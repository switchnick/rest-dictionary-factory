var express = require('express'),
    router = express.Router(),
    Auth = require('../controllers/auth'),
    Dictionary = require('../controllers/dictionaries'),
    GitHelper = require('../controllers/git-helper'),
    Defaults = require('../../defaults'),
    fs = require('fs'),
    MongoHelper = require('../controllers/mongo-helper');


//client routes
router.get('/', function(req, res){
  res.render('index.jade', {user: req.user});
});
router.get('/login', function(req, res){
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
        owner: repo.owner.login
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
            response.dictionary = content.content.download_url;
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
                  res.render('wizard/general.jade', {user: req.user, dictionary: response, repo: repo});
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
