const admin = require('./admin');
const transcode = require('./transcodeAPI');
//const redisClient = require('redis').createClient();
const ingest = require('./ingest');
const patreonWebhooks = require('./patreonWebhooks');
const express = require('@feathersjs/express');
const { authenticate } = require('@feathersjs/express');
const droplet = require('./dropletAPI');
const userAPI = require('./userAPI');
//const apicache = require('apicache');
const streamsAPI = require('./streamsAPI');

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

  /*
  limiter({
    path: '*',
    method: 'put',
    lookup: 'headers.x-forwarded-for',
    total: 10,
    expire: 1000 * 30,
    onRateLimited: function (req, res, next) {
      next({ message: 'Rate limit exceeded', code: 429 })
    }
  });*/


  app.set('view engine', 'ejs');
  app.set('views', 'public');
  
  app.get('/v2/streams', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ /*redisAPICache('1 seconds'),*/ streamsAPI.streams(app));
  app.get('/v2/stream/:username', /*limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}),*/ /*redisAPICache('1 seconds'),*/ streamsAPI.stream(app));
  
  app.patch('/v2/user/title', authenticate('jwt'), userAPI.patchTitle(app));
  app.patch('/v2/user/stream_password', authenticate('jwt'), userAPI.patchStreamPassword(app));
  app.post('/v2/user/stream_password', userAPI.checkStreamPassword(app));

  app.post('/v2/admin/ban', admin.ban(app));
  app.post('/v2/admin/unban', admin.unban(app));
  app.post('/v2/admin/drop', admin.drop(app));

  app.post('/transcode/v1', transcode(app));

  app.post('/droplet/v1', droplet(app));
  app.get('/droplet/v1', droplet.list(app))

  app.post('/v2/patreon/webhooks', patreonWebhooks(app));
  
  app.get('/v2/ingest', ingest.list(app)); // list of ingest servers
  app.post('/v2/ingest/stats', ingest.stats(app));
  app.post('/v2/ingest', ingest.stream(app));
  app.post('/v2/ingest/done', ingest.done(app));

  app.use(express.errorHandler({
    html: function(error, req, res, next) {
      res.render('errors.ejs', {code: error.code, message: error.message});
    }
  }));
};