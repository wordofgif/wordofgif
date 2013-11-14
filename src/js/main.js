$(function() {

  var video = require('./js/video');
  var fs = require('fs');
  var upload = require('./js/upload');
  var util = require('util');
  var findFile = require('./js/findFiles');
  var SubTitles = require('./js/subTitles');

  function prepareTypeahead(file_name) {

    var files = findFile(file_name);

    if (files.error) {
      alert(files.error);
      return;
    }

    var subTitles = new SubTitles(files.subTitlePath);

    $('.typeahead').on('typeahead:selected', function(ev, context) {
      startVideoProcessing();
      var offset = video.getSeekingStart(context.startTimeParsed).accurateSeekingStart;
      var pathToShiftedSubTitle = subTitles.createShiftedSubTitlesFile(offset);
      var settings = {
        pathToVideo: files.videoPath,
        pathToSubTitle: pathToShiftedSubTitle,
        startTime: context.startTimeParsed,
        duration: context.duration
      };

      video.preview(settings)
        .done(addVideo);

      //TODO avoid rendering anew for each call to upload or download
      $("#saveButton").off('click').click(function() {
        download(settings)
      });
      $("#uploadButton").off('click').click(function() {
        uploadToImgur(settings)
      });
    });

    $('.typeahead').typeahead({
      name: 'quotes',
      limit: 7,
      template: [
        '<p class="text">{{templateText}}</p>',
        '<span class="time">{{templateStartTime}} - {{templateEndTime}} ({{templateDuration}}s)</span>'
      ].join(''),
      engine: require('hogan.js'),
      local: subTitles.quotesForTypeAHead()
    });
  }

  $(window)
    .on('dragover', stop)
    .on('drop', stop);

  var dropzone = $('#dropzone');
  var stage = $('#stage');
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

  function startVideoProcessing() {
    stage.removeClass('subtitles').addClass('loading');
  }

  function addVideo(src) {
    $('video').attr('src', src.path);
    stage.removeClass('loading').addClass('video');
    var videoEl = $('video')[0];

    videoEl.play();
    slider.val([0, 100]);
    videoEl.removeEventListener('timeupdate');
    videoEl.addEventListener('timeupdate', function() {
      var value = 100 / videoEl.duration * videoEl.currentTime;
      var sliderValues = slider.val();
      if (value > sliderValues[1]) {
        value = sliderValues[0];
        videoEl.currentTime = videoEl.duration / 100 * value;
      }
      $('.tick').css('left', value + '%');
    });
  }

  function download(settings) {
    video.render(settings)
      .then(function(gif) {
        var chooser = $("#fileDialog");
        chooser.change(function() {
          var path = $(this).val();
          fs.renameSync(gif.path, path)
        });
        chooser.trigger('click');
      });
  }

  function uploadToImgur(settings) {
    video.render(settings)
      .then(upload.toImgur)
      .then(showImgurUrl, showError);
  }

  function showImgurUrl(url) {
    $('.imgur-url').show().text(url);
  }

  function showError(error) {
    $('.imgur-url').addClass('error').show().text(error.error);
  }

});