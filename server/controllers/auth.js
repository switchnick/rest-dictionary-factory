module.exports = {
  isLoggedIn: function(req, res, next){
    if(req.isAuthenticated()){
      next();
    }
    else{
      res.render('login.jade', {user: req.user});
    }
  }
}
