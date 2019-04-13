'use strict';
const request = require('request');

module.exports = function(app) {
    return function(req, res, next) {
      if(req.headers['authorization']) {
        const apiKey = req.headers.authorization.split(' ')[1];
        const adminKeys = app.get("adminKeys");
        if (adminKeys.includes(apiKey)) {
          const action = req.body.action;
        } else {
          res.status(403).send('wrong key');
        }
      } else {
        res.status(403).send('no key');
      }
    };
  };

module.exports.ban = function(app) {
  return function(req, res, next) {
    if(req.headers['authorization']) {
      const apiKey = req.headers.authorization.split(' ')[1];
      const adminKeys = app.get("adminKeys");
      if (adminKeys.includes(apiKey)) {
        const requested_username = req.body.username;
        app.service('users').find({
            query: { username: requested_username }
        })
        .then((users) => {
          if(users.total > 0) {
            const user = users.data[0];
            if(!user.banned) {
              app.service('users').patch(user._id, {
                banned: true
              }).then(() => {
                request('https://' + user.ingestServer + '/control/drop/publisher?app=live&name=' + requested_username);
                res.status(200).send(requested_username + " is now banned!");
              }).catch((e) => {
                console.error(e);
              });;
            } else {
              res.status(400).send("user is already banned");
            }
          } else {
            res.status(404).send("user not found");
          }
        }).catch((e) => {
          console.error(e);
        });
        request.post({
          url: 'http://10.132.146.231/admin',
          headers: {
            'Authorization': 'Bearer ' + apiKey
          },
          json: {
            username: requested_username,
            action: 'reload'
          }
        });
      } else {
        res.status(403).send('wrong key');
      }
    } else {
      res.status(403).send('no key');
    }
  }
}

module.exports.unban = function(app) {
  return function(req,res,next) {
    if(req.headers['authorization']) {
      const apiKey = req.headers.authorization.split(' ')[1];
      const adminKeys = app.get("adminKeys");
      if (adminKeys.includes(apiKey)) {
        const requested_username = req.body.username;
        app.service('users').find({
          query: { username: requested_username }
        })
        .then((users) => {
          if(users.total > 0) {
            const user = users.data[0];
            if(user.banned) {
              app.service('users').patch(user._id, {
                banned: false
              }).then(() => {
                res.status(200).send(requested_username + " is now unbanned!");
              }).catch((e) => {
                console.error(e);
              });
            } else {
              res.status(400).send("user is already not banned");
            }
          } else {
              res.status(404).send("user not found");
          }
        }).catch((e) => {
          console.error(e);
        });
      } else {
        res.status(403).send('wrong key');
      }
    } else {
      res.status(403).send('no key');
    }
  }
}

module.exports.drop = function(app) {
  return function(req, res, next) {
    if(req.headers['authorization']) {
      const apiKey = req.headers.authorization.split(' ')[1];
      const adminKeys = app.get("adminKeys");
      if (adminKeys.includes(apiKey)) {
        const requested_username = req.body.username;
        app.service('users').find({
            query: { username: requested_username }
        })
        .then((users) => {
          if(users.total > 0) {
            const user = users.data[0];
              request('https://' + user.ingestServer + '/control/drop/publisher?app=live&name=' + requested_username);
              res.status(200).send(requested_username + " has been dropped!");
          } else {
            res.status(404).send("user not found");
          }
        }).catch((e) => {
          console.error(e);
        });
      } else {
        res.status(403).send('wrong key');
      }
    } else {
      res.status(403).send('no key');
    }
  }
}