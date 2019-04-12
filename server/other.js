// const initDB = require('./db');
// const csv = require('csvtojson');
// var db;
// initDB().then(database => {
//   db = database;
// });


var csv = require('fast-csv');

var geneInChr = {};
csv.fromPath("./data/genes.csv", {headers: true}).on("data", data => {
    console.log(data);
}).on("end", () => { console.log("Loaded Genes")});