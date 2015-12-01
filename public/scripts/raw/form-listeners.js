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
