module.exports = function(passport, config){

  passport.serializeUser(function(user, done) {    
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    console.log("de-serialize");
    done(null, user);
  });

  //Configure login strategy
  require('./anonymous.js')(passport);
  require('./login.js')(passport, config);

}
