var express = require('express'),
    router = express.Router(),
    Auth = require('../controllers/auth'),
    Error = require('../controllers/error'),
    Dictionary = require('../controllers/dictionaries'),
    GitHelper = require('../controllers/git-helper'),
    MongoHelper = require('../controllers/mongo-helper'),
    Defaults = require('../../defaults'),
    fs = require('fs'),
    Request = require('request'),
    MongoHelper = require('../controllers/mongo-helper');

router.get('/', function(req, res){
  res.json({data:'data'});
});

router.post('/updatesessiondictionary/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  try{
    var provider = req.body.provider;
    var prop = req.body.prop;
    var data = req.body.data;
    console.log(provider);
    if(provider=="mongo"){
      req.session.info[prop] = data;  //should only ever go 1 level deep on the mongo data
    }
    var props = prop.split(".");
    var dicProp = req.session.dictionary;
    for (var i=0;i<props.length;i++){
      if(i==props.length-1){
        //we assign the value to the current prop
        dicProp[props[i]] = data;
      }
      else{
        //we go to the next object and create it if necessary
        if(!dicProp[props[i]]){
          if(dicProp.length){
            //then it's an array
            dicProp.push({});
          }
          else{
            //it's an object
            dicProp[props[i]] = {};
          }
        }
        dicProp = dicProp[props[i]];
      }
    }
    console.log(req.session.dictionary);
    res.json({});
  }
  catch(err){
    res.json({err: err});
  }
});

router.post('/newtable/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(!req.session.dictionary.tables){
    req.session.dictionary.tables = [];
  }
  req.session.dictionary.tables.push({qName: 'New Table'});
  res.redirect('/schema/'+req.params.id+'?table='+(req.session.dictionary.tables.length-1));
});

router.get('/autodetectcheck/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var auth_test_defaults = Defaults.auth_test_defaults[req.session.dictionary.auth_method.toLowerCase().replace(/\s/g, "-")];
  console.log(auth_test_defaults);
  console.log(req.session.dictionary.auth_method.toLowerCase().replace(/\s/g, "-"));
  console.log(Defaults.auth_test_defaults);
  res.json({auth_method: req.session.dictionary.auth_method, auth_options: req.session.dictionary.auth_options, auth_test_defaults: auth_test_defaults});
});

router.post('/autodetectfields/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var requestUrl = req.body.base_endpoint;
  requestUrl += "/";
  requestUrl += req.session.dictionary.base_endpoint;
  requestUrl += "/";
  requestUrl += req.session.dictionary.tables[req.body.table].endpoint;

  var headers = {
    "Content-Type": "application/json"
  };
  switch (req.session.dictionary.auth_method) {
    case "none":

      break;
    case "basic":
      headers.authorization = "Basic "+req.body.username+":"+req.body.password;
      break;
    default:

  }
  console.log(requestUrl);
  console.log(headers);
  Request({url: requestUrl, headers: headers}, function(error, response, body){
    if(error){
      res.json({err: error});
    }
    else{
      var data = JSON.parse(body)[req.session.dictionary.data_element];
      var fields = [];
      if(data && data.length>0){
        for (var key in data[0]){
          var field = {};
          field.qName = key;
          field.path = key;
          field.type = "String";
          fields.push(field);
        }
      }
      req.session.dictionary.tables[req.body.table].fields = fields;
      res.json(body);
    }
  });


});

router.get('/save/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  Dictionary.update(req.params.id, req.session.info, function(err){
    if(err){
      res.json({err: err});
    }
    else{
      var gitQuery = {
        user: req.session.info.owner,
        repo: req.session.info.name,
        path: req.session.info.dictionary,
        content: new Buffer(JSON.stringify(req.session.dictionary)).toString('base64'),
        message: "Updated via the Dictionary Factory",
        sha: req.session.sha
      };
      GitHelper.updateContent(req, res, gitQuery, function(err){
        if(err){
          res.json({err: err});
        }
        else{
          res.json({});
        }
      });
    }
  });
});

module.exports = router;
