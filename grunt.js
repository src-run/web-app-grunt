
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
  var c = r.configsManagerYAML();
  var s = r.systemIntrospector();

  s.getSystemEnvironment();

  grunt.util.linefeed = '\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: c.getTemplate('banner'),

    clean: {
      scr: c.getPath('app.to.scr'),
      css: c.getPath('app.to.css'),
      img: c.getPath('app.to.img'),
      fnt: c.getPath('app.to.img'),
      ext: c.getPath('app.extra'),
    },

    jshint: {
      options: {
        globals: {
          jQuery: true
        },
        jshintrc: c.getOption('rc-file.js-hint')
      },
      grunt: { src: c.getFilesMerged(['grunt']) },
      scr  : { src: c.getFilesMerged(['app.in.scr']) }
    },

    jscs: {
      options: {
        config: c.getOption('rc-file.jscs')
      },
      grunt: {
        src: '<%= jshint.grunt.src %>'
      },
      scr: {
        src: '<%= jshint.scr.src %>'
      }
    },

    decomment: {
      options: {
        type: 'text'
      },
      css: {
        src : c.getFiles('app.to.css'),
        dest: './',
        cwd : './'
      }
    },

    usebanner: {
      options: {
        position : 'top',
        banner   : '<%= banner %>',
        linebreak: true
      },
      scr: {
        files: {
          src: c.getPath('app.to.scr', { post: '*.js' })
        }
      },
      css: {
        files: {
          src: c.getPath('app.to.css', { post: '*.css' })
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      scr: {
        src : c.getFilesMerged(['jquery.in.scr', 'plug-bs.in.scr', 'plug-bs.in.scr', 'plug-waypoints.in.scr', 'plug-jslghtbx.in.scr', 'plug-smooth-scroll.in.scr', 'app.in.scr']),
        dest: c.getFiles('app.to.scr')
      }
    },

    closurecompiler: {
      scr: {
        // jscs:disable
        options: {
          closure_compilation_level: 'ADVANCED',
          closure_language_in      : 'ECMASCRIPT6_STRICT',
          closure_language_out     : 'ECMASCRIPT5_STRICT'
        },
        // jscs:enable
        src : '<%= concat.scr.dest %>',
        dest: c.getFiles('app.to.scr-min')
      }
    },

    sass: {
      options: {
        includePaths: [c.getPath('app.in.css'), c.getPath('plug.root')],
        precision   : 9,
        sourceMap   : true,
        outFile     : c.getFiles('app.to.css-map')
      },
      css: {
        src : c.getFiles('app.in.scss'),
        dest: c.getFiles('app.to.css')
      }
    },

    copy: {
      'img-jslghtbx': {
        files: [
          {
            expand  : true,
            flatten : true,
            src     : c.getPath('plug-jslghtbx.in.img', { post: '*' }),
            dest    : c.getPath('app.to.img'),
            filter  : 'isFile'
          }
        ]
      },
      'fnt-ionicons': {
        files: [
          {
            expand  : true,
            flatten : true,
            src     : c.getPath('plug-ionicons.in.fnt', { post: '*' }),
            dest    : c.getPath('plug-ionicons.to.fnt'),
            filter  : 'isFile'
          }
        ]
      },
      'fnt-fontawesome': {
        files: [
          {
            expand  : true,
            flatten : true,
            src     : c.getPath('plug-fa.in.fnt', { post: '*' }),
            dest    : c.getPath('plug-fa.to.fnt'),
            filter  : 'isFile'
          }
        ]
      }
    },

    autoprefixer: {
      options: {
        browsers: c.getTask('auto-prefix.browser-list'),
        map     : true
      },
      css: {
        src: '<%= sass.css.dest %>'
      }
    },

    lesslint: {
      options: {
        csslint: {
          'fallback-colors': false,
          failOnWarning    : true,
          csslintrc        : c.getOption('rc-file.css-lint')
        }
      },
      css: {
        src: '<%= sass.css.dest %>'
      }
    },

    cssmin: {
      options: {
        compatibility      : false,
        keepSpecialComments: false,
        sourceMap          : true,
        advanced           : false
      },
      css: {
        src : '<%= sass.css.dest %>',
        dest: c.getFiles('app.to.css-min')
      }
    },

    csscomb: {
      options: {
        config: c.getOption('rc-file.css-comb')
      },
      css: {
        expand: true,
        src   : ['*.css', '!*.min.css'],
        cwd   : c.getPath('app.to.css'),
        dest  : c.getPath('app.to.css')
      }
    },

    watch: {
      scr: {
        files: c.getPath('app.in.scr', { post: '**/*.js' }),
        tasks: ['test-scr', 'compile-scr']
      },
      css: {
        files: c.getPath('app.in.css', { post: '**/*.scss' }),
        tasks: ['compile-css', 'test-css']
      }
    }
  });

  require('load-grunt-tasks')(grunt, { scope : 'devDependencies' });
  require('time-grunt')(grunt);

  grunt.registerTask('test', [
    'test-css',
    'test-scr'
  ]);

  grunt.registerTask('test-css', [
    'lesslint'
  ]);

  grunt.registerTask('test-scr', [
    'jshint:scr',
    'jscs:scr',
    'jshint:grunt',
    'jscs:grunt'
  ]);

  grunt.registerTask('compile-scr', [
    'concat',
    'closurecompiler',
    'commonjs',
    'usebanner:scr'
  ]);

  grunt.registerTask('compile-css', [
    'sass',
    'autoprefixer',
    'csscomb',
    'cssmin',
    'decomment:css',
    'usebanner:css'
  ]);

  grunt.registerTask('assets-copy', [
    'copy:fnt-ionicons',
    'copy:fnt-fontawesome'
  ]);

  grunt.registerTask('install-img', [
    'copy:img-jslghtbx'
  ]);

  grunt.registerTask('compile', [
    'assets-copy',
    'compile-css',
    'compile-scr'
  ]);

  grunt.registerTask('cleanup', [
    'clean:img',
    'clean:scr',
    'clean:css',
    'clean:fnt'
  ]);

  grunt.registerTask('default', [
    'cleanup',
    'install-img',
    'compile'
  ]);

  grunt.registerTask('commonjs', 'Generate CommonJS entry module file', function () {
    return r.generatorCommonJS().write(grunt.config.get('concat.scr.src'), c.getPath('app.to.scr', { post: 'npm.js' }));
  });
};

/* EOF */
