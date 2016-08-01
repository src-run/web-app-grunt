
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class StandardIO {

  /**
   * @param {grunt} grunt
   * @param {bool}  useVerboseIndirectObject
   */
  constructor (grunt, useVerboseIndirectObject) {
    this.grunt = grunt;
    this.out   = grunt.log;

    if (useVerboseIndirectObject) {
      this.out = this.grunt.verbose;
    }
  }

  /**
   * @param {string} title
   */
  title (title) {
    this.out.subhead(title);
  }

  /**
   * @param {string} message
   */
  write (message) {
    this.out.write(message);
  }

  /**
   * @param {string} message
   */
  line (message) {
    this.out.writeln(message);
  }

  /**
   * @param {string} object
   * @param {string} prefix
   */
  props (object, prefix) {
    this.out.writeflags(object, prefix);
  }

  /**
   * @param {string} message
   */
  action (message) {
    this.out.ok(message);
  }

  /**
   * @param {string} message
   */
  actionSuccess (message) {
    if (message !== undefined) {
      this.out.ok(message);
    } else {
      this.out.ok();
    }
  }

  /**
   * @param {string}  message
   * @param {boolean} stop
   */
  actionFail (message, stop) {
    if (message !== undefined) {
      this.fail(message, undefined, stop);
      return;
    }

    this.log.error();

    if (stop) {
      this.grunt.fail.warn(message);
    }
  }

  /**
   * @param {string}  message
   * @param {object}  exception
   * @param {boolean} stop
   */
  actionException (message, exception, stop) {
    this.fail(message, exception, stop);
  }

  /**
   * @param {string}  message
   * @param {object}  exception
   * @param {boolean} stop
   */
  fail (message, exception, stop) {
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

module.exports = StandardIO;

/* EOF */
