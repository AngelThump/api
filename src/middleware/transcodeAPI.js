'use strict'

module.exports = function(app) {
	return function(req, res, next) {
        const transcodeKey = app.get("transcodeKey");
        
        if(req.headers['authorization']) {
            const apiKey = req.headers.authorization.split(' ')[1];
            if (transcodeKey.includes(apiKey)) {
                const action = req.body.action;
                if(action) {
                    if(action == "transcode") {
                        if(req.body.username) {
                            transcode(req.body.username);
                        } else {
                            res.status(400).send('missing username');
                        }
                    } else if (action == "ready") {
                        if(req.body.username) {
                            transcodeReady(req.body.username);
                        } else {
                            res.status(400).send('missing username');
                        }
                    }
                } else {
                    res.status(400).send('missing action');
                }
            } else {
                res.status(403).send('wrong key');
            }
        } else {
            res.status(403).send('no key');
        }


        function transcode(username) {
            app.service('users').find({
                query: { username: username }
            }).then((users) => {
                if (users.total > 0) {
                    const user = users.data[0];
                    app.service('users').patch(user._id, {
                        transcode: req.body.transcode
                    }).then(() => {
                        res.status(200).send(user.username + ": " + req.body.transcode);
                    }).catch((e) => {
                        res.status(500).send(e);
                    });
                } else {
                    res.status(404).send("Can't find user");
                }
            });
        }

        function transcodeReady(username) {
            app.service('users').find({
                query: { username: username }
            }).then((users) => {
                if (users.total > 0) {
                    const user = users.data[0];
                    app.service('users').patch(user._id, {
                        playerTranscodeReady: req.body.ready
                    }).then(() => {
                        res.status(200).send(user.username + ": player ready");
                    }).catch((e) => {
                        res.status(500).send(e);
                    });
                } else {
                    res.status(404).send("Can't find user");
                }
            });
        }
	};
};