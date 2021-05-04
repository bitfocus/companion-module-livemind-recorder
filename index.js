// Index.js
// companion-module-livemind-recorder

var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var xmlParser     = require('fast-xml-parser');
var debug;
var log;


// ########################
// #### Instance setup ####
// ########################

function instance(system, id, config) {
    var self = this;

    // super-constructor
    instance_skel.apply(this, arguments);

    self.initActions(); // export action

    return self;
}

// Return config fields for web config
instance.prototype.config_fields = function () {
    var self = this;

    return [
        {
            type : 'text',
            id   : 'info',
            width: 12,
            label: 'Information',
            value: 
              `<div style='margin-left: 20px;padding-left: 10px;border-left: 3px #BBBBBB solid'> 
              This module is for Livemind Recorder NDI recording software. To confiure, 
              add the <b>IP address</b> and <b>port</b> of the machine where Livemind Recorder is running.
              Multiple instances of the module can be added each pointing to a different
              IP address to control multiple instances of Recorder.
              <br><br>
              <b>Note</b>: If Recorder is running on a separate machine from 
              Companion you will need to create exceptions in your operating system's 
              firewall on BOTH machines at the port number you set.</div> `
        },
        {
            type    : 'textinput',
            id      : 'host',
            label   : 'IP Address (Default: 127.0.0.1)',
            width   : 6,
            default : '127.0.0.1',
            required: true,
            regex   : self.REGEX_IP
        },
        {
            type    : 'number',
            id      : 'port',
            label   : 'TCP Port (Default: 9099)',
            width   : 4,
            default : 9099,
            required: true,
            regex   : self.REGEX_PORT
        },
        {
            type    : 'number',
            id      : 'pollInterval',
            label   : 'Polling Interval in ms (Default: 250)',
            width   : 5,
            min     : 15,
            max     : 10000,
            default : 250,
            required: true,
            regex   : self.REGEX_FLOAT_OR_INT
        },
        {
            type   : 'checkbox',
            id     : 'debug',
            width  : 12,
            label  : 'Enable debug to log window',
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

    self.debug('[Livemind Recorder] Destroy', self.id);
}

// Initalize module
instance.prototype.init = function () {
    var self = this;

    debug = self.debug;
    log = self.log;

    self.setVariableDefinitions(self.getVariables());
    self.initPresets();
    self.initTCP();
}

// Initialize TCP connection
instance.prototype.initTCP = function () {
    var self = this;
    var receivebuffer = '';

    if (self.socket !== undefined) {
        self.log('warn', '[Livemind Recorder] Killing existing socket connections');
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
            self.log('error', '[Livemind Recorder] Network error: ' + err.message);
        });

        self.socket.on('connect', function () {
            console.log('Socket Message: ' + self.socket.message)
            self.debug("Connected");
            self.log('info', '[Livemind Recorder] Connected to Livemind Recorder at IP ' + self.config.host + ' on port ' + self.config.port);
        });
        
        // separate buffered stream into lines with responses
		self.socket.on('data', function (chunk) {
			var i = 0,
				line = '',
				offset = 0
			receivebuffer += chunk

			while ((i = receivebuffer.indexOf('\r', offset)) !== -1) {
				line = receivebuffer.substr(offset, i - offset)
				offset = i + 1
				self.socket.emit('receiveline', line.toString())
			}

			receivebuffer = receivebuffer.substr(offset)
		});

		self.socket.on('receiveline', function (line) {
			if (line !== undefined || !isNull(line)) {
				self.log('debug', '[Livemind Recorder] Data received: ' + line)
                
                try {
                    var response = xmlParser.parse(line)
                }
                catch(err) {
                    self.log('error', '[Livemind Recorder] XML Parser error: ' + err.message)
                }
                
                console.log(response);
                self.debug('[Livemind Recorder] Data recieved: ' + response.version)
                self.setVariable('version', '1234');
			} else {
				self.log('error', '[Livemind Recorder] Data received was undefined or null')
			}
		});
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
    self.log('debug', '[Livemind Recorder] Update Config Saved.')

    if (resetConnection === true || self.socket === undefined) {
        self.initTCP();
        self.log('debug', '[Livemind Recorder] Update Config: Reinitialized socket')
    }
   
}

// ########################
// #### Define Actions ####
// ########################

instance.prototype.CHOICES_SLOT = [
    { id: '0', label: 'All Connected Slots' },
    { id: '1', label: 'Slot 1' },
    { id: '2', label: 'Slot 2' },
    { id: '3', label: 'Slot 3' },
    { id: '4', label: 'Slot 4' },
    { id: '5', label: 'Slot 5' },
    { id: '6', label: 'Slot 6' },
    { id: '7', label: 'Slot 7' },
    { id: '8', label: 'Slot 8' },
    { id: '9', label: 'Slot 9' },
    { id: '10', label: 'Slot 10' },
    { id: '11', label: 'Slot 11' },
    { id: '12', label: 'Slot 12' },
    { id: '13', label: 'Slot 13' },
    { id: '14', label: 'Slot 14' },
    { id: '15', label: 'Slot 15' },
    { id: '16', label: 'Slot 16' },
];

instance.prototype.CHOICES_SLOT_NOALL = [
    { id: '1', label: 'Slot 1' },
    { id: '2', label: 'Slot 2' },
    { id: '3', label: 'Slot 3' },
    { id: '4', label: 'Slot 4' },
    { id: '5', label: 'Slot 5' },
    { id: '6', label: 'Slot 6' },
    { id: '7', label: 'Slot 7' },
    { id: '8', label: 'Slot 8' },
    { id: '9', label: 'Slot 9' },
    { id: '10', label: 'Slot 10' },
    { id: '11', label: 'Slot 11' },
    { id: '12', label: 'Slot 12' },
    { id: '13', label: 'Slot 13' },
    { id: '14', label: 'Slot 14' },
    { id: '15', label: 'Slot 15' },
    { id: '16', label: 'Slot 16' },
];

instance.prototype.initActions = function () {
    var self = this;
    var actions = {};

    actions['startRecordingSlot'] = {
        label: 'Start Recording in a Slot',
        options: [
            {
                type   : 'multiselect',
                label  : 'Select Slot [1-16, or All]',
                id     : 'slot',
                tooltip: 'Select the slot to start recording, or select All Coonected Slots',
                default: 0,
                choices: self.CHOICES_SLOT
            }
        ]
        // callback: function (action, bank) {
        //     var opt = action.options;
        //     self.sendCommand(`SET sample_action: ${opt.text}`);
        //}
    },
    actions['stopRecordingSlot'] = {
        label: 'Stop Recording in a Slot',
        options: [
            {
                type   : 'multiselect',
                label  : 'Select Slot [1-16, or All]',
                id     : 'slot',
                tooltip: 'Select the slot to stop recording, or select All Connected Slots',
                default: 0,
                choices: self.CHOICES_SLOT
            }
        ]

    },
    actions['startListenSlot'] = {
        label: 'Start Listening to a Slot',
        options: [
            {
                type   : 'dropdown',
                label  : 'Select Slot [1-16]',
                id     : 'slot',
                tooltip: 'Select the slot you want to listen to',
                choices: self.CHOICES_SLOT_NOALL
            }
        ]
    },
    actions['stopListenSlot'] = {
        label: 'Stop Listening to a Slot',
        options: [
            {
                type   : 'dropdown',
                label  : 'Select Slot [1-16]',
                id     : 'slot',
                tooltip: 'Select the slot you want to stop listening to',
                choices: self.CHOICES_SLOT_NOALL
            }
        ]
    }

    self.setActions(actions);
}

// Send command
instance.prototype.sendCommand = function (cmd) {
    var self = this;

    if (cmd !== undefined && cmd != '') {
        if (self.socket !== undefined && self.socket.connected) {
            self.log('debug', '[Livemind Recorder] Sending Command: ' + cmd)
            self.socket.send(cmd);
        } else {
            self.log('error', '[Livemind Recorder] Empty or undefined command in sendCommand')
        }
    }
}

// ##########################
// #### Define Feedbacks ####
// ##########################


// ########################
// #### Define Presets ####
// ########################

instance.prototype.initPresets = function () {
    var self = this;
    var presets = [];
  
    presets.push({
      category: 'Commands',
      label: 'startSlotRec',
      bank: {
        style  : 'text',
        text   : 'Record All Slots',
        size   : 'auto',
        color  : '16777215',
        bgcolor: self.rgb(0,0,0)
      },
      actions: [{
        action: 'startRecordingSlot',
        options: {
          slot: 0
        }
      }],
      feedbacks: [{

      }]
    });
  
  self.setPresetDefinitions(presets);
  }

// ##########################
// #### Define Variables ####
// ##########################

instance.prototype.getVariables = function() {
    var variables = [ 
        {
            label: 'Version of Livemind Recorder',
            name : 'version'
        },
        {
            label: 'API Version of Livemind Recorder',
            name : 'apiVersion'
        }
    ];

    return variables;
    
}



instance_skel.extendedBy(instance);
exports = module.exports = instance;
