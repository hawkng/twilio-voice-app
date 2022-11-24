# Twilio Voice JavaScript Demo - Call using Browser

Adapted from [Twilio blog](https://www.twilio.com/blog/programmable-voice-javascript-quickstart-demo-node) & [Tutorial](https://www.twilio.com/docs/voice/sdks/javascript/get-started)
* Can be deployed as Twilio Functions

* Add feature to allow specify the device name using URL Parameter
  - https://example.com/voice
  - By default, the app will generate a random name without parameter. 
  - https://example.com/voice?name=xxx
  - You can specify a preferred name using the URL parameter as shown
    
* Add recording feature with playback link 
  - Tick the checbox ***Recording*** next to the ***Call** button
  - Recording link will be available after the call ended in the Recording Log panel

* If callee rejected the incoming call, the caller's browser is not updated and the call status remains "ringing"
  - Added polling to check the status and auto disconnect the call after 30 seconds
  - Modify the constant **CALL_TIME_OUT** in ***/assets/quickstart.js***

![image](https://user-images.githubusercontent.com/29279065/203714749-a43f63b1-16c5-44a0-9477-4489622b4b83.png)
