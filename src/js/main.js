$(function() {

  var moment = require('moment');
  var subtitles_parser = require('subtitles-parser');
  var tmp = require('temporary');
	var preview = require('./js/snippet').preview;
	var snippet = require('./js/snippet');
	var fs = require('fs')
	var uploadToImgur = require('./js/upload').upload
	var util = require('util');

  function parseSrtTime(string) {
    return moment.duration(string.replace(",", ".")).asMilliseconds()
  }

  function formatSrtTime(millis) {
    return moment(millis).utc().format("HH:mm:ss,SSS")
  }

  function prepareTypeahead(file_name) {
    var fs = require('fs');
    var _ = require('lodash');

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

			//TODO avoid rendering anew for each call to upload or download
			$("#saveButton").off('click').click(function(){download(file_name, shifted_subtitles_file.path, context.startTimeParsed, context.duration)})
			$("#uploadButton").off('click').click(function(){upload(file_name, shifted_subtitles_file.path, context.startTimeParsed, context.duration, "words of GIF")})
    });

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 7,
      template: [
        '<p class="text">{{text}}</p>',
        '<span class="time">{{startTimeStripped}} - {{endTimeStripped}} ({{durationInSeconds}}s)</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: _.shuffle(_.map(quotes, function(srt_entry) {
        var secondsBefore = 2;
        var secondsAfter = 2;
        var start = math.min(0, parseSrtTime(srt_entry.startTime) - secondsBefore * 1000);
        var end = parseSrtTime(srt_entry.endTime) + secondsAfter * 1000;
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

  function download(videoPath, shifted_subtitles_file_path, startTimeParsed, duration){

		console.log("download video: "+videoPath+", subfile: "+shifted_subtitles_file_path+", startTime: "+startTimeParsed+", duration: "+duration)

		snippet.render(
			videoPath.replace("srt", "avi"),
			shifted_subtitles_file_path,
			startTimeParsed,
			duration,
			function(gif){
				console.log("gif rendered to "+gif.path)
				var chooser = $("#fileDialog");
				chooser.change(function(evt) {
						path = $(this).val()
						console.log("move "+gif.path+"to "+path);
						fs.renameSync(gif.path, path)
					});

				chooser.trigger('click');

			}
		);
	}

  function upload(videoPath, shifted_subtitles_file_path, startTimeParsed, duration, subtitles){
		console.log("upload video: "+videoPath+", subfile: "+shifted_subtitles_file_path+", startTime: "+startTimeParsed+", duration: "+duration+", subs: "+subtitles)
		snippet.render(
			videoPath.replace("srt", "avi"),
			shifted_subtitles_file_path,
			startTimeParsed,
			duration,
			function(gif){
				console.log("gif rendered to "+gif.path)

				uploadToImgur(gif.path, subtitles, function(result){
						if(result.success){
              console.log("uploaded to " + result.url);
              showImgurUrl(result.url)
						} else {
							console.log("error: "+util.inspect(result.error))
              showError(result.error);
						}
					})
			}
		)
  }

  function showImgurUrl(url) {
    $('.imgur-url').show().text(url);
  }

  function showError(error) {
    $('.imgur-url').addClass('error').show().text(url);
  }


});


