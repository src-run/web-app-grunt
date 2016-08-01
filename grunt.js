
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
      script: [c.getPath('app.to.script')],
      style : [c.getPath('app.to.style')]
    },

    jshint: {
      options: {
        globals: {
          jQuery: true
        },
        jshintrc: c.getPath('app.in.script', { post: '.jshintrc' })
      },
      grunt: {
        options: {
          jshintrc: c.getPath('app.in.script', { post: '.jshintrc' })
        },
        src: ['Gruntfile.js', 'package.js', 'grunt/*.js']
      },
      script: {
        src: c.getFilesMerged(['app.in.script'])
      }
    },

    jscs: {
      options: {
        config: c.getPath('app.in.script', { post: '.jscsrc' })
      },
      grunt: {
        src: '<%= jshint.grunt.src %>'
      },
      script: {
        src: '<%= jshint.script.src %>'
      }
    },

    decomment: {
      options: {
        type: 'text'
      },
      style: {
        src : [c.getPath('app.to.style', { post: '*.css' })],
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
      script: {
        files: {
          src: [c.getPath('app.to.script', { post: '*.js' })]
        }
      },
      style: {
        files: {
          src: [c.getPath('app.to.style', { post: '*.css' })]
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      script: {
        src : c.getFilesMerged(['jquery.in.script', 'plug-bs.in.script', 'plug-bs.in.script', 'plug-waypoints.in.script', 'app.in.script']),
        dest: c.getPath('app.to.script', { post: 'app.js' })
      }
    },

    uglify: {
      options: {
        mangle          : true,
        preserveComments: false,
        screwIE8        : true,
        quoteStyle      : 2
      },
      script: {
        src : '<%= concat.script.dest %>',
        dest: c.getPath('app.to.script', { post: 'app.min.js' })
      }
    },

    closurecompiler: {
      script: {
        options: { // jscs:disable
          closure_compilation_level: 'ADVANCED',
          closure_language_in      : 'ECMASCRIPT6_STRICT',
          closure_language_out     : 'ECMASCRIPT5_STRICT'
        }, // jscs:enable
        dest: c.getPath('app.to.script', { post: 'app.min.js' }),
        src : ['<%= concat.script.dest %>']
      }
    },

    sass: {
      options: {
        includePaths: [c.getPath('app.in.style'), c.getPath('plug.root')],
        precision   : 9,
        sourceMap   : true,
        outFile     : c.getPath('app.to.style', { post: 'app.css.map' })
      },
      style: {
        src : c.getPath('app.in.style', { post: 'app.scss' }),
        dest: c.getPath('app.to.style', { post: 'app.css' })
      }
    },

    autoprefixer: {
      options: {
        browsers: c.getTask('autoprefixer.browserList')
      },
      style: {
        options: {
          map: true
        },
        src: c.getPath('app.to.style', { post: 'app.css' })
      }
    },

    lesslint: {
      options: {
        csslint: {
          csslintrc        : c.getPath('app.in.style', { post: '.csslintrc' }),
          failOnWarning    : false,
          'fallback-colors': false
        }
      },
      style: {
        src: c.getPath('app.to.style', { post: 'app.css' })
      }
    },

    cssmin: {
      options: {
        compatibility      : false,
        keepSpecialComments: false,
        sourceMap          : true,
        advanced           : false
      },
      style: {
        src : c.getPath('app.to.style', { post: 'app.css' }),
        dest: c.getPath('app.to.style', { post: 'app.min.css' })
      }
    },

    csscomb: {
      options: {
        config: c.getPath('app.in.style', { post: '.csscomb.json' })
      },
      style: {
        expand: true,
        src   : ['*.css', '!*.min.css'],
        cwd   : c.getPath('app.to.style'),
        dest  : c.getPath('app.to.style')
      }
    },

    watch: {
      script: {
        files: c.getFilesMerged(['jquery.in.script', 'plug-bs.in.script', 'plug-bs.in.script', 'plug-waypoints.in.script', 'app.in.script']),
        tasks: ['jshint:script', 'compile-script']
      },
      style: {
        files: c.getPath('app.in.style', { post: '**/*.scss' }),
        tasks: ['test-style']
      }
    }
  });

  require('load-grunt-tasks')(grunt, { scope : 'devDependencies' });
  require('time-grunt')(grunt);

  grunt.registerTask('test', [
    'test-style',
    'test-script'
  ]);

  grunt.registerTask('test-style', [
    'compile-style',
    'lesslint'
  ]);

  grunt.registerTask('test-script', [
    'jshint:script',
    'jscs:script',
    'jshint:grunt',
    'jscs:grunt'
  ]);

  grunt.registerTask('compile-script', [
    'concat',
    'closurecompiler',
//    'uglify',
    'commonjs',
    'usebanner:script'
  ]);

  grunt.registerTask('compile-style', [
    'sass',
    'autoprefixer',
    'csscomb',
    'cssmin',
    'decomment:style',
    'usebanner:style'
  ]);

  grunt.registerTask('compile', [
    'compile-style',
    'compile-script'
  ]);

  grunt.registerTask('cleanup', [
    'clean:script',
    'clean:style'
  ]);

  grunt.registerTask('default', [
    'cleanup',
    'compile',
    'test'
  ]);

  grunt.registerTask('commonjs', 'Generate CommonJS entry module file', function () {
    return r.generatorCommonJS().write(grunt.config.get('concat.script.src'), c.getPath('app.to.script', { post: 'npm.js' }));
  });
};

/* EOF */
