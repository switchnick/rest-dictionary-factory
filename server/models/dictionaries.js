var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: String,
  display_name: String,
  owner: String,
  dictionary: String,
  icon: String
});

module.exports = mongoose.model('dictionaries', schema)
