// Index.js
// companion-module-livemind-recorder

// var instance_skel = require('../../instance_skel');

// function instance(system, id, config) {
// 	var self = this;

// 	// super-constructor
// 	instance_skel.apply(this, arguments);
// 	...
// 	return self;
// }

// instance_skel.extendedBy(instance);
// exports = module.exports = instance;

var instance_skel = require('../../instance_skel');
var tcp = require('../../tcp');
var debug;
var log;

function instance(system, id, config) {
		var self = this;

		// super-constructor
		instance_skel.apply(this, arguments);
		self.actions(); // export actions
		return self;
}

instance.prototype.init = function () {
		var self = this;

		debug = self.debug;
		log = self.log;

		self.status(self.STATUS_UNKNOWN);

		if (self.config.host !== undefined) {
			// EMT for XML listen to port 9876
			self.tcp = new tcp(self.config.host, 9876);

			self.tcp.on('status_change', function (status, message) {
				self.status(status, message);
			});

			self.tcp.on('error', function () {
				// Ignore
			});
		}
};