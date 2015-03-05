module.exports = function () {
  return this._makeTar()
  .bind(this)
  .then(function (tarContent) {
    return this.docker.buildImageAsync(tarContent, {
      t: this.opts.meta.repo + ':' + this.opts.meta.version,
      nocache: !this.opts.cache
    });
  });
};
