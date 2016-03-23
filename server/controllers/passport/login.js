var GitHubStrategy    = require('passport-github').Strategy;

module.exports = function(passport){
  passport.use(new GitHubStrategy({
      clientID: process.env.github_clientId,
      clientSecret: process.env.github_secret,
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
