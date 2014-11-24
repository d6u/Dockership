var Transform = require('stream').Transform;

var transform = new Transform({objectMode: true});

transform._transform = function (chunk, encoding, cb) {
  if (this._store   === undefined) this._store = '';
  if (this._preFlag === undefined) this._preFlag = 'debug';

  var obj     = JSON.parse(chunk.toString());
  var flag    = 'stream' in obj ? 'debug' : 'error';
  var content = 'stream' in obj ? obj['stream'] : obj['error'];

  if (flag !== this._preFlag) {
    if (this._store !== '') {
      this.push({flag: this._preFlag, content: this._store});
    }
    this._store = '';
    this._preFlag = flag;
  }

  var pieces = (this._store + content).split('\n');

  for (var i = 0; i < pieces.length - 1; i++) {
    this.push({flag: this._preFlag, content: pieces[i]});
  }

  this._store = pieces[pieces.length - 1];
  cb(null);
};

transform._flush = function (cb) {
  this.push({flag: this._preFlag, content: this._store});
  cb(null);
};

module.exports = function () {
  return Object.create(transform);
};
