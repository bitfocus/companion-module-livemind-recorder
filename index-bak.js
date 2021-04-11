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

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;


// ########################
// #### Instance setup ####
// ########################
function instance(system, id, config) {
    var self = this;

    // super-constructor
    instance_skel.apply(this, arguments);

    self.initActions(); // export actions

    return self;
}

// Return config fields for web config
instance.prototype.config_fields = function () {
    var self = this;

    return [
        {
            type: 'text',
            id: 'info',
            width: 12,
            label: 'Information',
            value: 'This module is for Livemind Recorder NDI recording software.'
        },
        {
            type: 'textinput',
            id: 'host',
            label: 'IP Address of Livemind Recorder (Default: 127.0.0.1)',
            width: 6,
            default: '127.0.0.1',
            regex: self.REGEX_IP
        },
        {
            type: 'number',
            id: 'port',
            label: 'TCP Port of Recorder (Default: 9099)',
            width: 3,
            default: 9099,
            regex: self.REGEX_PORT
        },
        {
            type: 'number',
            id: 'pollInterval',
            label: 'Polling Interval in milliseconds (Default: 250)',
            width: 6,
            min: 15,
            max: 10000,
            default: 250,
            required: true
        },
        {
            type: 'checkbox',
            id: 'debug',
            width: 3,
            label: 'Enable debug to log window',
            default: false
        }
    ]
}

// When module gets deleted
instance.prototype.destroy = function () {
    var self = this;

    if (self.socket !== undefined) {
        self.socket.destroy();
    }

    self.debug("destroy", self.id);
}

// Initalize module
instance.prototype.init = function () {
    var self = this;

    debug = self.debug;
    log = self.log;

    self.initTCP();
}

instance.prototype.initActions = function () {
    var self = this;
    var actions = {};

    actions['sample_action'] = {
        label: 'Sample Action',
        options: [
            {
                type: 'textinput',
                label: 'Some Text',
                id: 'text',
                regex: self.REGEX_SOMETHING
            }
        ],
        callback = function (action, bank) {
            var opt = action.options;
            self.sendCommand(`SET sample_action: ${opt.text}`);
        }
    };

    self.setActions(actions);
}

// Initialize TCP connection
instance.prototype.initTCP = function () {
    var self = this;

    if (self.socket !== undefined) {
        self.socket.destroy();
        delete self.socket;
    }

    if (self.config.port === undefined) {
        self.config.port = 9099;
    }

    if (self.config.host) {
        self.socket = new tcp(self.config.host, self.config.port);

        self.socket.on('status_change', function (status, message) {
            self.status(status, message);
        });

        self.socket.on('error', function (err) {
            self.debug("Network error", err);
            self.log('error', "Network error: " + err.message);
        });

        self.socket.on('connect', function () {
            self.debug("Connected");
        });
    }
}

// Send command
instance.prototype.sendCommand = function (cmd) {
    var self = this;

    if (cmd !== undefined && cmd != '') {
        if (self.socket !== undefined && self.socket.connected) {
            self.socket.send(cmd);
        }
    }
}

// Update module after a config change
instance.prototype.updateConfig = function (config) {
    var self = this;
    var resetConnection = false;

    if (self.config.host != config.host) {
        resetConnection = true;
    }

    self.config = config;

    if (resetConnection === true || self.socket === undefined) {
        self.initTCP();
    }
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;



// ##########################
// #### Instance Actions ####
// ##########################


// ##########################
// #### Define Feedbacks ####
// ##########################


// ########################
// #### Define Presets ####
// ########################


// ##########################
// #### Define Variables ####
// ##########################


