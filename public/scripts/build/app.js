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
});
