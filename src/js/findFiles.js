var fs = require('fs');
var _ = require('lodash');

function findFile(path) {
  var match = path.match(/([^]*)\.([^.]*)$/);
  var fileName = match[1];
  var extension = match[2];
  var videoPath;
  var subtitlePath;
  console.log(fileName);
  if (extension.match(/avi|mpeg|mpg|mp4|mkv/)) {
    videoPath = path;
    if (fs.existsSync(fileName) + '.srt') {
      subtitlePath = fileName + '.srt';
    }
  } else if (extension.match(/srt/)) {
    subtitlePath = path;
    _.each(['.avi', '.mpeg'], function(extension) {
      if (fs.existsSync(fileName + extension)) {
        videoPath = fileName + extension;
        return false;
      }
    });
  }
  if (videoPath && subtitlePath) {
    return {
      videoPath: videoPath,
      subTitlePath: subtitlePath
    };
  }

  return {
    error: 'Cant find ' + (!videoPath ? 'video' : 'subtitle') + 'file.'
  }
}

module.exports = findFile;