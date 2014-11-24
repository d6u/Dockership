var Transform = require('stream').Transform;

var transform = new Transform();

transform._transform = function (chunk, encoding, cb) {
  var obj = JSON.parse(chunk.toString());
  cb(null, {
    status: obj['error'] === undefined ? 'debug' : 'error',
    content: obj['stream'] || obj['error']
  });
};

module.exports = function () {
  return Object.create(transform);
};
