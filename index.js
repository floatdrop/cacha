'use strict';

var fs = require('fs');
var path = require('path');
var homeOrTmp = require('home-or-tmp');
var PinkiePromise = require('pinkie-promise');
var mkdirp = require('mkdirp');
var pathIsAbsolute = require('path-is-absolute');

var pify = require('pify');
var fsP = pify.all(fs, PinkiePromise);

function handleEnoent(err) {
	if (err.code === 'ENOENT') {
		return undefined;
	}

	throw err;
}

function Cacha(namespace, opts) {
	if (!(this instanceof Cacha)) {
		return new Cacha(namespace, opts);
	}

	if (typeof namespace !== 'string') {
		throw new TypeError('namespace expected to be a string');
	}

	this.ns = namespace;

	if (pathIsAbsolute(this.ns)) {
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

	return fsP.writeFile(entryPath, content, opts).then(function () {
		return content;
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

	return fsP.stat(entryPath)
		.then(function (stats) {
			if (Date.now() - Number(stats.atime) > self.opts.ttl) {
				return undefined;
			}

			return fsP.readFile(entryPath, opts);
		})
		.catch(handleEnoent);
};

Cacha.prototype.getSync = function getSync(id, opts) {
	var self = this;
	var entryPath = path.join(this.path, id);
	var stats;

	try {
		stats = fs.statSync(entryPath);
	} catch (err) {
		if (err.code !== 'ENOENT') {
			throw err;
		}

		return undefined;
	}

	if (Date.now() - Number(stats.atime) > self.opts.ttl) {
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
		var atime = fs.statSync(file).atime;

		if (Date.now() - atime > ttl) {
			fs.unlinkSync(file);
		}
	});
};

module.exports = Cacha;
