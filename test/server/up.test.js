var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

describe('Server', function () {
  describe('up', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    function spy() {
      return sinon.spy(function () {});
    }

    it('should emit info and end', function (done) {
      var server = this.server;

      server.getConfig          = spy();
      server.getDocker          = spy();
      server._getImage          = spy();
      server._getContainer      = spy();
      server._cleanUpContainers = spy();
      server._startContainer    = spy();
      server.container          = {Id: 'abc'};

      var infoArr = ['container up and running', {Id: 'abc'}];
      server.on('info', function (info) {
        expect(info).eql(infoArr.shift());
      });
      server.on('end', function () {
        expect(infoArr.length).eql(0);
        expect(server.getConfig.callCount).eq(1);
        expect(server.getDocker.callCount).eq(1);
        expect(server._getImage.callCount).eq(1);
        expect(server._getContainer.callCount).eq(1);
        expect(server._cleanUpContainers.callCount).eq(1);
        expect(server._startContainer.callCount).eq(1);
        done();
      });
      server.up().catch(done);
    });

    it('should emit error and end', function (done) {
      var server = this.server;
      var e = new Error('123');

      server.getConfig          = spy();
      server.getDocker          = spy();
      server._getImage          = spy();
      server._getContainer      = spy();
      server._cleanUpContainers = spy();
      server._startContainer    = sinon.spy(function () {
        throw e;
      });

      var i = 0;
      server.on('error', function (err) {
        expect(err).eq(e);
        i += 1;
      });
      server.on('end', function () {
        expect(i).eql(1);
        expect(server.getConfig.callCount).eq(1);
        expect(server.getDocker.callCount).eq(1);
        expect(server._getImage.callCount).eq(1);
        expect(server._getContainer.callCount).eq(1);
        expect(server._cleanUpContainers.callCount).eq(1);
        expect(server._startContainer.callCount).eq(1);

        done();
      });
      server.up().catch(done);
    });

  });
});
