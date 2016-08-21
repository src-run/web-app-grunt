
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

module.exports = function (grunt) {
  'use strict';

  var r = new (require('./require.js'))(grunt);
  var c = r.configDataYaml();
  var g = r.configGenerator(c);
  var s = r.systemIntrospector();

  s.getSystemEnvironment();

  grunt.util.linefeed = '\n';
  grunt.initConfig(g.getConfig());

  require('load-grunt-tasks')(grunt, { scope : 'devDependencies' });
  require('time-grunt')(grunt);

  grunt.registerTask('test', [
    'test-sty',
    'test-scr'
  ]);

  grunt.registerTask('test-sty', [
    'lesslint'
  ]);

  grunt.registerTask('test-scr', [
    'jshint:scr',
    'jscs:scr',
    'jshint:grunt',
    'jscs:grunt'
  ]);

  grunt.registerTask('compile-scr', [
    'concat:scr',
    'concat:scr-plugins',
    'closurecompiler:scr',
    'closurecompiler:scr-plugins',
    'commonjs',
    'usebanner:scr'
  ]);

  grunt.registerTask('compile-sty', [
    'sass',
    'autoprefixer',
    'csscomb',
    'cssmin',
    'decomment:sty',
    'usebanner:sty'
  ]);

  grunt.registerTask('compile', [
    'copy',
    'compile-sty',
    'compile-scr'
  ]);

  grunt.registerTask('cleanup', [
    'clean:img',
    'clean:scr',
    'clean:sty',
    'clean:fnt'
  ]);

  grunt.registerTask('default', [
    'cleanup',
    'compile',
    'test'
  ]);

  grunt.registerTask('commonjs', 'Generate CommonJS entry module file', function () {
    return r.generatorCommonJS().write(grunt.config.get('concat.scr.src'), c.getPath('to.scr', { post: 'npm.js' }));
  });
};

/* EOF */
