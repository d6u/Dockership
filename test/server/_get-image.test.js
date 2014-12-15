var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise      = require('bluebird');
var EventEmitter = require('events').EventEmitter;

var imagesMock  = require('../fixture/get-image-images.json');
var meta_0_9_15 = require('../fixture/meta-0-9-15.json');
var meta_1_0_0  = require('../fixture/meta-1-0-0.json');

describe('Server', function () {
  describe('_getImage', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    it('should resolve with newest image from server if server is newer than local', function (done) {
      this.server.getImages = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.build = sinon.spy(function () {});
      this.server.docker = {};
      this.server.meta = meta_0_9_15;
      this.server.emitter = {};
      this.server.images = imagesMock;

      this.server._getImage()
        .then(function () {
          expect(this.image).eql(imagesMock[0]);
          expect(this.getImages.callCount).eq(1);
          expect(this.build.callCount).eq(0);

          done();
        })
        .catch(done);
    });

    it('should build local image and resolve with that image if local is newer than server', function (done) {
      var i = 0;
      this.server.getImages = sinon.spy(function () {
        if (i === 0) {
          this.images = imagesMock;
        } else {
          this.images = [{
            "Id": "280ee4e3cb99b3ae43e711ffda699c83fba7f6c94776ddbb0a6b02bde2bfb085",
            "repo": "someone/baseimage",
            "version": "1.0.0",
            "ports": ["80:10000"]
          }].concat(imagesMock);
        }
        i += 1;
        return Promise.resolve();
      });
      this.server.build = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server._handleBuildResponse = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.docker = {};
      this.server.meta = meta_1_0_0;
      this.server.emitter = {};

      this.server
        ._getImage()
        .then(function () {
          expect(this.image).eql({
            "Id": "280ee4e3cb99b3ae43e711ffda699c83fba7f6c94776ddbb0a6b02bde2bfb085",
            "repo": "someone/baseimage",
            "version": "1.0.0",
            "ports": ["80:10000"]
          });
          expect(this.getImages.callCount).eq(2);
          expect(this.build.callCount).eq(1);
          expect(this._handleBuildResponse.callCount).eq(1);

          done();
        })
        .catch(done);
    });

  });
});
