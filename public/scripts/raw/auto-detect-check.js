function autoDetectFields(){
  var id = window.location.pathname.split("/").pop();
  var tableIndex = getUrlVars().table;
  console.log(id);
  $.get('/api/autodetectcheck/'+id).success(function(data){
    if(data.err){

    }
    else{
      //we should be able to get the Fields
      //first we need to see if there is any authentication information to obtain
      //the response from the last call gives us the auth_method, auth_options and auth_test_defaults data
      getAutoDetectAuthInfo(data, function(authInfo){
        authInfo.table = tableIndex;
        //now we can execute the call
        console.log('authInfo');
        console.log(authInfo);
        $.post('/api/autodetectfields/'+id, authInfo).success(function(data){
          if(data.err){
            console.log(data.err);
          }
          else{
            window.location = window.location;
          }
        });
      });
    }
  });
}

function getAutoDetectAuthInfo(auth, callbackFn){
  window.autoDetectAuthCallback = callbackFn;
  var defaults = auth.auth_test_defaults;
  if(auth.auth_test_defaults && auth.auth_test_defaults.params){
    var params = auth.auth_test_defaults.params;
    var html = "";
    for(var i=0;i<params.length;i++){
      html += "<label>"+params[i].name+"</label>";
      html += "<input type='"+params[i].type+"' class='form-control auth-item' data-param='"+params[i].param+"'>";
      html += "<p class='hint'>"+params[i].description+"</p>";
    }
  }
  $('.autodetect-auth .required-auth-info').html(html);
  $('.autodetect-auth-container').show();
}

function getUrlVars() {
  var url = window.location.href;
  var vars = {};
  var hashes = url.split("?")[1];
  var hash = hashes.split('&');

  for (var i = 0; i < hash.length; i++) {
  params=hash[i].split("=");
  vars[params[0]] = params[1];
  }
  return vars;
}
