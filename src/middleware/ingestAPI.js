'use strict';

const axios = require('axios');

module.exports.list = function(app) {
  return async function(req, res, next) {

    axios.get(`https://api.digitalocean.com/v2/droplets?tag_name=ingest`, {
      headers: {
        authorization: `Bearer ${app.get('doAPIKey')}`
      }
    }).then(response => {
      let ingestServers=[];
      for(let server of response.data.droplets) {
        const json = {
          name: server.name,
          rtmpUrl: `rtmp://${server.name}.angelthump.com:1935/live`,
          location: server.region.name
        }
        ingestServers.push(json);
      }
      res.json({
        ingestServers: ingestServers,
        total: response.data.meta.total
      })
    }).catch(e => {
      console.error(e);
      return res.json({
        error: true,
        errorMsg: "something went wrong"
      })
    })
  };
};

module.exports.stream = function(app) {
  return async function(req, res, next) {
    if(!req.body.name) {
      return res.status(400).json({
        "error": true,
        errorMsg: "no name"
      });
    }

    const stream_key = req.body.name;

    const users = await app.service('users').find({
      query: { stream_key: stream_key }
    }).then(users => {
      return users;
    }).catch(e => {
      console.error(e.message);
      return null;
    })

    if(!users) {
      return res.status(500).json({
        "error": true,
        errorMsg: "something went terribly wrong in users service"
      });
    }

    if(users.total == 0) {
      return res.status(404).json({
        "error": true,
        errorMsg: "no users found"
      });
    }

    const user = users.data[0];

    if(user.banned) {
      return res.status(403).json({
        "error": true,
        errorMsg: "you are banned"
      });
    }

    if(!user.isVerified) {
      return res.status(403).json({
        "error": true,
        errorMsg: "email not verified"
      });
    }

    const username = user.username;

    let userObject = {
			id: user.id,
			username: user.username,
			display_name: user.display_name,
			offline_banner_url: user.offline_banner_url,
			profile_logo_url: user.profile_logo_url,
			title: user.title,
			angel: user.angel,
			nsfw: user.nsfw,
			banned: user.banned,
			password_protect: user.password_protect,
		}

    if(user.patreon) {
      userObject.patreon = {
        isPatron: user.patreon.isPatron,
        tier: user.patreon.tier
      }
    }

    if(user.twitch) {
      userObject.twitch = {
        channel: user.twitch.channel
      }
    }

    res.redirect(username);
    console.log(`${username} is now live`)
    
    await app.service('streams').create({
      ingest: {
        server: req.query.server,
        url: `rtmp://${req.query.server}.angelthump.com/live`
      },
      userId: user.id,
      username: user.username,
      transcoding: false,
      type: "live",
      thumbnail_url: `https://thumbnail.angelthump.com/thumbnails/${username}.jpeg`,
      stream_key: stream_key,
      viewer_count: 0,
      user: userObject
    }).then(async () => {
      await mux(`rtmp://${req.query.server}.angelthump.com/live`, req.query.server, username, app.get('muxerApiKey'));
      await updateLive(username, true, app.get('adminKey'))
    }).catch(e => {
      console.error(e.message);
      return res.status(500).json({
        "error": true,
        errorMsg: "something went terribly wrong in streams service"
      });
    })
  };
};

//on_publish_done
module.exports.done = function(app) {
  return async function(req, res, next) {
    if(!req.body.name) {
      return res.status(400).json({
        "error": true,
        errorMsg: "no name"
      });
    }
    const stream_key = req.body.name;

    const streamService = app.service('streams');

    const streams = await streamService.find({
      query: { stream_key: stream_key }
    })
    .then(streams => {
      return streams
    }).catch(e => {
      console.error(e.message);
      return null;
    })

    if(!streams) {
      return res.status(500).json({
        "error": true,
        errorMsg: "something went terribly wrong in streams service"
      });
    }

    if(streams.length == 0) {
      return res.status(404).json({
        "error": true,
        errorMsg: "no users found"
      });
    }

    const stream = streams[0];

    await streamService
    .remove(stream._id)
    .catch(e => {
      console.error(e.message);
    })

    console.log(`${stream.username} is now not live`)
    await doneMuxing(stream.username, app.get('muxerApiKey'))
    await updateLive(stream.username, false, app.get('adminKey'))

    /*
    const metadata = app.service('metadata')
    .get(stream._id)
    .then(data => {
      return data;
    })
    .catch(e => {
      console.error(e.message)
      return null;
    })

    if(!metadata) {
      res.status(500).json({
        "error": false,
        errorMsg: "Something went wrong with the metadata service"
      });
    }

    app.service('pastStreams')
    .create({
      id: stream._id,
      user_id: stream.user.id,
      average_viewer_count: metadata.average_viewer_count,
      max_viewer_count: metadata.max_viewer_count,
      viewer_count: stream.viewer_count,
      duration: (new Date().getTime() - new Date(stream.createdAt).getTime())/1000/60/60
    })*/

    return res.status(200).json({
      "error": false,
      errorMsg: ""
    });
  };
};

