var Dictionary = require('../models/dictionaries'),
    flash = require('connect-flash');

module.exports = {
  get: function(query, callbackFn){
    Dictionary.find(query, function(err, result){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err, result);
    });
  },
  create: function(data, callbackFn){
    Dictionary.create(data, function(err, dic){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err, dic);
    });
  },
  delete: function(query, callbackFn){
    Dictionary.remove(query, function(err){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err);
    });
  }
}
