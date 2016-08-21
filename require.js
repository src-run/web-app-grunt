
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class RequiredDependencies {

  /**
   * @param {object} grunt
   */
  constructor (grunt) {
    var filesystem = require('fs');
    var path       = require('path');
    var process    = require('child_process');
    var os         = require('os');

    this.objects = [];
    this.objects.sio = new (require('./require-standard-io.js'))(grunt, true);
    this.objects.cfg = new (require('./require-configs-manager.js'))(this.objects.sio, filesystem);
    this.objects.gcj = new (require('./require-generator-commonjs.js'))(this.objects.sio, filesystem, path);
    this.objects.osi = new (require('./require-system-introspect.js'))(this.objects.sio, process, os);
    this.objects.gen = new (require('./require-configs-generator.js'))(grunt, this.objects.sio, this.objects.cfg, this.objects.osi, this.objects.gcj);
  }

  /**
   * @param {string} name
   *
   * @returns {*}
   */
  get (name) {
    if (this.objects[name] !== undefined) {
      return this.objects[name];
    }

    this.standardIO().fail('Invalid object type requested from dependencies handler (' + name + ').');
  }

  /**
   * @returns {StandardIO}
   */
  standardIO () {
    return this.objects.sio;
  }

  /**
   * @returns {ConfigManagerYAML}
   */
  configDataYaml () {
    return this.objects.cfg;
  }

  /**
   * @returns {ConfigGenerator}
   */
  configGenerator () {
    return this.objects.gen;
  }

  /**
   * @returns {GeneratorCommonJS}
   */
  generatorCommonJS () {
    return this.objects.gcj;
  }

  /**
   * @returns {SystemIntrospector}
   */
  systemIntrospector () {
    return this.objects.osi;
  }
}

module.exports = RequiredDependencies;

/* EOF */
