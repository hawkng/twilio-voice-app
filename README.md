# Twilio Voice JavaScript Demo - Call using Browser

Adapted from [Twilio blog](https://www.twilio.com/blog/programmable-voice-javascript-quickstart-demo-node) & [Tutorial](https://www.twilio.com/docs/voice/sdks/javascript/get-started)
* Can be deployed as Twilio Functions

* Added option to allow specify the device name using URL Parameter
  - https://example.com/voice
  - By default, the app will generate a random name without parameter. 
  - https://example.com/voice?name=xxx
  - You can specify a preferred name using the URL parameter as shown
    
* Added recording option with playback link 
  - Tick the checbox ***Recording*** next to the ***Call** button
  - Recording link will be available after the call ended in the Recording Log panel
  - Recording is not available when calling to Flex Agent

* Added option to call the Flex Agent from the browser

## Setup
1. Create 2 TwilML Apps, for calling to another user on browser and to Flex respectively
   - Update environment variables **TWIML_APPLICATION_SID_APP** and **TWIML_APPLICATION_SID_FLEX** accordingly in **.env** 

2. Update constants in **assets/quickstart.js**
   - **CALL_TIME_OUT** : The time caller's browser shall wait before disconnect the call, should the callee reject the incoming call. 
                         `call.reject() will not change the call status, it remains as **ringing** and the caller will keep waiting`
   - **CALLER_ID** : The same Twilio number which you have specifiend in the environment variable

3. Flex Setup
   - Create a new Studio Flow with a **Send To Flex** widget connect to the **Incoming Call** option
   ![image](https://user-images.githubusercontent.com/29279065/203920658-4ef57ac6-3a6f-4826-8eb0-0fede4516933.png)

   - Copy the Studio Flow Webhook URL and update **TWIML_APPLCATION_SID_FLEX** voice configuration accordingly
   ![image](https://user-images.githubusercontent.com/29279065/203921009-f7bbc240-a597-463e-a888-7a7da4b413da.png)

   - Default flex plugin will generate error when the agent accept the task with incoming call
   
    ```
     {
        "message": "could not accept call",
        "wrappedError": "Request failed with status code 400",
        "type": "taskrouterSDK",
        "description": "Could not accept call: Request failed with status code 400",
        "context": "WorkerActions.AcceptTask",
        "severity": "normal",
        "twilioErrorCode": 45600
    }
    ```
    
    Customize a new Flex plugin and add the following code snippet to **init(flex, manager)** function fix it
    
    ```
    flex.Actions.replaceAction('AcceptTask', (payload, original) => {      
      payload.conferenceOptions.from = "anything";
      return original(payload);
    })
    ```
    
## Usage
* Click **Start Device (App)** to make call between browsers
* Click **Start Device (Flex)** to make call from browser to Flex Agent
  - The **phone number** input will make ReadOnly and set to a value with the const **CALLER_ID** defined in *assests/quickstart.js*
  - Recording option will be disabled as it is not supported when calling to Flex
  
![image](https://user-images.githubusercontent.com/29279065/203916271-ca127893-4d7c-4e06-8f32-4043bbcd2a29.png)

