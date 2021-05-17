# A module to control [Livemind Recorder v0.9.4.0](https://livemind.tv/recorder)

Livemind Recorder is a desktop application letting you monitor and record up to 16 NDI® sources, utilizing NewTek's latest NDI 4.5 recording capabilities. App features configurable multiview with multiple layouts, tally borders, VU-meters, audio monitoring, and available storage indicators.

## Configuration

Livemind Record offers an API through a simple TCP interface to control its operation. Companion can run on the same or a separate machine from Recorder.

- In **Recorder**, connections are accepted on a port selected in the Settings dialog (`9099` by default ). Please make sure the port is set and the checkbox is enabled. 
  
  _**Note**: You may have to confgure this port in your operating system's firewall to allow Recorder to recieve connections from other devices on your network. The machine where Companion is running will also need this port configured to allow traffic.]_
- In **Companion**: Add the module to your setup and fill in the following setup parameters:

  - **IP ADDRESS**: This is the IP address of the machine running Livemind Recorder. If you are running on the same computer as Companion you may use `127.0.0.1` otherwise enter a valid IPv4 address in the same subnet. (Default: `127.0.0.1`)

  - **PORT**: This is the TCP API port where Recorder is listenting for commands. This needs to match the port set in the Recorder settings dialog. (Default: `9099`)

  - **Number of Slots to Create**: Select the number of slots to create based off of the grid layout you are using Recorder. This should match the Grid Size setting in Recorder settings. Options: `(2x2, 3x2, 3x3, 4x3, 4x4, 2+8, 2+14)`

  - **Verbose Debug to Log**: Check this box to include verbose debug messages in the Companion log tab. Verbose will show the command and response from the API.
  
---
## Available Actions

The following actions are available to assign to a button.

Action                   | Description                  
-----------------------: | ---------------------------- 
**Start Recording Slot** | Starts recording in the specified slot number `[1-16]` or `All` connected channels
**Stop Recording Slot**  | Stops recording in the specified slot number `[1-16]` or `All` connected channels
**Start Listening Slot** | Starts listening to audio on the specified slot number `[1-16]`.   **Note:** Only one slot can be listented to at a time and the audio will come from the machine where Recorder is running
**Stop Listening Slot**  | Stops listening to audio on the specified slot `[1-16]` 
**Refresh**              | Forces a refresh of the current status of all record slots and updates feedback and variables in Companion 

---
## Available Feedback

The following feedback has been implemented allowing Companion to indicate the status and states of Recorder

Feedback          | Description                        
----------------- | ---------------------------------- 
 **Slot Recording**| Set the button color if a slot `[1-16 or All]` is recording
 **Slot Stopped**  | Set the button color if a slot `[1-16 or All]` is stopped (not recording) 
 **Slot Listening**| Set the button color if listening to slot `[1-16]` audio
 **Slot Stop Listening**| Set the button color when listening stops for slot `[1-16]` audio

---
## Variables

The following variables are available to Companion.

Variable                | Description 
----------------------- | ----------------------------------- 
**$(recorder:version)** | The current verison of the connected Recorder instance
**$(recorder:apiVersion)** | The API version of the connected Recorder instance
**$(recorder:status)**  | Connection status of Recorder. Possible values are: `Connected`, `Not Connected`, `Error`    
**$(recorder:recordingSlot_`x`)** | Recording status of a given slot. `x` is a slot numnber `[1-16]` Possible values are `0`- Not Recording, `1`- Recording, `undefined`- Slot not initialized

---
## Presets

Presets have been created for many commond commands so that creating buttons is easy.

Preset          | Description                                
--------------- | -------------------------------------------
**Record All**  | Starts recording on all available channels, with feedback to change background color
**Stop All**    | Stops recording on all available channels, with feedback to change background color 
**Record Slot `X`** | Starts recording on the indicated slot `[1-16]`
**Stop Slot `X`**   | Stops recording on the indicated slot `[1-16]`

---
### Notes
- It is reccomended to `disable` any instances of the Recorder module in Companion if the Recorder application is not open and running on the target computer. If the application is not open Companion will coninuously try to connect to the application causing repeated errors in the logfile as well as unecessary network traffic. You can create a button that toggles `enable/disable` of any instance of the Recorder module. 
- Multiple instances of the module can be added each pointing to a different IP address to control multiple instances of Recorder. 

---

That's it. Have fun and if you have any questions please submit an issue in this module's [GitHub Repository](https://github.com/bitfocus/companion-module-livemind-recorder) or leave a message on the official [Bitfocus Slack Channel](https://bitfocusio.slack.com/archives/CFG7HAN5N)
