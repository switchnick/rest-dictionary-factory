//listen to focus out on text types
$('.wizard').on('focusout', '.form-control[type!="radio"][type!="checkbox"]', function(event){
  var provider = $(this).attr("data-provider");
  var prop = $(this).attr("data-prop");
  var data = $(this).val();
  updateSessionDictionary(provider, prop, data);
});
$('.autodetect-auth').on('focusout', '.form-control[type!="radio"][type!="checkbox"]', function(event){
  var provider = $(this).attr("data-provider");
  var prop = $(this).attr("data-prop");
  var data = $(this).val();
  updateSessionDictionary(provider, prop, data);
});

//listen to change on radio buttons
$('.wizard').on('change', '.form-control[type="radio"],.form-control[type="checkbox"], .form-control.drop-down', function(event){
  var provider = $(this).attr("data-provider");
  var prop = $(this).attr("data-prop");
  var data = $(this).val();
  updateSessionDictionary(provider, prop, data);
  window.location = window.location;
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
  if(event.target.classList.contains('delete-button')){
    event.stopPropagation();
    //the delete is handled in a separate function
    return;
  }
  var index = $(this).attr("data-index");
  window.location = window.location.pathname+"?table="+index;
});

//listen to the icon upload input
$('.wizard').on('change', '#file', function(event){
  var r = new FileReader();
  var file = event.target.files[0];
  var id = event.target.attributes["data-id"].value;
  var iconData = {
    type: file.type,
    name: file.name
  };
  r.onloadend = function(){
    var iconCanvas = document.createElement('canvas');
    var iconContext = iconCanvas.getContext('2d');
    var icon = new Image();
    icon.onload = function(){
      var width = icon.width;
      var height = icon.height;
      if(width > 200 || height > 200){
        if(width > height){
          height = (height / width) * 200;
          width = 200;
        }
        else if(height > width) {
          width = (width / height) * 200;
          height = 200;
        }
        else{
          width = 200;
          height = 200;
        }
      }
      iconCanvas.width = 200;
      iconCanvas.height = 200;
      iconContext.drawImage(icon, ((iconCanvas.width - width) / 2), ((iconCanvas.height - height) / 2) , width, height);
      iconData.data = iconCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
      $(".icon img").attr("src", iconCanvas.toDataURL("image/png"));
      $.post("/api/iconupload/"+id, {icon:iconData}).success(function(data){

      });

    };
    icon.src = r.result;
  }
  r.readAsDataURL(file);
});

$('.wizard').on('click', '.delete-button', function(event){
  var item = event.target.parentNode.attributes["data-item"].value;
  var index = event.target.parentNode.attributes["data-index"].value;
  var dicId = event.target.parentNode.attributes["data-id"].value;
  var url = "/api/delete"+item+"/"+dicId+"/";
  var parentIndex;
  if(event.target.parentNode.attributes["data-parent-index"]){
    parentIndex = event.target.parentNode.attributes["data-parent-index"].value
    url+= parentIndex + "/";
  }
  url+= index;
  $.post(url).success(function(response){
    window.location.reload(true);
  });
});

$('.autodetect-auth-container').on('click', '.autodetect-auth-cancel', function(event){
  $('.autodetect-auth-container').removeClass('show');
  $('.autodetect-auth-container').addClass('hide');
});
