var module = require('module')

function chooseFile(callback) {
  var chooser = $("#fileDialog");
  chooser.change(function(evt) {
      console.log("file chosen: "+$(this).val());
      callback(val);
    });

  chooser.trigger('click');  
}

module.export.chooseFile = chooseFile;
