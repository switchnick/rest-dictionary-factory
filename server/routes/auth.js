var express = require('express'),
    router = express.Router(),
    passport = require('passport');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  req.session.token = req.user.token;
  res.redirect('/dashboard');
});

module.exports = router;
