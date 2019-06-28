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

const request = require('request-promise');

module.exports.stream = function(app) {
  return function(req, res, next) {
    const streamkey = req.body.name;

    //console.log('initial hit to:', req.originalUrl);
    app.service('users').find({
      query: { streamkey: streamkey }
    })
    // Then we're good to stream
    .then((users) => {
  		if (users.total > 0) {
        const user = users.data[0];
        if(!user.banned && user.isVerified) {
            const username = user.username;
            res.redirect(username);

            let ingest = user.ingest;

            if(!ingest) {
              ingest = {
                server: "",
                live: false,
                streamCreatedAt: "",
                streamUpdatedAt: "",
                transcode: false,
                playerTranscodeReady: false
              }
            }

            let ingestServer = req.body.tcurl;
            ingest.server = ingestServer.substring(ingestServer.indexOf("rtmp://") + 7, ingestServer.indexOf(":1935"));
            ingest.live = true;
            ingest.streamCreatedAt = new Date().toISOString();

            app.service('users').patch(user._id, {
              ingest: ingest,
              live: true
            }).then(() => {
              console.log(username + " is now live");
            }).catch((e) => {
              console.error(e);
            });

            request({
              url: 'https://10.132.146.231/admin',
							insecure: true,
							rejectUnauthorized: false,
              method: 'POST',
              auth: {
                'bearer': app.get('transcodeKey')
              },
              body: {
                'action': 'live',
                'username': username,
                'live': true
              },
              json: true
            }).catch((e) => {
              console.error(e);
            });;

        } else {
            res.status(403).send('You are banned or your email is not verified!');
        }
  		} else {
  			res.status(404).send('No user with that streamkey');
  		}
    })
    // On errors, just call our error middleware
    .catch(() => res.status(403).send('Forbidden'));
  };
};

//on_publish_done
module.exports.done = function(app) {
  return function(req, res, next) {
    const streamkey = req.body.name;

    app.service('users').find({
      query: { streamkey: streamkey }
    })
    .then((users) => {
  		if (users.total > 0) {
        const user = users.data[0];
        const username = user.username;

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

        request({
          url: 'https://10.132.146.231/admin',
          method: 'POST',
          insecure: true,
					rejectUnauthorized: false,
          auth: {
              'bearer': app.get('transcodeKey')
          },
          body: {
            'action': 'live',
            'username': username,
            'live': false
          },
          json: true
        }).catch((e) => {
          console.error(e);
        });

  		}
    })
    .catch(() => res.status(403).send('Forbidden'));
  };
};

module.exports.update = function(app) {
  return function(req, res, next) {
    const streamkey = req.body.name;

    app.service('users').find({
      query: { streamkey: streamkey }
    })
    .then((users) => {
  		if (users.total > 0) {
        const user = users.data[0];
        const username = user.username;

        let ingest = user.ingest;
        ingest.streamUpdatedAt = new Date().toISOString();

        app.service('users').patch(user._id, {
          ingest: ingest
        }).then(() => {
          console.log(username + " updated!");
        }).catch((e) => {
          console.error(e);
        });
  		}
    })
    .catch(() => res.status(403).send('Forbidden'));
  };
};

module.exports.stats = function(app) {
  return function(req, res, next) {
    const transcodeKey = app.get("transcodeKey");
        
    if(req.headers['authorization']) {
      const key = req.headers.authorization.split(' ')[1];
      if (transcodeKey.includes(key)) {
        const rp = require('request-promise');
        const basicAuth = app.get('muxerAuth');
        rp({
          url:"http://" + basicAuth + "@10.132.83.160:8080/stat",
          headers: {
            'Content-Type': 'text/xml'
          }
        })
        .then((response) => {
          const parser = require('xml2json');
          var options = {
              object: true,
              reversible: false,
              coerce: false,
              sanitize: true,
              trim: false,
              arrayNotation: false,
              alternateTextNode: false
          };
          var jsonResponse = parser.toJson(response, options);
          //Get stats that are needed
          res.json(newJson(jsonResponse));
        }).catch(error => {
          res.status(500).send("oopsie woopsie");
          console.error(error);
        })
      } else {
        res.status(403).send('wrong key');
      }
    } else {
      res.status(403).send('no key');
    }
  };
};

//returns json of current streamers and their metadata
function newJson(json) {
  var newJson;
  const applications = json.rtmp.server.application;
  var indexToUse;
  for(var i = 0; i<applications.length; i++) {
    if(applications[i].name == 'hls') {
      indexToUse = i;
    }
  }
  const streams = applications[indexToUse].live.stream;

  newJson = {
    streams: streams
  };
  return newJson;
}