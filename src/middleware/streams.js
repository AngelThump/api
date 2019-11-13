const request = require('request-promise');

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
                                id: number,
								username: username,
								viewers: json.viewers
							};
							jsonArray.push(jsonObject);
							if (++number == users.total) {
								callback(jsonArray);
							}
						}).catch(e => {
                            console.error(e);
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
			
			res.set('X-Total-Count', users.total);
			if(users.total != 0) {
				api(function(data) {
                    data.sort(sortBy("viewers"));
                    res.json(data);
				});
			} else {
				res.json([]);
			}
		})
		.catch((e) => {
			res.render('errors.ejs', {code: 403, message: e.message});
		});
	};
};