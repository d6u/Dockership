var fs = require('../fs-promisified');

module.exports = function (path) {
  return fs.readFileAsync(path, {encoding: 'utf8'}).then(JSON.parse);
};