// post to mux api to start muxing
const mux = async(url, server, name, muxerApiKey) => {
  const postObject = await axios({
    url: `https://muxer-api.angelthump.com/v2/mux`,
    method: "POST",
    headers: {
      authorization: `Bearer ${muxerApiKey}`
    },
    data: {
      serverUrl: url,
      server: server,
      name: name
    }
  })
  .then(data => {
    return data;
  }).catch(e => {
    console.error(e);
  })
  return postObject;
}

const updateLive = async (channel, live, adminKey) => {
  const postObject = await axios({
    method: "POST",
    url: `https://viewer-api.angelthump.com/admin`,
    headers: {
      authorization: `Bearer ${adminKey}`
    },
    data: {
      action: 'live',
      channel: channel,
      live: live
    }
  })
  .then(data => {
      return data;
  }).catch(e => {
      console.error(e);
  })
  return postObject;
}

module.exports.stats = function(app) {
  return async function(req, res, next) {
    if(!req.headers['authorization']) {
      return res.status(401).json({
        error: true,
        errorMsg: 'no key'
      });
    }

    const apiKey = req.headers.authorization.split(' ')[1];
    const transcodeKey = app.get('transcodeKey');

    if (transcodeKey != apiKey) {
      return res.status(403).json({
        error: true,
        errorMsg: 'wrong key'
      });
    }

    if (!req.body.name) {
      return res.status(401).json({
        error: true,
        errorMsg: 'no name'
      });
    }

    if(!req.body.server) {
      return res.status(400).json({
        error: true,
        errorMsg: "no server"
      })
    }
  
    const basicAuth = app.get('muxerAuth');

    await axios({
      method: "GET",
      url: `https://${basicAuth}@${req.body.server}.angelthump.com/stat`,
      headers: {
        'Content-Type': 'text/xml'
      }
    })
    .then(response => {
      const parser = require('xml2json');

      const jsonResponse = parser.toJson(response.data, {
        object: true,
        reversible: false,
        coerce: false,
        sanitize: true,
        trim: false,
        arrayNotation: false,
        alternateTextNode: false
      });
      //Get stats that are needed
      const streamsObject = jsonResponse.rtmp.server.application.live.stream;

      if(streamsObject) {
        let stats;
        if(Array.isArray(streamsObject)) {
          for(let stream of streamsObject) {
            if(stream.name.toUpperCase() === req.body.name.toUpperCase()) {
              stats = stream.meta;
              return res.json(stats);
            }
          }
        } else {
          if(streamsObject.name.toUpperCase() === req.body.name.toUpperCase()) {
            stats = streamsObject.meta;
            return res.json(stats);
          }
        }
      }

      //stream not found
      return res.status(404).json({
        error: true,
        errorMsg: "no stats found"
      })
    }).catch(e => {
      res.status(500).send("oopsie woopsie");
        console.error(e);
    })
  };
};

const doneMuxing = async (name, muxerApiKey) => {
  const postObject = await axios({
    method:"DELETE",
    url: `https://muxer-api.angelthump.com/v2/mux/done`,
    headers: {
      authorization: `Bearer ${muxerApiKey}`
    },
    data: {name: name}
  })
  .then(data => {
    return data;
  }).catch(e => {
    console.error(e);
  })
  return postObject;
}