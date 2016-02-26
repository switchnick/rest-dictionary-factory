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
  //reset the current session variables
  req.session.info = null;
  req.session.icon = null;
  req.session.dictionary = null;
  req.session.curr_dictionary = null;
  req.session.sha = null;
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
  var query = {
    user: req.session.info.owner,
    repo: req.session.info.name,
    path: 'icon.png'
  };
  if(!req.session.icon){
    GitHelper.getContent(req, res, query, function(content){
      if(content.err){
        req.flash('error', content.err);
      }
      else{
        req.session.icon = "data:image/png;base64," + content.content;
        res.render('wizard/general.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'general', icon: req.session.icon, defaults: Defaults, error: req.flash('error'), errorDetail:req.flash('errorDetail')});
      }
    });
  }
  else{
    res.render('wizard/general.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'general', icon: req.session.icon, defaults: Defaults, error: req.flash('error'), errorDetail:req.flash('errorDetail')});
  }
});
router.get('/authentication/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.render('wizard/authentication.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'auth', defaults: Defaults, error: req.flash('error'), errorDetail:req.flash('errorDetail')});
});
router.get('/paging/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  res.render('wizard/paging.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'paging', defaults: Defaults, error: req.flash('error'), errorDetail:req.flash('errorDetail')});
});
router.get('/schema/:id', Auth.isLoggedIn, MongoHelper.getInfo, GitHelper.setSessionDictionary, function(req, res, next){
  var tableIndex = req.query.table || 0;
  req.session.temp.table = tableIndex;
  console.log('table index is '+tableIndex);
  var autodetect = (req.query.autodetect && req.query.autodetect == "true");
  res.render('wizard/schema.jade', {user: req.user, dictionary: req.session.dictionary, info: req.session.info, page:'schema', defaults: Defaults, temp: req.session.temp, tableIndex: tableIndex, autodetect: autodetect, error: req.flash('error'), errorDetail:req.flash('errorDetail')});
});

//api routes
router.post('/create', Auth.isLoggedIn, function(req, res, next){
  //reset the current session variables
  req.session.info = null;
  req.session.dictionary = null;
  req.session.curr_dictionary = null;
  req.session.sha = null;
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
          dicData.auth_method = "None";
          dicData.auth_options = {};
          dicData.paging_method = "None";
          dicData.paging_options = {};
          dicData.tables = [];
          var jsonContent = {
            user: repo.owner.login,
            repo: repo.name,
            path: "dictionary.json",
            content: new Buffer(JSON.stringify(dicData)).toString('base64'),
            message: "Initial Dictionary"
          };
          GitHelper.createContent(req, res, jsonContent, function(content){
            response.dictionary = content.content.path;
            response.dictionary_url = "https://api.github.com/repos/"+repo.owner.login+"/"+repo.name+"/contents/"+content.content.path;
            console.log('dictionary_url');
            console.log(response.dictionary_url);
            var iconurl = "./default-icon.png";
            var icon = fs.readFileSync(iconurl);
            icon = new Buffer(icon).toString('base64');
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

router.post('/delete/:id', Auth.isLoggedIn, function(req, res){
  Dictionary.delete({owner:req.user.username, _id: req.params.id}, function(err){
    if(err){
      console.log(err);
      req.json({err: err});
    }
    res.redirect('/dashboard');
  });
});

router.get('/error', function(req, res){
  res.render('error.jade', {error: req.flash('error')});
});


module.exports = router;
