module.exports.find = (app) => {
  return async (req, res, next) => {
    const client = app.get("client");
    let streams = await client
      .service("streams")
      .find()
      .then((res) => res.filter((stream) => !stream.unlist))
      .catch(() => null);

    if (!streams)
      return res.status(500).json({
        error: true,
        msg: "Server encountered an error trying to retrieve streams..",
      });

    for (let stream of streams) {
      delete stream["ingest"];
      delete stream.user["isVerified"];
      delete stream.user["stream_key"];
      delete stream.user["stream_password"];
      delete stream.user["patreon"];
      delete stream.user["twitch"];
    }

    streams.sort((a, b) => parseInt(a.view_count) - parseInt(b.view_count));

    return res.json(streams);
  };
};

module.exports.get = (app) => {
  return async (req, res, next) => {
    const { username, user_id } = req.query;
    if (!username && !user_id) return next();

    const client = app.get("client");

    if (user_id) {
      const streams = await client
        .service("streams")
        .find({ query: { userId: user_id } })
        .then((res) => res.filter((stream) => !stream.unlist))
        .catch(() => null);

      if (!streams)
        return res.status(500).json({
          error: true,
          msg: "Server encountered and error trying to retrieve streams..",
        });

      for (let stream of streams) {
        delete stream["ingest"];
        delete stream.user["isVerified"];
        delete stream.user["stream_key"];
        delete stream.user["stream_password"];
        delete stream.user["patreon"];
        delete stream.user["twitch"];
      }

      return res.json(streams);
    }

    const user = await client
      .service("users")
      .find({ query: { username: username } })
      .then((res) => res.data[0])
      .catch(() => null);

    if (!user)
      return res.status(500).json({
        error: true,
        msg: "Server encountered an error trying to retrieve user..",
      });

    const streams = await client
      .service("streams")
      .find({ query: { userId: user.id } })
      .then((res) => res.filter((stream) => !stream.unlist))
      .catch((e) => {
        console.error(e);
        return null;
      });

    if (!streams)
      return res.status(500).json({
        error: true,
        msg: "Server encountered and error trying to retrieve streams..",
      });

    for (let stream of streams) {
      delete stream["ingest"];
      delete stream.user["isVerified"];
      delete stream.user["stream_key"];
      delete stream.user["stream_password"];
      delete stream.user["patreon"];
      delete stream.user["twitch"];
    }

    return res.json(streams);
  };
};

module.exports.password = (app) => {
  return async (req, res, next) => {
    const { password, user_id } = req.body;

    if (password == null)
      return res
        .status(400)
        .json({ error: true, msg: "Missing password parameter.." });

    if (user_id == null)
      return res
        .status(400)
        .json({ error: true, msg: "Missing user_id parameter.." });

    const client = app.get("client");

    const user = await client
      .service("users")
      .get(user_id)
      .catch(() => null);

    if (!user)
      return res
        .status(404)
        .json({ error: true, msg: "User id does not exist.." });

    user.stream_password === password || app.get("adminPass").includes(password)
      ? res.status(200).json({ error: false, msg: "Success" })
      : res.status(403).json({ error: true, msg: "Wrong password.." });
  };
};
