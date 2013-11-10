var request = require('request');
var fs = require('fs');
//var util = require('util');

var imgurUploadPath = 'https://api.imgur.com/3/image';

var imgurUploadOptions = {
  url: imgurUploadPath,
  headers: {
    Authorization: 'Client-ID 7bc6ef5e4ecf6b2'
  }
}


function upload(path, text){
  var r = request.post(imgurUploadOptions, function(e, r, rbody){
      //console.log("e: "+e);
      //console.log("r: "+r);
      //console.log("rbody: "+rbody);

      if(rbody){
        var body = JSON.parse(rbody)
        //console.log("body: "+util.inspect(body))
        if(body.success){
          //console.log("success")
          var url = body.data.link
          return {url: url, sucess: true}
        } else {
          //console.log("error")
          return {success: false, error: "upload failed, imgur returned "+body.status+", error: "+body.data.error} 
        }
      } else {
        //console.log("unknown error")
        return {success: false, error: "unknown error: "+e}
      } 
    });

  var form = r.form();

  form.append('image', fs.createReadStream(path))
  //form.append('title', 'TODO: titles')
  form.append('description', text)
  form.append('type', 'file')
}

module.exports = {"upload": upload};