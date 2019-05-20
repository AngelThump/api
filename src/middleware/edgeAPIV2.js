'use strict';
const fs = require('fs');
const path = require('path');

module.exports.list = function(app) {
	return function(req, res, next) {
        fs.readFile(path.join(__dirname, '../../config/edgesv2.json'), async (err, data) => {  
			if (err) console.log(err);
            let list = JSON.parse(data);
			res.status(200).json(list);
		});
	};
};

module.exports.add = function(app) {
	return function(req, res, next) {

        if(!req.headers['authorization']) {
			res.status(403).send('no key');
			return;
        }

        const key = req.headers.authorization.split(' ')[1];

        if(!key.includes(app.get('edgeKey'))) {
			res.status(403).send('bad key');
			return;
        }

        if(!req.body.hostname && !req.body.region) {
			res.status(400).send('bad request');
			return;
        }

		setTimeout(() => {
			if(!res.headersSent) {
				res.status(200).send('ok');
			}
		}, 1);
		
        fs.readFile(path.join(__dirname, '../../config/edgesv2.json'), (err, data) => {  
			if (err) console.log(err);
			let list = JSON.parse(data);
			list.regions[req.body.region].push({"name": req.body.hostname, "status":req.body.status});
			console.log("added " + req.body.hostname + " to the v2 list");

			fs.writeFile(path.join(__dirname, '../../config/edgesv2.json'), JSON.stringify(list), 'utf-8', function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
	};
};

module.exports.remove = function(app) {
	return function(req, res, next) {

        if(!req.headers['authorization']) {
			res.status(403).send('no key');
			return;
        }

        const key = req.headers.authorization.split(' ')[1];

        if(!key.includes(app.get('edgeKey'))) {
			res.status(403).send('bad key');
			return;
        }

        if(!req.body.hostname && !req.body.region) {
			res.status(400).send('bad request');
			return;
		}

		setTimeout(() => {
			if(!res.headersSent) {
				res.status(200).send('ok');
			}
		}, 1);
		
        fs.readFile(path.join(__dirname, '../../config/edgesv2.json'), (err, data) => {  
			if (err) console.log(err);
            let list = JSON.parse(data);
            let region = list.regions[req.body.region];
            for(let index = 0; index<region.length; index++) {
				let hostname = list.regions[req.body.region][index].name;
                if(hostname === req.body.hostname) {
					list.regions[req.body.region].splice(index, 1);
					fs.writeFile(path.join(__dirname, '../../config/edgesv2.json'), JSON.stringify(list), 'utf-8', function(err) {
						if (err) {
							console.log(err);
						} 
						console.log("deleted " + req.body.hostname + " from the v2 list");
					});
                }
            }
		});
	};
};

module.exports.postStatus = function(app) {
	return function(req, res, next) {

        if(!req.headers['authorization']) {
			res.status(403).send('no key');
			return;
        }

        const key = req.headers.authorization.split(' ')[1];

        if(!key.includes(app.get('edgeKey'))) {
			res.status(403).send('bad key');
			return;
        }

        if(!req.body.hostname && !req.body.status && !req.body.region) {
			res.status(400).send('bad request');
			return;
        }

		setTimeout(() => {
			if(!res.headersSent) {
				res.status(200).send('ok');
			}
		}, 1);
		
        fs.readFile(path.join(__dirname, '../../config/edgesv2.json'), (err, data) => {  
			if (err) console.log(err);
            let list = JSON.parse(data);
            let region = list.regions[req.body.region];
            for(let index=0; index<region.length; index++) {
                let hostname = list.regions[req.body.region][index].name;
                if(hostname === req.body.hostname) {
                    if(list.regions[req.body.region][index].status != req.body.status) {
                        list.regions[req.body.region][index].status = req.body.status;
                        fs.writeFile(path.join(__dirname, '../../config/edgesv2.json'), JSON.stringify(list), 'utf-8', function(err) {
                            if (err) {
                                console.log(err);
                            }
                            if(req.body.status === 'down') {
                                console.log(`updated ${req.body.hostname} to ${req.body.status}`);
                            }
                        });
                    }
                    break;
                }
            }
		});
	};
};