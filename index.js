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
    self.CHOICES_SLOT = []
    self.CHOICES_SLOT_NOALL = []
    self.RECORDING_STATUS = [
        { id: 0, status: 'Stopped'},
        { id: 1, status: 'Recording'}
    ]

    // Define icons
    self.ICON_RECORD_ACTIVE = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAADPElEQVR4nO2aMW7bQBBFx8kFGCBAXKpjRUQ6AaUbSF262F26OCdQWKWUcwLLJ4huIPEEkqBKHesAQXiEYI2/BjHapSRqloyNeYCBiCFnh39nlruzS0o9V/+LPnmcRETUx89Nut+VHbv0RCcCQYwxEaUQpe+5dYO/nIgWXYjWqkB5nPSIaApxojMfN+IsiChL97sikIsHtCIQIuYO4kiQEdF9GxEVXKA8Tkz6PNSkUVNM6t2m+90mpP9BBYI4y5p0KpA2OVLIvmwfz6RIx57nefPMKKRIwQQ6Is4KaVJUBmv7FStxvbSDMwQy6Tl02AoqUhCBasQxL/MNkWIH61NYQFBjd+axG0SkN9IGwYPjJYzzI0TD+gxxCPeu8eyokoqWCG2K81baYB4n34noE7tsXmhCRD+I6MsF5k2KXZvBufJvy/Xt+w9X8z+/VxfYP0A0xTDPWbPoKdHr56TUMWzK8TQ2bQ0k50nSKfbVkVoZhJEShyr2MnY9gg9iSAt0w36v0NtSE8QqU9jmKcV9uAgxgfI4cS0ffgYSxzJFG1Ui+CKCZASl7HeB3hXtUcYN2uBjDvelMZIC8aXESnjc8TF2pJnYskZSID7LzSV7soYUbdX50phQE0VC2PvWUJL0HCkmRkiBXgUq0BFUoCOEFKjvWFSGYBOgGPeMpED8U/uRiLaC9n1s0VadL42RFIhHyxhLgdAsHPMtsciVFIjPRezWzlywDc7cs0PCfWmMdLnjL3O2QKmDl0AkeCptoORRnW+V6X73TqoR6UGaLxx7nrKEBJmnoM99uAhpge7Rs1VmGDQlU20OmzN2vYQPYogKhI08V7Qs0bMSIs1ha+n4v0x6MzHUrsbSsWC0pdch6jhNtp4zRI5rx2SV7nejC10/INREceJItagyWA8QCaf0dol7B8wGv2ci6P8zXW0cFoiGBSKq7yiN5JjP2LrS1FMdeHkbh5YTtp5LCLB1zH6HmCEPjzz/MreeLTjZ8UuyiAWMoJPQJzxaOx+Ux8ldw8GZU+JrJfo599H2ASp7Tuhzg2qjGbce2zoXZOnsjCLGp+oxPNeXqXr8ro3SiaIoiqIoiqIoiqIoiqIoiqJ0AxH9A3ws4ocwSlYLAAAAAElFTkSuQmCC';
    self.ICON_RECORD_STANDBY = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAAC40lEQVR4nO2awXHbMBBFf1KBS/BNJ43lCihXELsDuwInFWhUQawKrA6kVJCwAsnDk24sgSVkkPlMOBuItMUPyOPZdzLp0QL4XCwWC8Dp59O59Ckn00sAtwCuAIS/ZwAu+O8GwB5ADeAFwLY4VPU5+pldoHIyvQfwSEHeQhBsVRyqdc7+ZhOonEyDt3ynt4wheNK34lBtc/Q7uUDlZBqmzTOnk5Ig0ENxqJqU/U8qEMX5OTCdwtT5Qc9o40wbj7684rc3KUVKJhCD8K4TeLuEAa0ArIeCL0X+yrh1zNZ1qiCeRKABz3kCsHzrV6fNBcWyJPOkVAJtIjGnYcwYFVwZ7J8j3hRSgbsxtmPIBeIANuZ1wy+8F7Uxo4dake7Uq5tUIE6DXWQpD+L8Erc1p0hdasYj2VT7rDJE7iPiLNXiBGhzaV5fsg8y1AI9mueaQTkVT53U4FgfRiETiHEh5j3JchTa/s+L2BcJSg+KZco5tgOxNmRZu1KgwjxvU28D8M+LrEi2LyejFMi69YvQ9hC2rXc5xWxOIl+5erBtxbYkJ6FexT4cLtAALtAAKQWSBcpztqUUyAbKK6HtIWxbsgVCKZDdqatLrH3YtiRVA4gFKs3zBUsfSWEbdlm3fTkZmUCsw9jMWbpxPIJto1HWhNRBemWe5+VkGiuRSqDt+UAfRqEWaB3xooVyd91CmwvzumEfZEgF4smC/YJ/zsVYbZTQOWuzNlfq041URftdJDfZs2Y8agA8TtrE7BeH6nqM7RipEsWHyFQLA9qNWdn425j4DduUk/Lg8NjJA5jIvbpWzQL9IhKQoT4xsaQ+eu4TCawnb5m31O0gO+XbgkngsQsPScVBpssLMwZU9Uq250FkMnGQYzfPAdxEiutjWKb2nJasF6i4Ai1OPLtqa8/LnLfNznIFj3nMLWPMvCfG1AzoZa5DAMvZ7ihaGKv+3lHMMX0cx3Ecx3Ecx3Ecx3Ecx3Ec590A4DcpOPT+CT226QAAAABJRU5ErkJggg=='
    self.ICON_STOP = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAAAq0lEQVR4nO3ZsQ0CMQyGUYMY6KZyzyT0mYYRbiNo6P+CMwL03gCO8kWpXPCW05H5uvvxDc+x1jrsXuejBv0rgQKBgsvw/GtV7cNnbFV1mxo+HWhfa90nD+juyfG+WCJQIFAgUCBQIFAgUCBQIFAgUCBQIFAgUCBQIFAgUCBQIFAgUCBQIFAgUCBQML0X26b3Vq/F4ZjpQGMbz0/xxQKBAoEAAAAAAAB+X1U9AUnADP3h8e7aAAAAAElFTkSuQmCC'

    // Fill choices based off of number of slots to be created
    self.setChoices(self.config.slotsToCreate);

    self.initActions(); // export action

    return self;
}

