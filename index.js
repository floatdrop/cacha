'use strict';

var fs = require('fs');
var path = require('path');
var homeOrTmp = require('home-or-tmp');
var PinkiePromise = require('pinkie-promise');
var mkdirp = require('mkdirp');

function Cacha(namespace, opts) {
	if (!(this instanceof Cacha)) {
		return new Cacha(namespace, opts);
	}

	if (typeof namespace !== 'string') {
		throw new TypeError('namespace expected to be a string');
	}

	this.ns = namespace;

	if (this.ns[0] === '/') {
		this.path = this.ns;
	} else {
		this.path = path.join(homeOrTmp, this.ns);
	}

	this.opts = opts || {};
	this.opts.ttl = this.opts.ttl === undefined ? 86400000 : this.opts.ttl;

	mkdirp.sync(this.path);
}

Cacha.prototype.set = function set(id, content, opts) {
	var entryPath = path.join(this.path, id);

	return new PinkiePromise(function (resolve, reject) {
		fs.writeFile(entryPath, content, opts, function (err) {
			if (err) {
				reject(err);
				return;
			}

			resolve(content);
		});
	});
};

Cacha.prototype.setSync = function setSync(id, content, opts) {
	var entryPath = path.join(this.path, id);
	fs.writeFileSync(entryPath, content, opts);
	return content;
};

Cacha.prototype.get = function get(id, opts) {
	var self = this;
	var entryPath = path.join(this.path, id);

	return new PinkiePromise(function (resolve, reject) {
		fs.stat(entryPath, function (err, stats) {
			if (err) {
				if (err.code === 'ENOENT') {
					resolve(undefined);
					return;
				}

				reject(err);
				return;
			}

			if (Date.now() - stats.mtime > self.opts.ttl) {
				resolve(undefined);
				return;
			}

			fs.readFile(entryPath, opts, function (err, data) {
				if (err) {
					if (err.code === 'ENOENT') {
						resolve(undefined);
						return;
					}

					reject(err);
					return;
				}

				resolve(data);
			});
		});
	});
};

Cacha.prototype.getSync = function getSync(id, opts) {
	var self = this;
	var entryPath = path.join(this.path, id);

	var stats = fs.statSync(entryPath);

	if (Date.now() - stats.mtime > self.opts.ttl) {
		return undefined;
	}

	return fs.readFileSync(entryPath, opts);
};

Cacha.prototype.clean = function clean() {
	var ttl = this.opts.ttl;
	var cacheDir = this.path;
	var files = fs.readdirSync(cacheDir);

	files.forEach(function (id) {
		var file = path.join(cacheDir, id);
		var mtime = fs.statSync(file).mtime;

		if (Date.now() - mtime > ttl) {
			fs.unlinkSync(file);
		}
	});
};

module.exports = Cacha;
