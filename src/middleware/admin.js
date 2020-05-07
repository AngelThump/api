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

    const ingestServer =
    await app.service('streams').find({
      query: { "username": requested_username}
    }).then(streams => {
      if(streams.total !== 0) {
        return streams[0].ingest.server;
      }
      return null;
    }).catch(error => {
      console.error(error);
    })

    /*
    if(!ingestServer) {
      return res.json({
        error: true,
        errorMSG: "Something went wrong with streams service"
      })
    }*/

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
        if(!ingestServer) {
          return res.json({
            error: false,
            errorMSG: ""
          })
        }
        await axios.get(`https://${app.get('muxerAuth')}@${ingestServer}.angelthump.com/control/drop/publisher?app=live&name=${requested_username}`)
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

        setTimeout(()=> {
          axios({
            method: "POST",
            url: 'https://viewer-api.angelthump.com/admin',
            headers: {
              authorization: `Bearer ${app.get(adminKey)}`
            },
            data: {
              action: 'reload',
              channel: channel
            }
          }).catch(e => {
            console.error(e.response.data);
          });
        }, 5000);

      }).catch((e) => {
        console.error(e);
        res.status(200).json({
          error: true,
          errorMSG: "Something went wrong trying to patch user"
        });
      });
    }).catch((e) => {
      console.error(e);
      res.status(200).json({
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

    const ingestServer =
    await app.service('streams').find({
      query: { "username": requested_username}
    }).then(streams => {
      return streams[0].ingest.server;
    }).catch(error => {
      console.error(error);
    })

    if(!ingestServer) {
      return res.json({
        error: true,
        errorMSG: "Something went wrong with streams service"
      })
    }

    await axios.get(`https://${app.get('muxerAuth')}@${ingestServer}.angelthump.com/control/drop/publisher?app=live&name=${requested_username}`)
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