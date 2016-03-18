module.exports = {
  isLoggedIn: function(req, res, next){
    if(req.isAuthenticated() || req.url=="/public" || req.url.indexOf("summary")!=-1){
      console.log(req.user);
      console.log(req.url);
      console.log('authenticated');
      next();
    }
    else{
      console.log(req.url);
      console.log(req);
      console.log('not authenticated');
      res.render('login.jade', {user: req.user});
    }
  }
}
