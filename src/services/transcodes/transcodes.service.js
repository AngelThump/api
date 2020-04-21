// Initializes the `transcodes` service on path `/transcodes`
const { Transcodes } = require('./transcodes.class');
const createModel = require('../../models/transcodes.model');
const hooks = require('./transcodes.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/transcodes', new Transcodes(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('transcodes');

  service.hooks(hooks);
};
