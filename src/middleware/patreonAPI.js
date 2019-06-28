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
                if(rawJson.included && typeof rawJson.included[Symbol.iterator] === 'function') {
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
                } else {
                    console.log(rawJson);
                }
                if(!found) {
                    res.status(403).render('errors.ejs', {code: 403, message: "not a patron"});
                }
            }).catch(e => {
                console.error(e);
            })
        })
        .catch(function (err) {
            res.status(err.statusCode).render('errors.ejs', {code: err.statusCode, message: "An error occurred while linking your account!"});
            console.error(err.message);
        });
    }
};

module.exports.verify = function (app) {
    return function(req, res, next) {
        const user = req.user;
        const data = res.locals.patronData;
        const patreonID = data.id;
        const amount = data.attributes.will_pay_amount_cents;
        const patron_status = data.attributes.patron_status.toLowerCase();
        const last_charged_status = data.attributes.last_charge_status.toLowerCase();

        // the amount was less than $5
        if (amount < 500) {
            res.status(403).render('errors.ejs', {code: 403, message: "Patron status is only allowed at $5 or more"});
            //console.log("debug (amount): " + data.attributes);
            return;
        }

        // the user is not an active patron
        if (patron_status !== 'active_patron') {
            res.status(403).render('errors.ejs', {code: 403, message: "Not an active patron"});
            //console.log("debug (patron_status): " + data.attributes);
            return;
        }

        // the last transaction failed
        if (last_charged_status !== 'paid') {
            res.status(403).render('errors.ejs', {code: 403, message: "Last patreon payment was declined"});
            //console.log("debug (last_charged_status): " + data.attributes);
            return;
        }

        // the user has not verified the email attached to their at account
        if (!user.isVerified) {
            res.status(403).render('errors.ejs', {code: 403, message: "Email is not verified!"});
            return;
        }

        const newTier = amount < 1000 ? 1 : 2;

        // the user is already verified but linking patreon should be idempotent
        if (user.isPatron && newTier === user.patronTier) {
            res.status(200).render('success.ejs', {message: "You are a patron already!"});
            return;
        }

        console.log("updating patron status for " + user.email);
        app.service('users').patch(user._id, {
            patreonID: patreonID,
            isPatron: true,
            patronTier: newTier
        }).then(() => {
            console.log(user.email + " is now a patron!");
            res.status(200).render('success.ejs', {message: "You are now a patron!"});
        }).catch(() => {
            console.log("db error while saving patron status for " + user.email);
            res.status(500).render('errors.ejs', {code: 500, message: "An error occurred while linking your account!"});
        });
    }
};