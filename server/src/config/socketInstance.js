/**
 * Shared Socket.IO Instance
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 *
 * Set once in server.js after `io` is created,
 * then imported anywhere (controllers, services) that need to emit events.
 */
let _io = null;

module.exports = {
  setIo(io) {
    _io = io;
  },
  getIo() {
    return _io;
  },
};
