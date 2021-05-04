# A module to control [Livemind Recorder v0.9.4.0](https://livemind.tv/recorder)

Livemind Recorder is a desktop application letting you monitor and record up to 16 NDI® sources, utilizing NewTek's latest NDI 4.5 recording capabilities. App features configurable multiview with multiple layouts, tally borders, VU-meters, audio monitoring, and available storage indicators.

## Configuration

Livemind Record offers an API through a simple TCP interface to control its operation. Companion can run on the same or a separate machine from Recorder.

- In **Recorder**, connections are accepted on a port selected in the Settings dialog (`9099` by default ). Please make sure the port is set and the checkbox is enabled. 
  
  _**Note**: You may have to confgure this port in your operating system's firewall to allow Recorder to recieve connections from other devices on your network. The machine where Companion is running will also need this port configured to allow traffic.]_
- In **Companion**: Add the module to your setup and fill in the following setup parameters:

  - **IP ADDRESS**: This is the IP address of the machine running Livemind Recorder. If you are running on the same computer as Companion you may use `127.0.0.1` otherwise enter a valid IPv4 address in the same subnet. (Default: `127.0.0.1`)
  
  - **PORT**: This is the TCP API port where Recorder is listenting for commands. This needs to match the port set in the Recorder settings dialog. (Default: `9099`)

  - **POLLING INTERVAL**: This is the time in milliseconds that Companion polls Recorder to check for status changes. Setting the value too low here may have a performance impact on Companion and could cause unnecessary network traffic. Setting the value too high will cause Companion to not get notificaiton of status changes from Recorder in a timely manner. We find that a good compromise is **250ms** and does not effect performance and allows for timely ststus updates. (Default: `250`)

---
## Available Actions

The following actions are available to assign to a button.

Action                        | Description                  
----------------------------: | ---------------------------- 
**startRecordingSlot**      | Starts recording in the specified slot number `[1-16]` or `0` starts recording on all connected channels 
**stopRecordingSlot**      | Stops recording in the specified slot number `[1-16]` or `0` stops recording on all connected channels
**startListeningSlot**     | Starts listening to audio on the specified slot number. Note: Only one slot can be listented to at a time and the audio will come from the machine where Recorder is running. 
**stopListeningSlot**      | Stops listening to audio on the specified slot. 
**refreshStatus**           | Forces a refresh of the current status of all record slots and updates feedback and variables in Companion 


---
## Available Feedback

The following feedback has been implemented allowing Companion to indicate the status and states of Recorder

Feedback          | Description                        
----------------- | ---------------------------------- 
 **slotStatus**  | Will indicate the status of the specified slot number [1-16]  

---
## Variables

The following variables are available to Companion.

Variable                | Description 
----------------------- | ----------------------------------- 
**$(recorder:version)** | The current verison of the connected Recorder instance
**$(recorder:status)**  | Connection status of Recorder. Possible values are: `Connected`, `Not-Connected`, `Error`       
**$(recorder:slot_status_`x`)** | Status of a given Recorder slot. `x` is a slot numnber `[1-16]`.
---
## Presets

Presets have been created for many commond commands so that creating buttons is easy.

Preset          | Description                                
--------------- | -------------------------------------------
**Record All**  | Starts recording on all available channels 
**Stop All**    | Stops recording on all available channels  

---

### Notes
It is reccomended to `disable` any instances of the Recorder module in Companion if the Recorder application is not open and running on the target computer. If the application is not open Companion will coninuously try to connect to the application causing repeated errors in the logfile as well as unecessary network traffic. You can create a button that toggles `enable/disable` of any instance of the Recorder module. 


That's it. Have fun and if you have any questions please submit an issue in this module's [GitHub Repository](https://github.com/bitfocus/companion-module-livemind-recorder) or leave a message on the official [Bitfocus Slack Channel](https://bitfocusio.slack.com/archives/CFG7HAN5N)
