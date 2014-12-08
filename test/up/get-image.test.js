var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise      = require('bluebird');
var EventEmitter = require('events').EventEmitter;

var imagesMock  = require('../fixture/get-image-images.json');
var meta_0_9_15 = require('../fixture/meta-0-9-15.json');
var meta_1_0_0  = require('../fixture/meta-1-0-0.json');

describe('getImage', function () {

  it('should resolve with newest image from server if server is newer than local', function (done) {
    var spyGetImages = sinon.spy(function () {
      return Promise.resolve(imagesMock);
    });

    var spyBuild = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandler = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandleBuildResponse = sinon.spy(function () {
      return spyHandler;
    });

    var getImage = proxyquire('../../lib/up/get-image', {
      '../get-images':           spyGetImages,
      '../build':                spyBuild,
      './handle-build-response': spyHandleBuildResponse
    });

    Promise.bind({meta: meta_0_9_15})
      .then(getImage())
      .then(function () {
        expect(this.image).eql(imagesMock[0]);

        expect(spyGetImages.callCount).eql(1);
        expect(spyBuild.callCount).eql(0);
        expect(spyHandleBuildResponse.callCount).eql(1);
        expect(spyHandler.callCount).eql(0);

        done();
      })
      .catch(done);
  });

  it('should resolve build local image and resolve with data about that image', function (done) {
    var i = 0;

    var spyGetImages = sinon.spy(function () {
      if (i === 0) {
        i += 1;
        return Promise.resolve(imagesMock);
      } else {
        return Promise.resolve([{
          "Id": "280ee4e3cb99b3ae43e711ffda699c83fba7f6c94776ddbb0a6b02bde2bfb085",
          "repo": "someone/baseimage",
          "version": "1.0.0",
          "ports": ["80:10000"]
        }].concat(imagesMock));
      }
    });

    var spyBuild = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandler = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandleBuildResponse = sinon.spy(function () {
      return spyHandler;
    });

    var getImage = proxyquire('../../lib/up/get-image', {
      '../get-images': spyGetImages,
      '../build': spyBuild,
      './handle-build-response': spyHandleBuildResponse
    });

    Promise.bind({meta: meta_1_0_0})
      .then(getImage())
      .then(function () {
        expect(this.image).eql({
          "Id": "280ee4e3cb99b3ae43e711ffda699c83fba7f6c94776ddbb0a6b02bde2bfb085",
          "repo": "someone/baseimage",
          "version": "1.0.0",
          "ports": ["80:10000"]
        });

        expect(spyGetImages.callCount).eql(2);
        expect(spyBuild.callCount).eql(1);
        expect(spyHandleBuildResponse.callCount).eql(1);
        expect(spyHandler.callCount).eql(1);

        done();
      })
      .catch(done);
  });
});
