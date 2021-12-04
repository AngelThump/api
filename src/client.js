const io = require("socket.io-client");
const feathers = require("@feathersjs/feathers");
const socketio = require("@feathersjs/socketio-client");
const auth = require("@feathersjs/authentication-client");

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

  const authSocket = io(app.get("sso").hostname);

  const authClient = feathers();
  authClient.configure(
    socketio(authSocket, {
      timeout: 2000,
    })
  );
  authClient.configure(auth());

  app.set("authClient", authClient);
};
