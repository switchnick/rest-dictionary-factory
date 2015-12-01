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
