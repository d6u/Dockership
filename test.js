var Bluebird = require('bluebird');
var Docker = require('dockerode');
var fs = require('./lib/fs-promisified');

Bluebird.join(
  fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/ca.pem'),
  fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/cert.pem'),
  fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/key.pem'),
  function (ca, cert, key) {
    var d = new Docker({
      host     : '192.168.59.103',
      port     : 2376,
      ca       : ca,
      cert     : cert,
      key      : key
    });

    d.listImages(function (err, images) {
      console.error(err);
      console.log(images)
    });
  });
