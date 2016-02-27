var express = require('express'),
    router = express.Router(),
    Auth = require('../controllers/auth'),
    Error = require('../controllers/error'),
    Dictionary = require('../controllers/dictionaries'),
    GitHelper = require('../controllers/git-helper'),
    Test = require('../controllers/test'),
    MongoHelper = require('../controllers/mongo-helper'),
    Defaults = require('../../defaults'),
    config = require('../../config'),
    fs = require('fs'),
    stream = require('stream'),
    Request = require('request'),
    qs = require('querystring'),
    busboy = require('connect-busboy'),
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
      console.log('updating info');
      req.session.info[prop] = data;  //should only ever go 1 level deep on the mongo data
      console.log(req.session.info);
    }
    else if(provider=="temp"){
      console.log('updating temp');
      req.session.temp[prop] = data;  //should only ever go 1 level deep on the temp data
      console.log(req.session.temp);
    }
    else if(provider="github"){
      console.log('updating dictionary');
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
    }
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

router.post('/deletetable/:id/:index', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(!req.params.id || !req.params.index){
    req.flash('error', "There was a problem deleting the table");
    res.redirect('/schema/'+req.params.id);
  }
  else {
    req.session.dictionary.tables.splice(req.params.index, 1);
    res.redirect('/schema/'+req.params.id);
  }
});

router.post('/deletefield/:id/:tableindex/:fieldindex', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(!req.params.id || !req.params.tableindex ||!req.params.fieldindex){
    req.flash('error', "There was a problem deleting the field");
    if(req.params.tableindex){
      res.redirect('/schema/'+req.params.id+'?table='+ req.params.tableindex);
    }else {
      res.redirect('/schema/'+req.params.id);
    }
  }
  else {
    req.session.dictionary.tables[req.params.tableindex].fields.splice(req.params.fieldindex, 1);
    res.redirect('/schema/'+req.params.id+'?table='+ req.params.tableindex);
  }
});

router.post('/iconupload/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
    var query = {
      user: req.session.info.owner,
      repo: req.session.info.name,
      path: 'icon.png',
      message: 'new icon uploaded'
    };
    var icon;

    icon = req.body.icon.data.toString('base64');
    console.log(icon);
    GitHelper.getContent(req, res, query, function(content){
      query.sha = content.sha;
      query.content = icon;
      req.session.icon = "data:image/png;base64,"+icon;
      GitHelper.updateContent(req, res, query, function(response){
        if(response.err){
          console.log(response);
          res.json(response);
        }
        else{
          res.json({});
        }
      })
    });
});

router.get('/autodetectcheck/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  //checking goes here
  var authMethod = req.session.dictionary.auth_method.toLowerCase().replace(/\s/g, "_");
  var itemsToCheck = Defaults.autodetect_requirements[authMethod];
  var errorDescription = "The following information is required before you can use autodetect.";
  var errorHTML = "<ul>";
  var errorCount = 0;
  for(var i=0;i<itemsToCheck.length;i++){
    var value = req.session.dictionary;
    var props = itemsToCheck[i].path.split(".");
    for (var j=0;j<props.length;j++){
      value = value[props[j]];
    }
    if(!value || value=='' ){
      errorCount++;
      errorHTML += "<li>" + itemsToCheck[i].label + "</li>";
    }
  }
  errorHTML += "</ul>";
  console.log(errorHTML);
  //then
  if(errorCount > 0){
    req.flash('error', errorDescription);
    req.flash('errorDetail', errorHTML);
    res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
  }
  else{
    res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table+'&autodetect=true');
  }
  //res.json({auth_method: req.session.dictionary.auth_method, auth_options: req.session.dictionary.auth_options, auth_test_defaults: auth_test_defaults});
});

router.post('/autodetectfields/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var requestUrl = Test.buildTestUrl(req, res);
  var oauthparams;
  var headers = {
    "Content-Type": "application/json",
    "User-Agent": "rest-dictionary-factory"
  };
  switch (req.session.dictionary.auth_method) {
    case "None":

      break;
    case "Basic":
      headers.Authorization = "Basic "+req.body.username+":"+req.body.password;
      break;
    case "OAuth":
      if(req.session.dictionary.auth_options.auth_version=="2.0"){
        headers.Authorization = "Bearer "+ req.body.access_token;
      }
      else{
        oauthparams = {
          consumer_key: req.session.temp.consumer_key,
          consumer_secret: req.session.temp.consumer_secret,
          token: req.body.access_token,
          token_secret: req.body.token_secret
        };
      }
    default:

  }
  var requestParams = {
    url: requestUrl,
    headers: headers
  };

  if(oauthparams){
    requestParams.oauth = oauthparams;
  }

  Request(requestParams, function(error, response, body){
    if(error){
      res.json({err: error});
    }
    else{
      try{
        if(req.session.dictionary.data_element && req.session.dictionary.data_element != ''){
          var data = JSON.parse(body)[req.session.dictionary.data_element];
        }
        else{
          var data = JSON.parse(body);
        }
        var fields = [];
        if(data && data.length>0){
          for (var key in data[0]){
            if(key!="__v"){
              var fieldData = data[0][key];
              if(fieldData !== null && typeof fieldData === 'object'){
                //then we have child properties
                for (var child in fieldData){
                  if(child!="__v" && child!="0"){
                    var field = {};
                    field.qName = key+"_"+child;
                    field.path = key+"."+child;
                    field.type = "String";
                    fields.push(field);
                  }
                }
              }
              else{
                var field = {};
                field.qName = key;
                field.path = key;
                field.type = "String";
                fields.push(field);
              }

            }
          }
        }
        else{
          req.flash('error', body);
        }
        req.session.dictionary.tables[req.session.temp.table].fields = fields;
        res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
      }
      catch(err){
        console.log(err);
        req.flash('error', 'Could not automatically detect the fields for <strong>'+req.session.dictionary.tables[req.session.temp.table].qName+'</strong>. Please check the details and try again.');
        res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
      }
    }
  });


});

