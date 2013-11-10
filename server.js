// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('7jLaz2Fmg7i-TH4k');
var express = require('express');
var request = require('request');
var fs = require('fs');
var util = require('util');

var isProduction = (process.env.NODE_ENV === 'production');
var http = require('http');
var port = (isProduction ? 80 : 8000);

var imgurUploadPath = 'https://api.imgur.com/3/image';

var imgurUploadOptions = {
  url: imgurUploadPath,
  headers: {
    Authorization: 'Client-ID 7bc6ef5e4ecf6b2'
  }
}

var app = express();
app.use(express.bodyParser({keepExtensions: true}));

app.get('/',function (req, res) {
  // http://blog.nodeknockout.com/post/35364532732/protip-add-the-vote-ko-badge-to-your-app
  res.sendfile('index.html')
})

app.post('/upload', function(req, res){

    console.log("upload image");
    console.log("files: "+req.files);
    console.log("path: "+req.files.image.path);

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
            res.json({url: url})
          } else {
            //console.log("error")
            res.json(body.status, {error: body.data.error}) 
          }
        } else {
          //console.log("unknown error")
          res.send(500, {error: 'something blew up'})
        } 
      });

    var form = r.form();
    
    form.append('image', fs.createReadStream(req.files.image.path))
    form.append('title', 'TODO: titles')
    form.append('description', 'TODO: description')
    form.append('type', 'file')

  })


app.listen(port, function(err) {
  if (err) { console.error(err); process.exit(-1); }

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0) {
    require('fs').stat(__filename, function(err, stats) {
      if (err) { return console.error(err); }
      process.setuid(stats.uid);
    });
  }

  console.log('Server running at http://0.0.0.0:' + port + '/');
});
