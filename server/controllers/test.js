module.exports = {
  buildTestUrl: function(req, res){
    var requestUrl = req.body.test_url;
    if(req.session.dictionary.base_endpoint && req.session.dictionary.base_endpoint!=''){
      requestUrl += "/";
      requestUrl += req.session.dictionary.base_endpoint;
    }
    requestUrl += "/";
    requestUrl += req.session.dictionary.tables[req.session.temp.table].endpoint;
    return requestUrl;
  }
}
