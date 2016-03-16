var LocalStrategy = require('passport-local');

module.exports = function(passport){
  passport.use('anonymous', new LocalStrategy(function(username, password, done){
    return done(null, {id: username,username: username});
  }));
};

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
