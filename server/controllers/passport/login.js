var GitHubStrategy    = require('passport-github').Strategy;

module.exports = function(passport, config){
  console.log('we got here too');
  passport.use(new GitHubStrategy({
      clientID: config.github.clientId,
      clientSecret: config.github.secret
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('did we make it');
      // asynchronous verification, for effect...
      process.nextTick(function () {

        // To keep the example simple, the user's GitHub profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the GitHub account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  ));
};
