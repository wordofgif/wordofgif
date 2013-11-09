$(function() {

  function prepareTypeahead(file_name) {
    var fs = require('fs');
    var _ = require('lodash');
    var srt2data = require('subtitles-parser').fromSrt;
    var file_content = fs.readFileSync(file_name);
    var quotes = srt2data(file_content.toString());

    console.log(quotes);

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 12,
      template: [
        '<p class="text">{{text}}</p>',
        '<span class="startTime">{{startTime}}</span>',
        '<span class="endTime">{{endTime}}</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: _.map(quotes, function(srt_entry) {
        _.extend(srt_entry, {
          value: srt_entry.text
        });
        return srt_entry;
      })
    });
  }


  $('input').change(function() {
    var file_name = $(this).val();
    prepareTypeahead(file_name);
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
    stage.removeClass('drop').addClass('subtitles')

    prepareTypeahead(path);
    console.log(path);
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


