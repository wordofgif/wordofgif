var moment = require('moment');
var process = require('child_process');
var fs = require('fs');


function toTimestamp(milis) {
  return moment(milis).utc().format('HH:mm:ss.SSS');
}

function escapeFilename(filename) {
  return filename.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function preview(videoFilename, subtitleFilename, startOffset, duration, cb) {
  // constants
  var codec = "libvpx";
  var output = "out.webm";
  var inaccuracyPeriod = 30 * 1000;

  if (fs.existsSync(output)) {
    fs.unlinkSync(output);
  }

  // figure out fast vs. accurate seeking
  var accurateSeekingStart;
  if (startOffset > inaccuracyPeriod) {
     accurateSeekingStart = startOffset - inaccuracyPeriod;
     startOffset = inaccuracyPeriod;
  } else {
     accurateSeekingStart = 0;
  }

  // spawn ffmpeg process
  var args = [
    "-ss", toTimestamp(accurateSeekingStart),
    "-i", videoFilename,
    "-c:v", codec,
    "-ss", toTimestamp(startOffset),
    "-t", toTimestamp(duration),
    "-vf", "subtitles="+escapeFilename(subtitleFilename),
    output ];
  console.log(args);
  var ffmpeg = process.execFile('ffmpeg', args);

  // call callback, when done
  ffmpeg.on('close', function (code) {
    console.log('child process exited with code ' + code);
    if (cb) {
      cb(code);
    }
  });

  // debug prints
  ffmpeg.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  ffmpeg.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
}

module.exports = { "preview": preview };

