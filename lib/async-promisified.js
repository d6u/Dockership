var Promise = require('bluebird');

module.exports = Promise.promisifyAll(require('async'));
