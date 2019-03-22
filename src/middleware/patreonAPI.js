let rp = require('request-promise');

module.exports = function (app) {
    return function(req, res, next) {
        let CLIENT_ID = app.get('authentication').patreonV2.CLIENT_ID;
        let CLIENT_SECRET = app.get('authentication').patreonV2.CLIENT_SECRET;
        let redirectURL = 'https://api.angelthump.com/patreon/oauth/redirect';
        let code = req.query.code;
        let userToken;
        const campaignID = app.get('authentication').patreonV2.campaignID;

        rp({
            uri: 'https://www.patreon.com/api/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'code': code,
                'grant_type': 'authorization_code',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'redirect_uri': redirectURL
            },
            json: true
        })
        .then(function (response) {
            userToken = response.access_token;
            rp({
                uri: 'https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign&fields%5Bmember%5D=full_name,is_follower,email,last_charge_date,last_charge_status,lifetime_support_cents,patron_status,currently_entitled_amount_cents,pledge_relationship_start,will_pay_amount_cents&fields%5Btier%5D=title&fields%5Buser%5D=full_name,hide_pledges',
                auth: {
                    'bearer': userToken
                },
                json: true 
            }).then(function(rawJson) {
                let found = false;
                for(const included of rawJson.included) {
                    if(included.relationships) {
                        if(campaignID == included.relationships.campaign.data.id) {
                            found = true;
                            res.locals.patronData = included;
                            next();
                            break;
                        }
                    }
                }
                if(!found) {
                    res.status(403).render('errors.ejs', {code: 403, message: "not a patron"});
                }
            }).catch(e => {
                console.error(e);
            })
        })
        .catch(function (err) {
            res.status(err.statusCode).render('error.ejs', {code: err.statusCode, message: "oopsie woopsie, what happened D:"});
            console.error(err.message);
        });
    }
};

module.exports.verify = function (app) {
    return function(req, res, next) {
        const data = res.locals.patronData;
        const patreonID = data.id;
        const user = req.user;

        app.service('users').patch(user._id, {
            patreonID: patreonID
        }).then(() => {
            console.log(user.email + " assigned with " + patreonID);
        }).catch(e => {
            console.error(e);
        });

        const amount = data.attributes.will_pay_amount_cents;
        const patron_status = data.attributes.patron_status;
        const last_charged_status = data.attributes.last_charge_status;

        if(amount >= 500) {
            if(patron_status == "active_patron") {
                if(last_charged_status == "Paid") {
                    var tier;
                    if(amount >= 500 && amount < 1000) {
                        tier = 1;
                    } else {
                        tier = 2;
                    }
                    if(user.isVerified) {
                        if(user.tier != patronTier) {
                            app.service('users').patch(user._id, {
                                patronTier: tier
                            })
                        }
                        if(user.isPatron) {
                            app.service('users').patch(user._id, {
                                isPatron: true,
                                patronTier: tier
                            }).then(() => {
                                console.log(user.email + " is now a patreon!");
                                res.status(200).render('success.ejs', {message: "You are now a patron!"});
                            });
                        } else {
                            res.status(400).render('errors.ejs', {code: 400, message: "You are a patron already!"});
                        }
                    } else {
                        res.status(403).render('errors.ejs', {code: 403, message: "Email is not verified!"});
                    }
                } else {
                    res.status(403).render('errors.ejs', {code: 403, message: "Last patreon payment was declined"});
                }
            } else {
                res.status(403).render('errors.ejs', {code: 403, message: "Not an active patron"});
            }
        } else {
            res.status(403).render('errors.ejs', {code: 403, message: "Patron status is only allowed at $5 or more"});
        }
    }
};