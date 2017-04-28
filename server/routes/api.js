var express = require('express'),
    expressSession = require('express-session'),
    router = express.Router(),
    Auth = require('../controllers/auth'),
    Error = require('../controllers/error'),
    Dictionary = require('../controllers/dictionaries'),
    OAuthCreds = require('../controllers/oauth-creds'),
    GitHelper = require('../controllers/git-helper'),
    Test = require('../controllers/test'),
    MongoHelper = require('../controllers/mongo-helper'),
    Defaults = require('../../defaults'),
    passport = require('passport'),
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
    if(provider=="mongo"){
      req.session.info[prop] = data;  //should only ever go 1 level deep on the mongo data
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
          if(data=="true" || data=="false"){
            data = data=="true"?true:false;
          }
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

router.use('/addfield/:id/:tableindex', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(!req.params.id || !req.params.tableindex){
    req.flash('error', "There was a problem adding the field");
    if(req.params.tableindex){
      res.redirect('/schema/'+req.params.id+'?table='+ req.params.tableindex);
    }else {
      res.redirect('/schema/'+req.params.id);
    }
  }
  else{
    req.session.dictionary.tables[req.params.tableindex].fields.splice(0, 0, {
      qName: "name",
      path: "path",
      type: "String"
    });
    res.redirect('/schema/'+req.params.id+'?table='+ req.params.tableindex);
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
          res.json(response);
        }
        else{
          res.json({});
        }
      })
    });
});

router.get('/saveoauthpopup/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.redirect('/authentication/'+req.params.id+'?storeoauth=true');
});

router.get('/removeoauthcreds/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  //remove the credentials
  OAuthCreds.getOne({dictionaryId: req.params.id}, function(err, result){
    if(err){
      req.flash('error', err);
      res.redirect('/authentication/'+req.params.id);
    }
    else {
      if(result){
        OAuthCreds.delete({_id:result._id}, function(err, result){
          if(err){
            req.flash('error', err.message);
            res.redirect('/authentication/'+req.params.id);
          }
          else{
            req.session.info.saved_credentials = false;
            Dictionary.update(req.params.id, req.session.info, function(err){
              if(err){
                req.flash('error', err.message);
              }
              res.redirect('/authentication/'+req.params.id);
            });
          }
        });
      }
    }
  });
});

