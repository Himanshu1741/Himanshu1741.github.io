/**
 * Shared Socket.IO instance.
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
