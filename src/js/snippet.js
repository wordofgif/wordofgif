var moment = require('moment');
var process = require('child_process');
var fs = require('fs');
var tmp = require('temporary');


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

function invokeOnExitOf(process, cb) {
  // call callback, when done
  process.on('close', function (code) {
    console.log('child process exited with code ' + code);
    cb(code);
  });

  // debug prints
  process.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  process.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
}

function FFmpegArgs(videoFilename, subtitleFilename, codec, startOffset, duration) {
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

  var args = [
    "-ss", toTimestamp(accurateSeekingStart),
    "-i", videoFilename,
    "-c:v", codec,
    "-ss", toTimestamp(startOffset),
    "-t", toTimestamp(duration),
    "-vf", "subtitles="+escapeFilename(subtitleFilename),
  ];
  return args;
}

function preview(videoFilename, subtitleFilename, startOffset, duration, cb) {
  var output = "out.webm";
  removeFileSync(output);

  // spawn ffmpeg process
  var args = FFmpegArgs(videoFilename, subtitleFilename, "libvpx", startOffset, duration);
  args.push(output);
  console.log("invoking ffmpeg with:", args.join(" "));
  var ffmpeg = process.execFile('ffmpeg', args);

  invokeOnExitOf(ffmpeg, function(code) {
    if (cb) { cb(code); }
  });
}

function render(videoFilename, subtitleFilename, startOffset, duration, cb) {
  var dir = new tmp.Dir();

  // spawn ffmpeg process
  var args = FFmpegArgs(videoFilename, subtitleFilename, "png", startOffset, duration);
  args = args.concat(["-s", "480x270", "-f", "image2", dir.path + "/%03d.png"]);
  console.log("invoking ffmpeg with:", args.join(" "));
  var ffmpeg = process.execFile('ffmpeg', args);

  invokeOnExitOf(ffmpeg, function(code) {
    console.log('child process exited with code:', code, 'files saved to:', dir);
    if (cb) { cb(code); }
  });
}

module.exports = { "preview": preview, "render": render };

