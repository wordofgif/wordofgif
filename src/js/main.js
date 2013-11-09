
$(function() {
  $('input').change(function() {

    var fs = require('fs');
    var _ = require('lodash');
    var srt2data = require('subtitles-parser').fromSrt;

    var file_name = $(this).val();

    var file_content = fs.readFileSync(file_name);

    var quotes = srt2data(file_content.toString());

    $('.typeahead').typeahead({
      name: 'quotes',
      local: _.pluck(quotes, 'text')
    });

  })

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

});

