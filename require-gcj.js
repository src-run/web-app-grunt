
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class GeneratorCommonJS {

  /**
   * @param {StandardIO} out
   * @param {filesystem} filesystem
   * @param {path}       filePath
   */
  constructor (out, filesystem, filePath) {
    this.out        = out;
    this.filesystem = filesystem;
    this.filePath   = filePath;
  }

  /**
   * @param {string} jsFiles
   * @param {string} toPath
   */
  write (jsFiles, toPath) {
    this.out.title('Generating CommonJS file');

    this.jsFileList = jsFiles;
    this.destPath   = this.filePath.dirname(toPath);

    this.writeFile(toPath);
  }

  /**
   * @param {string} toPath
   */
  writeFile (toPath) {
    this.out.write('Writing ' + toPath + '...');

    try {
      this.filesystem.writeFileSync(toPath, this.generate());
    } catch (error) {
      this.out.actionException('Generating CommonJS file', error, true);
    }

    this.out.actionSuccess();
  }

  /**
   * @returns {string}
   */
  generate () {
    return this.jsFileList.map(this.generateInclude.bind(this)).join('\n');
  }

  /**
   * @param {string} path
   *
   * @returns {string}
   */
  generateInclude (path) {
    return 'require(\'' + this.filePath.relative(this.destPath, path).replace(/\\/g, '/') + '\');';
  }
}

module.exports = GeneratorCommonJS;

/* EOF */
