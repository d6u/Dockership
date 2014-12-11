var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

var Promise = require('bluebird');
var PropertyMissingError = require('../../lib/property-missing-error');

var imagesMock = require('../fixture/get-images-images.json');
var meta100    = require('../fixture/meta-1-0-0.json');

describe('Server', function () {
  describe('getImages', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    it('should throw PropertyMissingError', function (done) {
      this.server.getImages()
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(PropertyMissingError, function (err) {
          done();
        })
        .catch(done);
    });

    it('should resolve with only related images data ordered by smaller version', function (done) {
      // some image has multiple version, getImages only use's smaller version
      // which is the same behavior as docker API
      var _this = this;
      this.server.docker = {
        listImagesAsync: function () {
          return Promise.resolve(imagesMock);
        }
      };
      this.server.meta = meta100;
      this.server.getImages()
        .then(function () {
          expect(_this.server.images.length).eql(3);
          expect(_this.server.images[0].version).eql('0.9.15');
          expect(_this.server.images[1].version).eql('0.9.13');
          expect(_this.server.images[2].version).eql('0.9.8');
          expect(_this.server.images[0].repo).eql('someone/baseimage');
          expect(_this.server.images[1].repo).eql('someone/baseimage');
          expect(_this.server.images[2].repo).eql('someone/baseimage');
          expect(_this.server.images[0].tag).eql('someone/baseimage:0.9.15');
          expect(_this.server.images[1].tag).eql('someone/baseimage:0.9.13');
          expect(_this.server.images[2].tag).eql('someone/baseimage:0.9.8');

          done();
        })
        .catch(done);
    });

  });
});
