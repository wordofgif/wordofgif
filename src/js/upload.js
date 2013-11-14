var request = require('request');
var fs = require('fs');
var when = require('when');

var imgurUploadPath = 'https://api.imgur.com/3/image';

var imgurUploadOptions = {
  url: imgurUploadPath,
  headers: {
    Authorization: 'Client-ID 7bc6ef5e4ecf6b2'
  }
}

function toImgur(gif, text) {
  console.log('start upload');

  var deferred = when.defer();
  var r = request.post(imgurUploadOptions, function(error, response, body) {
    if (body) {
      var body = JSON.parse(body);
      if (body.success) {
        var url = body.data.link;
        deferred.resolve(url);
      } else {
        deferred.reject({status: body.status, error: body.data.error});
      }
    } else {
      deferred.reject({error: error});
    }
  });

  var form = r.form();

  form.append('image', fs.createReadStream(gif.path));
//  form.append('description', text);
  form.append('type', 'file');

  return deferred.promise;
}

module.exports = {'toImgur': toImgur};