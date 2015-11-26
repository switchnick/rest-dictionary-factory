var GitHubStrategy    = require('passport-github').Strategy;

module.exports = function(passport, config){
  console.log('we got here too');
  passport.use(new GitHubStrategy({
      clientID: config.github.clientId,
      clientSecret: config.github.secret,
      scope: 'public_repo'
    },
    function(accessToken, refreshToken, profile, done) {      
      profile.token = accessToken;
      // asynchronous verification, for effect...
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  ));
};
