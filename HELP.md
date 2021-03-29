# A module to control [Livemind Recorder](https://livemind.tv/recorder)

Livemind Recorder is a desktop application letting you monitor and record up to 16 NDI® sources, utilizing NewTek's latest NDI 4.5 recording capabilities. App features configurable multiview with multiple layouts, tally borders, VU-meters, audio monitoring, and available storage indicators.

## Configuration
Livemind Record offers an API through a simple TCP interface to control its operation. Companion can run on the same or a separate machine from Recorder.  

- In **Recorder**, connections are accepted on a port selected in the Settings dialog (`9099` by default ). Please make sure the port is set and the checkbox is enabled. *[Note: You may have to confgure this port in your operating system's firewall to allow Recorder to recieve connections from other devices on your network.]*
- In **Companion**: Add the module to your setup and fill in the following setup parameters:
  
  - **IP ADDRESS**:  This is the IP address of the machine running Livemind Recorder. If you are running on the same computer as Companion you may use `127.0.0.1`otherwise enter a valid IPv4 address in the same subnet. (Default: `127.0.0.1`)
  
  - **POLLING INTERVAL**: This is the time in milliseconds that Companion polls Recorder to check for any status changes. Setting the value too low here may have a performance impact on Companion and could cause unnecessary network traffic. Setting the value too high will cause Companion to not get notificaiton of status changes in Recorder in a timely manner. We find that a good compromise is **250ms** and does not effect performance and allows for timely ststus updates.   (Default: `250`)


## Available Actions
The following actions are available to assign to a button.

## Available Feedback
The following feedback has been implemented allowing Companion to indicate the status and states of Recorder

## Variables
The following variables are available to Companion. 

## Presets
Presets have been created for many commond commands so that creating buttons is easy.
  - **Record All**: Starts all channels available into **Record** mode. 
  - **Stop All**: Stops recording on al available channels.

That's it. Have fun and if you have any questions please submit an issue in this module's [GitHub Repository](https://github.com/bitfocus/companion-module-livemind-recorder) or leave a message on the official [Bitfocus Slack Channel](https://bitfocusio.slack.com/archives/CFG7HAN5N)