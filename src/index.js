/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port, '0.0.0.0');

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () => {
    if (process.env.NODE_ENV === "production") {
      logger.info('Feathers application production build started on http://%s:%d', app.get('host'), port)
    } else {
      logger.info('Feathers application development build started on http://%s:%d', app.get('host'), port)
    }
  }
);

process.on('unhandledRejection', function(reason, p){
  console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging here
});