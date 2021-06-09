'use strict';
const axios = require('axios');

module.exports.ban = function(app) {
  return async function(req, res, next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKey = app.get("adminKey");
    
    if (adminKey !== apiKey) {
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

    const stream =
    await app.service('streams').find({
      query: { "username": requested_username}
    }).then(streams => {
      return streams[0];
    }).catch(error => {
      console.error(error);
      return null;
    })

    app.service('users').find({
      query: { username: requested_username }
    }).then((users) => {
      if(!users.total > 0) {
        res.status(404).send("user not found");
        return;
      }
      const user = users.data[0];

      if(user.banned) {
        return res.status(400).send("user is already banned");
      }

      let bansObject = user.bans;
      if(!bansObject) {
        bansObject = []
      }

      bansObject.push({
        reason: reason,
        date: new Date().toISOString()
      })

      app.service('users').patch(user.id, {
        banned: true,
        bans: bansObject
      }).then(async () => {
        if(!stream) return;
        await axios.get(`https://${app.get('muxerAuth')}@${stream.ingest.server}.angelthump.com/control/drop/publisher?app=live&name=${requested_username}`)
        .catch(e => {
          console.error(e);
          return res.status(500).json({
            error: true,
            errorMSG: "something went wrong trying to drop user"
          });
        })

        /*
        setTimeout(()=> {
          axios({
            method: "POST",
            url: 'https://viewer-api.angelthump.com/admin',
            headers: {
              authorization: `Bearer ${app.get(adminKey)}`
            },
            data: {
              action: 'reload',
              channel: requested_username
            }
          }).catch(e => {
            console.error(e.response.data);
          });
        }, 5000);*/

      }).catch((e) => {
        console.error(e);
        res.status(500).json({
          error: true,
          errorMSG: "Something went wrong trying to patch user"
        });
      });
      res.status(200).json({
        error: false,
        errorMSG: ""
      });
    }).catch((e) => {
      console.error(e);
      res.status(404).json({
        error: true,
        errorMSG: "Something went wrong trying to find user"
      });
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
    const adminKey = app.get("adminKey");
    
    if (adminKey !== apiKey) {
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

      app.service('users').patch(user.id, {
        banned: false
      }).then(() => {
        return res.json({
          error: false,
          errorMSG: ""
        })
      }).catch((e) => {
        console.error(e);
        return res.json({
          error: true,
          errorMSG: "Something went wrong trying to patch user"
        })
      });
    }).catch((e) => {
      console.error(e);
      return res.json({
        error: true,
        errorMSG: "Something went wrong trying to find user"
      })
    });
  }
}

module.exports.drop = function(app) {
  return async function(req, res, next) {
    if(!req.headers['authorization']) {
      res.status(403).send('no key');
      return;
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const adminKey = app.get("adminKey");
    
    if (adminKey !== apiKey) {
      res.status(403).send('wrong key');
      return;
    }

    if(!req.body.username) {
      res.status(400).send('bad request');
      return;
    }

    const requested_username = req.body.username;

    const stream =
    await app.service('streams').find({
      query: { "username": requested_username}
    }).then(streams => {
      return streams[0];
    }).catch(error => {
      console.error(error);
      return null;
    })

    if(!stream) {
      return res.json({
        error: true,
        errorMSG: "Something went wrong with streams service"
      })
    }

    await axios.get(`https://${app.get('muxerAuth')}@${stream.ingest.server}.angelthump.com/control/drop/publisher?app=live&name=${requested_username}`)
    .then(() => {
      res.status(200).json({
        error: false,
        errorMSG: ""
      });
    }).catch(e => {
      console.error(e);
      return res.status(200).json({
        error: true,
        errorMSG: "something went wrong trying to drop user"
      });
    })
  }
}