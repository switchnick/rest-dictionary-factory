var express = require('express'),
    expressSession = require('express-session'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    request = require('request'),
    config = require('./config'),
    git = require('github'),
    flash = require('connect-flash'),
    Auth = require(__dirname+'/server/controllers/auth'),
    Dictionary = require( __dirname+'/server/controllers/dictionaries'),
    busboy = require('connect-busboy'),
    Defaults = require('./defaults');

if(config){
  for(var c in config){
      process.env[c] = config[c];
  }
}

mongoose.connect(process.env.mongo);

require('./server/controllers/passport/passport.js')(passport, config);

var clientRoutes = require(__dirname+'/server/routes/client');
var apiRoutes = require(__dirname+'/server/routes/api');
var authRoutes = require(__dirname+'/server/routes/auth');

app.set('views', __dirname+'/server/views');

app.use(expressSession({ secret: "thecolonelwillnevertell"}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(busboy());

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb'}));

//load the models
require('./server/models/dictionaries.js');

app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/styles', express.static(__dirname + '/public/styles/css'));
app.use('/scripts', express.static(__dirname + '/public/scripts/build'));
app.use('/resources', express.static(__dirname + '/public/resources'));

app.use('/', clientRoutes);
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

app.listen(process.env.PORT || 4000);

console.log('listening on port '+(process.env.PORT ||'4000'));

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
