var chalk      = require('chalk');
var dateformat = require('dateformat');

var categories = [];
var longestLength = 0;

function getPadding(str) {
  return new Array(longestLength - str.length + 1).join(' ');
}

function updateLength() {
  longestLength = 0;
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].length > longestLength) {
      longestLength = categories[i].length;
    }
  }
}

function getLogger(category, colorName) {
  if (colorName == null) colorName = 'red';
  if (categories.indexOf(category) === -1) {
    categories.push(category);
    updateLength();
  }
  return function () {
    var time = chalk.reset('[')+chalk.grey(dateformat(new Date(), 'HH:MM:ss.l'))+']';
    var cat  = '['+chalk[colorName](category)+']'+getPadding(category);
    var args = Array.prototype.slice.call(arguments);
    args = [time, cat].concat(args);
    console.log.apply(console, args);
  }
}

getLogger.info = getLogger('info', 'green');
getLogger.error = getLogger('error', 'red');
module.exports = getLogger;
