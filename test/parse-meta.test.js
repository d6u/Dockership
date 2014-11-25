var expect = require('chai').expect;
var sinon = require('sinon');

var parseMeta = require('../lib/parse-meta');

describe('parseMeta', function () {

  var sandbox = sinon.sandbox.create();

  before(function () {
    sandbox.stub(Date.prototype, 'toJSON', function () {
      return '2014-11-25T15:49:05.859Z';
    });
  });

  after(function () {
    sandbox.restore();
  });

  it('should parse correct meta', function () {
    var meta = require('./fixture/meta.json');

    expect(parseMeta(meta)).eql({
      'name': '2014-11-25T15_49_05.859Z',
      'Image': 'daiweilu/baseimage-nginx:0.0.3',
      'HostConfig': {
        'PortBindings': {
          '80/tcp': [{
            'HostPort': '10000'
          }]
        }
      }
    });
  });
});
