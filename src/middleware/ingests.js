const axios = require("axios");

module.exports.get = function (app) {
  return async function (req, res, next) {
    const data = await axios({
      method: "get",
      headers: {
        "x-api-key": app.get("socket").authKey,
      },
      url: `${app.get("socket").hostname}/v3/ingest`,
    })
      .then((response) => response.data)
      .catch(() => null);

    if (!data)
      return res.status(500).json({
        error: true,
        msg: "Server encountered an error trying to retrieve ingests.",
      });

    res.json(data);
  };
};
