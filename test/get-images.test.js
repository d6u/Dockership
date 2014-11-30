var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

var Promise    = require('bluebird');

var images0915 = require('./fixture/images-0-9-15.json');
var meta100    = require('./fixture/meta-1-0-0.json');

describe('getImages', function () {

  it('should resolve with only related images data ordered by version', function (done) {

    var getImages = proxyquire('../lib/get-images', {
      './get-docker': function () {
        return Promise.resolve({
          listImagesAsync: function () {
            return Promise.resolve(images0915);
          }
        });
      }
    });

    getImages(meta100)
      .then(function (images) {

        expect(images.length).eql(3);

        expect(images[0].version).eql('0.9.15');
        expect(images[1].version).eql('0.9.14');
        expect(images[2].version).eql('0.9.8');

        expect(images[0].repo).eql('someone/baseimage');
        expect(images[1].repo).eql('someone/baseimage');
        expect(images[2].repo).eql('someone/baseimage');

        expect(images[0].tag).eql('someone/baseimage:0.9.15');
        expect(images[1].tag).eql('someone/baseimage:0.9.14');
        expect(images[2].tag).eql('someone/baseimage:0.9.8');

        done();
      })
      .catch(done);
  });
});
