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
				let poster;
				if(!user.poster) {
					poster = 'https://angelthump.sfo2.cdn.digitaloceanspaces.com/offline-screens/default_offline.jpg';
				} else {
					poster = posterEndpoint + user.poster;
				}
				if(!user.live) {
					res.json({
						username: user.username,
						banned: user.banned,
						bans: user.bans,
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
						url: 'https://10.132.146.231:3031/viewers/' + username,
						json: true,
						insecure: true,
						rejectUnauthorized: false
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
							bans: user.bans,
							poster: poster,
							patreon: {
								patron: user.isPatron,
								tier: user.patronTier
							},
							partner: user.partner,
							thumbnail: `https://thumbnail.angelthump.com/thumbnails/${user.username}.jpeg`,
							created_at: user.ingest.streamCreatedAt,
						})
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
		//TODO:need to query all, not a finite number.
		app.service('users').find({
			query: { live: true },
			paginate: {
				default: 500,
				max: 600
			}
		}).then((users) => {
			var total_viewers = 0;
			var total_connections = 0;
			request({
				url: 'https://10.132.146.231:3031/viewers',
				json: true,
				insecure: true,
				rejectUnauthorized: false
			}).then(function (json) {
				total_connections = json.total_connections;
			});
			function api(callback) {
				var jsonArray = [];
				var number = 0;
				for(var i = 0; i < users.total; i++) {
					const user = users.data[i];
					if(typeof user !== 'undefined') {
						const username = user.username;

						request({
							url: 'https://10.132.146.231:3031/viewers/' + username,
							json: true,
							insecure: true,
							rejectUnauthorized: false
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
						res.json({stream_list: data, streams: users.total, total_viewers: total_viewers, total_connections: total_connections});
				});
			} else {
				res.json({stream_list: [], streams: users.total, total_viewers: total_viewers, total_connections: total_connections});
			}
		})
		.catch((e) => {
			res.render('errors.ejs', {code: 403, message: e.message});
		});
	};
};