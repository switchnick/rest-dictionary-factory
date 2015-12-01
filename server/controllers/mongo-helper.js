var Dictionary = require('../controllers/dictionaries'),
    Error = require('../controllers/error');

module.exports = {
  getInfo: function(req, res, next){  //uses the 'id' param on the url to get the info for the specified dictionary
    if(!req.params.id){
      req.flash('error', Error.notYours());
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
            next();
          }
        });
      }
      else{
        next();
      }
    }
  }
}
