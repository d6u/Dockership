var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var path    = require('path');

describe('Server', function () {
  describe('getConfig', function () {

    var readJSON, Server;

    beforeEach(function () {
      readJSON = sinon.spy(function () {
        return Promise.resolve({});
      });
      Server = proxyquire('../../index', {
        './lib/read-json': readJSON
      });
    });

    it('should reject with error if provide unrecognized config name', function (done) {
      var server = new Server('testing');
      server.getConfig('xxx')
        .catch(function (err) {
          expect(err.message).eq('cannot recognize config name "xxx"');
          expect(readJSON.callCount).eq(0);
          done();
        })
        .catch(done);
    });

    it('should call getJson with correct path', function (done) {
      var server1 = new Server('development');
      var server2 = new Server('production');

      Promise.join(
        server1.getConfig('meta'),
        server1.getConfig('ssd'),
        server2.getConfig('meta'),
        server2.getConfig('ssd'),
        function () {
          expect(readJSON.args[0][0]).eq(path.resolve('source/meta.json'));
          expect(readJSON.args[1][0]).eq(path.resolve('stage/development/ssd.json'));
          expect(readJSON.args[2][0]).eq(path.resolve('source/meta.json'));
          expect(readJSON.args[3][0]).eq(path.resolve('stage/production/ssd.json'));
          done();
        })
        .catch(done);
    });

    it('should cache configs', function (done) {
      var server = new Server('testing');
      server.getConfig('meta')
        .then(function () { return server.getConfig('meta'); })
        .then(function () {
          expect(readJSON.callCount).eq(1);
          done();
        })
        .catch(done)
    });

  });
});
