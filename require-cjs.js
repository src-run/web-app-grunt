
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class GruntGenerateCommonJsFile {
  constructor(out, fileSystem, filePath) {
    this.out        = out;
    this.fileSystem = fileSystem;
    this.filePath   = filePath;
  }

  write(jsFileList, destFilePath) {
    this.out.title('Generating CommonJS file');

    this.jsFileList = jsFileList;
    this.destPath   = this.filePath.dirname(destFilePath);

    this.writeFile(destFilePath);
  }

  writeFile(destFilePath) {
    this.out.write('Writing ' + destFilePath + '...');

    try {
      this.fileSystem.writeFileSync(destFilePath, this.generate());
    } catch (error) {
      this.out.actionException('Generating CommonJS file', error, true);
    }

    this.out.actionSuccess();
  }

  generate() {
    return this.jsFileList.map(this.generateFileInclude.bind(this)).join('\n');
  }

  generateFileInclude(srcPath) {
    return 'require(\'' + this.filePath.relative(this.destPath, srcPath).replace(/\\/g, '/') + '\');';
  }
}

module.exports = GruntGenerateCommonJsFile;

/* EOF */
