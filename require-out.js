
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class GruntConsoleOutputHandler {
  constructor(gruntObj, callsOnVerboseObj) {
    this.grunt = gruntObj;
    this.out = gruntObj.log;

    if (callsOnVerboseObj) {
      this.out = this.grunt.verbose;
    }
  }

  title(title) {
    this.out.subhead(title);
  }

  write(message) {
    this.out.write(message);
  }

  line(message) {
    this.out.writeln(message);
  }

  props(object, prefix) {
    this.out.writeflags(object, prefix);
  }

  action(message) {
    this.out.ok(message);
  }

  actionSuccess(message) {
    if (message !== undefined) {
      this.out.ok(message);
    } else {
      this.out.ok();
    }
  }

  actionFail(message, stop) {
    if (message !== undefined) {
      this.fail(message, undefined, stop);
      return;
    }

    this.log.error();

    if (stop) {
      this.grunt.fail.warn(message);
    }
  }

  actionException(message, exception, stop) {
    this.fail(message, exception, stop);
  }

  fail(message, exception, stop) {
    if (exception === undefined) {
      this.out.write(message).error();
    } else {
      this.out.write(message).error().error(exception.message);
    }

    if (stop) {
      this.grunt.fail.warn(message);
    }
  }
}

module.exports = GruntConsoleOutputHandler;

/* EOF */
