$(document).ready(function(){
  $('.delete').on('click', function(event){
    console.log($(this).attr('data-repo'));
    $.post("/delete", {repo: $(this).attr('data-repo')})
    .success(function(data){
      if(data.err){
        console.log(data.err);
      }
      else{
        window.location = "/dashboard";
      }
    });
  });

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

  //listen to focus out on text types
  $('.wizard').on('focusout', '.form-control[type!="radio"][type!="checkbox"]', function(event){
    var provider = $(this).attr("data-provider");
    var prop = $(this).attr("data-prop");
    var data = $(this).val();
    updateSessionDictionary(provider, prop, data);
  });

  //listen to change on radio buttons
  $('.wizard').on('change', '.form-control[type="radio"],.form-control[type="checkbox"], .form-control.drop-down', function(event){
    updateSessionConfig();
    if(event.target.attributes['data-name'].value=='paging_method'){
      window.location = '/config/'+getId()+'/schema';
    }
  });

  //listen to the save button
  $('.wizard').on('click', '.save', function(event){
    var id = window.location.pathname.split("/").pop();
    $.get('/api/save/'+id).success(function(data){
      if(data.err){
        console.log(data.err);
      }
      else{
        $('.save-successful').show();
        $('.save-description').hide();
        setTimeout(function(){
          $('.save-successful').hide();
          $('.save-description').show();
        }, 1000);
      }
    });
  });

  $('.wizard').on('click', '.auth-method, .paging-method', function(event){
    var provider = $(this).attr("data-provider");
    var prop = $(this).attr("data-prop");
    var data = $(this).attr("data-item");
    updateSessionDictionary(provider, prop, data);
    window.location = window.location;
  });

  $('.wizard').on('click', '.table-card', function(event){
    var index = $(this).attr("data-index");
    window.location = window.location.pathname+"?table="+index;
  });

  $('.wizard').on('click', '.auto-detect', function(event){
    autoDetectFields();
  });

  $('.autodetect-auth-container').on('click', '.autodetect-auth-ok', function(event){
    var authInfo = {};
    $('.autodetect-auth-container .autodetect-auth .auth-item').each(function(index, item){
      authInfo[$(item).attr('data-param')] = $(item).val();
    });
    window.autoDetectAuthCallback.call(null, authInfo);
  });

  $('.autodetect-auth-container').on('click', '.autodetect-auth-cancel', function(event){
    $('.autodetect-auth-container').hide();
    $('.autodetect-auth .required-auth-info').html('');
    window.autoDetectAuthCallback = null;
  });

  function updateSessionDictionary(provider, prop, data){
    var id = window.location.pathname.split("/").pop();
    if(prop){
      $.post("/api/updatesessiondictionary/"+id, {provider: provider, prop: prop, data: data}).success(function(data){
        if(data.err){

        }
        else{

        }
      });
    }
  };

});
