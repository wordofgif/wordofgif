var moment = require('moment');
var fs = require('fs');
var tmp = require('temporary');
var sh = require('shelljs');
var _ = require('lodash');
var rimraf = require('rimraf');
var when = require('when');
var process = require('../js/process');

function toTimestamp(milis) {
  return moment(milis).utc().format('HH:mm:ss.SSS');
}

function escapeFilename(filename) {
  return filename.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function removeFileSync(filename) {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
}

function getSeekingStart(startOffset) {
  // constants
  var inaccuracyPeriod = 30 * 1000;

  // figure out fast vs. accurate seeking
  var accurateSeekingStart;
  if (startOffset > inaccuracyPeriod) {
    accurateSeekingStart = startOffset - inaccuracyPeriod;
    startOffset = inaccuracyPeriod;
  } else {
    accurateSeekingStart = 0;
  }

  return {
    accurateSeekingStart: accurateSeekingStart,
    startOffset: startOffset
  }
}

function ffmpegArgs(settings, codec) {
  var seekingStart = getSeekingStart(settings.startTime);
  return [
    "-ss", toTimestamp(seekingStart.accurateSeekingStart),
    "-i", settings.pathToVideo,
    "-c:v", codec,
    "-ss", toTimestamp(seekingStart.startOffset),
    "-t", toTimestamp(settings.duration),
    "-vf", "subtitles=" + escapeFilename(settings.pathToSubTitle)
  ];
}

function createTmpFile(extension) {
  var output = new tmp.File();
  output.path += "." + extension;
  return output;
}

function preview(settings) {
  var output = createTmpFile('webm');

  // spawn ffmpeg process
  var args = ffmpegArgs(settings, "libvpx");
  args.push(output.path);

  return  process.run('ffmpeg', args)
    .then(function() {
      return output;
    });
}

function render(settings) {
  var output;
  var dir = new tmp.Dir();
  var argsFFmpeg = ffmpegArgs(settings, "png")
    .concat(["-s", "480x270", "-f", "image2", "-r", 8, dir.path + "/%03d.png"]);

  // spawn ffmpeg process
  return  process.run('ffmpeg', argsFFmpeg)
    .then(function() {
      console.log('ffmpeg process finished. files saved to:', dir);
      output = createTmpFile('gif');

      var files = sh.ls(dir.path);

      var longFiles = _.map(files, function(file) {
        return dir.path + "/" + file;
      });

      return  argsConvert = ["+dither", "-fuzz", "3%", "-delay", "1x8"]
        .concat(longFiles)
        .concat(["-coalesce", "-layers", "OptimizeTransparency", output.path]);

    })
    .then(_.partial(process.run, 'convert'))
    .then(function() {
      rimraf.sync(dir.path);
      return output
    });
}

module.exports = { "preview": preview, "render": render, "getSeekingStart": getSeekingStart };