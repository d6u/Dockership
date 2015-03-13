var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect     = require('chai').expect;
var sinon      = require('sinon');

var Bluebird = require('bluebird');

var mockImages = require('./fixture/images.json');

describe('images()', function () {

  var Dockership, ship;

  it('should resolve with qualified images', function (done) {
    Dockership = proxyquire('../lib/index', {
      './promisified/docker-promisified': function () {
        this.listImagesAsync = function () {
          return Bluebird.resolve(mockImages);
        };
      }
    });

    ship = new Dockership({
      buildContext: '',
      docker: {},
      meta: {
        repo: 'someone/baseimage',
        version: '0.9.15'
      }
    });

    ship.images().then(function (images) {
      expect(images.length).equal(3);
      images.forEach(function (image) {
        expect(image.repo).equal('someone/baseimage');
      });
    })
    .then(done, done);
  });

});
