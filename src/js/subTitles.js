var subtitlesParser = require('subtitles-parser');
var tmp = require('temporary');
var fs = require('fs');
var _ = require('lodash');
var moment = require('moment');

var TIME_FORMAT = 'HH:mm:ss';
var TIME_FORMAT_MILLIS = TIME_FORMAT + ',SSS';

function formatSrtTime(millis) {
  return moment(millis).utc().format(TIME_FORMAT_MILLIS)
}

function parseSrtTime(string) {
  return moment.duration(string.replace(',', '.')).asMilliseconds()
}

function stripHTMLTags(string) {
  return string.replace(/<[^>]*>/g, '');
}

function createTypeAHeadSettings(quote) {
  var milliSecondOffset = 2000;

  var start = Math.max(0, parseSrtTime(quote.startTime) - milliSecondOffset);
  var end = parseSrtTime(quote.endTime) + milliSecondOffset;
  var duration = end - start;

  return  _.extend({}, quote, {
    templateText: stripHTMLTags(quote.text),
    templateStartTime: moment(start).utc().format(TIME_FORMAT),
    templateEndTime: moment(end).utc().format(TIME_FORMAT),
    templateDuration: Math.floor(duration / 1000),
    duration: duration,
    value: quote.text,
    startTimeParsed: start,
    endTimeParsed: end
  });
}

function setTimeWithOffset(offset, item) {
  var shifted_start = parseSrtTime(item.startTime) - offset;
  var shifted_end = parseSrtTime(item.endTime) - offset;

  if (shifted_start < 0 || shifted_end < 0) {
    return;
  }

  item.startTime = formatSrtTime(shifted_start);
  item.endTime = formatSrtTime(shifted_end);

  return item;
}

function setId(item, index) {
  item.id = index + 1;
}

function SubTitle(path) {
  var file_content = fs.readFileSync(path);
  this.quotes = subtitlesParser.fromSrt(file_content.toString());
}

SubTitle.prototype.getQuotesWithOffset = function(offset) {

  return _(this.quotes)
    .map(_.partial(setTimeWithOffset, offset))
    .compact()
    .each(setId)
    .value();
}

SubTitle.prototype.quotesForTypeAHead = function() {

  return _(this.quotes)
    .map(createTypeAHeadSettings)
    .shuffle()
    .value();
}

SubTitle.prototype.createShiftedSubTitlesFile = function(startTime) {
  var offset = this.getSeekingStart(startTime).accurateSeekingStart;

  var shiftedSubtitlesFile = new tmp.File('srt');
  shiftedSubtitlesFile.writeFileSync(subtitlesParser.toSrt(this.getQuotesWithOffset(offset)));
  return shiftedSubtitlesFile.path;
}

SubTitle.prototype.getSeekingStart = function(startOffset) {
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
    accurateSeekingStart: accurateSeekingStart,
    startOffset: startOffset
  }
}

module.exports = SubTitle