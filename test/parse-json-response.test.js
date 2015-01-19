var expect = require('chai').expect;

var split = require('split');
var through2 = require('through2');
var path = require('path');
var fs = require('../lib/fs-promisified');

var ParseJSONResponse = require('../lib/parse-json-response');

describe('PerLineStream', function () {

  it('should pipe out object contains line data and flag', function (done) {
    var i = 0;
    fs.createReadStream(path.resolve('test/fixture/docker-response-error.txt'))
      .pipe(split('<CHUNK-END>'))
      .pipe(new ParseJSONResponse())
      .pipe(through2.obj(function (obj, enc, cb) {
        i += 1;
        expect(obj['stream'] || obj['errorDetail']).not.undefined;
        cb()
      }))
      .on('finish', done)
      .on('error', done);
  });
});