router.post('/saveoauthcreds/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  //save the credentials
  var data = req.body;
  data.dictionaryId = req.params.id;
  OAuthCreds.getOne({dictionaryId: req.params.id}, function(err, result){
    if(err){
      req.flash('error', err);
      res.redirect('/authentication/'+req.params.id);
    }
    else {
      if(result){
        OAuthCreds.update(result._id, data, function(err, result){
          if(err){
            req.flash('error', err);
            res.redirect('/authentication/'+req.params.id);
          }
          else{
            req.session.info.saved_credentials = true;
            Dictionary.update(req.params.id, req.session.info, function(err){
              if(err){
                res.json({err: err});
              }
              res.redirect('/authentication/'+req.params.id);
            });
          }
        });
      }
      else{
        OAuthCreds.create(data, function(err, result){
          if(err){
            req.flash('error', err);
            res.redirect('/authentication/'+req.params.id);
          }
          else{
            req.session.info.saved_credentials = true;
            Dictionary.update(req.params.id, req.session.info, function(err){
              if(err){
                res.json({err: err});
              }
              res.redirect('/authentication/'+req.params.id);
            });
          }
        });
      }
    }
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
  console.log("Auth method - "+ req.session.dictionary.auth_method);
  switch (req.session.dictionary.auth_method) {
    case "None":

      break;
    case "Basic":
      console.log("Basic auth header - "+ new Buffer(req.body.username+":"+req.body.password).toString('base64'));
      headers.Authorization = "Basic "+ new Buffer(req.body.username+":"+req.body.password).toString('base64');
      break;
    case "OAuth":
      if(req.session.dictionary.auth_options.auth_version=="2.0"){
        if(req.session.dictionary.auth_options.oauth_params_in_query){
          if(requestUrl.indexOf("?")==-1){
            requestUrl+="?";
          }
          else{
            requestUrl+="&";
          }
          requestUrl += "access_token=";
          requestUrl += req.body.access_token;
        }
        else{
          headers.Authorization = "Bearer "+ req.body.access_token;
        }
        if(req.session.dictionary.auth_options.sign_requests == true){
          oauthparams = {
            consumer_secret: req.session.temp.signing_key,
            token_secret: req.body.access_token
          };
        }
      }
      else{
        oauthparams = {
          consumer_key: req.session.temp.consumer_key,
          consumer_secret: req.session.temp.consumer_secret,
          token: req.body.access_token,
          token_secret: req.body.token_secret
        };
      }
      break;
    case "API Key":
      if(requestUrl.indexOf("?")==-1){
        requestUrl+="?";
      }
      else{
        requestUrl+="&";
      }
      requestUrl += req.session.dictionary.auth_options.api_key_parameter;
      requestUrl += "=";
      requestUrl += req.session.temp.api_key;
      break;
    default:

  }
  var requestParams = {
    rejectUnauthorized: false,
    url: requestUrl,
    headers: headers
  };

  if(oauthparams){
    requestParams.oauth = oauthparams;
  }

  console.log(requestUrl);

  Request(requestParams, function(error, response, body){
    if(error){
      console.log('error in auto detection');
      console.log(error);
      res.json({err: error});
    }
    else{
      try{
        console.log('autodetect result response');
        console.log(response);
        console.log('autodetect result body');
        console.log(body);
        var data = JSON.parse(body);
        if(req.session.dictionary.tables[req.session.temp.table].has_link_to_child && req.session.dictionary.tables[req.session.temp.table].has_link_to_child==true){
          var dataElement = req.session.dictionary.tables[req.session.temp.table].data_element_override.split(".");
          if(!dataElement){
            req.flash('error', "Please specify a Data Element Override");
          }
          else{
            console.log("Fetching child");
            var urlProp = dataElement.pop();
            for (var i=0;i<dataElement.length;i++){
              data = data[dataElement[i]];
            }
            var childUrl = data[0][urlProp];
            var linkToParent;
            if(data[0].id){
              linkToParent = {
                qName: "parentId",
                type: "String",
                path: "{parent}.id"
              };
            }
            console.log("Child url is "+childUrl);
            requestParams.url = childUrl;
            Request(requestParams, function(error, response, childcontent){
              if(error){
                console.log(error);
                res.flash('error', error);
              }
              else{
                var childdata = JSON.parse(childcontent);
                if(req.session.dictionary.tables[req.session.temp.table].child_data_element && req.session.dictionary.tables[req.session.temp.table].child_data_element != ''){
                  var childDataElement = req.session.dictionary.tables[req.session.temp.table].child_data_element.split(".");
                  for (var i=0;i<childDataElement.length;i++){
                    childdata = childdata[childDataElement[i]];
                  }
                }
                var fields = [];
                if(childdata){
                  if(childdata.length && childdata.length>0){
                    childdata = childdata[0];
                  }
                  else{
                    req.flash('error', "No data found at specified child element");
                  }
                  var fields = getSchema(childdata, linkToParent);
                }
                else{
                  req.flash('error', body);
                }
                req.session.dictionary.tables[req.session.temp.table].fields = fields;
                res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
              }
            });
          }
        }
        else{
          if(req.session.dictionary.data_element && req.session.dictionary.data_element != ''){
            var dataElement = req.session.dictionary.data_element.split(".");
            var targetData = data;
            for (var i=0;i<dataElement.length;i++){
              targetData = targetData[dataElement[i]];
            }
          }
          if(req.session.dictionary.tables[req.session.temp.table].data_element_override && req.session.dictionary.tables[req.session.temp.table].data_element_override != ''){
            var dataElement = req.session.dictionary.tables[req.session.temp.table].data_element_override.split(".");
            var targetData = data;
            for (var i=0;i<dataElement.length;i++){
              targetData = targetData[dataElement[i]];
            }
          }
          if(!targetData){
            targetData = data;
          }
          var fields = [];
          if(targetData){
            if(targetData.length>0){
              targetData = targetData[0];
              if(req.session.dictionary.tables[req.session.temp.table].child_data_element && req.session.dictionary.tables[req.session.temp.table].child_data_element!=''){
                var childDataElement = req.session.dictionary.tables[req.session.temp.table].child_data_element.split(".");
                for (var i=0;i<childDataElement.length;i++){
                  targetData = targetData[childDataElement[i]];
                }
                if(targetData && targetData.length>0){
                  targetData = targetData[0];
                }
              }
            }
            var fields = getSchema(targetData);
          }
          else{
            console.log(error);
            req.flash('error', body);
          }
          req.session.dictionary.tables[req.session.temp.table].fields = fields;
          res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
        }
      }
      catch(err){
        console.log(err);
        req.flash('error', 'Could not automatically detect the fields for <strong>'+req.session.dictionary.tables[req.session.temp.table].qName+'</strong>. Please check the details and try again.');
        res.redirect('/schema/'+req.params.id+'?table='+req.session.temp.table);
      }
    }
  });


});

//router.get('/oauth1_authorize/:id', MongoHelper.getInfoAnon, GitHelper.setSessionDictionary, function(req, res, next){
router.get('/oauth1_authorize/:id', function(req, res, next){
  if(!req.params.id || !req.query.consumer_key || !req.query.consumer_secret){
    //handle the issue
    req.flash('error', 'Missing information. Please check that a valid dictionary id, consumer key and consumer secret have been provided.');
    res.redirect('error.jade');
  }
  else{
    if(req.session && req.session.dictionary){
      console.log("we have a dictionary");
    }
    req.body.username = "anon_"+(req.query.consumer_key || randomString(12));
    req.body.password = "anonymous";
    passport.authenticate('anonymous', function(err, user){
      if(err){
        req.flash('error', err);
        res.redirect('error.jade');
      }
      else{
        req.logIn(user, function(err){
          if(err){
            req.flash('error', err);
            res.redirect('error.jade');
          }
          else{
            MongoHelper.getInfoAnon(req, res, function(){
              GitHelper.setSessionDictionaryAnon(req, res, function(){
                if(!req.session.temp){
                  req.session.temp = {};
                }
                req.session.temp.consumer_key = req.query.consumer_key;
                req.session.temp.consumer_secret = req.query.consumer_secret;
                var oauthparams = {
                  callback: process.env.oauth_redirect_uri,
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
              });
            });
          }
        });
      }
    })(req, res, next);
  }
});

//router.get('/oauth2_authorize/:id', MongoHelper.getInfoAnon, GitHelper.setSessionDictionary, function(req, res, next){
router.get('/oauth2_authorize/:id', function(req, res, next){
  if(!req.params.id){
    //handle the issue
    req.flash('error', 'Missing information. Please check that a valid dictionary id has been provided.');
    res.redirect('error.jade');
  }
  else{
    if(req.session && req.session.dictionary){
      console.log("we have a dictionary");
    }
    req.body.username = "anon_"+(req.query.clientid || randomString(12));
    req.body.password = "anonymous";
    passport.authenticate('anonymous', function(err, user){
      if(err){
        req.flash('error', err);
        res.redirect('error.jade');
      }
      else{
        req.logIn(user, function(err){
          if(err){
            req.flash('error', err);
            res.redirect('error.jade');
          }
          else{
            MongoHelper.getInfoAnon(req, res, function(){
              GitHelper.setSessionDictionaryAnon(req, res, function(){
                if(!req.session.temp){
                  req.session.temp = {};
                }
                if(!req.query.clientid){
                  //then hopefully we have a dictionary that uses saved credentials
                  if(req.session.info.saved_credentials && req.session.info.saved_credentials===true){
                    OAuthCreds.getOne({dictionaryId: req.params.id}, function(err, result){
                      if(err){
                        req.flash('error', err.message);
                        res.redirect('error.jade');
                      }
                      else{
                        req.session.temp.client_id = result.client_id;
                        req.session.temp.client_secret = result.client_secret;
                        var oauth_redirect_url_parameter = "redirect_uri";
                        if(req.session.dictionary.auth_options.oauth_redirect_url_parameter && req.session.dictionary.auth_options.oauth_redirect_url_parameter!=""){
                           oauth_redirect_url_parameter = req.session.dictionary.auth_options.oauth_redirect_url_parameter
                        }
                        var url = req.session.dictionary.auth_options.oauth_authorize_url+"?client_id="+req.session.temp.client_id+"&"+oauth_redirect_url_parameter+"="+process.env.oauth_redirect_uri;
                        if(req.session.dictionary.auth_options.oauth_additional_params && req.session.dictionary.auth_options.oauth_additional_params !== "") {
                          console.log('adding extra params to query string');
                          url += "&";
                          url += req.session.dictionary.auth_options.oauth_additional_params;
                        }
                        console.log('oauth2 url is');
                        console.log(url);
                        res.redirect(url);
                      }
                    });
                  }
                  else{
                    req.flash('error', 'Missing information. Please check that a valid Client Id has been provided.');
                    res.redirect('error.jade');
                  }
                }
                else{
                  req.session.temp.client_id = req.query.clientid;
                  req.session.save(function(err){
                    res.render('oauth2-authorize.jade', {clientId: req.query.clientid, info: req.session.info});
                  });
                }
              });
            });
          }
        });
      }
    })(req, res, next);
  }
});

router.use('/oauth2_authorize/:id/done',  Auth.isLoggedIn, MongoHelper.getInfoAnon, GitHelper.setSessionDictionaryAnon, function(req, res, next){
  if(req.body && req.body.client_secret){
    req.session.temp.client_secret = req.body.client_secret;
  }
  if(!req.session.temp.client_id){
    req.session.temp = JSON.parse(req.sessionStore.sessions[req.sessionID]).temp; //this is a bit dirty
  }
  var oauth_redirect_url_parameter = "redirect_uri";
  if(req.session.dictionary.auth_options.oauth_redirect_url_parameter && req.session.dictionary.auth_options.oauth_redirect_url_parameter!=""){
     oauth_redirect_url_parameter = req.session.dictionary.auth_options.oauth_redirect_url_parameter
  }
  var url = req.session.dictionary.auth_options.oauth_authorize_url+"?client_id="+req.session.temp.client_id+"&"+oauth_redirect_url_parameter+"="+process.env.oauth_redirect_uri;
  if(req.session.dictionary.auth_options.oauth_additional_params && req.session.dictionary.auth_options.oauth_additional_params !== "") {
    console.log('adding extra params to query string');
    url += "&";
    url += req.session.dictionary.auth_options.oauth_additional_params;
  }
  res.redirect(url);
});

router.use('/testoauth/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  if(req.session.dictionary.auth_options.auth_version=="1.0"){
    var oauthparams = {
      callback: process.env.oauth_redirect_uri,
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
    var oauth_redirect_url_parameter = "redirect_uri";
    if(req.session.dictionary.auth_options.oauth_redirect_url_parameter && req.session.dictionary.auth_options.oauth_redirect_url_parameter!=""){
       oauth_redirect_url_parameter = req.session.dictionary.auth_options.oauth_redirect_url_parameter
    }
    var url = req.session.dictionary.auth_options.oauth_authorize_url;
    url += "?client_id=";
    url += req.session.temp.client_id;
    url += "&" + oauth_redirect_url_parameter;
    url += "=" + process.env.oauth_redirect_uri;
    if(req.session.dictionary.auth_options.oauth_additional_params && req.session.dictionary.auth_options.oauth_additional_params !== "") {
      url += "&";
      url += req.session.dictionary.auth_options.oauth_additional_params;
    }
    res.redirect(url);
  }
});

router.get('/public', function(req, res){
  console.log('getting public');
  Dictionary.get({public:true}, function(err, result){
    if(err){
      console.log(err);
      res.send({err:err});
    }
    else{
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

router.get('/publish/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var public = req.session.info.public;
  Dictionary.update(req.params.id, {public: !public} , function(err){
    if(err){
      res.json({err: err});
    }
    else{
      req.session.info.public = !public;
      res.json({});
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

function getSchema(data, linkToParent){
  console.log("Figuring out schema");
  console.log(data);
  var fields = [];
  if(linkToParent){
    fields.push(linkToParent);
  }
  for (var key in data){
    if(key!="__v"){
      var fieldData = data[key];
      if(fieldData !== null && typeof fieldData === 'object'){
        //then we have child properties
        if(!fieldData.length){
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
  console.log("detected");
  console.log(fields);
  return fields;
}

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

module.exports = router;
