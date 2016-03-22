var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: String,
  display_name: String,
  owner: String,
  dictionary: String,
  dictionary_url: String,
  icon: String,
  public: Boolean,
  saved_credentials: Boolean
});

module.exports = mongoose.model('dictionaries', schema)
