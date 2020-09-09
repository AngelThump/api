'use strict'

module.exports.transcode = function(app) {
	return function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "missing authorization header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
        }

        if (req.body.transcode === null) {
            res.json({
                error: true,
                errorMsg: "no transcode option"
            })
            return;
        }

        if (!req.body.username) {
            res.json({
                error: true,
                errorMsg: "no user option"
            })
            return;
        }

        app.service('streams').find({
            query: { username: req.body.username }
        }).then(streams => {
            if(!streams.length > 0) {
                res.json({
                    error: true,
                    errorMsg: "stream not found"
                })
                return;
            }
            const stream = streams[0];
            app.service('streams').patch(stream._id, {
                transcoding: req.body.transcode
            }).then(() => {
                res.json({
                    error: false,
                    errorMsg: "",
                    successMsg: "YEP"
                })
            }).catch(e => {
                console.error(e);
                res.json({
                    error: true,
                    errorMsg: "something went wrong with the users service"
                })
            });
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with the users service"
            })
            return;
        });
	};
};

module.exports.transcodeReady = function(app) {
	return function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "missing authorization header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
        }

        if(!req.body.username) {
            res.json({
                error: true,
                errorMsg: "no username"
            })
            return;
        }

        if (req.body.ready === null) {
            res.json({
                error: true,
                errorMsg: "no ready option"
            })
            return;
        }

        app.service('streams').find({
            query: { username: req.body.username }
        }).then(streams => {
            if(!streams.length > 0) {
                res.json({
                    error: true,
                    errorMsg: "stream not found"
                })
                return;
            }
            const stream = streams[0];
            app.service('streams').patch(stream._id, {
                transcodeReady: req.body.ready
            }).then(() => {
                res.json({
                    error: false,
                    errorMsg: "",
                    successMsg: "YEP"
                })
            }).catch((e) => {
                res.json({
                    error: true,
                    errorMsg: "something went wrong with the streams service"
                })
            });
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with the streams service"
            })
            return;
        });


        app.service('transcodes').find({
            query: { username: req.body.username }
        }).then(streams => {
            if(!streams.length > 0) {
                return;
            }
            const stream = streams[0];
            app.service('transcodes').patch(stream._id, {
                transcodeReady: req.body.ready
            }).catch((e) => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
	};
};

module.exports.addInputs = function(app) {
	return function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "missing authorization header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
        }

        if(!req.body.stream) {
            res.json({
                error: true,
                errorMsg: "no stream"
            })
            return;
        }

        if (!req.body.inputs) {
            res.json({
                error: true,
                errorMsg: "no inputs"
            })
            return;
        }

        app.service('streams').find({
            query: { username: req.body.stream }
        }).then(streams => {
            if(!streams.length > 0) {
                res.json({
                    error: true,
                    errorMsg: "stream not found"
                })
                return;
            }
            const stream = streams[0];
            app.service('streams').patch(stream._id, {
                transcodeInputs: req.body.inputs
            }).then(() => {
                res.json({
                    error: false,
                    errorMsg: "",
                    successMsg: "INPUTS ADDED"
                })
            }).catch((e) => {
                res.json({
                    error: true,
                    errorMsg: "something went wrong with the streams service"
                })
            });
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with the streams service"
            })
            return;
        });


        app.service('transcodes').find({
            query: { username: req.body.username }
        }).then(streams => {
            if(!streams.length > 0) {
                return;
            }
            const stream = streams[0];
            app.service('transcodes').patch(stream._id, {
                inputs: req.body.inputs
            }).catch((e) => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
	};
};

module.exports.add = function(app) {
	return async function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "Missing Authorization Header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "Wrong Authorization Key"
            })
            return;
        }


        if(!req.body.username) {
            res.json({
                error: true,
                errorMsg: "Missing username param"
            })
            return;
        }

        if(!req.body.dropletId) {
            res.json({
                error: true,
                errorMsg: "Missing dropletid param"
            })
            return;
        }

        const {username, dropletId} = req.body;

        const streams =
        await app.service('streams')
        .find({
            query: {username: username}
        })
        .then(streams => {
            return streams;
        })
        .catch(e => {
            console.error(e);
        })

        app.service('transcodes')
        .create({
            username: username,
            dropletId: dropletId,
            ingest: {
                server: streams[0].ingest.server,
                url: `rtmp://${streams[0].ingest.server}.angelthump.com/live`
            }
        }).then(() => {
            res.json({
                error: false,
                errorMsg: ""
            })
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with transcodes service"
            })
            return;
        })
	};
};

module.exports.update = function(app) {
	return async function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "Missing Authorization Header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "Wrong Authorization Key"
            })
            return;
        }


        if(!req.body.username) {
            res.json({
                error: true,
                errorMsg: "Missing username param"
            })
            return;
        }

        if(!req.body.dropletId) {
            res.json({
                error: true,
                errorMsg: "Missing dropletid param"
            })
            return;
        }

        const {username, dropletId} = req.body;

        const transcode =
        await app.service('transcodes')
        .find({
            query: {username: username}
        }).then(transcodes => {
            return transcodes
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with transcodes service"
            })
            return;
        })

        if(!transcode) {
            res.json({
                error: true,
                errorMsg: "no transcode found"
            })
            return;
        }

        app.service('transcodes')
        .patch(transcode._id,{
            username: username,
            dropletId: dropletId
        }).then(() => {
            res.json({
                error: false,
                errorMsg: ""
            })
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with transcodes service"
            })
            return;
        })
	};
};

module.exports.remove = function(app) {
	return async function(req, res, next) {
        if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "Missing Authorization Header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const transcodeKey = app.get("transcodeKey");

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "Wrong Authorization Key"
            })
            return;
        }

        if(!req.body.dropletId) {
            res.json({
                error: true,
                errorMsg: "Missing dropletid param"
            })
            return;
        }

        const {dropletId} = req.body;

        const transcodes =
        await app.service('transcodes')
        .find({
            query: {dropletId: dropletId}
        }).then(transcodes => {
            return transcodes
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with transcodes service"
            })
            return;
        })

        if(transcodes.length === 0) {
            res.json({
                error: true,
                errorMsg: "no transcode found"
            })
            return;
        }

        app.service('transcodes')
        .remove(transcodes[0]._id)
        .then(() => {
            res.json({
                error: false,
                errorMsg: ""
            })
        }).catch(e => {
            console.error(e);
            res.json({
                error: true,
                errorMsg: "something went wrong with transcodes service"
            })
            return;
        })
	};
};