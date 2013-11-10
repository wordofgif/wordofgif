var moment = require('moment');
var child_process = require('child_process');
var fs = require('fs');
var tmp = require('temporary');
var sh = require('shelljs');
var _ = require('lodash');
var rimraf = require('rimraf');


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

function runProcess(executable, args, cb) {
  console.log("invoking", executable, "with:", args.join(" "));
  var process = child_process.execFile(executable, args, {
    env: {
      DYLD_LIBRARY_PATH: sh.pwd() + '/vendor/bin/osx/',
      PATH:sh.pwd() + '/vendor/bin/osx/',
    }
  });

  // call callback, when done
  process.on('close', function (code) {
    console.log('child process exited with code ' + code);
    if (code == 0)
      cb();
  });

  // debug prints
  process.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  process.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
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
    accurateSeekingStart:accurateSeekingStart,
    startOffset:startOffset,
  }

}

function FFmpegArgs(videoFilename, subtitleFilename, codec, startOffset, duration) {
  var args = [
    "-ss", toTimestamp(getSeekingStart(startOffset).accurateSeekingStart),
    "-i", videoFilename,
    "-c:v", codec,
    "-ss", toTimestamp(getSeekingStart(startOffset).startOffset),
    "-t", toTimestamp(duration),
    "-vf", "subtitles="+escapeFilename(subtitleFilename),
  ];
  return args;
}

function preview(videoFilename, subtitleFilename, startOffset, duration, cb) {
  var output = new tmp.File();
  output.path += ".webm";

  // spawn ffmpeg process
  var args = FFmpegArgs(videoFilename, subtitleFilename, "libvpx", startOffset, duration);
  args.push(output.path);

  runProcess('ffmpeg', args, function() {
    if (cb) { cb(output); }
  });
}

function render(videoFilename, subtitleFilename, startOffset, duration, cb) {
  var dir = new tmp.Dir();

  // spawn ffmpeg process
  var argsFFmpeg = FFmpegArgs(videoFilename, subtitleFilename, "png", startOffset, duration);
  argsFFmpeg = argsFFmpeg.concat(["-s", "480x270", "-f", "image2", "-r", 8, dir.path + "/%03d.png"]);

  runProcess('ffmpeg', argsFFmpeg, function() {
    console.log('ffmpeg process finished. files saved to:', dir);
    var output = new tmp.File();
    output.path += ".gif";

    var files = sh.ls(dir.path)

    var longFiles = _.map(files, function(file){
      return dir.path+"/"+file;
    })

    argsConvert = ["+dither", "-fuzz", "3%", "-delay", "1x8"]
    argsConvert = argsConvert.concat(longFiles)
    argsConvert = argsConvert.concat(["-coalesce", "-layers", "OptimizeTransparency", output.path])

    // spawn imagemagick convert process
    runProcess('convert', argsConvert, function() {
      rimraf.sync(dir.path);
      if (cb) { cb(output); }
    });
  });
}

module.exports = { "preview": preview, "render": render, "getSeekingStart": getSeekingStart };

