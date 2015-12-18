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
    var index = $(this).attr("data-index");
    window.location = window.location.pathname+"?table="+index;
  });

  $('.autodetect-auth-container').on('click', '.autodetect-auth-cancel', function(event){
    $('.autodetect-auth-container').removeClass('show');
    $('.autodetect-auth-container').addClass('hide');
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
