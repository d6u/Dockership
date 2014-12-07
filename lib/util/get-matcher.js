var escapeRegex = require('./escape-regex');

module.exports = function (repo) {
  var tagRegex = new RegExp('^(' + escapeRegex(repo) + '):(\\d+(?:\\.\\d+)*)$');
  return function (string) {
    var m = tagRegex.exec(string);
    if (m) {
      return {tag: m[0], repo: m[1], version: m[2]};
    }
  };
};
