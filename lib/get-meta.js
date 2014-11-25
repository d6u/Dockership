var fs = require('./get-meta');

module.exports = function () {
  return fs.readFileAsync('./source/meta.json').then(JSON.parse);
}
