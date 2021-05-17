// Index.js
// companion-module-livemind-recorder
// GitHub: https://github.com/bitfocus/companion-module-livemind-recorder

var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var xmlParser     = require('fast-xml-parser');
var xmlOptions = {
    attributeNamePrefix   : "",
    ignoreAttributes      : false,
    parseNodeValue        : true,
    parseAttributeValue   : true,
    trimValues            : true
};
var debug;
var log;


// ########################
// #### Instance setup ####
// ########################

function instance(system, id, config) {
    var self = this;

    // super-constructor
    instance_skel.apply(this, arguments);

    self.SLOTS = []
    self.RECORDING_STATUS = [
        { id: 0, status: 'Stopped'},
        { id: 1, status: 'Recording'}
    ]

    self.initActions(); // export action

    return self;
}

// Create array of slots to hold state data
// numofSlots is the number of slots to create
instance.prototype.createSlots = function (numOfSlots) {
    var self = this;
    self.SLOTS = [];

    self.log('debug', '[Livemind Recorder] Creating slots')
    for (let index = 0; index <= numOfSlots; index++) {
        self.SLOTS.push({
            id: index,
            label: `Slot ${index}`,
            recording: 0,
            listening: 0
        })
    }
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
            type   : 'dropdown',
            id     : 'slotsToCreate',
            label  : 'Number of Slots to Create [1-16]',
            width  : 5,
            default: 9,
            choices: [
                { id: 4, label: '4 Slots (2x2)' },
                { id: 6, label: '6 Slots (3x2)' },
                { id: 9, label: '9 Slots (3x3)' },
                { id: 12, label: '12 Slots (4x3)' },
                { id: 16, label: '16 Slots (4x4)(2+8)(2+14)' }
            ] 
        },
        // {
        //     type    : 'number',
        //     id      : 'pollInterval',
        //     label   : 'Polling Interval in ms (Default: 500)',
        //     width   : 5,
        //     min     : 15,
        //     max     : 10000,
        //     default : 500,
        //     required: true,
        //     regex   : self.REGEX_FLOAT_OR_INT
        // },
        {
            type   : 'checkbox',
            id     : 'verbose',
            width  : 9,
            label  : 'Enable verbose debug messages to log window',
            default: false
        }
    ]
}

// Initalize module
instance.prototype.init = function () {
    var self = this;

    debug = self.debug;
    log = self.log;
   
    self.createSlots(self.config.slotsToCreate);
    self.initVariables();
    self.initFeedbacks();
    self.initPresets();
    self.initTCP();
    //self.updateStatus();
}

// Initialize TCP connection
instance.prototype.initTCP = function () {
    var self = this;
    var receiveBuffer = '';

    if (self.socket !== undefined) {
        self.log('warn', '[Livemind Recorder] Killing existing socket connections');
        self.socket.destroy();
        self.setVariable('status', 'Not Connected');
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
            self.debug('Network error', err);
            self.setVariable('status', 'Error');
            self.log('error', '[Livemind Recorder] Network error: ' + err.message);
        });

        self.socket.on('connect', function () {
            self.debug('Connected');
            self.setVariable('status', 'Connected');
            self.log('info', '[Livemind Recorder] Connected to Livemind Recorder at IP ' + self.config.host + ' on port ' + self.config.port);
            self.updateStatus();
        });
        
        // separate buffered stream into lines with responses
		self.socket.on('data', function (chunk) {
			var i = 0,
		        line = '',
				offset = 0
			receiveBuffer += chunk

			while ((i = receiveBuffer.indexOf('\r\n', offset)) !== -1) {
				line = receiveBuffer.substr(offset, i - offset)
				offset = i + 1
				self.socket.emit('receiveline', line.toString())
			}

			receiveBuffer = receiveBuffer.substr(offset)
		});
        
		self.socket.on('receiveline', function (line) {
			if (line !== undefined || line !== '') {
			    if (self.config.verbose) { self.log('debug', '[Livemind Recorder] Data received: ' + line) }

               try {
                    var response = xmlParser.parse(line, xmlOptions, false);
                    console.log(response)
                }
                catch(err) {
                    self.log('error', '[Livemind Recorder] XML Parser error: ' + err.message)
                }

                self.incomingData(response);

			} else {
				self.log('error', '[Livemind Recorder] Data received was undefined or null')
			}
		});
	}
}

