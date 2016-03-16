var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    request = require('request'),
    Auth = require('../controllers/auth'),
    qs = require('querystring'),
    config = require('../../config');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  req.session.token = req.user.token;
  res.redirect('/dashboard');
});

router.use('/oauth', function(req, res){
  var session;
  if(!req.session.dictionary){
    for(var s in req.sessionStore.sessions){
      if(JSON.parse(req.sessionStore.sessions[s]).dictionary){
        session = JSON.parse(req.sessionStore.sessions[s]);
      }
    }
  }
  else{
    session = req.session;
  }
  if(req.query){
    var data = req.query;
    if(session.dictionary.auth_options.auth_version=="1.0"){
      var authData = qs.parse(req.body);
      var oauthparams = {
        consumer_key: session.temp.consumer_key,
        consumer_secret: session.temp.consumer_secret,
        token: data.oauth_token,
        token_secret: data.oauth_token_secret,
        verifier: data.oauth_verifier
      };
      var url = session.dictionary.auth_options.oauth_token_url;
      request.post({url:url, oauth:oauthparams}, function(err, response, body){
        var tokenData = qs.parse(body);
        res.render('token.jade', {token: tokenData.oauth_token, tokenSecret: tokenData.oauth_token_secret});
      });
    }
    else{
      data.client_id = session.temp.client_id;
      data.client_secret = session.temp.client_secret;
      request({url:session.dictionary.auth_options.oauth_token_url, formData: data}, function(err, response, body){
        if(err){
          console.log(err);
        }
        else{
          var tokenData = qs.parse(body);
          res.render('token.jade', {token: tokenData.access_token});
        }
      });
    }
  }
  else{
    res.render('token.jade', {tokenInfo: req.body});
  }
});

module.exports = router;
