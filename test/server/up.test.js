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
      var _this = this;

      this.server.getConfig          = spy();
      this.server.getDocker          = spy();
      this.server._getImage          = spy();
      this.server._getContainer      = spy();
      this.server._cleanUpContainers = spy();
      this.server._startContainer    = spy();
      this.server.container          = {Id: 'abc'};

      this.server.up()
        .then(function (emitter) {
          var infoArr = ['container up and running', {Id: 'abc'}];
          emitter.on('info', function (info) {
            expect(info).eql(infoArr.shift());
          });
          emitter.on('end', function () {
            expect(infoArr.length).eql(0);
            expect(_this.server.getConfig.callCount).eq(1);
            expect(_this.server.getDocker.callCount).eq(1);
            expect(_this.server._getImage.callCount).eq(1);
            expect(_this.server._getContainer.callCount).eq(1);
            expect(_this.server._cleanUpContainers.callCount).eq(1);
            expect(_this.server._startContainer.callCount).eq(1);

            done();
          });
        })
        .catch(done);
    });

    it('should emit error and end', function (done) {
      var _this = this;
      var e = new Error('123');

      this.server.getConfig          = spy();
      this.server.getDocker          = spy();
      this.server._getImage          = spy();
      this.server._getContainer      = spy();
      this.server._cleanUpContainers = spy();
      this.server._startContainer    = sinon.spy(function () {
        throw e;
      });

      var i = 0;
      this.server.up()
        .then(function (emitter) {
          emitter.on('error', function (err) {
            expect(err).eq(e);
            i += 1;
          });
          emitter.on('end', function () {
            expect(i).eql(1);
            expect(_this.server.getConfig.callCount).eq(1);
            expect(_this.server.getDocker.callCount).eq(1);
            expect(_this.server._getImage.callCount).eq(1);
            expect(_this.server._getContainer.callCount).eq(1);
            expect(_this.server._cleanUpContainers.callCount).eq(1);
            expect(_this.server._startContainer.callCount).eq(1);

            done();
          });
        })
        .catch(done);
    });

  });
});
