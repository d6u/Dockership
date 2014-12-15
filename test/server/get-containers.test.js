var expect         = require('chai').expect;
var proxyquire     = require('proxyquire').noPreserveCache().noCallThru();

var Promise        = require('bluebird');
var PropertyMissingError = require('../../lib/property-missing-error');

var containersMock = require('../fixture/get-containers-containers.json');
var meta100        = require('../fixture/meta-1-0-0.json');

describe('Server', function () {
  describe('getContainers', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    it('should throw PropertyMissingError', function (done) {
      this.server.getContainers()
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(PropertyMissingError, function (err) {
          done();
        })
        .catch(done);
    });

    it('should resolve with only related containers data ordered by version and status', function (done) {
      var _this = this;
      this.server.docker = {
        listContainersAsync: function () {
          return Promise.resolve(containersMock);
        }
      };
      this.server.meta = meta100;

      this.server.getContainers()
        .then(function () {
          expect(_this.server.containers.length).eql(6);

          expect(_this.server.containers[0].version).eql('0.9.15');
          expect(_this.server.containers[1].version).eql('0.9.15');
          expect(_this.server.containers[2].version).eql('0.9.15');
          expect(_this.server.containers[3].version).eql('0.9.15');
          expect(_this.server.containers[4].version).eql('0.9.14');
          expect(_this.server.containers[5].version).eql('0.9.8');

          expect(_this.server.containers[0].Status).match(/^Up/);
          expect(_this.server.containers[1].Status).match(/^Up/);
          expect(_this.server.containers[2].Status).not.match(/^Up/);
          expect(_this.server.containers[3].Status).not.match(/^Up/);

          expect(_this.server.containers[0].repo).eql('someone/baseimage');
          expect(_this.server.containers[1].repo).eql('someone/baseimage');
          expect(_this.server.containers[2].repo).eql('someone/baseimage');
          expect(_this.server.containers[3].repo).eql('someone/baseimage');
          expect(_this.server.containers[4].repo).eql('someone/baseimage');
          expect(_this.server.containers[5].repo).eql('someone/baseimage');

          expect(_this.server.containers[0].tag).eql('someone/baseimage:0.9.15');
          expect(_this.server.containers[1].tag).eql('someone/baseimage:0.9.15');
          expect(_this.server.containers[2].tag).eql('someone/baseimage:0.9.15');
          expect(_this.server.containers[3].tag).eql('someone/baseimage:0.9.15');
          expect(_this.server.containers[4].tag).eql('someone/baseimage:0.9.14');
          expect(_this.server.containers[5].tag).eql('someone/baseimage:0.9.8');

          done();
        })
        .catch(done);
    });

  });
});
