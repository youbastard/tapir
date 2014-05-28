var fs = require('fs');
var twig = require('twig');
var mkpath = require('mkpath');
var path = require('path');
var colors = require('colors');
var layout, config, f = 0, g = 0, done;

module.exports = function(grunt) {
  grunt.registerTask('tapir', 'Do a thing', function() {
      // TODO: Defaults
      done = this.async();
      config = this.options();
      init();
  });
}

function handle(r, err) {

  if (err)
    log('[' + 'ERR'.red + ']' + ' Saved ' + path.normalize(r.dest) + '.', 2);
  else 
    log('[' + 'OK'.green + ']' + ' Saved ' + path.normalize(r.dest).cyan, 2)

  f++;
  if (f === g)
    return done();
}

function loaded(r, t) {
  var save = t.render();

  if (!save) {
    log('[' + 'ERR'.red + ']' + ' Processed ' + r.rel.cyan, 2)
  } else {
    log('[' + 'OK'.green + '] Processed ' + r.rel.cyan, 2);
    g++;
    mkpath.sync(path.dirname(config.destination + r.dest));
    fs.writeFile(config.destination + r.dest, layout.render({ content: save }), handle.bind(this, r));
  }
}

function init() {
  var handle = function( t ) {
    log('[' + 'OK'.green + '] Loaded base layout');
    layout = t;
    log('Processing ' + String(Object.keys(config.files).length).red + ' files.', 1);

    for (var i in config.files) {
      var r = {};

      if (i === config.files.lenght - 1)
        r.last = true;

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

  /* Layouts */
  new twig.twig({
    id: 'default.twig',
    async: true,
    method: 'fs',
    path: config.root + 'layouts\\default.twig',
    load: handle
  });
}

function log(message, v) {
  if ((config.verbosity || 3) >= (v || 3))
    console.log(message);
}