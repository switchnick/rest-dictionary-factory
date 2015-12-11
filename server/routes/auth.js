var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    request = require('request');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  req.session.token = req.user.token;
  res.redirect('/dashboard');
});

router.use('/oauth', function(req, res){
  if(req.query){
    console.log('query');
    console.log(req.query);
    var data = req.query;
    data.client_id = "f5ffcbc19e0d371c1fa6";
    data.client_secret = "4b72aa7380fc137feb2930475a6e73dae1989d35";
    console.log('the dictionary is');
    console.log(req.session.dictionary);
    request({url:req.session.dictionary.auth_options.oauth_token_url, formData: data}, function(err, response, body){
    //request({url: "https://github.com/login/oauth/access_token", formData: data}, function(err, response, body){
      console.log('we\'re in the callback of the request');
      if(err){
        console.log(err);
      }
      else{
        var tokenData = {};
        var params = body.split("&");
        for(var i=0;i<params.length;i++){
          var parts = params[i].split("=");
          console.log(parts);
          tokenData[parts[0]] = parts[1];
        }
        console.log(params);
        console.log(tokenData);
        res.render('token.jade', {token: tokenData.access_token});
      }
    });
  }
  else{
    console.log('body');
    console.log(req.body);
    res.render('token.jade', {tokenInfo: req.body});
  }
});

module.exports = router;
