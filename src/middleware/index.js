const admin = require('./admin');
const transcodeAPI = require('./transcodeAPI');
//const redisClient = require('redis').createClient();
const ingestAPI = require('./ingestAPI');
const patreonWebhooks = require('./patreonWebhooks');
const express = require('@feathersjs/express');
const { authenticate } = require('@feathersjs/express');
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
    method: 'patch',
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

  app.post('/v2/transcode', transcodeAPI.transcode(app));
  app.patch('/v2/transcode/ready', transcodeAPI.transcodeReady(app));
  app.post('/v2/transcode/add', transcodeAPI.add(app));
  app.patch('/v2/transcode/update', transcodeAPI.update(app));
  app.delete('/v2/transcode/remove', transcodeAPI.remove(app));

  app.post('/v2/patreon/webhooks', patreonWebhooks(app));
  
  app.get('/v2/ingest', ingestAPI.list(app)); // list of ingest servers
  app.post('/v2/ingest/stats', ingestAPI.stats(app));
  app.post('/v2/ingest', ingestAPI.stream(app));
  app.post('/v2/ingest/done', ingestAPI.done(app));

};