var fs = require('fs');
var twig = require('twig');
var mkpath = require('mkpath');
var path = require('path');
var colors = require('colors');
var async = require('async');

var layout, config, done;

// TODO: Defaults
module.exports = function(grunt) {
  grunt.registerTask('tapir:prod', 'Do a thing', function() {
      done = this.async();
      config = grunt.config('tapir').prod.options;
      init();
  });

  grunt.registerTask('tapir:dev', 'Do a thing', function() {
      done = this.async();
      config = grunt.config('tapir').dev.options;
      init();
  });

  grunt.registerTask('tapir', ['tapir:prod']);
};


function saveEntry(item, layout, next, template) {
  var save = template.render();
  var handle = function(err) {
    log(
      '['.bold +
      ((save && !err)?'OK'.green.bold:'ERR'.red.bold) +
      '] '.bold +
      item.rel.bold +
      Array(Math.max(45 - item.rel.length, 0)).join(' ') +
      ' -> '.green.bold +
      layout.id.bold +
      Array(Math.max(14 - layout.id.length, 0)).join(' ') +
      ((err || !save)?' x '.red.bold:' -> '.green.bold) +
      path.normalize(item.dest).blue.bold , 2);
    next();
  };

  if (save) {
    mkpath.sync(path.dirname(config.destination + item.dest));
    fs.writeFile(config.destination + item.dest, layout.render({ content: save }), handle);
  }
}

function processLayout( files, callback, layout ) {
  log('Processing ' + String(Object.keys(files).length).red + ' files into ' + layout.id.cyan, 1);

  var iterator = function( i, next ) {
    var item = { rel: i };
    var file = files[i];

    if ( typeof file === 'string' )
      item.dest = file;
    else if ( file === '' )
      item.dest = i.replace('.twig', '.html');

    if ( item.dest[item.dest.length - 1] === '/' || item.dest[item.dest.length - 1] === '\\' )
      item.dest += 'index.html';

    new twig.twig({
      async: true,
      method: 'fs',
      path: path.join(config.root, 'entries', item.rel),
      base: config.root,
      load: saveEntry.bind(this, item, layout, next)
    });
  };

  async.each(Object.keys(files), iterator, callback);
}

function init() {
  /* Layouts */
  var iterator = function(i, next) {
    new twig.twig({
      id: i,
      method: 'fs',
      path: path.join(config.root, 'layouts', i),
      load: processLayout.bind(this, config.builds[i], next)
    });
  };

  async.each(Object.keys(config.builds), iterator, done);
}

function log(message, v) {
  if ((config.verbosity || 3) >= (v || 3))
    console.log(message);
}