// When module gets deleted
instance.prototype.destroy = function () {
    var self = this;

    if (self.socket !== undefined) {
        self.sendCommand('<recording_unsubscribe uid="1234" />\r\n')
        self.setVariable('status', 'Not Connected')
        self.socket.destroy()
    }

    self.debug('[Livemind Recorder] Destroy', self.id);
}

// Update module after a config change
instance.prototype.updateConfig = function (config) {
    var self = this;
    var resetConnection = false;

    // check if host IP has updated
    if (self.config.host != config.host) {
        resetConnection = true;
    }

    // check if host Port has updated
    if (self.config.port != config.port) {
        resetConnection = true;
    }

    // check if number of slots had changed
    if (self.config.slotsToCreate != config.slotsToCreate) {
        resetConnection = true;
    }

    // save new config
    self.config = config;
    self.log('info', '[Livemind Recorder] Update Config Saved.')

    if (resetConnection === true || self.socket === undefined) {
        self.log('info', '[Livemind Recorder] Update Config: Reinitializing socket');
        self.initTCP();
    }

    // recreate slots if needed
    if (resetConnection === true) {
        self.createSlots(self.config.slotsToCreate);
    }
    self.initVariables();
    self.initPresets();
    self.initFeedbacks();
    self.updateStatus();
   
}

// Subscribe to events
instance.prototype.subscribeEvents = function() {
    var self = this;
    var cmd = '<recording_subscribe uid="' + Date.now() + '" />\r\n'
    self.sendCommand(cmd)
    self.log('debug', '[Livemind Recorder] Subscribed to events sent')
}

// Deal with incoming data
instance.prototype.incomingData = function (data) {
    var self = this;

    if (data !== undefined || data !== '') {

        if (data.hello) {
            self.setVariable('version', data.hello.release);
            self.setVariable('apiVersion', (data.hello.protocol = 1 ? '1.0.0' : data.hello.protocol));
            self.subscribeEvents();
        }

        // yes suces is spelled wrong, this is how the API returns it
        // Lets check for both spellings
        if (data.succes || data.success) {
            self.log('info', '[Livemind Recorder] Command success')
        }

        if (data.failure) {
            self.log('error', '[Livemind Recorder] Command failure: ' + data.failure.reason)
        }

        if (data.status) {
            if (data.status.uid) {
                self.log('info', '[Livemind Recorder] Getting all active slots status')
            }
            // Do nothing 
            // In the XML returned from the API, <status> tags surround a 
            // series of <slot ../> tags with slot status information
        }

        if (data.slot) {
           // if (self.config.verbose) { self.log('debug', '[Livemind Recorder] Slot status received') }
            self.SLOTS[data.slot.id - 1].recording = data.slot.recording
            self.setVariable('recordingSlot_' + data.slot.id, data.slot.recording)
        }

        if (data.recording) {
            self.log('debug', '[Livemind Recorder] Recording status update received')
            self.SLOTS[data.recording.slot - 1].recording = data.recording.state
            self.setVariable('recordingSlot_' + data.recording.slot, data.recording.state)
        }

        if (data.recording_all) {
            self.log('debug', '[Livemind Recorder] Recording ALL status update received')
            self.SLOTS[0].recording = data.recording_all.state
            self.setVariable('recordingSlot_0', data.recording_all.state)
            
            // Force a refresh all to get status of other slots
            self.updateStatus();
        }

    } else {
        self.log('error', '[Livemind Recorder] No data in socket recieve')
    }
}


// ########################
// #### Define Actions ####
// ########################

