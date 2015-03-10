var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var fs = require('../../lib/fs-promisified');
var Bluebird = require('bluebird');

describe('Server', function () {
  describe('_getImage', function () {
    var Server, sandbox = sinon.sandbox.create();

    beforeEach(function () {
      Server = proxyquire('../../index', {});
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should build', function (done) {
      Bluebird.join(
        fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/ca.pem'),
        fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/cert.pem'),
        fs.readFileAsync('/Users/daiwei/.boot2docker/certs/boot2docker-vm/key.pem'),
        function (ca, cert, key) {
          var s = new Server({
            buildContext: 'examples/node-hello/source',
            docker: {
              host: '192.168.59.103',
              port: 2376,
              ca: ca,
              cert: cert,
              key: key
            },
            meta: {
              repo: 'ssd-test/test',
              version: '0.0.1'
            }
          });

          s.on('info', console.log);
          s.on('progress', console.log);
          s.on('error', console.error);

          return s._getImage().then(function (image) {
            console.log(image);
            done();
          });
        }).catch(done);
    });
  });
});
