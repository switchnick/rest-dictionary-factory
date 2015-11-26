//this file just helps to clean up the code structure of the client.js route file
var git = require('github');

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
  createRepo: function(req, res, repoData, callbackFn){
    GitHub.authenticate({type: "oauth", token: req.session.token});
    GitHub.repos.create(repoData, function(err, repo){
      if(err){
        console.log('error creating repo');
        console.log(err);
        req.flash('error', err);
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
        req.flash('error', err);
        res.render('wizard/create.jade', {user: req.user, error: req.flash('error')});
      }
      else{
        console.log('created content');
        console.log(content);
        callbackFn.call(null, content);
      }
    });
  }
}
