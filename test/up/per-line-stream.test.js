var expect = require('chai').expect;

var Stream = require('stream');
var path = require('path');
var fs = require('../../lib/fs-promisified');

var PerLineStream = require('../../lib/up/per-line-stream');

describe('PerLineStream', function () {

  it('should pipe out object contains line data and flag', function (done) {
    fs.readFileAsync(path.join(__dirname, '../fixture/docker-response-error.txt'), {encoding: 'utf8'})
      .then(function (text) {

        var readable = new Stream.Readable();
        var pieces = text.split('<CHUNK-END>');
        var i = 0;

        readable._read = function () {
          readable.push(pieces[i]);
          i += 1;
          if (i === pieces.length) {
            readable.push(null);
          }
        };

        var perLine = new PerLineStream();

        var write = new Stream.Writable({objectMode: true});
        var contents = [];

        write._write = function (obj, encoding, cb) {
          contents.push(obj);
          cb(null);
        };

        write.on('finish', function () {
          for (var i = 0; i < contents.length - 1; i++) {
            expect(contents[i]['flag']).eql('info');
          }
          expect(contents[contents.length - 1])
            .eql({flag:'error', content:'runit-app.sh: no such file or directory'});
          done();
        });

        readable.pipe(perLine).pipe(write);
      });
  });
});
