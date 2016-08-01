
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
    this.objects.sio = new (require('./require-sio.js'))(grunt, true);
    this.objects.cfg = new (require('./require-cfg.js'))(this.objects.sio, filesystem);
    this.objects.gcj = new (require('./require-gcj.js'))(this.objects.sio, filesystem, path);
    this.objects.osi = new (require('./require-osi.js'))(this.objects.sio, process, os);
  }

  /**
   * @param {string} name
   *
   * @returns {*}
   */
  get (name) {
    if (this.objects[index] !== undefined) {
      return this.objects[index];
    }

    this.standardIO().fail('Invalid object type requested from dependencies handler (' + index + ').');
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
  configsManagerYAML () {
    return this.objects.cfg;
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
