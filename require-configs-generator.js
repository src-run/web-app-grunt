
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class ConfigGenerator {
  /**
   * Construct our configuration object instance.
   *
   * @param {*}                  grt
   * @param {StandardIO}         out
   * @param {ConfigManagerYAML}  cfg
   * @param {SystemIntrospector} sys
   * @param {GeneratorCommonJS}  cjs
   */
  constructor (grt, out, cfg, sys, cjs) {
    this.grt = grt;
    this.out = out;
    this.cfg = cfg;
    this.sys = sys;
    this.cjs = cjs;
  }

  /**
   * @returns {{}}
   */
  getConfig () {
    var c = this.cfg;
    var configObject = {
      pkg    : this.grt.file.readJSON('package.json'),
      banner : c.getTemplate('banner'),

      clean : {
        scr : c.getPath('to.scr'),
        sty : c.getPath('to.sty'),
        img : c.getPath('to.img'),
        fnt : c.getPath('to.fnt'),
        tmp : c.getPath('to.tmp')
      },

      jshint : {
        options : { globals: { jQuery : true }, jshintrc: c.getOption('rc.scr.hint') },
        grunt   : { src : c.getFiles('grunt') },
        scr     : { src : c.getFiles('in.scr') }
      },

      jscs : {
        options : { config : c.getOption('rc.scr.jscs') },
        grunt   : { src: '<%= jshint.grunt.src %>' },
        scr     : { src: '<%= jshint.scr.src %>' }
      },

      lesslint : {
        options : { csslint : { 'fallback-colors' : false, failOnWarning : true, csslintrc : c.getOption('rc.sty.lint') } },
        sty     : { src: '<%= sass.sty.dest %>' }
      },

      decomment : {
        options : { type: 'text' },
        sty     : {
          src  : c.getFiles('to.sty'),
          dest : './',
          cwd  : './'
        }
      },

      usebanner : {
        options : { position : 'top', banner : '<%= banner %>', linebreak : true },
        scr     : { files : { src : c.getPath('to.scr', { post: '*.js' }) } },
        sty     : { files : { src : c.getPath('to.sty', { post: '*.css' }) } }
      },

      concat : {
        scrPlugins : {
          options : { separator : ';' },
          src     : c.getFilesMerged(['plugins.in.scr']),
          dest    : c.getFiles('to.scr-plugins')
        },
        scr : {
          options : { separator : ';' },
          src     : c.getFilesMerged(['plugins.in.scr', 'in.scr']),
          dest    : c.getFiles('to.scr')
        },
        sty : {
          src  : c.getFilesMerged(['to.sty', 'plugins.in.sty']),
          dest : c.getFiles('to.sty')
        }
      },

      closurecompiler : {
        // jscs:disable
        options : { closure_language_in : c.getOption('closure-compiler.lang.in'), closure_language_out : c.getOption('closure-compiler.lang.to') },
        // jscs:enable
        scrPlugins : {
          // jscs:disable
          options : { closure_compilation_level : 'SIMPLE' },
          // jscs:enable
          src  : c.getFiles('to.scr-plugins'),
          dest : c.getFiles('to.scr-plugins-min')
        },
        scr : {
          // jscs:disable
          options : { closure_compilation_level : 'SIMPLE' },
          // jscs:enable
          src  : c.getFiles('to.scr'),
          dest : c.getFiles('to.scr-min')
        }
      },

      sass : {
        options : {
          includePaths : c.getPathsMerged(['in.sty', 'plugins.root']),
          precision    : 9,
          sourceMap    : true,
          outFile      : c.getFiles('to.sty-map')
        },
        sty : {
          src  : c.getFilesMerged(['in.sty']),
          dest : c.getFiles('to.sty')
        }
      },

      copy : this.getConfigsCopy(),

      autoprefixer : {
        options : {
          browsers : c.getOption('prefixer-browser-list'),
          map      : true
        },
        css : {
          src : '<%= sass.sty.dest %>'
        }
      },

      cssmin : {
        options : { compatibility : false, keepSpecialComments : false, sourceMap : true, advanced : false },
        sty     : {
          src  : '<%= sass.sty.dest %>',
          dest : c.getFiles('to.sty-min')
        }
      },

      csscomb : {
        options : { config : c.getOption('rc.sty.comb') },
        css     : {
          expand : true,
          src    : ['*.css', '!*.min.css'],
          cwd    : c.getPath('to.sty'),
          dest   : c.getPath('to.sty')
        }
      },

      watch : {
        scr : {
          files : c.getPath('in.scr', { post: '**/*.js' }),
          tasks : ['concat:scr', 'concat:scrPugins', 'usebanner:scr']
        },
        css : {
          files : c.getPath('in.sty', { post: '**/*.scss' }),
          tasks : ['copy', 'sass', 'autoprefixer', 'csscomb', 'cssmin']
        }
      }
    };

    return configObject;
  }

  getConfigsCopy () {
    var plugins = this.cfg.getPath('plugins');
    var copyImg = this.getObjectInnerTypes(plugins, 'img').map(function (v) {
      return {
        files: [
          {
            expand  : true,
            flatten : true,
            src     : v,
            dest    : this.cfg.getPath('to.img'),
            filter  : 'isFile'
          }
        ]
      };
    }.bind(this));

    var copyFnt = this.getObjectInnerTypes(plugins, 'fnt').map(function (v) {
      return {
        files: [
          {
            expand  : true,
            flatten : true,
            src     : v + '*',
            dest    : this.cfg.getPath('to.fnt'),
            filter  : 'isFile'
          }
        ]
      };
    }.bind(this));

    var config = {
      img : { files : [] },
      fnt : { files : [] }
    };

    copyImg.forEach(function (v) {
      config.img.files = Array.prototype.concat(config.img.files, v.files);
    }.bind(this));

    copyFnt.forEach(function (v) {
      config.fnt.files = Array.prototype.concat(config.fnt.files, v.files);
    }.bind(this));

    return config;
  }

  getObjectInnerTypes (v, p) {
    var found = [];

    if (v instanceof Object) {
      Array.prototype.concat(Object.getOwnPropertyNames(v)).forEach(function (property) {
        var value = v[property];

        if (property === p) {
          found = Array.prototype.concat(found, value.toString());
          return;
        }

        if (value instanceof Object) {
          found = Array.prototype.concat(found, this.getObjectInnerTypes(value, p));
        }
      }.bind(this));
    }

    return found;
  }
}

module.exports = ConfigGenerator;

/* EOF */
