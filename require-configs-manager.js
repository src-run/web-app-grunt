
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
   * Construct our configuration object instance.
   * @param {StandardIO} out
   * @param {filesystem} filesystem
   * @param {Array}      paths
   */
  constructor (out, filesystem, paths) {
    this.out           = out;
    this.filesystem    = filesystem;
    this.loaded        = false;
    this.loadPaths     = ['.grunt.json', '.grunt/config.json'];
    this.configuration = {};
    this.values        = {};

    var msg = 'Initializing Configuration Manager';

    this.out.title(msg);
    this.addPaths(paths);
    this.loadConfig();

    if (!this.loaded) {
      this.out.fail('Failed to load configuration! ');
      this.out.fail('Paths tried: "' + this.loadPaths.toString() + '" ', undefined, true);
    }
  }

  /**
   * Set alternative config file paths passed by the user.
   * @param {Array} paths
   */
  addPaths (paths) {
    if (paths && paths instanceof Array) {
      this.loadPaths = paths.concat(this.paths);
    }
  }

  /**
   * Read config file by trying
   * @returns {bool}
   */
  loadConfig () {
    this.loadPaths.forEach(function (p) {
      this.readConfig(p);
    }.bind(this));

    return this.loaded === true;
  }

  /**
   * Try to read config file. Skip load if one has already been loaded.
   * @param {string} file
   */
  readConfig (file) {
    if (this.loaded) {
      return;
    }

    try {
      this.configuration = JSON.parse(this.filesystem.readFileSync(file, { encoding: 'utf8' }));
      this.loaded = true;
      this.out.action('Loaded configuration file: ' + file);
    }
    catch (error) {}
  }

  /**
   * Get directory path from config.
   * @param   {string} idx
   * @param   {Array}  opt
   * @returns {*}
   */
  getPath (idx, opt) {
    return this.getValue('paths', idx, opt);
  }

  /**
   * Get collection of file paths from config.
   * @param   {Array} idxs
   * @returns {Array}
   */
  getPathsMerged (idxs) {
    return Array.prototype.concat(...idxs.map(this.getPath.bind(this)));
  }

  /**
   * Get file path from config.
   * @param   {string} idx
   * @param   {Array}  opt
   * @returns {*}
   */
  getFiles (idx, opt) {
    return this.getValue('files', idx, opt);
  }

  /**
   * Get collection of file paths from config.
   * @param   {Array} idxs
   * @returns {Array}
   */
  getFilesMerged (idxs) {
    return Array.prototype.concat(...idxs.map(this.getFiles.bind(this)));
  }

  /**
   * Get option value from config.
   * @param   {string} idx
   * @param   {Array}  opt
   * @returns {*}
   */
  getOption (idx, opt) {
    return this.getValue('options', idx, opt);
  }

  /**
   * Get task value from config.
   * @param   {string} idx
   * @param   {Array}  opt
   * @returns {*}
   */
  getTask (idx, opt) {
    return this.getValue('tasks', idx, opt);
  }

  /**
   * Get template value from config.
   * @param   {string} idx
   * @param   {Array}  opt
   * @returns {*}
   */
  getTemplate (idx, opt) {
    return this.getValue('templates', idx, opt);
  }

  /**
   * Get requested value from config.
   * @param {string} ctx
   * @param {string} idx
   * @param {Array}  opt
   * @returns {*}
   */
  getValue (ctx, idx, opt) {
    var val;

    idx = ConfigManagerYAML.buildIndex(ctx, idx);
    val = this.getCachedValue(idx, opt);

    if (val) {
      this.out.action('Value cached : ' + idx + ' (' + JSON.stringify(opt ? opt : 'no options') + ')');
      return val;
    }

    try {
      val = this.lookup(idx);
      val = ConfigManagerYAML.applyOptions(val, opt);
    } catch (error) {
      this.out.actionException('Value failed : ' + idx, error, true);
    }

    this.setCachedValue(idx, opt, val);
    this.out.action('Value lookup : ' + idx + ' (' + JSON.stringify(opt) + ')');

    if (val instanceof Object) {
      this.out.action('--           = {object}:');
      this.out.writeObject(val);
    } else {
      this.out.action('--           = ' + val.toString());
    }

    return val;
  }

  /**
   * Return value from cache if already resolved.
   * @param  {string} idx
   * @param  {Array}  opt
   * @return {string|Array|null}
   */
  getCachedValue (idx, opt) {
    var key = ConfigManagerYAML.buildCacheIndex(idx, opt);

    if (this.values[key]) {
      return this.values[key];
    }

    return null;
  }

  /**
   * Add value to cache for later retrieval.
   * @param {string}       idx
   * @param {Array}        opt
   * @param {Array|string} val
   */
  setCachedValue (idx, opt, val) {
    var key = ConfigManagerYAML.buildCacheIndex(idx, opt);

    this.values[key] = val;
  }

  /**
   * Lookup the config value by index.
   * @param   {string} idx
   * @returns {*}
   */
  lookup (idx) {
    return this.resolveReplacements(this.resolveValue(idx));
  }

  /**
   * Find a value through a lookup against it's index.
   * @param   {string} idx
   * @returns {string|Array}
   */
  resolveValue (idx) {
    var val = this.configuration;

    idx.split('.').forEach(function (i) {
      val = val[i];

      if (!val) {
        throw new Error('Resolution error for index (' + idx + ') at fragment ' + i);
      }
    });

    return val;
  }

  /**
   * Resolve value placeholders.
   * @param   {Array|string} val
   * @returns {Array|string}
   */
  resolveReplacements (val) {
    if (val instanceof Object) {
      return this.resolveReplacementsForObject(val);
    }

    if (val instanceof Array) {
      return this.resolveReplacementsForArray(val);
    }

    return this.resolveReplacementsForScalar(val);
  }

  /**
   * Resolve value placeholders in value string.
   * @param   {string} val
   * @returns {string}
   */
  resolveReplacementsForScalar (val) {
    var search;
    var replace;
    var i = 0;
    var maxIterations = 20;
    var parsed = val.toString();

    while (true) {
      search = new RegExp('\\$\{([a-z\.-]+)\}', 'i').exec(parsed);

      if (!search || search.length < 2 || i++ > maxIterations) {
        break;
      }

      replace = this.lookup(search[1]);

      if (replace) {
        parsed = parsed.replace(new RegExp(ConfigManagerYAML.regexQuote(search[0]), 'g'), replace);
      }
    }

    return parsed;
  }

  /**
   * Resolve value placeholders on each array element.
   * @param   {Array} val
   * @returns {Array}
   */
  resolveReplacementsForArray (val) {
    return val.map(function (v) {
      return this.resolveReplacementsForScalar(v);
    }.bind(this));
  }

  /**
   * Resolve value placeholders on each object element.
   * @param   {Object} val
   * @returns {Object}
   */
  resolveReplacementsForObject (val) {
    Array.prototype.concat(Object.getOwnPropertyNames(val)).forEach(function (property) {
      var v = val[property];

      if (v instanceof Object) {
        val[property] = this.resolveReplacementsForObject(v);
      } else if (v instanceof Array) {
        val[property] = this.resolveReplacementsForArray(v);
      } else if (typeof v === 'string') {
        val[property] = this.resolveReplacementsForScalar(v);
      }
    }.bind(this));

    return val;
  }

  /**
   * Resolve full index if context is specified.
   * @param   {string|null} ctx
   * @param   {string}      idx
   * @returns {string}
   */
  static buildIndex (ctx, idx) {
    if (ctx) {
      idx = ctx + '.' + idx;
    }

    return idx;
  }

  /**
   * Create a key for the given context, index, and options.
   *
   * @returns {string}
   */
  static buildCacheIndex () {
    var key = 'cache';

    Array.from(arguments).forEach(function (k, i) {
      key += '__' + i + '_' + JSON.stringify(k);
    });

    return key.replace(/\W/g, '');
  }

  /**
   * Apply options to resolved config value.
   * @param   {string|Array} val
   * @param   {Array}        opt
   * @returns {*}
   */
  static applyOptions (val, opt) {
    if (val instanceof Array) {
      return ConfigManagerYAML.applyOptionsOnArray(val, opt);
    }

    return ConfigManagerYAML.applyOptionsOnScalar(val, opt);
  }

  /**
   * Generate final config value by applying passed options to resolved string.
   * @param   {string} val
   * @param   {Array}  opt
   * @returns {*}
   */
  static applyOptionsOnScalar (val, opt) {
    if (opt && opt.pre) {
      val = opt.pre + val;
    }

    if (opt && opt.post) {
      val = val + opt.post;
    }

    return val;
  }

  /**
   * Generate final config value by applying passed options to each array element.
   * @param   {string} val
   * @param   {Array}  opt
   * @returns {*}
   */
  static applyOptionsOnArray (val, opt) {
    return val.map(function (v) {
      return ConfigManagerYAML.applyOptionsOnScalar(v.toString(), opt);
    });
  }

  /**
   * @param   {string} val
   * @returns {*}
   */
  static regexQuote (val) {
    return val.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}

module.exports = ConfigManagerYAML;

/* EOF */
