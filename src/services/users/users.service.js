// Initializes the `users` service on path `/users`
const hooks = require('./users.hooks');
const rest = require('@feathersjs/rest-client');
const axios = require('axios');

module.exports = function (app) {
  const client = rest(app.get('sso')).axios(axios, {
      headers: {
          "x-api-key": app.get('x-api-key')
      }
  });

  app.use('/users', client.service('users'));

  app.service('users');

  // Get our initialized service so that we can register hooks
  const service = app.service('users');

  service.hooks(hooks);
};
