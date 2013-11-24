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

function ffmpegArgs(settings, codec) {
  var seekingStart = getSeekingStart(settings.startTime);
  return [
    '-ss', toTimestamp(seekingStart.accurateSeekingStart),
    '-i', settings.pathToVideo,
    '-c:v', codec,
    '-ss', toTimestamp(seekingStart.startOffset),
    '-t', toTimestamp(settings.duration),
    '-vf', 'subtitles=' + escapeFilename(settings.pathToSubTitle)
  ];
}

function createTmpFile(extension) {
  var output = new tmp.File();
  output.path += '.' + extension;
  return output;
}


var Video = function(settings) {
  this.settings = settings;
}

Video.prototype.preview = function() {
  var output = createTmpFile('webm');

  // spawn ffmpeg process
  var args = ffmpegArgs(this.settings, 'libvpx');
  args.push(output.path);

  return  process.run('ffmpeg', args)
    .then(function() {
      return output;
    });
}

Video.prototype.renderFirstFrame = function() {
  var output = createTmpFile('png');
  var args = ffmpegArgs(this.settings, 'png')
    .concat(['-f', 'image2', '-f' , 'image2', '-vframes', 1, output.path]);

  return process.run('ffmpeg', args)
    .then(function() {
      return output;
    });
}

Video.prototype.getMetaData = function() {
  var args = ['-i', this.settings.pathToVideo];
  return process.run('ffmpeg', args);
}


Video.prototype.getSize = function() {
  var deferred = when.defer();
  this.getMetaData().then(null, null, function(metadata) {
    deferred.resolve(metadata.match(/(([0-9]{2,5})x([0-9]{2,5}))/));
  });

  return deferred.promise
}

Video.prototype.render = function(cut) {
  console.log(cut);
  var output;
  var dir = new tmp.Dir();
  var settings = _.extend(
    {},
    this.settings,
    {
      duration: parseInt(this.settings.duration / 100 * (cut[1] - cut[0])),
      startTime: parseInt(this.settings.startTime + this.settings.duration / 100 * cut[0])
    });

  return  this.getSize()
    .then(function(size) {
      var argsFFmpeg = ffmpegArgs(settings, 'png')
        .concat(['-s', size[0], '-f', 'image2', '-r', 8, dir.path + '/%03d.png']);

      return process.run('ffmpeg', argsFFmpeg)
    })
    .then(function() {
      console.log('ffmpeg process finished. files saved to:', dir);
      output = createTmpFile('gif');

      var files = sh.ls(dir.path);

      var longFiles = _.map(files, function(file) {
        return dir.path + '/' + file;
      });

      return  argsConvert = ['+dither', '-fuzz', '3%', '-delay', '1x8']
        .concat(longFiles)
        .concat(['-coalesce', '-layers', 'OptimizeTransparency', output.path]);

    })
    .then(_.partial(process.run, 'convert'))
    .then(function() {
      rimraf.sync(dir.path);
      return output
    });
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
module.exports = Video;