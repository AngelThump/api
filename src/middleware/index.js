const streams = require("./streams");
const users = require("./users");
const ingests = require("./ingests");
const { limiter } = require("./rateLimit");
const { cacheWithRedis } = require("../redis");

module.exports = function (app) {
  app.get("/v2/streams", limiter(app), cacheWithRedis(), streams.find(app));
  app.get(
    "/v2/streams/:username",
    limiter(app),
    cacheWithRedis(),
    streams.v2Get(app)
  );
  app.get(
    "/v3/streams",
    limiter(app),
    cacheWithRedis(),
    streams.get(app),
    streams.find(app)
  );
  app.post("/v3/streams/password", limiter(app), streams.password(app));

  app.patch(
    "/v2/user/title",
    limiter(app),
    users.getUser(app),
    users.v2PatchTitle(app)
  );
  app.get("/v3/users", limiter(app), cacheWithRedis(), users.find(app));
  app.patch("/v3/users", limiter(app), users.getUser(app), users.patch(app));

  app.get("/v3/ingests", limiter(app), cacheWithRedis(), ingests.get(app));
};
