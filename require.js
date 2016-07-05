
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class GruntRequirements {
  constructor(grunt) {
    var fileSystem     = require('fs');
    var filePath       = require('path');

    this.objects     = [];
    this.objects.out = new (require('./require-out.js'))(grunt, true);
    this.objects.cfg = new (require('./require-cfg.js'))(this.objects.out, fileSystem);
    this.objects.cjs = new (require('./require-cjs.js'))(this.objects.out, fileSystem, filePath);
  }

  get(name) {
    return this.objects[name];
  }
}

module.exports = GruntRequirements;

/* EOF */
