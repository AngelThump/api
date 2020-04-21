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

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
        }

        if (req.body.transcode !== null) {
            res.json({
                error: true,
                errorMsg: "no transcode option"
            })
            return;
        }

        app.service('streams').find({
            query: { username: username }
        }).then(streams => {
            if(!streams.total > 0) {
                res.json({
                    error: true,
                    errorMsg: "stream not found"
                })
                return;
            }
            const stream = streams.data[0];
            app.service('streams').patch(stream._id, {
                transcode: req.body.transcode
            }).then(() => {
                res.json({
                    error: false,
                    errorMsg: "",
                    successMsg: "YEP"
                })
            }).catch((e) => {
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

        if (!transcodeKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
        }

        if (req.body.ready !== null) {
            res.json({
                error: true,
                errorMsg: "no ready option"
            })
            return;
        }

        app.service('users').find({
            query: { username: username }
        }).then(streams => {
            if(!streams.total > 0) {
                res.json({
                    error: true,
                    errorMsg: "stream not found"
                })
                return;
            }
            const stream = streams.data[0];
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

module.exports.add = function(app) {
	return function(req, res, next) {
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

        app.service('transcodes')
        .create({
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
            return transcodes.data
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

        const transcode =
        await app.service('transcodes')
        .find({
            query: {dropletId: dropletId}
        }).then(transcodes => {
            return transcodes.data
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
        .remove(transcode._id)
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