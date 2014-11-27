function escapeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

module.exports = function (meta) {

  // make ports bings
  var portsBindings = {};
  meta['ports'].forEach(function (binding) {
    var ports = binding.split(':');
    portsBindings[ports[1] + '/tcp'] = [{'HostPort': ports[0]}];
  });

  return {
    'name': escapeName( (new Date()).toJSON() ),
    'Image': meta['repo'] + ':' + meta['version'],
    'HostConfig': {
      'PortBindings': portsBindings
    }
  };
};