instance.prototype.CHOICES_SLOT = [
    { id: 0, label: 'All Connected Slots' },
    { id: 1, label: 'Slot 1' },
    { id: 2, label: 'Slot 2' },
    { id: 3, label: 'Slot 3' },
    { id: 4, label: 'Slot 4' },
    { id: 5, label: 'Slot 5' },
    { id: 6, label: 'Slot 6' },
    { id: 7, label: 'Slot 7' },
    { id: 8, label: 'Slot 8' },
    { id: 9, label: 'Slot 9' },
    { id: 10, label: 'Slot 10' },
    { id: 11, label: 'Slot 11' },
    { id: 12, label: 'Slot 12' },
    { id: 13, label: 'Slot 13' },
    { id: 14, label: 'Slot 14' },
    { id: 15, label: 'Slot 15' },
    { id: 16, label: 'Slot 16' },
];

instance.prototype.CHOICES_SLOT_NOALL = [
    { id: 1, label: 'Slot 1' },
    { id: 2, label: 'Slot 2' },
    { id: 3, label: 'Slot 3' },
    { id: 4, label: 'Slot 4' },
    { id: 5, label: 'Slot 5' },
    { id: 6, label: 'Slot 6' },
    { id: 7, label: 'Slot 7' },
    { id: 8, label: 'Slot 8' },
    { id: 9, label: 'Slot 9' },
    { id: 10, label: 'Slot 10' },
    { id: 11, label: 'Slot 11' },
    { id: 12, label: 'Slot 12' },
    { id: 13, label: 'Slot 13' },
    { id: 14, label: 'Slot 14' },
    { id: 15, label: 'Slot 15' },
    { id: 16, label: 'Slot 16' },
];

// Define actions
instance.prototype.initActions = function () {
    var self = this;
    var actions = {};

    actions['startRecordingSlot'] = {
        label: 'Start Recording Slot',
        options: [
            {
                type        : 'multiselect',
                label       : 'Select Slot [1-16, or All]',
                id          : 'slot',
                tooltip     : 'Select the slot to start recording, or select All Coonected Slots. \r\nMinimum selection is 1 item, add one item to remote the first item.',
                default     : [ 0 ],
                choices     : self.CHOICES_SLOT,
                minSelection: 1
            }
        ]
        // callback: function (action, bank) {
        //     var opt = action.options;
        //     self.sendCommand(`SET sample_action: ${opt.text}`);
        //}
    },
    actions['stopRecordingSlot'] = {
        label: 'Stop Recording Slot',
        options: [
            {
                type        : 'multiselect',
                label       : 'Select Slot [1-16, or All]',
                id          : 'slot',
                tooltip     : 'Select the slot to stop recording, or select All Connected Slots \r\nMinimum selection is 1 item, add one item to remote the first item.',
                default     : [ 0 ],
                choices     : self.CHOICES_SLOT,
                minSelection: 1
            }
        ]
    },
    actions['startListenSlot'] = {
        label: 'Start Listening Slot',
        options: [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16]',
                id          : 'slot',
                tooltip     : 'Select the slot you want to listen to',
                choices     : self.CHOICES_SLOT_NOALL
            }
        ]
    },
    actions['stopListenSlot'] = {
        label: 'Stop Listening Slot',
        options: [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16]',
                id          : 'slot',
                tooltip     : 'Select the slot you want to stop listening to',
                choices     : self.CHOICES_SLOT_NOALL
            }
        ]
    },
    actions['refreshStatus'] = {
        label: 'Refresh',
        options: [
            {
                type   : 'text',
                label  : 'No options for the command',
                id     : 'slot',  // Need to send 'fake' slot over to make 
                default: 0        // switch statement make sense in action funciton
            }
        ]
    }

    self.setActions(actions);
}

