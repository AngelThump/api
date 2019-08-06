'use strict';
const request = require('request');

module.exports = function(app) {
  return function(req, res, next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKeys = app.get("adminKeys");
    if (!adminKeys.includes(apiKey)) {
      res.status(403).send('wrong key');
      return;
    }

    const action = req.body.action;
  };
};

module.exports.ban = function(app) {
  return function(req, res, next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKeys = app.get("adminKeys");
    
    if (!adminKeys.includes(apiKey)) {
      res.status(403).send('wrong key');
      return;
    }

    if(!req.body.username) {
      res.status(400).send('no username');
      return;
    }

    if(!req.body.reason) {
      res.status(400).send('no reason');
      return;
    }

    const requested_username = req.body.username;
    const reason = req.body.reason;

    app.service('users').find({
        query: { username: requested_username }
    }).then((users) => {
      if(!(users.total > 0)) {
        res.status(404).send("user not found");
        return;
      }
      const user = users.data[0];

      if(user.banned) {
        res.status(400).send("user is already banned");
        return;
      }

      let bansObject = user.bans;
      if(!bansObject) {
        bansObject = []
      }

      bansObject.push({
        reason: reason,
        date: new Date().toISOString()
      })

      app.service('users').patch(user._id, {
        banned: true,
        bans: bansObject
      }).then(() => {
        request('https://' + user.ingest.server + 'angelthump.com/control/drop/publisher?app=live&name=' + requested_username);
        /*
        const servers = app.get("ingestServers");
        for(let server of servers) {
          request('https://' + server + '-ingest.angelthump.com/control/drop/publisher?app=live&name=' + requested_username);
        }*/

        setTimeout(()=> {
          request.post({
            url: 'https://10.132.146.231/admin',
            insecure: true,
            rejectUnauthorized: false,
            headers: {
              'Authorization': 'Bearer ' + apiKey
            },
            json: {
              username: requested_username,
              action: 'reload'
            }
          });
        }, 5000);
        
        res.status(200).send(requested_username + " is now banned!");
      }).catch((e) => {
        console.error(e);
      });
    }).catch((e) => {
      console.error(e);
    });
  }
}

module.exports.unban = function(app) {
  return function(req,res,next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKeys = app.get("adminKeys");
    
    if (!adminKeys.includes(apiKey)) {
      res.status(403).send('wrong key');
      return;
    }

    const requested_username = req.body.username;
    app.service('users').find({
      query: { username: requested_username }
    }).then((users) => {
      if(!(users.total > 0)) {
        res.status(404).send("user not found");
        return;
      }
      const user = users.data[0];

      if(!user.banned) {
        res.status(400).send("user is already not banned");
        return;
      }

      app.service('users').patch(user._id, {
        banned: false
      }).then(() => {
        res.status(200).send(requested_username + " is now unbanned!");
      }).catch((e) => {
        console.error(e);
      });
    }).catch((e) => {
      console.error(e);
    });
  }
}

module.exports.drop = function(app) {
  return function(req, res, next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKeys = app.get("adminKeys");
    
    if (!adminKeys.includes(apiKey)) {
      res.status(403).send('wrong key');
      return;
    }

    if(!req.body.username) {
      res.status(400).send('bad request');
      return;
    }

    const requested_username = req.body.username;

    app.service('users').find({
      query: { username: requested_username }
    }).then((users) => {
      if(!(users.total > 0)) {
        res.status(404).send("user not found");
        return;
      }

      request('https://' + user.ingest.server + 'angelthump.com/control/drop/publisher?app=live&name=' + requested_username);
      res.status(200).send(requested_username + " has been dropped!");
    }).catch((e) => {
      console.error(e);
    });
    /*
    const servers = app.get("ingestServers");
    for(let server of servers) {
      request('https://' + server + '-ingest.angelthump.com/control/drop/publisher?app=live&name=' + requested_username);
    }

    res.status(200).send(requested_username + " has been dropped!");*/
  }
}