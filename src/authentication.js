const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');

module.exports = app => {
  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());

  app.use('/authentication', authentication);
};