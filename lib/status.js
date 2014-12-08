var Promise         = require('bluebird');
var fetchImages     = require('./get-images');
var fetchContainers = require('./get-containers');

module.exports = function (stage) {
  return Promise.props({
    images:     fetchImages(stage),
    containers: fetchContainers(stage)
  });
};
