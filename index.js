// Index.js
// companion-module-livemind-recorder v1.0.0
// GitHub: https://github.com/bitfocus/companion-module-livemind-recorder

const tcp           = require('../../tcp');
const instance_skel = require('../../instance_skel');
const xmlParser     = require('fast-xml-parser');
const xmlOptions = {
    attributeNamePrefix   : "",
    ignoreAttributes      : false,
    parseNodeValue        : true,
    parseAttributeValue   : true,
    trimValues            : true
};

// ########################
// #### Instance setup ####
// ########################

function instance(system, id, config) {
    var self = this;
    var debug;
    var log;
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
    self.ICON_RECORD_ACTIVE = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAAC1klEQVR4nO2Z323bQAzG2S4Qj6A86UloMoGkCexMUHuC2BM4nsDuBLYniDNBdBNEhZ70VI2gEQoaH4uDYKD5czzBAH+AIci58E6feRTJI8P4Et/GlM+l2YyIciK6I6IEH6bDp+ZheducxlrjKAK5NFsS0aMnCNNDEIJgE+9vLNYxb5unyEuNK5BLs4KI9p4w7BlHIqrytukHY1kgHj8lojm+ZqEWedtUsdYcTSCXZnOIQxBmlbdN59KMvYW32g/Pa1is3zwub5vapRkLusU4gkiHGOuOIpAnTg9hDvhuPdhml2Cv2Xj/s4WQUURSFwiB+BnilHjgZ2yfj8Db6gGCvkKkB+0ArioQtsYbHqZEEH5FEP4MNezcwQ6Lfs9bVesZvmsZBmuIswkgDnnC1LA5wRxqqAkE7+GY0eH1vPyiOALbWMIme84cc6mg6UGPuG7wACF/6TVsbgZzBUdTIHkln7w8JiRz2Pbnug6B8OsmXgI4VZhmCtv8dku0tpmWB8liHa4hYs8QsSlzXJVA/+oolBcqaNoWtD1ILT/xkBpOw0vVBJKqPPEeQIPe89ZaYwLtRPGGi00t47B9o2WfInhQMbi/tjn0ajGXZm+IC7fIU7aBp1ghD/rD4uRtcx/Y/hnNLfaCKyd0h8CxqIdNSUBf/jP+02gKJL0aKQN+BbQttsS2Wl9ITSC0IHZScaO4DNEqrWBLOgU7zXaHdj9oghhx7gAiZoToB828DuXtsJ8dEtXXPBZe4naPByvhWR9lh0A883rbpaY4FCEPklxlgds9ejkrCPWedukJQqxcmj154iw0cywh5qmG/PITbBVu3leowosLxWaHeNOh5tpia/YQJ8phYuxzsQQi+cndEXlMNRhbQJCfXsyqIE6MGu/MWCerBd5C763GKxz9RDswFMY+m0+8Q8NLW0wOD6N5jGEYhmEYhmEYhmEYhmEYhmEYhmEYhmGEhIj+ArCo+6Y/6lj3AAAAAElFTkSuQmCC';
    self.ICON_RECORD_NOTAVAIL = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAAC1klEQVR4nO2ZzW0bQQyFmaQAq4R1BbFvuWVUgeQKIldgqQI/VyCnAksVWD7m5HUF3lQQpYMtIaDwaAwWAuKf4QgC+AHCQvKas/OW5Aw5EgQf4tMh5QMwFZHvInImIg0/ypafTkSeAGwO9YwHEQjAXESuMkGUnoIIBRtlf1Ox1gBQ+VHrCgQgichdJox6xlpEWgD94F4VSO+fiMiMP6tQlwDaWs9cTSAAM4ojFGYBYAtAvUVD7WvmNSrWb70PQAdABV3yPqFIqxrPXUWgTJyewqz42/UgzPahXnOT/c+SQlYRyV0gJuJ7ijPmhO8ZPm9Bw+qCgj5SpAvvBO4qEEPjmZMZMwk/Mgm/h452zmhHRT/XUPWaw2cvw+Sa4twUEEcyYTraHHEMN9wEovdozthyeZ5/UBxDbcxpUz1nxrFc+OJlOKWkb/abJuWUUs+8U9B80u3BX1vZ2rb9VdD+C54hZkvyJtvHlGRG2/lYxXERiC7fZBvAicMwE9rW1a3xCjMvD7KHfeK1RO4ZYjZtjKMS6AWWF0dn2/ASyN6u2/4kw2o4Dy91E8iq8iabgAd9Vr91HgN4h9iJFptexmn7xMu+VPCgNPh+bGP41WIAnpkXTrlPWRYeYsF90B8VB8B5Yfs7PEPsgVfd0K0K56KeNm0D+vCf+9+Np0DWq7ni9WdB22bLbLv1hTyLVV3ib63iZnFZolXa0pZ1Cm492x3e/aARc8SuA8icUaIfNM06lKfDfnZJXJd5PviYX+84sTE9663cMhFPs9722FMcqVRqdPQe4cS0l7OgUK9pl24oxIKhZeJceu6xjJqnGvbmRwwVnXDLKjztKTa3zDdb1lxLhmZPcaocJtY+F2soUr65W3Mf0w7uTRTkR5azWopTo8bbcaiT1cRV6LXVeMujn2oHhsahz+ab7NBwX4jZ4WE1jwmCIAiCIAiCIAiCIAiCIAiCIAiCIAiCkojIP4R+/EP6mAG0AAAAAElFTkSuQmCC';
    self.ICON_RECORD_STANDBY = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAABfElEQVR4nO3Zz03DMBgF8AcTMEI55WTRDUwngG7QDSgTVGxANygT0A2abFDkk09khGwAiuQeaMqfBvs5kd7vWLVfPz0ljv0FIiIyXBe5O6sKMwVwD+AGwFX4uAHwBmBrvdvn7C9bQFVhFgBWACa/fLUG8GS925Ba+4IeUFWY9ip5BXB75k9LAHPrXZOotZOoAYVwdgCmPUu0t9uMGRItoAjhHFBDumT8SbCMEA5CjWWUjv6AcgVVhWkX4vfIZa+td3Xkmh2sK2gxkpodrIDuRlKzgxVQjLWHUbMjeUBVYc7d7wyi9gHzKTZKjIBS7leS74VYj/mPFHWtd8n7Z91iKU7klFM+K6CXkdTsYAW0ibxeNKFmcpSAwsFyHbHkmnVYZY87dj3mQMdK690sfnensfdB838urvtQgybXRHHVY2TxbL17TNTWt3LOpNtb7SEM7H+yDWtOmaPPIbzVmIR16Xh4X4f1JvnMR0RERERERERERERERERERERGCcAnoENUyFoumfwAAAAASUVORK5CYII=';
    self.ICON_STOP = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAACXBIWXMAAAsSAAALEgHS3X78AAAAdElEQVR4nO3ZsQ3DQAwEwZfhxlSZv3QlzjeiDAszBRyBTbkAfuiYPr333v+8/54c//oM748Gek2OP4FAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBQECgIFgYJAQaAgUBAoCBTuePucN9wAAAAAAAAAAHigtdYFKNgFdrdHhIUAAAAASUVORK5CYII=';

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
            label  : 'Number of Slots to Create',
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
        {
            type   : 'text',
            id     : 'slotsToCreateInfo',
            width  : 7,
            label  : '',
            value  : 'This setting needs to match the "Grid Size" setting in Recorder settings.'
        },
        {
            type   : 'checkbox',
            id     : 'truncateSource',
            width  : 1,
            label  : 'Enable',
            default: false
        },
        {
            type   : 'text',
            id     : 'truncateSourceInfo',
            width  : 11,
            label  : 'Remove machine name from NDI source name.',
            value  : '"COMPUTER (Test)" becomes "(Test)"   [Default: Un-Checked]'
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
            width  : 1,
            label  : 'Enable',
            default: false
        },
        {
            type   : 'text',
            id     : 'verboseInfo',
            width  : 11,
            label  : 'Turn on verbose debug messages to log window.',
            value  : 'When enabled the commands sent and received from Livemind Recorder will be logged.  [Default: Un-Checked]'
        }
    ]
}

