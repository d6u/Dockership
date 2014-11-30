var Promise       = require('bluebird');
var PerLineStream = require('../per-line-stream');
var LogStream     = require('../log-stream');

module.exports = function (response) {
  return new Promise(function (resolve, reject) {
    var logging = response
      .pipe(new PerLineStream())
      .pipe(new LogStream());

    logging
      .on('finish', resolve)
      .on('error', reject);
  });
}
