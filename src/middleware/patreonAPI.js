const rp = require('request-promise');

module.exports.refresh = function (app) {
    return function(req, res, next) {
        let CLIENT_ID = app.get('authentication').patreonV2.CLIENT_ID;
        let CLIENT_SECRET = app.get('authentication').patreonV2.CLIENT_SECRET;
        const user = req.user;
        
        rp({
            uri: 'https://www.patreon.com/api/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'grant_type': 'refresh_token',
                'refresh_token': user.patreon.refresh_token,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
            },
            json: true
        })
        .then((response) => {
            let patreonObject = user.patreon;
            patreonObject.access_token = response.access_token;
            patreonObject.refresh_token = response.refresh_token;
            
            app.service('users').patch(user._id, {
                patreon: patreonObject
            }).then(() => {
                console.log(`saved new tokens for ${user._id}`);
                verify(app);
            }).catch((e) => {
                console.error(e.message);
                return res.status(200).json({statusCode: 500, message: "An error occurred while verifying your patron status!"});
            });
        })
        .catch(function (err) {
            res.status(200).json({statusCode: err.statusCode, message: "An error occurred while verifying your patron status!"});
            console.error(err.message);
        });
    }
};

module.exports.verify = function (app) {
    return async function(req, res, next) {
        const user = req.user;
        let patronData;
        const campaignID = app.get('authentication').patreonV2.campaignID;
        await rp({
            uri: 'https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign&fields%5Bmember%5D=full_name,is_follower,email,last_charge_date,last_charge_status,lifetime_support_cents,patron_status,currently_entitled_amount_cents,pledge_relationship_start,will_pay_amount_cents&fields%5Btier%5D=title&fields%5Buser%5D=full_name,hide_pledges',
            auth: {
                'bearer': user.patreon.access_token
            },
            json: true 
        }).then((rawJson) => {
            if(rawJson.included && typeof rawJson.included[Symbol.iterator] === 'function') {
                for(const included of rawJson.included) {
                    if(included.relationships) {
                        if(campaignID == included.relationships.campaign.data.id) {
                            patronData = included;
                            break;
                        }
                    }
                }
            }
        }).catch(e => {
            if(e.statusCode == 401) {
                refresh(app)
            } else {
                console.error(e);
                res.status(200).json({statusCode: e.statusCode, message: "Something went terribly wrong!"});
            }
        })

        if(!patronData) {
            return res.status(200).json({statusCode: 403, message: "You are currently not a patron"});
        }

        const amount = patronData.attributes.currently_entitled_amount_cents;
        //const patron_status = patronData.attributes.patron_status.toLowerCase();
        const last_charged_status = patronData.attributes.last_charge_status.toLowerCase();

        // the amount was less than $5
        if (amount < 500) {
            return res.status(200).json({statusCode: 403, message: "Patron status is only allowed at $5 or more"});
            //console.log("debug (amount): " + patronData.attributes);
        }

        /*
        // the user is not an active patron
        if (patron_status !== 'active_patron') {
            return res.status(200).json({statusCode: 403, message: "Not an active patron"});
            //console.log("debug (patron_status): " + patronData.attributes);
        }*/

        // the last transaction failed
        if (last_charged_status !== 'paid') {
            return res.status(200).json({statusCode: 403, message: "Last patreon payment was declined"});
            //console.log("debug (last_charged_status): " + data.attributes);
        }

        // the user has not verified the email attached to their at account
        if (!user.isVerified) {
            return res.status(200).json({statusCode: 403, message: "Email is not verified!"});
        }

        const newTier = amount < 1000 ? 1 : 2;

        // the user is already verified but linking patreon should be idempotent
        if (user.isPatron && newTier === user.patronTier) {
            return res.status(200).json({message: "You are a patron already!"});
        }

        app.service('users').patch(user._id, {
            isPatron: true,
            patronTier: newTier
        }).then(() => {
            return res.status(200).json({statusCode: 200, message: "Updated Patreon Status"});
        }).catch(() => {
            console.log(`db error while saving patron status for ${user._id}`);
            return res.status(200).json('errors.ejs', {statusCode: 500, message: "An error occurred while linking your account!"});
        });
    }
};