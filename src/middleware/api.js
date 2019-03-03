'use strict';
const request = require('request-promise');

module.exports.user = function(app) {
	return function(req, res, next) {
		var requested_username = req.params.username.toLowerCase();

		app.service('users').find({
			query: { username: requested_username }
		}).then((users) => {
			if (users.total > 0) {
				const user = users.data[0];
				const posterEndpoint = app.get("spacesEndpoint") + "offline-screens/uploads/";
				if(!user.live) {
					res.json({
						username: user.username,
						banned: user.banned,
						poster: posterEndpoint + user.poster,
						patreon: {
							patron: user.isPatron,
							tier: user.patronTier
						},
						partner: user.partner,
						transcode: user.transcode,
						playerTranscodeReady: user.playerTranscodeReady,
						passwordProtected: user.passwordProtected
					});
				} else {
					const username = user.username;
					request({
						url: 'http://10.132.146.231/viewers/' + username,
						json: true
					}).then(function (json) {
						res.json({
							username: user.username,
							live: user.live,
							title: user.title,
							viewers: json.viewers,
							passwordProtected: user.passwordProtected,
							transcode: user.transcode,
							playerTranscodeReady: user.playerTranscodeReady,
							banned: user.banned,
							poster: posterEndpoint  + user.poster,
							patreon: {
								patron: user.isPatron,
								tier: user.patronTier
							},
							partner: user.partner,
							thumbnail: `https://thumbnail.angelthump.com/thumbnails/${user.username}.jpeg`,
							created_at: user.streamCreatedAt,
						});
					});
				}
			} else {
				res.render('errors.ejs', {code: 404, message: `No Users Named ${requested_username}`});
			}
		})
		.catch((e) => {
			res.render('errors.ejs', {code: 403, message: e.message});
		});
	};
};


module.exports.all = function(app) {
	return function(req, res, next) {
		app.service('users').find({
			query: { live: true }
		}).then((users) => {
			var total_viewers = 0;
			function api(callback) {
				var jsonArray = [];
				var number = 0;
				for(var i = 0; i < users.total; i++) {
					const user = users.data[i];
					if(typeof user !== 'undefined') {
						const username = user.username;

						request({
							url: 'http://10.132.146.231/viewers/' + username,
							json: true
						}).then(function (json) {
							var jsonObject = {
								username: username,
								viewers: json.viewers
							};
							jsonArray.push(jsonObject);
							total_viewers += json.viewers;
							if (++number == users.total) {
								callback(jsonArray);
							}
						});
					} else {
						if (++number == users.total) {
							callback(jsonArray);
						}
					}
				}
			}

			function sortBy(prop){
				return function(a,b){
					if( b[prop] > a[prop]){
						return 1;
					}else if( b[prop] < a[prop] ){
						return -1;
					}
					return 0;
				}
			}
				
			if(users.total != 0) {
				api(function(data) {
						data.sort(sortBy("viewers"));
						res.json({stream_list: data, streams: users.total, total_viewers: total_viewers});
				});
			} else {
				res.json({stream_list: [], streams: users.total, total_viewers: total_viewers});
			}
		})
		.catch((e) => {
			res.render('errors.ejs', {code: 403, message: e.message});
		});
	};
};

module.exports.changeTitle = function(app) {
	return function(req, res, next) {
		const user = req.user
		const title = req.body.title;
		app.service('users').patch(user._id, {
			title: title
		}).then(() => {
			res.status(200).send("Changed " + user.username + "'s stream title to: " + title);
		}).catch((e) => {
			res.status(500).send(e);
		});
	};
};

module.exports.edgeServerList = function(app) {
	return function(req, res, next) {
		request({
			url: 'https://api.digitalocean.com/v2/droplets?tag_name=edge&page=1&per_page=200',
			auth: {
				'bearer': app.get('doAPIKey')
			},
			json: true
		}).then(function (json) {
			const droplets = json.droplets;

			var nyc = [], sfo = [], tor = [], ams = [], fra = [], lon = [], blr = [], sgp = [], sfo_patreon = [], 
				nyc_patreon = [], tor_patreon = [], ams_patreon = [], fra_patreon = [], lon_patreon = [], blr_patreon = [], sgp_patreon = [];

			for(var i = 0; i < droplets.length; i++) {
				const droplet = droplets[i];
				const dropletName = droplet.name;
				//if(await dropletAlive(dropletName)) {
					const tags = droplet.tags;
					if(!tags.includes("patreon")) {
						if(tags.includes("nyc")) {
							nyc.push(dropletName);
						} else if (tags.includes("sfo")) {
							sfo.push(dropletName)
						} else if (tags.includes("tor")) {
							tor.push(dropletName)
						} else if (tags.includes("ams")) {
							ams.push(dropletName)
						} else if (tags.includes("fra")) {
							fra.push(dropletName)
						} else if (tags.includes("lon")) {
							lon.push(dropletName)
						} else if (tags.includes("blr")) {
							blr.push(dropletName)
						} else if (tags.includes("sgp")) {
							sgp.push(dropletName)
						}
					} else {
						if(tags.includes("nyc")) {
							nyc_patreon.push(dropletName);
						} else if (tags.includes("sfo")) {
							sfo_patreon.push(dropletName)
						} else if (tags.includes("tor")) {
							tor_patreon.push(dropletName)
						} else if (tags.includes("ams")) {
							ams_patreon.push(dropletName)
						} else if (tags.includes("fra")) {
							fra_patreon.push(dropletName)
						} else if (tags.includes("lon")) {
							lon_patreon.push(dropletName)
						} else if (tags.includes("blr")) {
							blr_patreon.push(dropletName)
						} else if (tags.includes("sgp")) {
							sgp_patreon.push(dropletName)
						}
					}
				}
			//}
			res.json({
				regions: {
					nyc: nyc,
					nyc_patreon: nyc_patreon,
					sfo: sfo,
					sfo_patreon: sfo_patreon,
					tor: tor,
					tor_patreon: tor_patreon,
					ams: ams,
					ams_patreon: ams_patreon,
					fra: fra,
					fra_patreon: fra_patreon,
					lon: lon,
					lon_patreon, lon_patreon,
					blr: blr,
					blr_patreon: blr_patreon,
					sgp: sgp,
					sgp_patreon: sgp_patreon
				}
			});
		}).catch(function (e) {
			res.render('errors.ejs', {code: 403, message: e.message});
		});
		/*
		async function dropletAlive(host) {
			request
			.get('https://' + host + '.angelthump.com/ping')
			.on('response', function(response) {
				console.log(response.statusCode);
				if(response.statusCode == 200) {
					return true;
				} else {
					return false;
				}
			})
		}*/
	};
};