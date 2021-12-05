module.exports.find = (app) => {
  return async (req, res, next) => {
    const { username, user_id } = req.query;
    if (!username && !user_id)
      return res
        .status(400)
        .json({ error: true, msg: "Missing username or user_id in Query" });

    const client = app.get("client");

    let users;
    if (user_id) {
      const user_ids = user_id.split(",").slice(0, 50);

      users = await client
        .service("users")
        .find({
          query: {
            id: {
              $in: user_ids,
            },
          },
        })
        .then((res) => res.data)
        .catch(() => null);
    } else {
      const usernames = username.split(",").slice(0, 50);
      users = await client
        .service("users")
        .find({
          query: {
            username: {
              $in: usernames,
            },
          },
        })
        .then((res) => res.data)
        .catch(() => null);
    }

    if (!users)
      return res.status(500).json({
        error: true,
        msg: "Server encountered an error trying to retrieve users..",
      });

    for (let user of users) {
      delete user["isVerified"];
      delete user["stream_key"];
      delete user["stream_password"];
      if (user.patreon) {
        delete user.patreon["id"];
        delete user.patreon["access_token"];
        delete user.patreon["refresh_token"];
      }
      if (user.twitch) {
        delete user.twitch["id"];
        delete user.twitch["access_token"];
        delete user.twitch["refresh_token"];
      }
    }

    return res.json(users);
  };
};

module.exports.getUser = (app) => {
  return async (req, res, next) => {
    if (!req.headers["authorization"])
      return res.status(403).json({ error: true, msg: "Not Authorized" });

    const authHeader = req.headers.authorization.split(" ")[1];
    const client = app.get("authClient");

    if (!client.io.connected)
      res
        .status(500)
        .json({ error: true, msg: "Server encountered an error!" });

    const { user } = await client
      .authenticate({
        strategy: "jwt",
        accessToken: authHeader,
      })
      .then(async () => {
        return await client.get("authentication").catch((e) => {
          return null;
        });
      })
      .catch((e) => console.error(e));
    client.logout();
    req.user = user;
    next();
  };
};

module.exports.patch = (app) => {
  return async (req, res, next) => {
    const user = req.user,
      { title, nsfw, password_protect, unlist, stream_password } = req.body;

    if (
      title == null &&
      nsfw == null &&
      password_protect == null &&
      unlist == null &&
      stream_password == null
    )
      return res
        .status(400)
        .json({ error: true, msg: "Missing at least one parameter." });

    if (
      (title != null && typeof title != "string") ||
      (nsfw != null && typeof nsfw != "boolean") ||
      (password_protect != null && typeof password_protect != "boolean") ||
      (unlist != null && typeof unlist != "boolean") ||
      (stream_password != null && typeof stream_password != "string")
    )
      return res.status(400).json({
        error: true,
        msg: "At least one parameter is not the right type..",
      });

    if (
      user.patreon &&
      !user.patreon.isPatron &&
      user.patreon.tier < 2 &&
      (password_protect != null || unlist != null || stream_password != null)
    )
      return res
        .status(403)
        .json({ error: true, msg: "Not a patreon member." });

    const client = app.get("client");

    const error = await client
      .service("users")
      .patch(user.id, {
        title: title != null && title.length > 0 ? title : user.title,
        nsfw: nsfw != null ? nsfw : user.nsfw,
        password_protect:
          password_protect != null ? password_protect : user.password_protect,
        unlist: unlist != null ? unlist : user.unlist,
        stream_password:
          stream_password != null && stream_password.length > 0
            ? stream_password
            : user.stream_password,
      })
      .then(() => false)
      .catch(() => true);

    if (error)
      return res.status(500).json({
        error: true,
        msg: "Server ecountered an error trying to patch user..",
      });

    res.json({ error: false, msg: "Updated user!" });
  };
};

module.exports.v2PatchTitle = (app) => {
  return async (req, res, next) => {
    const user = req.user,
      { title } = req.body;

    if (title == null)
      return res
        .status(400)
        .json({ error: true, msg: "Missing title param.." });

    if (title != null && typeof title != "string")
      return res
        .status(400)
        .json({ error: true, msg: "Title's type is not a string.." });

    const client = app.get("client");

    const error = await client
      .service("users")
      .patch(user.id, {
        title: title,
      })
      .then(() => false)
      .catch(() => true);

    if (error)
      return res.status(500).json({
        error: true,
        msg: "Server ecountered an error trying to patch user..",
      });

    res.json({ error: false, msg: "Updated user!" });
  };
};
