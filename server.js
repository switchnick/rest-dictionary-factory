var express = require('express'),
    expressSession = require('express-session'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    request = require('request'),
    config = require('./config'),
    git = require('github'),
    flash = require('connect-flash'),
    Auth = require(__dirname+'/server/controllers/auth');

GitHub = new git({
    // required
    version: "3.0.0",
    // optional
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
        "user-agent": "rest-factory" // GitHub is happy with a unique user agent
    }
});

//mongoose.connect('mongodb://localhost:27017/dictionary-factory');
mongoose.connect('mongodb://principal:principal%@ds041404.mongolab.com:41404/heroku_s6fg7p6h');

require('./server/controllers/passport/passport.js')(passport, config);

var authRoutes = require(__dirname+'/server/routes/auth');

app.set('views', __dirname+'/server/views');

app.use(expressSession({ secret: "thecolonelwillnevertell"}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/styles', express.static(__dirname + '/public/styles/css'));
app.use('/resources', express.static(__dirname + '/public/resources'));

//client routes
app.get('/', function(req, res){
  res.render('index.jade', {user: req.user});
});
app.get('/login', function(req, res){
  res.render('login.jade', {user: req.user});
});
app.get('/dashboard', Auth.isLoggedIn, function(req, res, next){
  res.render('dashboard.jade', {user: req.user});
});
app.get('/new', Auth.isLoggedIn, function(req, res, next){
  res.render('wizard/create.jade', {user: req.user});
});

//api routes
app.post('/create', Auth.isLoggedIn, function(req, res, next){
  res.render('wizard/create.jade', {user: req.user});
});

app.get('/error', function(req, res){
  res.render('error.jade', {error: req.flash('error')});
});

app.use('/auth', authRoutes);

app.get('/authorizegits', function(req, res){
  var url = "https://github.com/login/oauth/access_token?client_id="+config.github.clientId+"&client_secret="+config.github.secret+"&code="+req.query.code+"&state="+req.query.state;
  request.post({url: url, json:true}, function(e, r, body){
    console.log(body.access_token);
    GitHub.authenticate({type: "token", token: body.access_token});
    console.log('authenticated');
    GitHub.user.get({},function(err, user){
      if(err){
        req.flash('error', err);
        res.redirect('/error');
      }
      else{
        req.user = user;
        res.redirect('/');
      }
    });
  });
});

app.listen(4000);

console.log('listening on port 4000');

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
