const mongo = require('mongodb').MongoClient;

module.exports = async function() {
  // Connection URL
  const url = 'mongodb://visitor:visitor@193.112.28.37/neurodism?authSource=admin';

  let client = await mongo.connect(url, { useNewUrlParser: true });
  return client.db('neurodism');
};