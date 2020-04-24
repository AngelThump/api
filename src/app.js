const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const bodyParser = require('body-parser');
const socketio = require('@feathersjs/socketio');

const fs = require('fs');
const morgan = require('morgan');
const requestIp = require('request-ip');
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), {flags: 'a'});
const authentication = require('./authentication');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const mongoose = require('./mongoose');


const sequelize = require('./sequelize');


const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet({
    hsts: false
}));
app.use(cors({
    exposedHeaders: ['X-Total-Count'],
}));
app.use(compress());
const rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}

app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

//use real ip
morgan.token('remote-addr', function (req) {
    return requestIp.getClientIp(req);
});

//log to file
app.use(morgan(':method :url :status :response-time ms - :res[content-length] - :remote-addr - [:date[clf]]', {stream: accessLogStream, skip: function (req, res) { 
	return app.get('skipIPs').includes(requestIp.getClientIp(req));
}}));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.configure(mongoose);

app.configure(sequelize);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);

// Configure a middleware for 404s and the error handler
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
})
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
