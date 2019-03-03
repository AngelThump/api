module.exports.title = function(app) {
	return function(req, res, next) {
		const user = req.user
		const title = req.body.title;
		app.service('users').patch(user._id, {
			title: title
		}).then(() => {
			res.status(200).send("ok");
		}).catch((e) => {
			res.status(500).send(e);
		});
	};
};

module.exports.checkStreamPassword = function(app) {
	return function(req, res, next) {
		const stream = req.body.stream;
		const password = req.body.password;
		const adminPass = app.get("adminPass");

		app.service('users').find({
			query: { username: stream }
		})
		.then((users) => {
			const user = users.data[0];
			res.json({
				'success': user.streamPassword == password || password == adminPass
			})
		})
		.catch((error) => {
			res.status(400).send(error.message);
		});
	};
};