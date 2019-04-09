const api = require('./api');
const admin = require('./admin');
const transcode = require('./transcodeAPI');
const patreon = require('./patreonAPI');
const client = require('redis').createClient();
const ingest = require('./ingest');
const patreonWebhooks = require('./patreonWebhooks');
const cookieParser = require('cookie-parser');
const { authenticate } = require('@feathersjs/authentication').express;
const express = require('@feathersjs/express');
const droplet = require('./dropletAPI');
const userAPI = require('./userAPI');
const edge = require('./edgeAPI');

module.exports = function (app) {
  const limiter = require('express-limiter')(app, client);
  /*
  limiter({
    path: '*',
    method: 'post',
    lookup: 'headers.x-forwarded-for',
    total: 10,
    expire: 1000 * 30,
    onRateLimited: function (req, res, next) {
      next({ message: 'Rate limit exceeded', code: 429 })
    }
  });*/
  app.set('view engine', 'ejs');
  app.set('views', 'public');
  
  app.get('/v1', limiter({lookup: 'headers.x-forwarded-for', total: 300, expire: 60 * 1000}), api.all(app));
  app.get('/v1/:username', limiter({lookup: 'headers.x-forwarded-for', total: 300, expire: 60 * 1000}), api.user(app));
  app.post('/user/v1/title', limiter({lookup: 'headers.x-forwarded-for', total: 10, expire: 30 * 1000}), cookieParser(), authenticate('jwt'), userAPI.title(app));
  app.post('/user/v2/password', userAPI.checkStreamPassword(app));

  app.get('/edges/v1', edge.list(app));
  app.post('/edges/v1/add', edge.add(app));
  app.post('/edges/v1/delete', edge.delete(app));

  app.get('/admin', admin(app));
  app.post('/admin/v1/ban', admin.ban(app));
  app.post('/admin/v1/unban', admin.unban(app));
  app.post('/admin/v1/drop', admin.drop(app));

  app.post('/transcode/v1', transcode(app));

  app.post('/droplet/v1', droplet(app));
  app.get('/droplet/v1', droplet.list(app))

  app.post('/patreon/v1', limiter({lookup: 'headers.x-forwarded-for', total: 5, expire: 60 * 1000}), patreon(app));
  app.post('/patreon/webhooks/v1', patreonWebhooks(app));
  app.get('/patreon/oauth/redirect', patreon(app), cookieParser(), authenticate('jwt'), patreon.verify(app));
  
  app.get('/ingest/v1/stats', ingest.stats(app));
  //app.get('/ingest/v1', ingest(app)); // list of ingest servers
  app.post('/ingest/v1/live', ingest.stream(app));
  app.post('/ingest/v1/done', ingest.done(app));
  //app.post('/ingest/v1/update', ingest.update(app));

  app.use(express.errorHandler({
    html: function(error, req, res, next) {
      res.render('errors.ejs', {code: error.code, message: error.message});
    }
  }));
};