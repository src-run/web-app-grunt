
/*
 * This file is part of the `src-run/web-app-grunt` project.
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class SystemIntrospector {

  /**
   * @param {StandardIO}    out
   * @param {child_process} process
   * @param {os}            os
   */
  constructor (out, process, os) {
    this.out     = out;
    this.process = process;
    this.os      = os;
  }

  /**
   * @returns {*}
   */
  getSystemEnvironment () {
    this.out.action('Fetching system environment information...');
    this.out.line('');
    this.out.line('>>>');
    this.out.line('>>>');
    this.out.line('>>> hostname=[' + this.os.hostname() + ']');
    this.out.line('>>> platform=[' + this.os.platform() + ']');
    this.out.line('>>> kernel-v=[' + this.os.release() + ']');
    this.out.line('>>>');
    this.out.line('>>>');
    this.out.line('');
  }

  /**
   * @param {string} what
   *
   * @returns {string}
   */
  locateCommand (what) {
    var r = this.runCommand('which', [what]);

    if (r.error || r.stderr) {
      this.out.fail('Unable to resolve binary for ' + what);
      return false;
    }

    return r.stdout.trim();
  }

  /**
   * @param {string} exec
   * @param {*}      args
   * @param {*}      opts
   * @param {string} shell
   *
   * @returns {*}
   */
  runCommand (exec, args, opts, shell) {
    if (shell === undefined && this.isBashShellAvailable()) {
      shell = this.getBashShell();
    }

    if (opts === undefined) {
      opts = { shell: (shell ? shell : true), encoding: 'utf8', timeout: 10000 };
    }

    return this.process.spawnSync(exec, args, opts);
  }

  /**
   * @returns {boolean}
   */
  isBashShellAvailable () {
    return this.getBashShell() !== false;
  }

  /**
   * @returns {string}|{null}
   */
  getBashShell () {
    var r = this.runCommand('which', ['bash'], undefined, '/bin/sh');

    if (r.status === 0) {
      return r.stdout.trim();
    }

    this.out.fail('Coult not resolve bash binary.');
    return false;
  }
}

module.exports = SystemIntrospector;

/* EOF */
