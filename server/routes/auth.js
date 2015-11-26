var express = require('express'),
    router = express.Router(),
    passport = require('passport');

router.get('/login', passport.authenticate('github'), function(req, res){

});

router.get('/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
  console.log(req.user);
  res.redirect('/');
});

module.exports = router;
