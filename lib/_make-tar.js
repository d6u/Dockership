module.exports = function () {
  return new Bluebird(function (resolve, reject) {
    var archive = archiver('tar');
    var bufs = [];
    archive.on('error', function (err) {
      reject(err);
    });
    archive.on('data', function (d) {
      bufs.push(d);
    })
    archive.on('end', function () {
      resolve(Buffer.concat(bufs));
    });
    archive.bulk([{expand: true, cwd: this.opts.dockerfileContext, src: ['**']}]);
    archive.finalize();
  });
};