// Initalize module
instance.prototype.init = function () {
    var self = this;

    debug = self.debug;
    log = self.log;
    
    self.status(self.STATUS_UNKNOWN);

    self.createSlots(self.config.slotsToCreate);
    self.initVariables();
    self.initFeedbacks();
    self.initPresets();
    self.initTCP();
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
    self.log('info', '[Livemind Recorder] Updated Config Saved.')

    // recreate slots if needed
    if (resetConnection === true) {
        self.setChoices(self.config.slotsToCreate);
        self.createSlots(self.config.slotsToCreate);
    }

    if (resetConnection === true || self.socket === undefined) {
        self.log('warn', '[Livemind Recorder] Update Config: Reinitializing socket');
        self.initTCP();
        self.subscribeEvents();
    }

    self.initActions();
    self.initVariables();
    self.initPresets();
    self.initFeedbacks();
    self.updateStatus();
   
}

// Subscribe to events
instance.prototype.subscribeEvents = function () {
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
                //console.log(self.SLOTS)
                self.log('info', '[Livemind Recorder] Finished receiving all slots status')
                self.checkFeedbacks();
            }
            // Do nothing 
            // In the XML returned from the API, <status> tags surround a 
            // series of <slot ../> tags with slot status information
        }

        if (data.slot) {
            // if (self.config.verbose) { self.log('debug', '[Livemind Recorder] Slot status received') }
            let truncatedSource = ''

            try {
                //if (self.SLOTS[data.slot.id].recording !== data.slot.recording ||
               //     self.SLOTS[data.slot.id].source !== data.slot.source) {
                // Assign Recording status to SLOTS
                self.SLOTS[data.slot.id].recording = data.slot.recording
                self.setVariable('recordingSlot_' + data.slot.id, data.slot.recording)

                // Assign source to SLOTS
                if (self.config.truncateSource && data.slot.source !== 'none') {
                    truncatedSource = data.slot.source.substr(data.slot.source.indexOf('('));
                    self.SLOTS[data.slot.id].source = truncatedSource
                    self.setVariable('sourceSlot_' + data.slot.id, truncatedSource)
                } else {
                    self.SLOTS[data.slot.id].source = data.slot.source
                    self.setVariable('sourceSlot_' + data.slot.id, data.slot.source)
                }
            //}
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
            self.checkFeedbacks();
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
instance.prototype.updateStatus = function () {
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
            if (self.SLOTS[feedback.options.slot].recording === 1) {
                return true
            }
            return false
        }
    }

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
            if (self.SLOTS[feedback.options.slot].recording === 0) {
                return true
            } 
            return false
        }
    }

    feedbacks['slotNotReady'] = {
        type       : 'boolean',
        label      : 'Slot is Not Ready',
        description: 'If slot has no source and cannot record, set the button to this style',
        style      : {
            color  : self.rgb(110, 110, 110),
            bgcolor: self.rgb(60, 60, 60),
            png64  : self.ICON_RECORD_NOTAVAIL
        },
        options: [{
            type   : 'dropdown',
            label  : 'Select Slot [1-16]',
            id     : 'slot',
            tooltip: 'Select the slot this feedback monitors',
            choices: self.CHOICES_SLOT_NOALL
        }],
        callback: function (feedback) {
            if (self.SLOTS[feedback.options.slot].source === 'none' || 
                self.SLOTS[feedback.options.slot].source === '' ||
                self.SLOTS[feedback.options.slot].source === undefined)  {
                return true
            } 
            return false
        }
    }

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
            if (self.SLOTS[feedback.options.slot].listening === 1) {
                return true
            }
            return false
        }
    }

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
            if (self.SLOTS[feedback.options.slot].listening === 0) {
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
            bgcolor: self.rgb(0,102,102)
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
                bgcolor: self.rgb(0,102,102)
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
        bgcolor     : self.rgb(0,102,102)
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
            bgcolor: self.rgb(0,102,102)
        }
      }]
    });

    // Create a refresh all slots button
    presets.push({
        category: 'Commands',
        label   : 'refreshAllSlots',
        bank    : {
          style       : 'text',
          text        : 'Refresh all slot status',
          size        : 'auto',
          color       : self.rgb(255,255,255),
          bgcolor     : self.rgb(0,48,63),
        },
        actions: [{
          action : 'refreshStatus',
          options: {
          }
        }]
      });

    // Create a start recording button for each slot
    for (let index in self.SLOTS) {
        // Skip slot 0
        if (index !== '0') {
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
                    color       : self.rgb(255, 255, 255),
                    bgcolor     : self.rgb(40, 0, 0)
                },
                actions: [{
                    action : 'startRecordingSlot',
                    options: {
                        slot: [index]
                    }
                }],
                feedbacks: [{
                    type   : 'slotIsRecording',
                    options: {
                        slot: index
                    },
                    style: {
                        bgcolor: self.rgb(200, 0, 0)
                    }
                }]
            });
        }
    }

    // Create a stop recording button for each slot
    for (let index in self.SLOTS) {
        // Skip slot 0
        if (index !=='0') {
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
                    bgcolor     : self.rgb(40, 0, 0)
                },
                actions: [{
                    action : 'stopRecordingSlot',
                    options: {
                        slot: [index]
                    }
                }],
                feedbacks: [{
                    type   : 'slotIsStopped',
                    options: {
                        slot: index
                    },
                    style: {
                        bgcolor: self.rgb(40, 0, 0)
                    }
                }]
            });
        }
    }

    // Create record/stop toggle buttons for each slot
    for (let index in self.SLOTS) {
        // Skip slot 0
        if (index !=='0') {
            presets.push({
                category: 'Record Toggle',
                label   : `toggleRecSlot${index}`,
                bank    : {
                    style    : 'text',
                    text     : `REC ${index}\\n$(recorder:sourceSlot_${index})`,
                    size     : '14',
                    color    : self.rgb(255, 255, 255),
                    bgcolor  : self.rgb(40, 0, 0),
                    png64    : self.ICON_RECORD_ACTIVE,
                    alignment: 'center:bottom',
                    latch    : true
                },
                actions: [{
                    action: 'startRecordingSlot',
                    options: {
                        slot: [index]
                    }
                }],
                release_actions: [{
                    action: 'stopRecordingSlot',
                    options: {
                        slot: [index]
                    }
                }],
                feedbacks: [{
                    type: 'slotIsRecording',
                    options: {
                        slot: index
                    },
                    style: {
                        bgcolor: self.rgb(200, 0, 0)
                    }
                }, {
                    type: 'slotNotReady',
                    options: {
                        slot: index
                    },
                    style: {
                        color: self.rgb(110, 110, 110),
                        bgcolor: self.rgb(60, 60, 60),
                        png64: self.ICON_RECORD_NOTAVAIL
                    }
                }]
            });
        }
    }

    // Create Listening toggle buttons for each slot
    for (let index in self.SLOTS) {
        // Skip slot 0
        if (index !=='0') {
            presets.push({
                category: 'Listen',
                label   : `toggleListenSlot${index}`,
                bank    : {
                    style  : 'text',
                    text   : `Listen\\nSlot ${index}`,
                    size   : '18',
                    color  : self.rgb(255, 255, 255),
                    bgcolor: self.rgb(0, 0, 100),
                    latch  : true
                },
                actions: [{
                    action : 'startListenSlot',
                    options: {
                        slot: index
                    }
                }],
                release_actions: [{
                    action : 'stopListenSlot',
                    options: {
                        slot: index
                    }
                }],
                feedbacks: [{
                    type   : 'slotIsListening',
                    options: {
                        slot: index
                    },
                    style: {
                        bgcolor: self.rgb(0, 0, 240)
                    }
                }]
            });
        }
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

    for (let index in self.SLOTS) {
        // Skip slot 0
        if (index !=='0') {
            variables.push({ label: `Slot ${index} Recording`, name: `recordingSlot_${index}` });
            variables.push({ label: `Slot ${index} Source`, name: `sourceSlot_${index}` });
        }
    };

    self.setVariableDefinitions(variables);
    
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;

