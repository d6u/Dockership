'use strict';

var Docker = require('../promisified/docker-promisified');
var fs = require('../promisified/fs-promisified');
var path = require('path');
var _ = require('lodash');

function loadCert(cert) {
  if (typeof cert === 'string') {
    return fs.readFileSync(path.resolve(cert));
  } else {
    return cert;
  }
}

module.exports = function (docker) {
  if (docker instanceof Docker) {
    return docker;
  } else {
    var config = _.cloneDeep(docker);
    config.ca = loadCert(config.ca);
    config.cert = loadCert(config.cert);
    config.key = loadCert(config.key);
    return new Docker(config);
  }
};