// Carry out the actions of a button press
instance.prototype.action = function (action) {
    var self = this;
    var cmd;
    var options = action.options;
    console.log(util.inspect(action))

    // Parse Command 
    if (options.slot !== undefined || options.slot !== '') {

        switch (action.action) {

            case 'startRecordingSlot':
                if (options.slot[0] === 0) {
                    cmd = '<recording_start slot="0" uid="' + Date.now() + '" />\r\n'
                } else {
                    cmd = ''
                    options.slot.forEach(element => {
                        cmd += '<recording_start slot="' + element + '" uid="' + Date.now() + Math.floor(Math.random() * 100) + '" />\r\n'
                    });
                }
                break;

            case 'stopRecordingSlot':
                if (options.slot[0] === 0) {
                    cmd = '<recording_stop slot="0" uid="' + Date.now() + '" />\r\n'
                } else {
                    cmd = ''
                    options.slot.forEach(element => {
                        cmd += '<recording_stop slot="' + element + '" uid="' + Date.now() + Math.floor(Math.random() * 100) + '" />\r\n'
                    });
                }
                break;

            case 'startListenSlot':
                cmd = '<listen slot="' + options.slot + '" uid="' + Date.now() + '" />\r\n'
                // Must be set manually as this status is not returned from the API
                self.SLOTS[options.slot].listening = 1;
                break;

            case 'stopListenSlot':
                cmd = '<listen_off slot="' + options.slot + '" uid="' + Date.now() + '" />\r\n'
                // Must be set manually as this status is not returned from the API
                self.SLOTS[options.slot].listening = 0;
                break;

            case 'refreshStatus':
                cmd = '<status slot="0" uid="' + Date.now() + '" />\r\n'
                break;
        }

    } else {
        self.log('error', '[Livemind Recorder] Slot not defined in command options')
    }

    // Send the command 
    if (cmd !== undefined) {
        self.sendCommand(cmd);
        cmd = ''
    }
    else {
        self.log('error', '[Livemind Recorder] Invalid command: ' + cmd);
    }

};

// Send command
instance.prototype.sendCommand = function (cmd) {
    var self = this;

    if (cmd !== undefined && cmd != '') {
        if (self.socket !== undefined){ //} && self.socket.connected) {
            if (self.config.verbose) { self.log('debug', '[Livemind Recorder] Sending Command: ' + cmd) }
            try {
                self.socket.send(cmd);
            }
            catch (err) {
                self.log('error', '[Livemind Recorder] Error sending command: ' + err.message)
            }
        } else {
            self.log('error', '[Livemind Recorder] Empty or undefined command in sendCommand')
        }
    }
}

instance.prototype.updateStatus = function updateStatus() {
    var self = this;
    var cmd = '<status slot="0" uid="' + Date.now() + '" />\r\n'
    self.sendCommand(cmd);
}

// ##########################
// #### Define Feedbacks ####
// ##########################

instance.prototype.initFeedbacks = function() {
    var self = this;
    var feedbacks = {};

    feedbacks['slotIsRecording'] = {
        label      : 'Slot is Recording',
        description: 'If Recording, set the button to this color.',
        options    : [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16, or All]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors, or select All Coonected Slots',
                default     : 0,
                choices     : self.CHOICES_SLOT
            },
            {
                type   : 'colorpicker',
                label  : 'Foreground color',
                id     : 'fg',
                default: self.rgb(255, 255, 255)
            },
            {
                type   : 'colorpicker',
                label  : 'Background color',
                id     : 'bg',
                default: self.rgb(255, 0, 0)
            },
        ]
    },
    feedbacks['slotIsStopped'] = {
        label      : 'Slot is Stopped',
        description: 'If Stopped, set the button to this color.',
        options    : [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16, or All]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors, or select All Coonected Slots',
                default     : 0,
                choices     : self.CHOICES_SLOT
            },
            {
                type   : 'colorpicker',
                label  : 'Foreground color',
                id     : 'fg',
                default: self.rgb(255, 255, 255)
            },
            {
                type   : 'colorpicker',
                label  : 'Background color',
                id     : 'bg',
                default: self.rgb(0, 0, 0)
            },
        ]
    },
    feedbacks['slotIsListening'] = {
        label      : 'Slot Listning',
        description: 'If Listning to Audio, set the button to this color.',
        options    : [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors',
                choices     : self.CHOICES_SLOT_NOALL
            },
            {
                type   : 'colorpicker',
                label  : 'Foreground color',
                id     : 'fg',
                default: self.rgb(255, 255, 255)
            },
            {
                type   : 'colorpicker',
                label  : 'Background color',
                id     : 'bg',
                default: self.rgb(0, 0, 255)
            },
        ]
    },
    feedbacks['slotIsStopListening'] = {
        label      : 'Slot Stop Listening',
        description: 'If Stopped Listening to Audio, set the button to this color.',
        options    : [
            {
                type        : 'dropdown',
                label       : 'Select Slot [1-16]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors',
                choices     : self.CHOICES_SLOT_NOALL
            },
            {
                type   : 'colorpicker',
                label  : 'Foreground color',
                id     : 'fg',
                default: self.rgb(255, 255, 255)
            },
            {
                type   : 'colorpicker',
                label  : 'Background color',
                id     : 'bg',
                default: self.rgb(0, 0, 0)
            },
        ]
    };

    self.setFeedbackDefinitions(feedbacks);

}

