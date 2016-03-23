var Dictionary = require('../controllers/dictionaries'),
    OAuthCreds = require('../models/oauth-creds'),
    Error = require('../controllers/error');

module.exports = {
  getInfo: function(req, res, next){  //uses the 'id' param on the url to get the info for the specified dictionary
    if(!req.params.id){
      req.flash('error', Error.custom("No Dictionary Id provided."));
      res.redirect('/');
    }
    else{
      if(!req.session.info){
        Dictionary.getOne({owner: req.user.username, _id: req.params.id}, function(err, response){
          if(!response){
            req.flash('error', Error.notYours());
            res.redirect('/');
          }
          else{
            req.session.info = response;
            req.session.temp = {};
            next();
          }
        });
      }
      else{
        next();
      }
    }
  },
  getInfoAnon: function(req, res, next){  //uses the 'id' param on the url to get the info for the specified dictionary
    if(!req.params.id){
      req.flash('error', Error.custom("No Dictionary Id provided."));
      res.redirect('/');
    }
    else{
      Dictionary.getOne({_id: req.params.id}, function(err, response){
        if(!response){
          req.flash('error', Error.notYours());
          res.redirect('/');
        }
        else{
          req.session.info = response;
          req.session.temp = {};
          next();
        }
      });      
    }
  }
}
