const axios = require('axios');

module.exports.streams = function(app) {
	return async function(req, res, next) {
		const streams =
		await app.service('streams').find({
			query: { type: "live" },
			paginate: false,
			sort: {
				viewers: -1
			}
		}).then(streams => {
			return streams;
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMsg: "Something went wrong while retrieving streams"});
		});

		if(streams.total === 0) {
			return res.json([]);
		}

		res.set('X-Total-Count', streams.total);

		return res.json(streams);
	};
};

module.exports.stream = function(app) {
	return async function(req, res, next) {
		const requested_username = req.params.username.toLowerCase();

		const streams =
		await app.service('streams').find({
			query: { 'username': requested_username }
		}).then(streams => {
			return streams;
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMsg: "Something went wrong while retrieving streams"});
		});

		if(streams.total === 0) {
			return res.json({error: true, errorMsg: "No stream exists"});
		}

		const stream = streams.data[0];

		//get viewer count

		const viewers =
		await axios.get(`https://viewer-api.angelthump.com:3031/viewers/${requested_username}`, {
			headers: {
				authorization: `Bearer ${app.get('viewerApiKey')}`
			}
		}).then(response => {
			return response.data.viewers;
		}).catch(e => {
			console.error(e);
			res.json({
				error: true,
				errorMsg: "Something went wrong with viewer api"
			})
		})

		app.service('streams')
		.patch(stream._id, {
			viewer_count: viewers
		})
		.then(stream => {
			res.json(stream);
		})
		.catch(e => {
			console.error(e);
			res.json({
				error: true,
				errorMsg: "Something went wrong with patching viewers in the streams service"
			})
		})
	};
};

module.exports.patchViewerCount = function(app) {
	return async function(req, res, next) {
		if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "missing authorization header"
            })
            return;
		}
		
		const apiKey = req.headers.authorization.split(' ')[1];

        if (!muxerApiKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
		}

		if (!req.body.username) {
            res.json({
                error: true,
                errorMsg: "no username"
            })
            return;
        }
		
		if (!req.body.viewers) {
            res.json({
                error: true,
                errorMsg: "no view count"
            })
            return;
        }

		const streams =
		await app.service('streams').find({
			query: { 'user.username': requested_username }
		}).then(stream => {
			return stream;
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMsg: "Something went wrong while retrieving streams"});
		});

		if(streams.total === 0) {
			return res.json({error: true, errorMsg: "No stream exists"});
		}

		const stream = streams.data[0]

		await app.service('streams').patch(stream._id, {
			viewers: req.body.viewers
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMsg: "Something went wrong while patching stream"});
		});

		return res.json({
			error: false,
			errorMsg: ""
		});
	};
};