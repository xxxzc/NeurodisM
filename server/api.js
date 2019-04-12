const express = require('express');
const Promise = require("bluebird");
const path = require('path');
const exec = require('child_process').exec; 
const router = express.Router();

const initDB = require('./db');
var db;
initDB().then(database => {
  db = database;
});

router.get('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');

  if (req.url.indexOf('api') > -1) {
    next();
  } else res.sendFile(path.join(__dirname,'../client/index.html'));
});


router.get('/api/dp/:name', (req, res) => {
  let name = req.params.name;
  let cond = {};
  if (name !== 'all') {
    cond = {
      "$or": [{'d1': name}, {'d2':name}]
    };
  }
  db.collection('disease_pairs').find(cond).toArray(
    function (err, datas) {
      res.jsonp(datas);
    });
});

router.get('/api/gp/:name', (req, res) => {
  let name = req.params.name;
  let cond = {};
  if (name !== 'all') {
    cond = {
      "$or": [{'g1': name}, {'g2':name}]
    };
  }
  db.collection('gene_pairs').find(cond).toArray(
    function (err, datas) {
      res.jsonp(datas);
    });
});

router.get('/api/mut/all', (req, res) => {
  db.collection('mutations').find({}).toArray(
    function (err, data) {
      res.jsonp(data);
  })
});


router.get('/api/disease/:name', (req, res) => {
  let name = req.params.name;
  // get disease
  let getDis = new Promise((resolve, reject) => {
    db.collection('diseases').findOne({d: name}, function (err, data) {
      resolve(data);
    });
  });
  // get mutation
  let getMut = new Promise((resolve, reject) => {
    db.collection('mutations').find({pt: name}).toArray(function (err, data) {
      resolve(data);
    });
  });

  // get other mutations
  let getOtherMut = new Promise((resolve, reject) => {
    db.collection('other_mutations').find({pt: name}).toArray(function (err, data) {
      resolve(data);
    });
  });
  // join
  Promise.join(getDis, getMut, getOtherMut, function(dis, muts, other_muts) {
    res.jsonp({
      dis: dis,
      muts: muts,
      omuts: other_muts
    });
  });
});

router.get('/api/gene/:name', (req, res) => {
  let name = req.params.name;
  // get gene
  let getGene = new Promise((resolve, reject) => {
    db.collection('genes').findOne({g: name}, function (err, data) {
      resolve(data);
    });
  });
  // get mutation
  let getMut = new Promise((resolve, reject) => {
    db.collection('mutations').find({gene: name}).toArray(function (err, data) {
      resolve(data);
    });
  });
  // join
  Promise.join(getGene, getMut, function(gene, muts) {
    res.jsonp({
      gene: gene,
      muts: muts
    });
  });

});

router.get('/api/word/:type', (req, res) => {
  db.collection('words').find({}).toArray(function(err, data) {
    res.jsonp(data);
  });
});

router.get('/api/chr/all', (req, res) => {
  let chr = require('./data/ci.json');
  res.jsonp(chr);
});

router.get('/api/relation/:type/:n1/:n2', (req, res) => {
  let type = req.params.type;
  let n1 = req.params.n1;
  let n2 = req.params.n2;
  if (n1 > n2) {
    let type = n1;
    n1 = n2;
    n2 = type;
  }
  if (type === 'gene') {
    db.collection('gene_pairs').findOne({g1: n1, g2: n2}, (err, data) => {
      if (data === undefined) data = {};
      res.jsonp(data);
    });
  } else if (type === 'disease') {
    db.collection('disease_pairs').findOne({d1: n1, d2: n2}, (err, data) => {
      if (data === undefined) data = {};
      res.jsonp(data);
    });
  }
});

function getPvalue(args) {
  return new Promise((res, rej) => {
    let script = "Rscript " + path.join('.', 'server', 'r', 'p_value.R');
    exec(script + ' ' + args, function(err, stdout, stderr) {
      res(stdout.slice(4));
    });
  });
}

function getInterSection(l1, l2) {
  let s2 = new Set(l2);
  return l1.filter(x => s2.has(x));
}

router.get('/api/pvalue/:genes/:all', (req, res) => {
  db.collection('diseases').find({}).toArray(async (err, data) => {
    let gs = req.params.genes.split(',');
    let all = req.params.all;
    let glen = gs.length;
    let datas = [];
    for (let dis of data) {
      let dis_g = dis.g;
      if (all === 'all' && dis.og) {
        dis_g = getInterSection(dis_g, Object.keys(dis.og));
      }
      let dglen = dis_g.length;
      let genes = getInterSection(dis_g, gs);
      let n = genes.length;
      if (n === 0) continue;
      let a = n;
      let b = glen - n;
      let c = dglen - n;
      let d = 23341 - glen - dglen + n;
      let pvalue = await getPvalue([a, b, c, d].join(' '));
      datas.push({
        d: dis.d, p: Number(pvalue.trim()), g: genes
      });
    }
    res.jsonp({
      pvalues: datas,
      cond: req.params.genes
    });
  });
});

module.exports = router
