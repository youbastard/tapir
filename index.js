var fs = require('fs');
var twig = require('twig');
var mkpath = require('mkpath');
var path = require('path');
var colors = require('colors');
var layout, config;

module.exports = function(grunt) {
  grunt.registerTask('tapir', 'Do a thing', function() {
      var done = this.async();
      // TODO: Defaults
      config = this.options();
      init(done);
  });
}

function handle(r, err) {
  if (err)
    log('[' + 'ERR'.red + ']' + ' Saved ' + path.normalize(r.dest) + '.', 2);
  else 
    log('[' + 'OK'.green + ']' + ' Saved ' + path.normalize(r.dest).cyan, 2)
}

function loaded(r, t) {
  var save =  t.render();

  if (!save)
    log('[' + 'ERR'.red + ']' + ' Processed ' + r.rel.cyan, 2)
  else {
    log('[' + 'OK'.green + '] Processed ' + r.rel.cyan, 2);
    mkpath.sync(path.dirname(config.destination + r.dest));
    fs.writeFile(config.destination + r.dest, layout.render({ content: save }), handle.bind(this, r));
  }
}

function init() {
  /* Layouts */
  new twig.twig({
    id: 'default.twig',
    async: true,
    method: 'fs',
    path: config.root + 'layouts\\default.twig',
    load: function(t) {
      log('[' + 'OK'.green + '] Loaded base layout');
      layout = t;
    }
  });

  log('Processing ' + String(Object.keys(config.files).length).red + ' files.', 1);

  for (var i in config.files) {
    var r = {};

    if ( typeof config.files[i] === "string") {
      r.rel = i;
      r.dest = config.files[i];
      if (r.rel[r.rel.length] === "/" || r.rel[r.rel.length] === "\\")
        r.rel += "index.html";
    } else if ( config.files[i] === "*" ) {
      r.rel = i;
      r.dest = i.replace('.twig', '.html');
    } else
      ; // deal with objects later

    new twig.twig({
      async: true,
      method: 'fs',
      path: config.root + 'entries\\' + r.rel,
      base: config.root,
      load: loaded.bind(this, r),
    });
  }
}

function log(message, v) {
  if ((config.verbosity || 3) >= v)
    console.log(message);
}