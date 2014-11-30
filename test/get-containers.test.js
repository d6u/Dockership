var expect         = require('chai').expect;
var proxyquire     = require('proxyquire').noPreserveCache().noCallThru();

var Promise        = require('bluebird');

var containers0915 = require('./fixture/containers-0-9-15.json');
var meta100        = require('./fixture/meta-1-0-0.json');

describe('getContainers', function () {

  it('should resolve with only related containers data ordered by version and status', function (done) {

    var getContainers = proxyquire('../lib/get-containers', {
      './get-docker': function () {
        return Promise.resolve({
          listContainersAsync: function () {
            return Promise.resolve(containers0915);
          }
        });
      }
    });

    getContainers(meta100)
      .then(function (containers) {

        expect(containers.length).eql(2);

        expect(containers[0].version).eql('0.9.15');
        expect(containers[1].version).eql('0.9.15');

        expect(containers[0].repo).eql('someone/baseimage');
        expect(containers[1].repo).eql('someone/baseimage');

        expect(containers[0].tag).eql('someone/baseimage:0.9.15');
        expect(containers[1].tag).eql('someone/baseimage:0.9.15');

        done();
      })
      .catch(done);
  });
});
