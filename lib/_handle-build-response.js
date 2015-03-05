/**
 * Dedicated to consume response stream returned by `docker.buildImage`
 *   messages will be emitted on Server instance.
 * @param  {Stream} response
 * @return {Bluebird}
 */
module.exports = function (response) {
  var _this = this;
  return new Bluebird(function (resolve, reject) {
    response.setTimeout(60000);
    var logging = response.pipe(new ParseJSONResponse())
      .pipe(through2.obj(function (msg, enc, cb) {
        var obj;
        if (msg['stream']) {
          _this.emit('info', {
            info: msg['stream'].trimRight()
          });
          if (msg['progress'] || msg['progressDetail']) {
            _this.emit('progress', {
              id: msg['id'],
              progress: msg['progress'],
              progressDetail: msg['progressDetail']
            });
          }
          cb();
        } else if (msg['error'] || msg['errorDetail']) {
          var err = new Error(msg['error']);
          Error.captureStackTrace(this, Error);
          err.errorDetail = msg['errorDetail'];
          err.code = 'BUILDERROR';
          _this.emit('error', err);
          cb(err);
        } else {
          console.error('Uncaught response --> ', msg);
        }
      }))
      .on('finish', resolve)
      .on('error', reject);
  });
};
