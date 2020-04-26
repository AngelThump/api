const axios = require('axios');

module.exports.streams = function(app) {
	return async function(req, res, next) {
		const streams =
		await app.service('streams').find({
			query: {},
			$sort: {
				viewer_count: -1
			}
		}).then(streams => {
			return streams;
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMsg: "Something went wrong while retrieving streams"});
		});

		return res.json({
			streams: streams, 
			total: streams.length
		});
	};
};

module.exports.stream = function(app) {
	return async function(req, res, next) {
		const requested_username = req.params.username.toLowerCase();

		const user =
		await app.service('users')
		.find({
			query:{username: requested_username}
		})
		.then(users => {
			return users.data[0]
		})
		.catch(e => {
			console.error(e);
		})

		if(!user) {
			return res.status(404).json({
				error: true,
				errorMsg: "User does not exist"
			});
		}

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
			followers: user.followers,
			unlist: user.unlist
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

		if(streams.length === 0) {
			return res.json({
				username: requested_username,
				type: "",
				user: userObject
			});
		}

		//get viewer count

		const viewers =
		await axios.get(`https://viewer-api.angelthump.com/${requested_username}`, {
			headers: {
				authorization: `Bearer ${app.get('viewerApiKey')}`
			}
		}).then(response => {
			return response.data.viewers;
		}).catch(e => {
			console.error(e);
			return res.json({
				error: true,
				errorMsg: "Something went wrong with viewer api"
			})
		})

		if(user.patreon) {
			userObject.patreon = {
				isPatron: user.patreon.isPatron,
				tier: user.patreon.tier
			}
		} else {
			userObject.patreon = null
		}

		if(user.twitch) {
			userObject.twitch = {
				channel: user.twitch.channel
			}
		} else {
			userObject.twitch = null
		}

		app.service('streams')
		.patch(streams[0]._id, {
			viewer_count: viewers,
			user: userObject
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

module.exports.getIngest = function(app) {
	return async function(req, res, next) {

		if(!req.headers['authorization']) {
            res.json({
                error: true,
                errorMsg: "missing authorization header"
            })
            return;
        }

        const apiKey = req.headers.authorization.split(' ')[1];
        const muxerApiKey = app.get("muxerApiKey");

        if (!muxerApiKey.includes(apiKey)) {
            res.json({
                error: true,
                errorMsg: "wrong authorization header"
            })
            return;
		}
		
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

		if(streams.length === 0) {
			return res.status(404).send('no user');
		}

		return res.json({
			ingest: streams[0].ingest
		});
	};
};