module.exports = function (name) {
  return function (arg) {
    this[name] = arg;
  };
};
