$(function() {

  function prepareTypeahead(file_name) {
    var fs = require('fs');
    var moment = require('moment');
    var _ = require('lodash');
    var srt2data = require('subtitles-parser').fromSrt;
    var file_content = fs.readFileSync(file_name);
    var quotes = srt2data(file_content.toString());

    console.log(quotes);

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 5,
      template: [
        '<p class="text">{{text}}</p>',
        '<span class="time">{{startTimeStripped}} - {{endTimeStripped}} ({{duration}}s)</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: _.map(quotes, function(srt_entry) {
        var start = moment.duration(srt_entry.startTime).asMilliseconds();
        var end = moment.duration(srt_entry.endTime).asMilliseconds();
        var duration = (end - start) / 1000;
        _.extend(srt_entry, {
          value: srt_entry.text,
          text: srt_entry.text.replace(/<[^>]*>/g, ''),
          startTimeStripped: moment(start).utc().format('HH:mm:ss'),
          endTimeStripped: moment(end).utc().format('HH:mm:ss'),
          duration: duration
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
    stage.removeClass('drop').addClass('subtitles');
    dropzone.removeClass('hover');
    prepareTypeahead(path);
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


