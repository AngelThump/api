'use strict';
const crypto = require('crypto');

module.exports = function(app) {
	return function(req, res, next) {
		const signature = req.get("X-Patreon-Signature");
		const patreonWebhookSecret = app.get("patreonWebhookSecret");
		const hash = crypto.createHmac('md5', patreonWebhookSecret).update(req.rawBody).digest('hex');

		if(signature !== hash) {
			res.status(403).json({error: 'Invalid signature'});
		} else {
			const event = req.get("X-Patreon-Event");
			res.status(200).send('ok');
			if (event == 'members:pledge:update') {
				patreonUpdate();
			} else if (event == 'members:pledge:delete') {
				patreonDelete();
			}
		}
	
		function patreonDelete() {
			const id = req.body.data.id;

			app.service('users').find({
				query: { "patreon.id": id}
			})
			.then(users => {
				if(users.total > 0) {
					const user = users.data[0];
					app.service('users').patch(user.id, {
						patreon: {
							id: id,
							isPatron: false,
							tier: 0
						}
					}).catch(e => {
						console.error(e);
					});
				}
			})
			.catch(error => {
				console.error(error);
			});
		}
	
		function patreonUpdate() {
			const attributes = req.body.data.attributes;
			const amount = attributes.pledge_amount_cents;
			const patron_status = attributes.patron_status;
			const last_charged_status = attributes.last_charge_status;
			const id = req.body.data.id;
			
			if(amount >= 500) {
				if(patron_status == "active_patron") {
					if(last_charged_status == "Paid") {
						const id = req.body.data.id;

						app.service('users').find({
							query: { "patreon.id": id}
						})
						.then(users => {
							const user = users.data[0];
							if (users.total > 0  && user.isVerified) {
								let tier;

								if(amount >= 500 && amount < 1000) {
									tier = 1;
								} else if (amount >= 1000 && amount < 5000) {
									tier = 2;
								} else if (amount >= 5000) {
									tier = 3;
								}
								app.service('users').patch(user.id, {
									patreon: {
										id: id,
										isPatron: true,
										tier: tier
									}
								}).catch(e => {
									console.error(e);
								});
							}
						})
						.catch(error => {
							console.error(error);
						});
					}
				}
			} else if(amount < 500) {
				app.service('users').find({
					query: { "patreon.id": id}
				})
				.then(users => {
					if(users.total > 0) {
						const user = users.data[0];
						app.service('users').patch(user.id, {
							patreon: {
								id: id,
								isPatron: false,
								tier: 0
							}
						}).catch(e => {
							console.error(e);
						});
					}
				}).catch(error => {
					console.error(error);
				});
			}
		}
	}
}