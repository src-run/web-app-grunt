
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class GruntConfigurationResolver {
  constructor(out, fileSystem, configFilePath) {
    this.out          = out;
    this.fileSystem   = fileSystem;
    this.configLoaded = false;
    this.configPaths  = [
      '.grunt.json',
      '.grunt/config.json'
    ];

    this.readConfig();

    if (!this.configLoaded) {
      this.out.fail('Could not load any configuration files!', undefined, true);
    }

    this.out.action("JSON configuration object initialized!");
  }

  getPath(index, opts) {
    return this.getConfigIndex('paths', index, opts);
  }

  getFiles(index, opts) {
    return this.getConfigIndex('files', index, opts);
  }

  getTask(index, opts) {
    return this.getConfigIndex('tasks', index, opts);
  }

  getTemplate(index, opts) {
    return this.getConfigIndex('templates', index, opts);
  }

  getConfigIndex(context, index, opts) {
    var value;
    var msg = 'Resolving config value for ' + index;

    try {
      value = this.getConfig(context, index, opts);
    } catch (error) {
      this.out.actionException(msg, error, true);
    }

    this.out.action(msg + ' as ' + value);
    return value;
  }

  getConfig(context, index, opts) {
    var value;

    if (context) {
      index = context + '.' + index;
    }

    try {
      value = this.findIndex(index);
    } catch(e) {
      throw e;
    }

    try {
      value = value instanceof Array ? this.resolveArray(value) : this.resolveValue(value);
    } catch(e) {
      throw e;
    }

    return value instanceof Array ? GruntConfigurationResolver.prePostArray(value, opts) : GruntConfigurationResolver.prePostValue(value, opts);
  }

  readConfig() {
    this.out.title('Loading Grunt Configuration');

    for (var i in this.configPaths) {
      this.readConfigFile(this.configPaths[i]);
    }
  }

  readConfigFile(file) {
    if (this.configLoaded) {
      this.out.line('Skipping ' + file + ' (already resolved config)');
      return;
    }

    this.out.write('Trying to load config file "' + file + '"...');

    try {
      this.config = JSON.parse(this.fileSystem.readFileSync(file, {encoding: 'utf8'}));
      this.out.actionSuccess();
      this.configLoaded = true;
    } catch (error) {
      this.out.fail('could not load file...', undefined, false);
    }
  }

  resolveValue(value) {
    var parsed = value.toString();
    var search;
    var replaceRegex;
    var replaceValue;
    var i = 0;

    while (true) {
      search = new RegExp('\\$\{([a-z\.-]+)\}', 'i').exec(parsed);

      if (!search || search.length < 2 || i++ > 10) {
        break;
      }

      replaceValue = this.getConfig(undefined, search[1], {silent: true});
      replaceRegex = new RegExp(GruntConfigurationResolver.regexQuote(search[0]), 'g');

      if (replaceValue) {
        parsed = parsed.replace(replaceRegex, replaceValue);
      }
    }

    return parsed;
  }

  resolveArray(a) {
    return a.map(function (value) {
      return this.resolveValue(value);
    }.bind(this));
  }

  findIndex(search) {
    var config = this.config;

    search.split('.').forEach(function (p) {
      config = config[p];

      if (!config) {
        throw new Error('Error resolving value at index fragment: ' + index);
      }
    });

    return config;
  }

  static prePostValue(v, opts) {
    if (opts && opts.pre) {
      v = opts.pre + v;
    }

    if (opts && opts.post) {
      v = v + opts.post;
    }

    return v;
  }

  static prePostArray(a, opts) {
    return a.map(function (value) {
      return GruntConfigurationResolver.prePostValue(value, opts);
    });
  }

  static regexQuote(string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}

module.exports = GruntConfigurationResolver;

/* EOF */
