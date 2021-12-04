const streams = require("./streams");
const users = require("./users");
const { limiter } = require("./rateLimit");
const apicache = require("apicache");

module.exports = function (app) {
  const cacheWithRedis = apicache.options({
    redisClient: app.get("redisClient"),
    defaultDuration: "60 seconds",
    statusCodes: {
      include: [200],
    },
  }).middleware;

  app.get(
    "/v3/streams",
    limiter(app),
    cacheWithRedis(),
    streams.get(app),
    streams.find(app)
  );
  app.post("/v3/streams/password", limiter(app), streams.password(app));

  app.get("/v3/users", limiter(app), cacheWithRedis(), users.find(app));
  app.patch("/v3/users", limiter(app), users.getUser(app), users.patch(app));
};
