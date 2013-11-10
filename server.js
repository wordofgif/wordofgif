// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('7jLaz2Fmg7i-TH4k');
var express = require('express');

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

var app = express();
app.use(express.logger());
app.use(app.router);
app.use('/page', express.static('page'));

app.get('/',function (req, res) {
  res.sendfile('index.html')
})

app.listen(port, function  () {
  console.log('server running at port' + port);
});