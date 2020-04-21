const streams = require('./streams/streams.service.js');
const users = require('./users/users.service.js');
const transcodes = require('./transcodes/transcodes.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(streams);
  app.configure(users);
  app.configure(transcodes);
};
