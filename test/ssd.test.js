var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var Bluebird = require('bluebird');
var fs = require('../lib/fs-promisified.js');

var fixture_images = require('./fixture/get-images-images.json');

describe('Server', function () {
  describe('constructor', function () {
    var Server, sandbox = sinon.sandbox.create(), dockerSpy;

    beforeEach(function () {
      dockerSpy = sandbox.spy();
      Server = proxyquire('../index', {'./lib/docker-promisified': dockerSpy});
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should throw error if options are complete', function () {
      var error;
      try {
        new Server({
          // dockerfileContext: '',
          docker: {},
          meta: {}
        });
      } catch (err) {
        error = err;
      }
      expect(error).not.undefined;
      expect(error.message).equal('"opts.dockerfileContext" is required but not defined');
      expect(dockerSpy.callCount).equal(0);
    });
  });

  describe('_remoteImages', function () {
    var Server, sandbox = sinon.sandbox.create();

    beforeEach(function () {
      Server = proxyquire('../index', {
        './lib/docker-promisified': function () {
          return {
            listImagesAsync: function () {
              return Bluebird.resolve(fixture_images);
            }
          };
        }
      });
    });

    afterEach(function () {});

    it('should return a list of sorted images of target repo with tag, repo, version properties', function (done) {
      var s = new Server({
        dockerfileContext: '',
        docker: {},
        meta: {
          repo: 'someone/baseimage'
        }
      });

      s._remoteImages().then(function (images) {
        expect(images).eql([{
          Created: 1412332797,
          Id: 'cf39b476aeec4d2bd097945a14a147dc52e16bd88511ed931357a5cd6f6590de',
          ParentId: '64463062ff222a46710cad76581befc2502cf9bf43663d398ab279ce5203778c',
          RepoTags: [ 'someone/baseimage:0.9.15', 'someone/baseimage:latest' ],
          Size: 0,
          VirtualSize: 288990123,
          tag: 'someone/baseimage:0.9.15',
          repo: 'someone/baseimage',
          version: '0.9.15'
        }, {
          Created: 1412154258,
          Id: 'e74fe19c755c4f64752786128e38cd4adc33a0e0b39fcf46e04cf8fceae8fe33',
          ParentId: 'c4856f07178bc5d3ac406a1ef7e36cf6ebf3ea6987c037dcb5ddfd26fef7aa5c',
          RepoTags: [ 'someone/baseimage:0.9.14', 'someone/baseimage:0.9.13' ],
          Size: 0,
          VirtualSize: 412653106,
          tag: 'someone/baseimage:0.9.14',
          repo: 'someone/baseimage',
          version: '0.9.14'
        }, {
          Created: 1393411590,
          Id: '83bc4d21347b2cad69cde2544717d65c249553ffacd7294a69563971d7a672f1',
          ParentId: '0ec2263b38de4a3f932a9cd20f62ac5f5a9d3f01fcebea120d87df4edca90508',
          RepoTags: [ 'someone/baseimage:0.9.8', 'someone/baseimage:0.9.9' ],
          Size: 0,
          VirtualSize: 352331672,
          tag: 'someone/baseimage:0.9.9',
          repo: 'someone/baseimage',
          version: '0.9.9'
        }]);
        done();
      }).catch(done);
    });

    it('should emit warning if detected image with multiple RepoTag', function (done) {
      var s = new Server({
        dockerfileContext: '',
        docker: {},
        meta: {
          repo: 'someone/baseimage'
        }
      });

      s._remoteImages();

      var i = 0;
      s.on('warn', function (msg) {
        expect(msg).contains('detected image with multiple RepoTags:\n');
        i += 1;
        if (i === 2) {
          done();
        }
      });
    });
  });
});