instance.prototype.feedback = function (feedback, bank) {
    var self = this;

}

// ########################
// #### Define Presets ####
// ########################

instance.prototype.initPresets = function () {
    var self = this;
    var presets = [];
  
    presets.push({
        category: 'Commands',
        label   : 'startAllSlotRec',
        bank    : {
            style  : 'text',
            text   : 'Record All Slots',
            size   : 'auto',
            color  : '16777215',
            bgcolor: self.rgb(0, 0, 0)
        },
        actions: [{
            action : 'startRecordingSlot',
            options: {
                slot: [ 0 ]
            }
        }],
        feedbacks: [
            {
                type   : 'slotIsRecording',
                options: {
                    slot: 0
                }
            },
            {
                type   : 'slotIsStopped',
                options: {
                    slot: 0
                }
            }
        ]
    });

    presets.push({
      category: 'Commands',
      label   : 'stopAllSlotRec',
      bank    : {
        style  : 'text',
        text   : 'Stop Recording All Slots',
        size   : 'auto',
        color  : '16777215',
        bgcolor: self.rgb(0,0,0)
      },
      actions: [{
        action : 'stopRecordingSlot',
        options: {
          slot: [ 0 ]
        }
      }],
      feedbacks: [{
        type   : 'slotIsStopped',
        options: {
            slot: 0
        }
      }]
    });

    const numberOfSLOTS = self.SLOTS.length;
    for (let index = 1; index < numberOfSLOTS; index++) {
        presets.push({
            category: 'Record',
            label   : `startRecSlot${index}`,
            bank    : {
              style  : 'text',
              text   : `Record Slot ${index}`,
              size   : 'auto',
              color  : '16777215',
              bgcolor: self.rgb(0,0,0)
            },
            actions: [{
              action : 'startRecordingSlot',
              options: {
                slot: [ index ]
              }
            }],
            feedbacks: [{
              type   : 'slotIsRecording',
              options: {
                  slot: index
              }
            }]
        });
    }

    for (let index = 1; index < numberOfSLOTS; index++) {
        presets.push({
            category: 'Stop Recording',
            label   : `stopRecSlot${index}`,
            bank    : {
              style  : 'text',
              text   : `Stop Slot ${index}`,
              size   : 'auto',
              color  : '16777215',
              bgcolor: self.rgb(0,0,0)
            },
            actions: [{
              action : 'stopRecordingSlot',
              options: {
                slot: [ index ]
              }
            }],
            feedbacks: [{
              type   : 'slotIsStopped',
              options: {
                  slot: index
              }
            }]
        });
    }
 
  self.setPresetDefinitions(presets);
  }

// ##########################
// #### Define Variables ####
// ##########################

instance.prototype.initVariables = function() {
    var self = this;
    const numberOfSLOTS = self.SLOTS.length;

    var variables = [ 
        { label: 'Version of Livemind Recorder', name: 'version' },
        { label: 'API Version of Livemind Recorder', name: 'apiVersion' },
        { label: 'Connection status of this Recorder instance', name: 'status'},
        { label: 'Slot 0 (All) Recording', name: 'recordingSlot_0' }
    ];

    for (let index = 1; index < numberOfSLOTS; index++) {
        variables.push({ label: `Slot ${index} Recording`, name: `recordingSlot_${index}` });
    };

    self.setVariableDefinitions(variables);
    
}


instance_skel.extendedBy(instance);
exports = module.exports = instance;