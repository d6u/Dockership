var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var PropertyMissingError = require('../../lib/property-missing-error');

describe('Server', function () {
  describe('status', function () {
    var Server = proxyquire('../../index', {});
    var server = new Server('testing');

    it('should assign properties to server instance', function (done) {
      server.getDocker = sinon.spy();
      server.getConfig = sinon.spy();
      server.getImages = sinon.spy();
      server.getContainers = sinon.spy();

      server.status()
        .then(function () {
          expect(server.getDocker.callCount).eq(1);
          expect(server.getConfig.callCount).eq(1);
          expect(server.getConfig.args[0]).eql(['meta']);
          expect(server.getImages.callCount).eq(1);
          expect(server.getContainers.callCount).eq(1);

          done();
        })
        .catch(done);
    });

  });
});
