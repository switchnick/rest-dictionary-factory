module.exports = {
  isLoggedIn: function(req, res, next){
    console.log('a1');
    if(req.isAuthenticated()){
      next();
    }
    else{
      console.log('not authenticated');
      res.render('login.jade', {user: req.user});
    }
  }
}
