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
			return res.json({error: true, errorMSG: "Something went wrong while retrieving streams"});
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

		const stream =
		await app.service('streams').find({
			query: { 'user.username': requested_username }
		}).then(stream => {
			return stream;
		})
		.catch((e) => {
			console.error(e);
			return res.json({error: true, errorMSG: "Something went wrong while retrieving streams"});
		});

		if(stream.total === 0) {
			return res.json({error: true, errorMSG: "No stream exists"});
		}

		return res.json(stream.data[0]);
	};
};