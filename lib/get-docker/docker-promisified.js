var Promise = require('bluebird');
var Docker  = require('dockerode');

Promise.promisifyAll(Docker.prototype);

module.exports = Docker;
