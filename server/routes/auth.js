var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    request = require('request'),
    qs = require('querystring'),
    config = require('../../config');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  req.session.token = req.user.token;
  res.redirect('/dashboard');
});

router.use('/oauth', function(req, res){
  if(req.query){
    console.log('we\'re back');
    console.log('query');
    console.log(req.query);
    var data = req.query;
    console.log('body');
    console.log(req.body);
    if(req.session.dictionary.auth_options.auth_version=="1.0"){
      var authData = qs.parse(req.body);
      console.log(authData);
      var oauthparams = {
        consumer_key: req.session.temp.consumer_key,
        consumer_secret: req.session.temp.consumer_secret,
        token: data.oauth_token,
        token_secret: data.oauth_token_secret,
        verifier: data.oauth_verifier
      };
      var url = req.session.dictionary.auth_options.oauth_token_url;
      request.post({url:url, oauth:oauthparams}, function(err, response, body){
        console.log(body);
        var tokenData = qs.parse(body);
        console.log(tokenData);
        res.render('token.jade', {token: tokenData.oauth_token, tokenSecret: tokenData.oauth_token_secret});
      });
    }
    else{
      data.client_id = req.session.temp.client_id;
      data.client_secret = req.session.temp.client_secret;
      request({url:req.session.dictionary.auth_options.oauth_token_url, formData: data}, function(err, response, body){
      //request({url: "https://github.com/login/oauth/access_token", formData: data}, function(err, response, body){
        console.log('we\'re in the callback of the request');
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
    console.log('i can\'t remember why we\'d be here');
    console.log('body');
    console.log(req.body);
    res.render('token.jade', {tokenInfo: req.body});
  }
});

module.exports = router;
