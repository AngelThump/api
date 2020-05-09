const admin = require('./admin');
const transcodeAPI = require('./transcodeAPI');
const redisClient = require('redis').createClient();
const ingestAPI = require('./ingestAPI');
const { authenticate } = require('@feathersjs/express');
const userAPI = require('./userAPI');
const apicache = require('apicache');
const streamsAPI = require('./streamsAPI');

module.exports = function (app) {
  const limiter = require('express-limiter')(app, redisClient);
  const redisAPICache = apicache.options({ redisClient: redisClient }).middleware;

  limiter({
    path: '*',
    method: 'patch',
    lookup: 'headers.x-forwarded-for',
    total: 10,
    expire: 1000 * 30,
    onRateLimited: function (req, res, next) {
      res.status(429).json({message: 'Rate limited'})
    }
  });
  
  app.get('/v2/streams', limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}), redisAPICache('10 seconds'), streamsAPI.streams(app));
  app.get('/v2/streams/:username/ingest', limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}), streamsAPI.getIngest(app));
  app.get('/v2/streams/:username', limiter({lookup: 'headers.x-forwarded-for', total: 1000, expire: 30 * 1000}), redisAPICache('1 seconds'), streamsAPI.stream(app));
  
  app.patch('/v2/user/title', authenticate('jwt'), userAPI.patchTitle(app));
  app.patch('/v2/user/unlist', authenticate('jwt'), userAPI.patchUnlist(app));
  app.patch('/v2/user/password_protect', authenticate('jwt'), userAPI.patchPasswordProtect(app));
  app.patch('/v2/user/stream_password', authenticate('jwt'), userAPI.patchStreamPassword(app));
  app.post('/v2/user/stream_password', limiter({lookup: 'headers.x-forwarded-for', total: 5, expire: 5 * 1000}), userAPI.checkStreamPassword(app));

  app.post('/v2/admin/ban', limiter({lookup: 'headers.x-forwarded-for', total: 5, expire: 30 * 1000}), admin.ban(app));
  app.post('/v2/admin/unban', limiter({lookup: 'headers.x-forwarded-for', total: 5, expire: 30 * 1000}), admin.unban(app));
  app.post('/v2/admin/drop', limiter({lookup: 'headers.x-forwarded-for', total: 5, expire: 30 * 1000}), admin.drop(app));

  app.post('/v2/transcode', transcodeAPI.transcode(app));
  app.patch('/v2/transcode/ready', transcodeAPI.transcodeReady(app));
  app.post('/v2/transcode/add', transcodeAPI.add(app));
  app.patch('/v2/transcode/update', transcodeAPI.update(app));
  app.delete('/v2/transcode/remove', transcodeAPI.remove(app));
  
  app.get('/v2/ingest',  redisAPICache('1 minutes'), ingestAPI.list(app));
  app.get('/v2/ingests', redisAPICache('1 minutes'), ingestAPI.list(app));
  app.post('/v2/ingest/stats', ingestAPI.stats(app));
  app.post('/v2/ingest', limiter({total: 3, expire: 5000, lookup: 'body.addr'}), ingestAPI.stream(app));
  app.post('/v2/ingest/done', ingestAPI.done(app));

};