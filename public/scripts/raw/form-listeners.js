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
