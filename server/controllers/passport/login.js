var GitHubStrategy    = require('passport-github').Strategy;

module.exports = function(passport){
  console.log('we got here too');
  passport.use(new GitHubStrategy({
      clientID: process.env.github_clientId,
      clientSecret: process.env.github_secret,
      scope: 'public_repo'
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('uugh');
      profile.token = accessToken;
      // asynchronous verification, for effect...
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  ));
};
