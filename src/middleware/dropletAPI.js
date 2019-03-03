'use strict'

const fs = require('fs');
const path = require('path');

module.exports = function(app) {
	return function(req, res, next) {
        const transcodeKey = app.get("transcodeKey");
        
        if(req.headers['authorization']) {
            const apiKey = req.headers.authorization.split(' ')[1];
            if (transcodeKey.includes(apiKey)) {
                const action = req.body.action;
                if(action) {
                    if (action == "add") {
                        if(req.body.username) {
                            if(req.body.dropletID) {
                                addDroplet(req.body.username, req.body.dropletID);
                            } else {
                                res.status(400).send('missing dropletID');
                            }
                        } else {
                            res.status(400).send('missing username');
                        }
                    } else if (action == "remove") {
                        if(req.body.dropletID) {
                            removeDroplet(req.body.dropletID);
                        } else {
                            res.status(400).send('missing dropletID');
                        }
                    } else if (action == "update") {
                        if(req.body.username) {
                            if(req.body.dropletID) {
                                updateDroplet(req.body.username, req.body.dropletID);
                            } else {
                                res.status(400).send('missing dropletID');
                            }
                        } else {
                            res.status(400).send('missing username');
                        }
                    }
                } else {
                    res.status(400).send('missing action');
                }
            } else {
                res.status(403).send('wrong key');
            }
        } else {
            res.status(403).send('no key');
        }

        function addDroplet(username, dropletID) {
            const dropletJSON = require('../../config/droplet.json');
            var exists = false;
            for(const droplet of dropletJSON) {
                if(droplet.dropletID == dropletID || droplet.username == username) {
                    exists = true;
                    break;
                }
            }
            if(!exists) {
                dropletJSON.push({dropletID: dropletID, username: username});
                fs.writeFile(path.join(__dirname, '../../config/droplet.json'), JSON.stringify(dropletJSON), 'utf-8', function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("using " + dropletID + " to transcode " + username);
                    }
                });
                res.status(200).send("using " + dropletID + " to transcode " + username);
            } else {
                res.status(500).send(dropletID + " or " + username + " already exists!");
            }
        }

        function removeDroplet(dropletID) {
            const dropletJSON = require('../../config/droplet.json');
            var exists = false;
            var stream;
            for(var i=0; i<dropletJSON.length; i++) {
                const droplet = dropletJSON[i];
                if(droplet.dropletID == dropletID) {
                    stream = droplet.username;
                    exists = true;
                    dropletJSON.splice(i,1);
                    break;
                }
            }
            if(exists) {
                fs.writeFile(path.join(__dirname, '../../config/droplet.json'), JSON.stringify(dropletJSON), 'utf-8', function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("removed " + dropletID);
                    }
                });
                res.status(200).send("removed " + dropletID + " from " + stream);
            } else {
                res.status(404).send(dropletID + " does not exist!");
            }
        }

        function updateDroplet(username, dropletID) {
            const dropletJSON = require('../../config/droplet.json');
            var exists = false;
            for(var i=0; i<dropletJSON.length; i++) {
                const droplet = dropletJSON[i];
                if(droplet.dropletID == dropletID) {
                    exists = true;
                    dropletJSON.splice(i,1,{dropletID: dropletID, username: username});
                    break;
                }
            }
            if(exists) {
                fs.writeFile(path.join(__dirname, '../../config/droplet.json'), JSON.stringify(dropletJSON), 'utf-8', function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("updated " + dropletID);
                    }
                });
                res.status(200).send("updated " + dropletID);
            } else {
                res.status(404).send(dropletID + " does not exist!");
            }
        }
	};
};

/*
 * Show a list of transcode droplets and their current job
 */
module.exports.list = function(app) {
	return function(req, res, next) {
        if(req.headers['authorization']) {
            const apiKey = req.headers.authorization.split(' ')[1];
            const transcodeKey = app.get("transcodeKey");
            if (transcodeKey.includes(apiKey)) {
                const dropletJSON = require('../../config/droplet.json');
                res.json(dropletJSON);
            } else {
                res.status(403).send('wrong key');
            }
        } else {
            res.status(403).send('no key');
        }
	};
};