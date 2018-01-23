var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    request = require('request'),
    Auth = require('../controllers/auth'),
    qs = require('querystring');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  req.session.token = req.user.token;
  res.redirect('/dashboard');
});

router.use('/oauth', function(req, res){
  var session;
  var sessionRef;
  if(!req.session.dictionary){
    for(var s in req.sessionStore.sessions){
      if(JSON.parse(req.sessionStore.sessions[s]).dictionary){
        sessionRef = s;
        console.log("session ref");
        console.log(sessionRef);
        session = JSON.parse(req.sessionStore.sessions[s]);
      }
    }
  }
  else{
    session = req.session;
  }
  if(req.query){
    var data = req.query;
    var tokenUrl = session.dictionary.auth_options.oauth_token_url;
    if(session.dictionary.auth_options.auth_version=="1.0"){
      var authData = qs.parse(req.body);
      console.log("Received auth data");
      console.log(authData);
      var oauthparams = {
        consumer_key: session.temp.consumer_key,
        consumer_secret: session.temp.consumer_secret,
        token: data.oauth_token,
        token_secret: data.oauth_token_secret,
        verifier: data.oauth_verifier
      };
      request.post({url:tokenUrl, oauth:oauthparams}, function(err, response, body){
        if(req.user.username.indexOf("anon_")!=-1){
          req.logout();
        }
        var tokenData = qs.parse(body);
        console.log('Token Data');
        console.log(tokenData);
        res.render('token.jade', {token: tokenData.oauth_token, tokenSecret: tokenData.oauth_token_secret});
      });
    }
    else{
      console.log('temp info is');
      console.log(JSON.stringify(session.temp));
      data.client_id = session.temp.client_id;
      data.client_secret = session.temp.client_secret;
      data.grant_type = "authorization_code";
      data.redirect_uri = process.env.oauth_redirect_uri;
      if(session.dictionary.auth_options.oauth_params_in_query){
        if(tokenUrl.indexOf("?")==-1){
          tokenUrl+="?";
        }
        else{
          tokenUrl+="&";
        }
        for (var prop in data){
          tokenUrl+=prop;
          tokenUrl+="=";
          tokenUrl+=data[prop];
          tokenUrl+="&";
        }
        tokenUrl = tokenUrl.split("");
        tokenUrl.pop();
        console.log(tokenUrl);
        tokenUrl = tokenUrl.join("");
        var redirect_uri_parameter = "redirect_uri";
        if(session.dictionary.auth_options.oauth_redirect_url_parameter && session.dictionary.auth_options.oauth_redirect_url_parameter!=""){
          redirect_uri_parameter = session.dictionary.auth_options.oauth_redirect_url_parameter
        }
        tokenUrl += "&";
        tokenUrl += redirect_uri_parameter;
        tokenUrl += "=";
        tokenUrl += process.env.oauth_redirect_uri;
      }
      console.log('token url is');
      console.log(tokenUrl);
      console.log('data is');
      console.log(JSON.stringify(data));
      request.post({url:tokenUrl, form: data}, function(err, response, body){
        if(err){
          console.log(err);
        }
        else{
          var responseData;
          if(body.indexOf("{")!=-1){
            responseData = JSON.parse(body);
          }
          else{
            responseData = qs.parse(body);
          }
          console.log(responseData);
          var tokenData = getTokens(responseData);
          console.log(tokenData);
          if(req.user && req.user.username.indexOf("anon_")!=-1){
            req.logout();
          }
          res.render('token.jade', {token: tokenData.access_token, refrehToken: tokenData.refresh_token});
        }
      });
    }
  }
  else{
    if(req.user && req.user.username.indexOf("anon_")!=-1){
      req.logout();
    }
    res.render('token.jade', {tokenInfo: req.body});
  }
});

function getTokens(data){
  var output = {};
  output = traverseProperties(data, output);
  return output;
}

function traverseProperties(input, output){
  console.log(input);
  for (var prop in input){
    if(typeof input[prop] === "object"){
      output = traverseProperties(input[prop], output);
    }
    else{
      if(prop.indexOf("token")!=-1){
        output[prop] = input[prop];
      }
    }
  }
  return output;
}

module.exports = router;
