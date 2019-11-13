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
			if(event == 'members:pledge:create') {
				patreonCreate();
			} else if (event == 'members:pledge:update') {
				patreonUpdate();
			} else if (event == 'members:pledge:delete') {
				patreonDelete();
			}
		}
		

		function patreonCreate() {
			const attributes = req.body.data.attributes;
			const amount = attributes.pledge_amount_cents;
			const patron_status = attributes.patron_status;
			const last_charged_status = attributes.last_charge_status;
			
			if(amount >= 500) {
				if(patron_status == "active_patron") {
					if(last_charged_status == "Paid") {
						const id = req.body.data.id;
						var includedEmail;
						for(const included of req.body.included) {
							if(included.type == 'user') {
								includedEmail = included.attributes.email;
							}
						}

						//console.log(includedEmail + " || id: " + id + " to be created");

						app.service('users').find({
							query: { email: includedEmail }
						})
						.then((users) => {
							const user = users.data[0];
							if (users.total > 0  && user.isVerified) {
								var tier;
								if(amount >= 500 && amount < 1000) {
									tier = 1;
								} else {
									tier = 2;
								}
								app.service('users').patch(user._id, {
									patreonID: id,
									isPatron: true,
                                    patronTier: tier
								}).then(() => {
									//console.log(user.email + " is now a patron!");
								});
							} else {
								//console.log(includedEmail + " may not be verified or is banned or not found in system!");
							}
						})
						.catch(function(error){
							console.log(error);
						});
					}
				}
			}
		}
	
		function patreonDelete() {
			const id = req.body.data.id;
			var includedEmail;
			for(const included of req.body.included) {
				if(included.type == 'user') {
					includedEmail = included.attributes.email;
				}
			}

			//console.log(includedEmail + " || id: " + id + " to be deleted");

			app.service('users').find({
				query: { patreonID: id}
			})
			.then((users) => {
				if(users.total > 0) {
					const user = users.data[0];
					app.service('users').patch(user._id, {
						isPatron: false
					}).then(() => {
						//console.log(user.email + " is now not a patron!");
					});
				} else {
					//console.log("nothing to delete")
				}
			})
			.catch(function(error){
				console.log(error);
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
						var includedEmail;
						for(const included of req.body.included) {
							if(included.type == 'user') {
								includedEmail = included.attributes.email;
							}
						}

						//console.log(includedEmail + " || id: " + id + " to be updated or created");

						app.service('users').find({
							query: { patreonID: id}
						})
						.then((users) => {
							const user = users.data[0];
							if (users.total > 0  && user.isVerified) {
								var tier;
								if(amount >= 500 && amount < 1000) {
									tier = 1;
								} else {
									tier = 2;
								}
								app.service('users').patch(user._id, {
									patreonID: id,
									isPatron: true,
                                    patronTier: tier
								}).then(() => {
									//console.log(user.email + " is now a patron!");
								});
							} else {
								//console.log(includedEmail + " may not be verified or is banned or not found in system!");
							}
						})
						.catch(function(error){
							console.log(error);
						});
					}
				}
			} else if(amount < 500) {
				app.service('users').find({
					query: { patreonID: id}
				})
				.then((users) => {
					if(users.total > 0) {
						const user = users.data[0];
						app.service('users').patch(user._id, {
							isPatron: false
						}).then(() => {
							//console.log(user.email + " is now not a patron!");
						});
					} else {
						//console.log("nothing to delete")
					}
				}).catch(function(error){
					console.log(error);
				});
			}
		}
	}
}