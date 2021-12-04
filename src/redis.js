const { RateLimiterRedis } = require("rate-limiter-flexible");
const IoRedis = require("ioredis");

module.exports = async function (app) {
  const redisConf = app.get("redis"),
    redisClient = new IoRedis(
      redisConf.useSocket
        ? { enableOfflineQueue: false, path: redisConf.unix }
        : { enableOfflineQueue: false, host: redisConf.hostname }
    );

  app.set("redisClient", redisClient);

  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 100,
    duration: 10,
  });

  app.set("rateLimiter", rateLimiter);
};
