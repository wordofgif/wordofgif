$(function() {
  $(window)
    .on('dragover', stop)
    .on('drop', stop);

  var dropzone = $('#dropzone');

  dropzone
    .on('dragover', hover)
    .on('dragleave', leave)
    .on('dragend', leave)
    .on('drop', ondrop);


  
  function ondrop(e) {
    e.preventDefault();
    var path = e.originalEvent.dataTransfer.files[0].path;
    var video = document.getElementById('video');
    console.log(path);
  }

  function hover() {
    this.className = 'hover'
  }

  function leave() {
    this.className = ''
  }

  function stop(e) {
    e.preventDefault();
  }

})

