const streams = require('./streams/streams.service.js');
const users = require('./users/users.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(streams);
  app.configure(users);
};
