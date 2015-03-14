'use strict';

var Docker = require('../promisified/docker-promisified');
var fs = require('../promisified/fs-promisified');
var path = require('path');

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
    docker.ca   = loadCert(docker.ca);
    docker.cert = loadCert(docker.cert);
    docker.key  = loadCert(docker.key);
    return new Docker(docker);
  }
};
