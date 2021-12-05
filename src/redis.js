const { RateLimiterRedis } = require("rate-limiter-flexible");
const IoRedis = require("ioredis");
const apicache = require("apicache");

let ioRedisClient;

module.exports = async function (app) {
  const redisConf = app.get("redis");
  ioRedisClient = new IoRedis(
    redisConf.useSocket
      ? { enableOfflineQueue: false, path: redisConf.unix }
      : { enableOfflineQueue: false, host: redisConf.hostname }
  );

  const rateLimiter = new RateLimiterRedis({
    storeClient: ioRedisClient,
    keyPrefix: "middleware",
    points: 100,
    duration: 10,
  });

  app.set("rateLimiter", rateLimiter);
};

module.exports.cacheWithRedis = apicache.options({
  redisClient: ioRedisClient,
  defaultDuration: "60 seconds",
  statusCodes: {
    include: [200],
  },
}).middleware;
