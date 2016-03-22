var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  dictionaryId: String,
  consumer_key: String,
  consumer_secret: String,
  client_id: String,
  client_secret: String
});

module.exports = mongoose.model('oauthcreds', schema)
