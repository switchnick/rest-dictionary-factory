module.exports = function(passport, config){

  passport.serializeUser(function(user, done) {        
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  //Configure login strategy
  require('./login.js')(passport, config);

}