router.get('/oauth1_authorize/:id', MongoHelper.getInfoAnon, GitHelper.setSessionDictionary, function(req, res, next){
  console.log(req.query);
  if(!req.params.id || !req.query.consumer_key || !req.query.consumer_secret){
    //handle the issue
    req.flash('error', 'Missing information. Please check that a valid dictionary id, consumer key and consumer secret have been provided.');
    res.redirect('error.jade');
  }
  else{
    if(!req.session.temp){
      req.session.temp = {};
    }
    req.session.temp.consumer_key = req.query.consumer_key;
    req.session.temp.consumer_secret = req.query.consumer_secret;
    var oauthparams = {
      callback: config.oauth.redirect_uri,
      consumer_key: req.session.temp.consumer_key,
      consumer_secret: req.session.temp.consumer_secret
    };
    var url = req.session.dictionary.auth_options.oauth_request_url;
    Request.post({url:url, oauth:oauthparams}, function(err, response, body){
      var reqData = qs.parse(body);
      var authUrl = req.session.dictionary.auth_options.oauth_authorize_url;
      authUrl += "?" + qs.stringify({oauth_token: reqData.oauth_token});
      res.redirect(authUrl);
    });
  }
});

router.get('/oauth2_authorize/:id', MongoHelper.getInfoAnon, GitHelper.setSessionDictionary, function(req, res, next){
  console.log(req.query);
  if(!req.params.id || !req.query.clientid){
    //handle the issue
    req.flash('error', 'Missing information. Please check that a valid dictionary id and client id have been provided.');
    res.redirect('error.jade');
  }
  else{
    if(!req.session.temp){
      req.session.temp = {};
    }
    req.session.temp.client_id = req.query.clientid;
    res.render('oauth2-authorize.jade', {clientId: req.query.clientid});
  }
});

router.post('/oauth2_authorize', function(req, res){
  if(req.body && req.body.client_secret){
    if(!req.session.temp){
      //we have bigger problems if this doesn't exist
      req.session.temp = {};
    }
    req.session.temp.client_secret = req.body.client_secret;
  }
  res.redirect(req.session.dictionary.auth_options.oauth_authorize_url+"?client_id="+req.session.temp.client_id+"&redirect_uri="+config.oauth.redirect_uri);
});

router.use('/testoauth/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(req.session.dictionary.auth_options.auth_version=="1.0"){
    var oauthparams = {
      callback: config.oauth.redirect_uri,
      consumer_key: req.session.temp.consumer_key,
      consumer_secret: req.session.temp.consumer_secret
    };
    var url = req.session.dictionary.auth_options.oauth_request_url;
    Request.post({url:url, oauth:oauthparams}, function(err, response, body){
      var reqData = qs.parse(body);
      var authUrl = req.session.dictionary.auth_options.oauth_authorize_url;
      authUrl += "?" + qs.stringify({oauth_token: reqData.oauth_token});
      res.redirect(authUrl);
    });
  }
  else{
    res.redirect(req.session.dictionary.auth_options.oauth_authorize_url+"?client_id="+req.session.temp.client_id+"&redirect_uri="+config.oauth.redirect_uri);
  }
  //res.redirect("https://github.com/login/oauth/authorize?client_id="+req.session.temp.client_id+"&redirect_uri=http://localhost:4000/auth/oauth");
});

router.get('/public', function(req, res){
  console.log('getting public');
  Dictionary.get({}, function(err, result){
    if(err){
      console.log(err);
      res.send({err:err});
    }
    else{
      console.log(result);
      res.send({configs:result});
    }
  });
});

router.get('/public/dictionary/:id', function(req, res){
  console.log('getting public dictionary');
  Dictionary.getOne({_id: req.params.id}, function(err, result){
    if(err){
      console.log(err);
      res.send({err:err});
    }
    else{
      var gitQuery = {
        repo: result.name,
        user: result.owner,
        path: result.dictionary
      };
      GitHelper.getContentPublic(gitQuery, function(dictionary){
        res.send(dictionary);
      });
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
      GitHelper.updateContent(req, res, gitQuery, function(result){
        if(result.err){
          console.log(result.err);
          res.json(result);
        }
        else{
          req.session.sha = result;
          res.json({});
        }
      });
    }
  });
});

module.exports = router;
