'use strict';

// HTTP request receives a number of arguments. 
// POST method is used with application/x-www-form-urlencoded MIME type. 
// The following arguments are passed to caller:

// call=play
// addr - client IP address
// clientid - nginx client id (displayed in log and stat)
// app - application name
// flashVer - client flash version
// swfUrl - client swf url
// tcUrl - tcUrl
// pageUrl - client page url
// name - stream name
// In addition to the above mentioned items all arguments passed explicitly 
// to play command are also sent with the callback. For example if stream 
// is accessed with the url rtmp://localhost/app/movie?a=100&b=face&foo=bar 
// then a, b & foo are also sent with callback.

process.on('unhandledRejection', function(reason, p){
  console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging here
});

const fetch = require('axios');

module.exports.stream = function(app) {
  return async function(req, res, next) {
    if(!req.body.name) {
      return res.status(400).json({
        "error": true,
        "errorMSG": "no name"
      });
    }

    const streamkey = req.body.name;
    
    console.log(req.body);

    /*
    const users = await app.service('users').find({
      query: { streamkey: streamkey }
    }).then(users => {
      return users
    }).catch(e => {
      console.error(e);
      return res.status(500).json({
        "error": true,
        "errorMSG": "something went terribly wrong in users service"
      })
    })

    if(users.total == 0) {
      return res.status(500).json({
        "error": true,
        "errorMSG": "no users found"
      });
    }

    const user = users[0];

    if(user.banned) {
      return res.status(403).json({
        "error": true,
        "errorMSG": "you are banned"
      });
    }

    if(!user.isVerified) {
      return res.status(403).json({
        "error": true,
        "errorMSG": "email not verified"
      });
    }

    const username = user.username;*/
    //res.redirect(username);
    /*
    app.service('streams').create({
      ingest: {
        server: req.query.server
      }
      ip_address: addr,
      transcoding: false,
      user: user
    })*/
    
  };
};

// post to mux api to start muxing
const mux = async(server, name, muxerApiKey) => {
  const postObject = await fetch(`http://muxer-api.angelthump.com:3030/v1/mux`, {
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
  const postObject = await fetch(`http://10.132.146.231:8080/admin`, {
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

//on_publish_done
module.exports.done = function(app) {
  return function(req, res, next) {
    if(!req.body.name) {
      return res.status(400).json({
        "error": true,
        "errorMSG": "no name"
      });
    }
    const streamkey = req.body.name;

    app.service('users').find({
      query: { streamkey: streamkey }
    })
    .then((users) => {
      if(users.total == 0) {
        return res.status(500).json({
          "error": true,
          "errorMSG": "no users found"
        });
      }

      const user = users.data[0];
      const username = user.username;
      doneMuxing(username, app.get('muxerApiKey'));
      updateLive(username, false, app.get('transcodeKey'));

  		let ingest = user.ingest;
      ingest.live = false;
      ingest.transcode = false;
      ingest.playerTranscodeReady = false;

      app.service('users').patch(user._id, {
        ingest: ingest,
        live: false,
        transcode: false,
        playerTranscodeReady: false
      }).then(() => {
        console.log(username + " is now not live");
      }).catch((e) => {
        console.error(e);
      });
    })
    .catch(() => res.status(403).send('Forbidden'));
  };
};

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

    await fetch(`https://${basicAuth}@${ingest}/stat`, {
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
  const postObject = await fetch(`http://10.132.4.25:3030/v1/mux/ingest`, {
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
  const postObject = await fetch(`http://muxer-api.angelthump.com:3030/v1/mux/done`, {
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