// Setup the choices that are available based off of number of slots
instance.prototype.setChoices = function (numberOfSLOTS) {
    var self = this;
    self.CHOICES_SLOT = []
    self.CHOICES_SLOT_NOALL = []

    for (let index = 0; index <= numberOfSLOTS; index++) {
        if (index === 0) {
            self.CHOICES_SLOT.push({ id: index, label: 'All Connected Slots' });
        } else {
            self.CHOICES_SLOT.push({ id: index, label: `Slot ${index}` });
            self.CHOICES_SLOT_NOALL.push({ id: index, label: `Slot ${index}` });
        }
    }
}

// Create array of slots to hold state data
// numberOfSLOTS is the number of slots to create
instance.prototype.createSlots = function (numberOfSLOTS) {
    var self = this;
    self.SLOTS = [];

    self.log('debug', `[Livemind Recorder] Creating ${numberOfSLOTS} slots`);
    for (let index = 0; index <= numberOfSLOTS; index++) {
        self.SLOTS.push({
            id       : index,
            label    : `Slot ${index}`,
            source   : '',
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
            label  : 'Number of Slots to Create. This setting needs to match the "Grid Size" setting in Recorder settings.',
            width  : 5,
            default: 9,
            choices: [
                { id: 4, label: '4 Slots (2x2)' },
                { id: 6, label: '6 Slots (3x2)' },
                { id: 9, label: '9 Slots (3x3)' },
                { id: 12, label: '12 Slots (4x3)' },
                { id: 16, label: '16 Slots (4x4) (2+8) (2+14)' }
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
            self.log('error', '[Livemind Recorder] TCP Socket error: ' + err.message);
        });

        self.socket.on('connect', function () {
            self.debug('Connected');
            self.setVariable('status', 'Connected');
            self.log('info', '[Livemind Recorder] Connected to Livemind Recorder at IP ' + self.config.host + ' on port ' + self.config.port);
            //self.updateStatus();
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
                    //console.log(response)
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
        self.sendCommand('<recording_unsubscribe uid="' + Date.now() + '" />\r\n')
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
    if (self.config.host !== config.host) {
        resetConnection = true;
    }

    // check if host Port has updated
    if (self.config.port !== config.port) {
        resetConnection = true;
    }

    // check if number of slots had changed
    if (self.config.slotsToCreate !== config.slotsToCreate) {
        resetConnection = true;
    }

    // save new config
    self.config = config;
    self.log('info', '[Livemind Recorder] Update Config Saved.')

    if (resetConnection === true || self.socket === undefined) {
        self.log('warn', '[Livemind Recorder] Update Config: Reinitializing socket');
        self.initTCP();
    }

    // recreate slots if needed
    if (resetConnection === true) {
        self.setChoices(self.config.slotsToCreate);
        self.createSlots(self.config.slotsToCreate);
        self.status(self.STATUS_OK)
    }
    self.initActions();
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
    self.log('info', '[Livemind Recorder] Subscribe to record events sent')
}

// Deal with incoming data
instance.prototype.incomingData = function (data) {
    var self = this;

    if (data !== undefined || data !== '') {

        if (data.hello) {
            self.setVariable('version', data.hello.release);
            self.setVariable('apiVersion', (data.hello.protocol = 1 ? '1.0.0' : data.hello.protocol));
            self.subscribeEvents();
            self.updateStatus();
        }

        // yes 'succes' is spelled wrong, this is how the API returns it
        // Lets check for both spellings
        if (data.succes || data.success) {
            self.log('info', '[Livemind Recorder] Command success: uid=' + data.succes.uid)
            self.checkFeedbacks();
        }

        if (data.failure) {
            self.log('error', '[Livemind Recorder] Command failure: ' + data.failure.reason + ' / uid=' + data.failure.uid)
        }

        if (data.status || data.status === '') {
            if (data.status.uid) {
                self.log('info', '[Livemind Recorder] Receiving all slots status')
            } else {
                console.log(self.SLOTS)
                self.log('info', '[Livemind Recorder] Finished receiving all slots status')
            }
            // Do nothing 
            // In the XML returned from the API, <status> tags surround a 
            // series of <slot ../> tags with slot status information
        }

        if (data.slot) {
           // if (self.config.verbose) { self.log('debug', '[Livemind Recorder] Slot status received') }
           try {
            self.SLOTS[data.slot.id].recording = data.slot.recording
            self.setVariable('recordingSlot_' + data.slot.id, data.slot.recording)
            self.SLOTS[data.slot.id].source = data.slot.source
            self.setVariable('sourceSlot_' + data.slot.id, data.slot.source)
           } catch (err) {
               self.log('error', '[Livemind Recorder] Error Slot undefined. Does the "Number of Slots to Create" in module settings match the slots in the "Grid Size" in Recorder?')
               self.status(self.STATUS_ERROR, 'ERROR: Does the number of slots to create match the grid size in Recorder settings?');
               self.setVariable('status', 'Error');
           }
        }

        if (data.recording) {
            self.log('info', '[Livemind Recorder] Recording status update received')
            self.SLOTS[data.recording.slot].recording = data.recording.state;
            self.setVariable('recordingSlot_' + data.recording.slot, data.recording.state)
            self.checkFeedbacks();
        }

        if (data.recording_all) {
            self.log('debug', '[Livemind Recorder] Recording ALL status update received')
            self.SLOTS[0].recording = data.recording_all.state
            self.setVariable('recordingSlot_0', data.recording_all.state)
            
            // Force a refresh all to get status of other slots
            self.updateStatus();
        }

    } else {
        self.log('error', '[Livemind Recorder] No data received from socket')
    }
}


// ########################
// #### Define Actions ####
// ########################


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
                tooltip     : 'Select the slot to start recording, or select All Coonected Slots. \r\n(Minimum selection is 1 item, add one item to remove the first item.)',
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
                tooltip     : 'Select the slot to stop recording, or select All Connected Slots \r\n(Minimum selection is 1 item, add one item to remove the first item.)',
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
        label: 'Refresh status of all slots',
        options: [
            {
                type   : 'text',
                label  : 'No options for this command',
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

// Query the status of all active slots
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
        type       : 'boolean',
        label      : 'Slot is Recording',
        description: 'If Recording, set the button to this style',
        style      : {
            color  : self.rgb(255,255,255),
            bgcolor: self.rgb(200, 0, 0)
        },
        options    : [{
                type        : 'dropdown',
                label       : 'Select Slot [1-16, or All]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors, or select All Coonected Slots',
                default     : 0,
                choices     : self.CHOICES_SLOT
        }],
        callback: function (feedback) {
            if (self.SLOTS[feedback.options.slot].recording == 1) {
                return true
            }
            return false
        }
    },
    feedbacks['slotIsStopped'] = {
        type       : 'boolean',
        label      : 'Slot is Stopped',
        description: 'If Stopped, set the button to this style',
        style      : {
            color  : self.rgb(255, 255, 255),
            bgcolor: self.rgb(0, 0, 0)
        },
        options: [{
            type   : 'dropdown',
            label  : 'Select Slot [1-16, or All]',
            id     : 'slot',
            tooltip: 'Select the slot this feedback monitors, or select All Coonected Slots',
            default: 0,
            choices: self.CHOICES_SLOT
        }],
        callback: function (feedback) {
            if (self.SLOTS[feedback.options.slot].recording == 0) {
                return true
            } 
            return false
        }
    },
    feedbacks['slotIsListening'] = {
        type       : 'boolean',
        label      : 'Slot Listening',
        description: 'If Listning to Audio, set the button to this style.',
        style      : {
            color  : self.rgb(255, 255, 255),
            bgcolor: self.rgb(0, 0, 255)
        },
        options: [{
                type   : 'dropdown',
                label  : 'Select Slot [1-16]',
                id     : 'slot',
                tooltip: 'Select the slot this feedback monitors',
                choices: self.CHOICES_SLOT_NOALL
        }],
        callback: function (feedback) {
            if (self.SLOTS[feedback.options.slot].listening == 1) {
                return true
            }
            return false
        }
    },
    feedbacks['slotIsStopListening'] = {
        type       : 'boolean',
        label      : 'Slot Stop Listening',
        description: 'If Stopped Listening to Audio, set the button to this style.',
        style      : {
            color  : self.rgb(255, 255, 255),
            bgcolor: self.rgb(0, 0, 0)
        },
        options    : [{
                type        : 'dropdown',
                label       : 'Select Slot [1-16]',
                id          : 'slot',
                tooltip     : 'Select the slot this feedback monitors',
                choices     : self.CHOICES_SLOT_NOALL
        }],
        callback: function (feedback) {
            if (self.SLOTS[feedback.options.slot].listening == 0) {
                return true
            }
            return false
        }
    }

    self.setFeedbackDefinitions(feedbacks);
}

// ########################
// #### Define Presets ####
// ########################

instance.prototype.initPresets = function () {
    var self = this;
    var presets = [];
  
    // Create a start all slots recording button
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
                slot: [0]
            }
        }],
        feedbacks: [{
            type: 'slotIsRecording',
            options: {
                slot: 0
            },
            style : {
                bgcolor: self.rgb(200,0,0)
            }
        },
        {
            type: 'slotIsStopped',
            options: {
                slot: 0
            },
            style : {
                bgcolor: self.rgb(0,0,0)
            }
        }]
    });

    // Create a stop all slots recording button
    presets.push({
      category: 'Commands',
      label   : 'stopAllSlotRec',
      bank    : {
        style       : 'text',
        text        : 'Stop Recording All Slots',
        size        : 'auto',
        color       : '16777215',
        bgcolor     : self.rgb(0,0,0)
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
        },
        style : {
            bgcolor: self.rgb(0,0,0)
        }
      }]
    });

    // Create a start recording button for each slot
    const numberOfSLOTS = self.SLOTS.length;
    for (let index = 1; index < numberOfSLOTS; index++) {
        presets.push({
            category: 'Record',
            label   : `startRecSlot${index}`,
            bank    : {
              style       : 'png',
              text        : `Rec ${index}`,
              size        : '18',
              png64       : self.ICON_RECORD_ACTIVE,
              pngalignment: 'center:top',
              alignment   : 'center:bottom',
              color       : self.rgb(255,255,255),
              bgcolor     : self.rgb(0,0,0)
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
              },
              style : {
                  bgcolor: self.rgb(200,0,0)
              }
            }]
        });
    }

    // Create a stop recording button for each slot
    for (let index = 1; index < numberOfSLOTS; index++) {
        presets.push({
            category: 'Stop Recording',
            label   : `stopRecSlot${index}`,
            bank    : {
                style       : 'png',
                text        : `Stop ${index}`,
                size        : '18',
                png64       : self.ICON_STOP,
                pngalignment: 'center:top',
                alignment   : 'center:bottom',
                color       : '16777215',
                bgcolor     : self.rgb(0,0,0)
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
              },
              style : {
                  bgcolor: self.rgb(0,0,0)
              }
            }]
        });
    }

    // Create Listening toggle buttons for each slot
    for (let index = 1; index < numberOfSLOTS; index++) {
        presets.push({
            category: 'Listen',
            label   : `toggleListenSlot${index}`,
            bank    : {
              style  : 'text',
              text   : `Listen\\nSlot ${index}`,
              size   : '18',
              color  : self.rgb(255,255,255),
              bgcolor: self.rgb(0,0,100),
              latch  : true
            },
            actions: [{
              action : 'startListenSlot',
              options: {
                slot: index 
              }
            }],
            release_actions : [{
                action : 'stopListenSlot',
                options: {
                    slot : index
                }
            }],
            feedbacks: [{
              type   : 'slotIsListening',
              options: {
                  slot: index
              },
              style : {
                  bgcolor: self.rgb(0,0,240)
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
        if (index != 0) {
            variables.push({ label: `Slot ${index} Source`, name: `sourceSlot_${index}` });
        }
       
    };

    self.setVariableDefinitions(variables);
    
}


instance_skel.extendedBy(instance);
exports = module.exports = instance;

