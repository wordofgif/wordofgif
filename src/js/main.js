
$(function() {
  $('input').change(function() {

    var fs = require('fs');
    var _ = require('lodash');

    var file_name = $(this).val();

    var file_content = fs.readFileSync(file_name);

    var quotes = srt2data(file_content.toString());

    $('.typeahead').typeahead({
      name: 'quotes',
      local: _.pluck(quotes, 'text')
    });

  })

  function srt2data(data, ms) {
        var useMs = ms ? true : false;

        data = data.replace(/\r/g, '');
        var regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
        data = data.split(regex);
        data.shift();

        var items = [];
        for (var i = 0; i < data.length; i += 4) {
            items.push({
                id: data[i].trim(),
                startTime: useMs ? timeMs(data[i + 1].trim()) : data[i + 1].trim(),
                endTime: useMs ? timeMs(data[i + 2].trim()) : data[i + 2].trim(),
                text: data[i + 3].trim()
            });
        }

        return items;
    };

  $(window)
    .on('dragover', stop)
    .on('drop', stop);

  var dropzone = $('#dropzone');

  dropzone
    .on('dragover', hover)
    .on('dragleave', leave)
    .on('dragend', leave)
    .on('drop', ondrop);


  
  function ondrop(e) {
    e.preventDefault();
    var path = e.originalEvent.dataTransfer.files[0].path;
    var video = document.getElementById('video');
    console.log(path);
  }

  function hover() {
    this.className = 'hover'
  }

  function leave() {
    this.className = ''
  }

  function stop(e) {
    e.preventDefault();
  }

});

