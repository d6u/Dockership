var Promise = require('bluebird');
var path    = require('path');
var getJson = require('./get-json');

function getPaths(stage) {
  if (stage === undefined) stage = 'development';
  return {
    'meta': './source',
    'ssd':   path.resolve('./stage', stage)
  }
}

module.exports = function (name, stage) {
  var p = getPaths(stage);
  if (name in p) {
    return getJson(path.resolve(p[name], name + '.json'));
  } else {
    return new Promise.reject(
      new Error('cannot recognize "' + name + '" as config in "' + stage + '" stage'));
  }
};
