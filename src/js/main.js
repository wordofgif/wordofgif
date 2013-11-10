$(function() {

  var moment = require('moment');
  var subtitles_parser = require('subtitles-parser');
  var tmp = require('temporary');

  function parseSrtTime(string) {
    return moment.duration(string.replace(",", ".")).asMilliseconds()
  }

  function formatSrtTime(millis) {
    return moment(millis).utc().format("HH:mm:ss,SSS")
  }

  function prepareTypeahead(file_name) {
    var fs = require('fs');
    var _ = require('lodash');
    var preview = require('./js/snippet').preview;

    var getSeekingStart = require('./js/snippet').getSeekingStart;

    var findFile = require('./js/findFiles');
    var files = findFile(file_name);
    if (files.error) {
      alert(files.error);
      return;
    }
    var file_content = fs.readFileSync(files.subTitlePath);
    var quotes = subtitles_parser.fromSrt(file_content.toString());

    var get_quotes_with_offset = function(offset) {

      console.log('shifting by', offset, 'milliseconds (', formatSrtTime(offset), ')');

      return _.map(quotes, function(srt_entry) {

        var shifted_start = parseSrtTime(srt_entry.startTime) - offset;
        var shifted_end = parseSrtTime(srt_entry.endTime) - offset;

        if (shifted_start < 0 || shifted_end < 0) {
          return -1;
        }

        _.extend(srt_entry, {
          startTime: formatSrtTime(shifted_start),
          endTime: formatSrtTime(shifted_end)
        })

        return srt_entry;
      }).filter(function(entry) {
        return entry != -1;
      }).map(function(srt_entry, index) {
        _.extend(srt_entry, {
          id: ""+ (index + 1)
        });
        return srt_entry;
      })

    }

    console.log(files);
    console.log(quotes);

    $('.typeahead').on('typeahead:selected', function(ev, context) {
      console.log(context);
      startVideoProcessing();
      var shifted_subtitles_file = new tmp.File('srt');
      shifted_subtitles_file.writeFileSync(
        subtitles_parser.toSrt(get_quotes_with_offset(getSeekingStart(context.startTimeParsed).accurateSeekingStart))
      )
      preview(
        files.videoPath,
        shifted_subtitles_file.path,
        context.startTimeParsed,
        context.duration,
        addVideo
      );

    });

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 5,
      template: [
        '<p class="text">{{text}}</p>',
        '<span class="time">{{startTimeStripped}} - {{endTimeStripped}} ({{durationInSeconds}}s)</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: _.shuffle(_.map(quotes, function(srt_entry) {
        var start = parseSrtTime(srt_entry.startTime);
        var end = parseSrtTime(srt_entry.endTime);
        var duration = (end - start);

        var context = {}

        _.extend(context, srt_entry, {
          value: srt_entry.text,
          text: srt_entry.text.replace(/<[^>]*>/g, ''),
          startTimeStripped: moment(start).utc().format('HH:mm:ss'),
          endTimeStripped: moment(end).utc().format('HH:mm:ss'),
          duration: duration,
          durationInSeconds: Math.floor(duration / 1000),
          startTimeParsed: start,
          endTimeParsed: end
        });
        return context;
      }))
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
  function startVideoProcessing () {
    stage.removeClass('subtitles').addClass('loading');  }

  function addVideo(src) {
    $('video').attr('src', src.path);
    stage.removeClass('loading').addClass('video');
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


