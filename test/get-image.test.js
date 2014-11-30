var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

describe('getImage', function () {

  var images = [
    {
      "Created": 1412332797,
      "Id": "cf39b476aeec4d2bd097945a14a147dc52e16bd88511ed931357a5cd6f6590de",
      "ParentId": "64463062ff222a46710cad76581befc2502cf9bf43663d398ab279ce5203778c",
      "RepoTags": [
        "someone/baseimage:0.9.15",
        "someone/baseimage:latest"
      ],
      "Size": 0,
      "VirtualSize": 288990123,
      "repo": "someone/baseimage",
      "tag": "someone/baseimage:0.9.15",
      "version": "0.9.15"
    },
    {
      "Created": 1393411590,
      "Id": "83bc4d21347b2cad69cde2544717d65c249553ffacd7294a69563971d7a672f1",
      "ParentId": "0ec2263b38de4a3f932a9cd20f62ac5f5a9d3f01fcebea120d87df4edca90508",
      "RepoTags": [
        "someone/baseimage:0.9.8"
      ],
      "Size": 0,
      "VirtualSize": 352331672,
      "repo": "someone/baseimage",
      "tag": "someone/baseimage:0.9.8",
      "version": "0.9.8"
    }
  ];

  it('should resolve with newest image from server if server is newer than local', function (done) {
    var spyGetImages = sinon.spy(function () {
      return Promise.resolve(images);
    });

    var spyBuild = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandleBuildResponse = sinon.spy(function () {
      return Promise.resolve();
    });

    var getImage = proxyquire('../lib/up/get-image', {
      '../get-images': spyGetImages,
      '../build': spyBuild,
      './handle-build-response': spyHandleBuildResponse
    });

    Promise.bind({
      meta: {
        "repo": "someone/baseimage",
        "version": "0.9.15",
        "ports": ["80:10000"]
      }
    })
      .then(getImage)
      .then(function () {

        expect(this.image).eql(images[0]);

        expect(spyGetImages.callCount).eql(1);
        expect(spyBuild.callCount).eql(0);
        expect(spyHandleBuildResponse.callCount).eql(0);

        done();
      })
      .catch(done);
  });

  it('should resolve build local image and resolve with data about that image', function (done) {
    var meta = {
      "repo": "someone/baseimage",
      "version": "1.0.0",
      "ports": ["80:10000"]
    };

    var i = 0;

    var spyGetImages = sinon.spy(function () {
      if (i === 0) {
        i += 1;
        return Promise.resolve(images);
      } else {
        return Promise.resolve([{
          "Id": "280ee4e3cb99b3ae43e711ffda699c83fba7f6c94776ddbb0a6b02bde2bfb085",
          "repo": "someone/baseimage",
          "version": "1.0.0",
          "ports": ["80:10000"]
        }].concat(images));
      }
    });

    var spyBuild = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyHandleBuildResponse = sinon.spy(function () {
      return Promise.resolve();
    });

    var getImage = proxyquire('../lib/up/get-image', {
      '../get-images': spyGetImages,
      '../build': spyBuild,
      './handle-build-response': spyHandleBuildResponse
    });

    Promise.bind({meta: meta})
      .then(getImage)
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

        done();
      })
      .catch(done);
  });
});
