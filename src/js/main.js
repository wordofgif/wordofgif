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
      local: _.map(quotes, function(srt_entry) {
        _.extend(srt_entry, {
          value: srt_entry.text
        });
        return srt_entry;
      })
    });

  });

  $(window)
    .on('dragover', stop)
    .on('drop', stop);

  var dropzone = $('#dropzone');
  var stage = $('#stage');
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
    stage.removeClass('drop').addClass('subtitles')
  }

  function hover() {
    $(this).addClass('hover')
  }

  function leave() {
    $(this).removeClass('hover')
  }

  function stop(e) {
    e.preventDefault();
  }

});

