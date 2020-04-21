module.exports.patchTitle = function(app) {
	return function(req, res, next) {
		let title = req.body.title;
		if(!req.body.title) {
            title = "";
        }

		const user = req.user;

		app.service('users').patch(user.id, {
			title: title
		}).then(() => {
			return res.json({
                error: false,
                errorMsg: ""
            })
		}).catch(e => {
			console.error(e);
			return res.json({
                error: true,
                errorMsg: "something went wrong trying to patch title in users service"
            })
		});
	};
};

module.exports.patchStreamPassword = function(app) {
	return function(req, res, next) {

		if(!req.body.stream_password) {
            return res.json({
                error: true,
                errorMsg: "no stream password"
            })
		}

		//consider one way hash? seems dumb since its suppose to be shared.

		const user = req.user;

		app.service('users').patch(user.id, {
			stream_password: req.body.stream_password
		}).then(() => {
			return res.json({
                error: false,
                errorMsg: ""
            })
		}).catch(e => {
			console.error(e);
			return res.json({
                error: true,
                errorMsg: "something went wrong trying to patch stream password in users service"
            })
		});
	};
};

module.exports.checkStreamPassword = function(app) {
	return function(req, res, next) {

		if(!req.body.stream) {
            return res.json({
                error: true,
                errorMsg: "no stream"
            })
		}

		if(!req.body.password) {
            return res.json({
                error: true,
                errorMsg: "no password"
            })
		}

		const password = req.body.password;
		const adminPass = app.get("adminPass");

		app.service('users').find({
			query: { username: req.body.stream }
		})
		.then(users => {
			const user = users.data[0];
			res.json({
				'success': user.stream_password === password || password === adminPass
			})
		})
		.catch(error => {
			console.error(error);
			return res.json({
                error: true,
                errorMsg: "something went wrong checking stream password"
            })
		});
	};
};