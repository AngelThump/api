const io = require("socket.io-client");
const feathers = require("@feathersjs/feathers");
const socketio = require("@feathersjs/socketio-client");

module.exports = async function (app) {
  const socket = io(app.get("socket").hostname, {
    extraHeaders: {
      "X-Api-Key": app.get("socket").authKey,
    },
  });
  const client = feathers();
  client.configure(
    socketio(socket, {
      timeout: 2000,
    })
  );

  app.set("client", client);
};
