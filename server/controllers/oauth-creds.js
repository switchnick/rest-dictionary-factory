var OauthCreds = require('../models/oauth-creds'),
    flash = require('connect-flash');

module.exports = {
  get: function(query, callbackFn){
    console.log('controller get');
    OauthCreds.find(query, function(err, result){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err, result);
    });
  },
  getOne: function(query, callbackFn){
    OauthCreds.findOne(query, function(err, result){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err, result);
    });
  },
  create: function(data, callbackFn){
    OauthCreds.create(data, function(err, dic){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err, dic);
    });
  },
  update: function(id, data, callbackFn ){
    if(id){
      OauthCreds.findOneAndUpdate({_id: id}, data, function(err, result){
        if(err){
          callbackFn.call(null, 'We couldn\'t save it, sorry.');
        }
        else{
          callbackFn.call(null);
        }
      });
    }
    else{
      callbackFn.call(null, 'We couldn\'t save it, sorry.');
    }
  },
  delete: function(query, callbackFn){
    OauthCreds.remove(query, function(err){
      if(err){
        console.log(err);
      }
      callbackFn.call(null, err);
    });
  }
}
