var Promise = require('bluebird');
var path    = require('path');
var getJson = require('./get-json');

function getPaths(stage) {
  return {
    'meta': path.resolve('source', 'meta.json'),
    'ssd':  path.resolve('stage', stage, 'ssd.json')
  }
}

module.exports = function (name, stage) {
  var p = getPaths(stage);
  if (name in p) {
    return getJson(p[name]);
  } else {
    return new Promise.reject(
      new Error('cannot recognize "' + name + '" as config in "' + stage + '" stage'));
  }
};
