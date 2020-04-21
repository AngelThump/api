'use strict';

process.on('unhandledRejection', function(reason, p){
  console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging here
});

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
    
    app.service('streams').create({
      ingest: {
        server: req.query.server
      },
      userId: user.id,
      display_name: user.display_name,
      offline_image_url: user.offline_image_url,
      ip_address: req.body.addr,
      transcoding: false,
      type: "live",
      thumbnail_url: `https://thumbnail.angelthump.com/${username}.jpeg`,
      stream_key: stream_key,
      viewers: 0,
    }).then(() => {
      res.redirect(username);
      mux(`rtmp://${req.query.server}.angelthump.com/live`, username, app.get('muxerApiKey'));
      updateLive(username, true, app.get('transcodeKey'))
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
      stream_key: stream_key
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

    if(streams.total == 0) {
      return res.status(404).json({
        "error": true,
        errorMsg: "no users found"
      });
    }

    const stream = streams.data[0];

    await streamService
    .remove(stream._id)
    .catch(e => {
      console.error(e.message);
    })

    doneMuxing(username, app.get('muxerApiKey'))
    updateLive(username, false, app.get('transcodeKey'))

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
const mux = async(server, name, muxerApiKey) => {
  const postObject = await axios(`http://muxer-api.angelthump.com:3030/v1/mux`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muxerApiKey}`
    },
    body: JSON.stringify({
      tcurl: server,
      name: name
    })
  })
  .then((response) => {
      return response.json();
  })
  .then((data) => {
      return data;
  }).catch((e) => {
      console.error(e);
  })
  return postObject;
}

const updateLive = async (username, live, transcodeKey) => {
  const postObject = await axios(`http://10.132.146.231:8080/admin`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transcodeKey}`
    },
    body: JSON.stringify({
      action: 'live',
      username: username,
      live: live
    })
  })
  .then((response) => {
      return response.json();
  })
  .then((data) => {
      return data;
  }).catch((e) => {
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
  
    const basicAuth = app.get('muxerAuth');

    const server = await getServer(req.body.name, app.get('muxerApiKey'));
    if(!server) {
      return res.status(400).json({
          error: true,
          errorMsg: "no server object"
      })
    }
    if(server.error) {
      return res.status(404).json({
          error: true,
          errorMsg: "no server found"
      })
    }

    let ingest = server.ingest.substring(7, server.ingest.lastIndexOf('/'))

    await axios(`https://${basicAuth}@${ingest}/stat`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/xml'
      }
    })
    .then((response) => {
      return response.text();
    })
    .then((data) => {
      const parser = require('xml2json');

      const jsonResponse = parser.toJson(data, {
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
    }).catch((e) => {
      res.status(500).send("oopsie woopsie");
        console.error(e);
    })
  };
};

async function getServer(username, muxerApiKey) {
  const postObject = await axios(`http://10.132.4.25:3030/v1/mux/ingest`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muxerApiKey}`
    },
    body: JSON.stringify({
      name: username
    })
  }).then((response) => {
    return response.json();
  })
  .then((data) => {
    return data;
  }).catch((e) => {
    console.error(e);
  })
  return postObject;
}

const doneMuxing = async (name, muxerApiKey) => {
  const postObject = await axios(`http://muxer-api.angelthump.com:3030/v1/mux/done`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${muxerApiKey}`
      },
      body: JSON.stringify({name: name})
  })
  .then((response) => {
      return response.json();
  })
  .then((data) => {
      return data;
  }).catch((e) => {
      console.error(e);
  })
  return postObject;
}