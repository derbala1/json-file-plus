var fs = require('fs');
var path = require('path');
var extend = require('node.extend');
var is = require('is-extended');

var setImmediate = setImmediate || function (func) { setTimeout(func, 0); };

var JSONFile = function (raw) {
	var hasTrailingNewline = (/\n\n$/).test(raw),
		indentMatch = raw.match(/^[ \t]+/m),
		indent = indentMatch ? indentMatch[0] : 2;

	this.format = {
		indent: indent,
		trailing: hasTrailingNewline
	};
	this.data = JSON.parse(raw);
};
JSONFile.prototype.get = function (key, callback) {
	var data = extend({}, this.data);
	if (is.isFunction(key)) {
		callback = key;
		key = null;
	}
	var value = key ? data[key] : data;
	if (is.isHash(value)) {
		value = extend({}, value);
	}
	if (is.isFunction(callback)) {
		setImmediate(function () { callback(null, value); });
	}
	return value;
};
JSONFile.prototype.set = function (obj) {
	if (!is.isHash(obj)) { throw new TypeError('object must be a plain object'); }
	extend(true, this.data, obj);
};
JSONFile.prototype.save = function (filename, callback) {
	var endingNewlines = this.format.trailing ? "\n\n" : "\n";
	var indent = this.format.indent || 2;
	var json = new Buffer(JSON.stringify(this.data, null, indent) + endingNewlines);
	fs.writeFile(path.join(process.cwd(), filename), json, callback);
};

var readJSON = function (filename, callback) {
	if (!is.isFunction(callback)) {
		throw new TypeError('callback must be a function');
	}
	fs.readFile(path.join(process.cwd(), filename), function (err, rawBuf) {
		var file, raw;
		if (!err) {
			raw = rawBuf.toString('utf8');
			try { file = new JSONFile(raw); }
			catch (e) { err = e; }
		}
		setImmediate(function () { callback(err, file); });
	});
};
readJSON.JSONFile = JSONFile;

module.exports = readJSON;

