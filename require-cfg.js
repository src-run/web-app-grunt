
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class ConfigManagerYAML {

  /**
   * @param {StandardIO} out
   * @param {filesystem} filesystem
   * @param {*}          tryPaths
   */
  constructor (out, filesystem, tryPaths) {
    this.out        = out;
    this.filesystem = filesystem;
    this.isLoaded   = false;
    this.tryPaths   = ['.grunt.json', '.grunt/config.json'];

    this.setUsrDirs(tryPaths);
    this.readConfig();

    if (!this.isLoaded) {
      this.out.fail('Could not load any configuration files!', undefined, true);
    }

    this.out.action('JSON configuration object initialized!');
  }

  /**
   * @param {*} paths
   *
   * @return {*}
   */
  setUsrDirs (paths) {
    if (paths === undefined || !(paths instanceof Array)) {
      return;
    }

    return this.tryPaths = paths.concat(this.tryPaths);
  }

  /**
   * Get config value for context path.
   *
   * @param {string}idx
   * @param {*}     opt
   *
   * @returns {*}
   */
  getPath (idx, opt) {
    return this.getConfigIndex('paths', idx, opt);
  }

  /**
   * Get config value for context files.
   *
   * @param {string} idx
   * @param {*}      opt
   *
   * @returns {*}
   */
  getFiles (idx, opt) {
    return this.getConfigIndex('files', idx, opt);
  }

  /**
   * @param {*} indexes
   *
   * @returns {Array}
     */
  getFilesMerged (indexes) {
    return Array.prototype.concat(...indexes.map(this.getFiles.bind(this)));
  }

  /**
   * Get config value for context task.
   *
   * @param {string}idx
   * @param {*}     opt
   *
   * @returns {*}
   */
  getTask (idx, opt) {
    return this.getConfigIndex('tasks', idx, opt);
  }

  /**
   * Get config value for context template.
   *
   * @param {string}idx
   * @param {*}     opt
   *
   * @returns {*}
   */
  getTemplate (idx, opt) {
    return this.getConfigIndex('templates', idx, opt);
  }

  /**
   * Wrapper for getConfig() with IO logging.
   *
   * @param {string} context
   * @param {string} idx
   * @param {*}      opt
   *
   * @returns {*}
   */
  getConfigIndex (context, idx, opt) {
    var val;
    var msg = 'Resolving config val for ' + idx;

    try {
      val = this.getConfig(context, idx, opt);
    } catch (error) {
      this.out.actionException(msg, error, true);
    }

    this.out.action(msg + ' as ' + val);
    return val;
  }

  /**
   * Return a config val based on the context, idx, and final-operations specified as arguments.
   *
   * @param {string} context
   * @param {string} idx
   * @param {*}      opt
   *
   * @returns {*}
   */
  getConfig (context, idx, opt) {
    var val;

    if (context) {
      idx = context + '.' + idx;
    }

    try {
      val = this.findIndex(idx);
    } catch (e) {
      throw e;
    }

    try {
      val = val instanceof Array ? this.resolveArray(val) : this.resolveValue(val);
    } catch (e) {
      throw e;
    }

    return val instanceof Array ? ConfigManagerYAML.prePostArray(val, opt) : ConfigManagerYAML.prePostValue(val, opt);
  }

  /**
   * Attempt to read in the first config file that exists out of those configured.
   *
   * @returns {bool}
   */
  readConfig () {
    this.out.title('Loading Grunt Configuration');

    this.tryPaths.forEach(function (p) {
      this.readConfigFile(p);
    }.bind(this));

    return this.isLoaded === true;
  }

  /**
   * Attempt to read a config file. If file exists, load and toggle $isLoaded to stop further files from being read in.
   *
   * @param {string} file
   */
  readConfigFile (file) {
    if (this.isLoaded) {
      this.out.line('Skipping ' + file + ' (already resolved config)');
      return;
    }

    this.out.write('Trying to load config file "' + file + '"...');

    try {
      this.config = JSON.parse(this.filesystem.readFileSync(file, { encoding: 'utf8' }));
      this.out.actionSuccess();
      this.isLoaded = true;
    } catch (error) {
      this.out.fail('could not load file...', undefined, false);
    }
  }

  /**
   * Resolve config val by performing recursive substitutions for all placeholders until the string is resolved.
   *
   * @param {string} val
   *
   * @returns {string}
   */
  resolveValue (val) {
    var parsed = val.toString();
    var search;
    var replaceRegex;
    var replaceValue;
    var i = 0;

    while (true) {
      search = new RegExp('\\$\{([a-z\.-]+)\}', 'i').exec(parsed);

      if (!search || search.length < 2 || i++ > 10) {
        break;
      }

      replaceValue = this.getConfig(undefined, search[1], { silent: true });
      replaceRegex = new RegExp(ConfigManagerYAML.regexQuote(search[0]), 'g');

      if (replaceValue) {
        parsed = parsed.replace(replaceRegex, replaceValue);
      }
    }

    return parsed;
  }

  /**
   * If an array value needs to resolution this loops though and utilizes the normal scalar value resolver.
   *
   * @param {*} a
   *
   * @returns {*}
   */
  resolveArray (a) {
    return a.map(function (val) {
      return this.resolveValue(val);
    }.bind(this));
  }

  /**
   * Find a value through a lookup against it's index.
   *
   * @param {string} search
   *
   * @returns {*}
   */
  findIndex (search) {
    var conf = this.config;

    search.split('.').forEach(function (p) {
      if (!(conf = conf[p])) {
        throw new Error('Error resolving value at index fragment: ' + index);
      }
    });

    return conf;
  }

  /**
   * Generate and concatenate pre-value string to resolved string.
   *
   * @param {string} val
   * @param {*}      opt
   *
   * @returns {*}
   */
  static prePostValue (val, opt) {
    if (opt && opt.pre) {
      val = opt.pre + val;
    }

    if (opt && opt.post) {
      val = val + opt.post;
    }

    return val;
  }

  /**
   * Generate and concatinate pre-value string to resolved string, but against an array of items.
   *
   * @param {string} arr
   * @param {*}      opt
   *
   * @returns {*}
   */
  static prePostArray (arr, opt) {
    return arr.map(function (val) {
      return ConfigManagerYAML.prePostValue(val, opt);
    });
  }

  /**
   * Regex quote sub routine.
   *
   * @param {string} val
   *
   * @returns {*}
   */
  static regexQuote (val) {
    return val.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}

module.exports = ConfigManagerYAML;

/* EOF */
