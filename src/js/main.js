$(function() {

  function prepareTypeahead(file_name) {
    var fs = require('fs');
    var moment = require('moment');
    var _ = require('lodash');
    var srt2data = require('subtitles-parser').fromSrt;
    var preview = require('./js/snippet').preview;

    var file_content = fs.readFileSync(file_name);
    var quotes = srt2data(file_content.toString());

    console.log(quotes);
    $('.typeahead').on('typeahead:selected', function(ev, context) {
      console.log(context);
      preview(file_name.replace("srt", "avi"), file_name.replace("avi", "srt"), context.startTimeParsed, context.duration, function() {
      });
    });

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 5,
      template: [
        '<p class="text">{{text}}</p>',
        '<span class="time">{{startTimeStripped}} - {{endTimeStripped}} ({{durationInSeconds}}s)</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: _.map(quotes, function(srt_entry) {
        var start = moment.duration(srt_entry.startTime.replace(",", ".")).asMilliseconds();
        var end = moment.duration(srt_entry.endTime.replace(",", ".")).asMilliseconds();
        var duration = (end - start);

        _.extend(srt_entry, {
          value: srt_entry.text,
          text: srt_entry.text.replace(/<[^>]*>/g, ''),
          startTimeStripped: moment(start).utc().format('HH:mm:ss'),
          endTimeStripped: moment(end).utc().format('HH:mm:ss'),
          duration: duration,
          durationInSeconds: Math.floor(duration / 1000),
          startTimeParsed: start,
          endTimeParsed: end
        });
        return srt_entry;
      })
    });
  }

  $(window)
    .on('dragover', stop)
    .on('drop', stop);

  var dropzone = $('#dropzone');
  var stage = $('#stage');
  var video = $('#video');
  var slider = $('.bar').noUiSlider({
    range: [0, 100],
    start: [0, 100]
  });

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
    window.focus();
    $('.typeahead').focus();
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

  function addVideo(src) {
    stage.removeClass('subtitles').addClass('video');
    $('video').attr('src', src);
    var video = $('video')[0];

    video.play();
    slider.val([0, 100]);
    video.removeEventListener('timeupdate');
    video.addEventListener('timeupdate', function() {
      var value = 100 / video.duration * video.currentTime;
      var sliderValues = slider.val();
      if (value > sliderValues[1]) {
        value = sliderValues[0];
        video.currentTime = video.duration / 100 * value;
      }
      $('.tick').css('left', value + '%');
    });
  }
});


