'use strict';
const fs = require('fs');
const path = require('path');

module.exports.list = function(app) {
	return function(req, res, next) {
        fs.readFile(path.join(__dirname, '../../config/edges.json'), (err, data) => {  
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
		
        fs.readFile(path.join(__dirname, '../../config/edges.json'), (err, data) => {  
			if (err) console.log(err);
			let list = JSON.parse(data);
			list.regions[req.body.region].push(req.body.hostname);
			console.log("added " + req.body.hostname + " to the list");

			fs.writeFile(path.join(__dirname, '../../config/edges.json'), JSON.stringify(list), 'utf-8', function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
	};
};

module.exports.delete = function(app) {
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

        setTimeout(() => {
			if(!res.headersSent) {
				res.status(200).send('ok');
			}
		}, 1);

		fs.readFile(path.join(__dirname, '../../config/edges-default.json'), (err, data) => {  
			if (err) console.log(err);
			let defaultList = JSON.parse(data);

			fs.writeFile(path.join(__dirname, '../../config/edges.json'), JSON.stringify(defaultList), 'utf-8', function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
	};
};