//this file just helps to clean up the code structure of the client.js route file
var git = require('github'),
    atob = require('atob');

GitHub = new git({
  version: "3.0.0",
  debug: false,
  protocol: "https",
  host: "api.github.com", // should be api.github.com for GitHub
  pathPrefix: "", // for some GHEs; none for GitHub
  timeout: 5000,
  headers: {
      "user-agent": "rest-factory" // GitHub is happy with a unique user agent
  }
});

module.exports = {
  setSessionDictionary: function(req, res, next){
    console.log('g3');
    if(!req.session.dictionary || req.session.curr_dictionary != req.params.id){
      GitHub.repos.getContent({user: req.user.username, repo: req.session.info.name, path: req.session.info.dictionary}, function(err, content){
        if(err){
          console.log('error getting content');
          console.log(err);
          req.flash('error', err.message);
          res.redirect('/error');
        }
        else{
          req.session.dictionary = JSON.parse(atob(content.content));
          req.session.curr_dictionary = req.params.id;
          req.session.sha = content.sha;
          next();
        }
      });
    }
    else{
      next();
    }
  },
  checkForRepo: function(req, res, repo, owner, callbackFn){
    console.log('looking for '+owner+"/"+repo);
    GitHub.authenticate({type: "oauth", token: req.session.token});
    GitHub.repos.get({user: owner, repo:repo}, function(err, repo){
      if(err){
        console.log(err);
      }
      if(repo){
        console.log('existing repo found');
        req.flash('error', "You already have a repo with that name.");
        res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
      }
      else{
        callbackFn.call();
      }
    });
  },
  getContent: function(req, res, query, callbackFn){
    GitHub.authenticate({type: "oauth", token: req.session.token});
    console.log(query);
    GitHub.repos.getContent(query, function(err, content){
      if(err){
        console.log('error getting content');
        console.log(err);
        req.flash('error', err.message);
        res.redirect('/error');
      }
      else{
        console.log('content got');
        callbackFn.call(null, content);
      }
    });
  },
  createRepo: function(req, res, repoData, callbackFn){
    GitHub.authenticate({type: "oauth", token: req.session.token});
    GitHub.repos.create(repoData, function(err, repo){
      if(err){
        console.log('error creating repo');
        console.log(err);
        req.flash('error', err.message);
        res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
      }
      else{
        console.log('created repo');
        callbackFn.call(null, repo);
      }
    });
  },
  createContent: function(req, res, content, callbackFn){
    console.log(req.session.token);
    GitHub.authenticate({type: "oauth", token: req.session.token});
    GitHub.repos.createContent(content, function(err, content){
      if(err){
        console.log('error creating content');
        console.log(err);
        req.flash('error', err.message);
        res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
      }
      else{
        console.log('created content');
        console.log(content);
        callbackFn.call(null, content);
      }
    });
  },
  updateContent: function(req, res, data, callbackFn){
    GitHub.authenticate({type: "oauth", token: req.session.token});
    GitHub.repos.updateFile(data, function(err){
      if(err){
        callbackFn.call(null, err);
      }
      else {
        callbackFn.call(null);
      }
    });
  }
}
