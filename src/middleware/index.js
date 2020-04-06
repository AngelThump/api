const api = require('./api');
const admin = require('./admin');
const transcode = require('./transcodeAPI');
//const redisClient = require('redis').createClient();
const ingest = require('./ingest');
const patreonWebhooks = require('./patreonWebhooks');
const cookieParser = require('cookie-parser');
const express = require('@feathersjs/express');
const { authenticate } = require('@feathersjs/express');
const droplet = require('./dropletAPI');
const userAPI = require('./userAPI');
//const apicache = require('apicache');
const streams = require('./streams');

module.exports = function (app) {
  //const limiter = require('express-limiter')(app, redisClient);
  //const redisAPICache = apicache.options({ redisClient: redisClient }).middleware;
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
  
  //v2 api change all to follow /v2 endpoint spec
  app.get('/v1', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ api.all(app));
  app.get('/v2/streams', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ /*redisAPICache('1 seconds'),*/ streams.all(app));
  app.get('/v1/:username', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ /*redisAPICache('5 seconds'),*/ api.user(app));
  //app.get('/v2/user/:username')
  app.post('/user/v1/title', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ cookieParser(), authenticate('jwt'), userAPI.title(app));
  app.post('/user/v2/password', userAPI.checkStreamPassword(app));
  //app.post('/v2/user/title')
  //app.post('/v2/user/password')

  app.get('/admin', admin(app));
  app.post('/admin/v1/ban', admin.ban(app));
  app.post('/admin/v1/unban', admin.unban(app));
  app.post('/admin/v1/drop', admin.drop(app));

  app.post('/transcode/v1', transcode(app));

  app.post('/droplet/v1', droplet(app));
  app.get('/droplet/v1', droplet.list(app))

  app.post('/v2/patreon/webhooks', patreonWebhooks(app));
  
  //app.get('v1/ingest', ingest(app)); // list of ingest servers
  app.post('/v2/ingest/stats', ingest.stats(app));
  app.post('/v2/ingest', ingest.stream(app));
  app.post('/v2/ingest/done', ingest.done(app));

  app.use(express.errorHandler({
    html: function(error, req, res, next) {
      res.render('errors.ejs', {code: error.code, message: error.message});
    }
  }));
};