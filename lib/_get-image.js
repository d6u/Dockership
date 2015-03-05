module.exports = function () {
  return this._remoteImages()
  .bind(this)
  .then(function (images) {
    if (this._isLocalNewer(images[0])) {
      return this._buildImage();
    } else {
      throw images[0];
    }
  })
  .then(function (response) { return this._handleBuildResponse(response); })
  .then(function () { return this._remoteImages(); })
  .then(function (images) { throw images[0]; })
  .catch(function isImage(obj) {
    return obj.Id !== undefined;
  }, function (image) {
    return this.image = image;
  });
};
