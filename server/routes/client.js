var express = require('express'),
    router = express.Router(),
    Auth = require('../controllers/auth'),
    Error = require('../controllers/error'),
    Dictionary = require('../controllers/dictionaries'),
    GitHelper = require('../controllers/git-helper'),
    MongoHelper = require('../controllers/mongo-helper'),
    Defaults = require('../../defaults'),
    fs = require('fs'),
    MongoHelper = require('../controllers/mongo-helper');


//client routes
router.get('/', function(req, res){
  res.render('index.jade', {user: req.user, error: req.flash('error')});
});
router.get('/login', function(req, res){
  console.log('here');
  res.render('login.jade', {user: req.user});
});
router.get('/dashboard', Auth.isLoggedIn, function(req, res, next){
  Dictionary.get({owner: req.user.username}, function(err, response){
    if(err){
      console.log(err);
      req.flash('error', err);
      res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
    }
    else{
      res.render('dashboard.jade', {user: req.user, dictionaries: response});
    }
  });
});
router.get('/new', Auth.isLoggedIn, function(req, res, next){
  res.render('wizard/create.jade', {user: req.user});
});
router.get('/general/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.render('wizard/general.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'general', defaults: Defaults});
});
router.get('/authentication/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var am = req.session.dictionary.auth_method;
  am = am.toLowerCase().replace(/\s/g, "-");
  res.render('wizard/auth/'+am+'.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'auth', defaults: Defaults});
});
router.get('/paging/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.render('wizard/paging.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'paging', defaults: Defaults});
});
router.get('/schema/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.render('wizard/schema.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'schema', defaults: Defaults});
});


//api routes
router.post('/create', Auth.isLoggedIn, function(req, res, next){
  var name = req.body.name;
  name = name.toLowerCase().replace(/\s/g, "-");
  GitHelper.checkForRepo(req, res, name, req.user.username, function(){
    //setup the repo data
    var repoData = {
      name: name,
      description: Defaults.description,
      auto_init: true
    };
    GitHelper.createRepo(req, res, repoData, function(repo){
      var dicData = {
        name: repo.name,
        display_name: repo.name,
        owner: repo.owner.login,
        auth_method: "None"
      }
      Dictionary.create(dicData, function(err, response){
        if(err){
          console.log(err);
          req.flash('error', err);
          res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
        }
        else{
          var jsonContent = {
            user: repo.owner.login,
            repo: repo.name,
            path: "dictionary.json",
            content: new Buffer(JSON.stringify(dicData)).toString('base64'),
            message: "Initial Dictionary"
          };
          GitHelper.createContent(req, res, jsonContent, function(content){
            response.dictionary = content.content.path;
            var iconurl = "./default-icon.png";
            var icon = fs.readFileSync(iconurl);
            console.log(icon);
            icon = new Buffer(icon).toString('base64');
            console.log(icon);
            var iconContent = {
              user: repo.owner.login,
              repo: repo.name,
              path: "icon.png",
              content: icon,
              message: "Initial Icon"
            };
            GitHelper.createContent(req, res, iconContent, function(content){
              response.icon = content.content.download_url;
              console.log(response);
              response.save(function(err){
                if(err){
                  console.log(err);
                  req.flash('error', err);
                  res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
                }
                else {
                  res.redirect('/general/'+response._id);
                }
              });
            });
          });
        }
      });
    });
  });
});

router.post('/delete', Auth.isLoggedIn, function(req, res){
  Dictionary.delete({owner:req.user.username, name: req.body.repo}, function(err){
    if(err){
      console.log(err);
      req.json({err: err});
    }
    res.json({});
  });
});

router.get('/error', function(req, res){
  res.render('error.jade', {error: req.flash('error')});
});


module.exports = router;
