$(function () {
  const CALL_TIME_OUT = 30000; //30 seconds
  const CALLER_ID = '+13019234964';
  const speakerDevices = document.getElementById("speaker-devices");
  const ringtoneDevices = document.getElementById("ringtone-devices");
  const outputVolumeBar = document.getElementById("output-volume");
  const inputVolumeBar = document.getElementById("input-volume");
  const volumeIndicators = document.getElementById("volume-indicators");
  const callButton = document.getElementById("button-call");
  const outgoingCallHangupButton = document.getElementById("button-hangup-outgoing");
  const callControlsDiv = document.getElementById("call-controls");
  const audioSelectionDiv = document.getElementById("output-selection");
  const getAudioDevicesButton = document.getElementById("get-devices");
  const logDiv = document.getElementById("log");
  const incomingCallDiv = document.getElementById("incoming-call");
  const recordingCheckbox = document.getElementById("checkbox-recording");
  const logRecordingDiv = document.getElementById("log-recording");

  const incomingCallHangupButton = document.getElementById(
    "button-hangup-incoming"
  );
  const incomingCallAcceptButton = document.getElementById(
    "button-accept-incoming"
  );
  const incomingCallRejectButton = document.getElementById(
    "button-reject-incoming"
  );
  const phoneNumberInput = document.getElementById("phone-number");
  const incomingPhoneNumberEl = document.getElementById("incoming-number");
  const startupButtonApp = document.getElementById("startup-button-app");
  const startupButtonFlex = document.getElementById("startup-button-flex");

  let device;
  let token;
  let callSid;
  let callNotAnswered;
  // Event Listeners

  callButton.onclick = (e) => {
    e.preventDefault();
    makeOutgoingCall();
  };
  getAudioDevicesButton.onclick = getAudioDevices;
  speakerDevices.addEventListener("change", updateOutputDevice);
  ringtoneDevices.addEventListener("change", updateRingtoneDevice);


  // SETUP STEP 1:
  // Browser client should be started after a user gesture
  // to avoid errors in the browser console re: AudioContext
  startupButtonApp.addEventListener("click", ()=>startupClient('app'));
  startupButtonFlex.addEventListener("click", ()=>startupClient('flex'));

  // SETUP STEP 2: Request an Access Token
  async function startupClient(target) {
    //check identity

    log("Requesting Access Token..."+ target);

    try {
      const params = new URLSearchParams(window.location.search);
      const data = await $.getJSON("/token", {'name':params.get("name"), 'target' : target});
      log("Got a token.");
      token = data.token;
      setClientNameUI(data.identity);
      intitializeDevice(target); //allowRecording only if target is App, flex not allow recording
    } catch (err) {
      console.log(err);
      log("An error occurred. See your browser console for more information.");
    }
  }

  // SETUP STEP 3:
  // Instantiate a new Twilio.Device
  function intitializeDevice(target) {
    recordingCheckbox.checked = false;
    recordingCheckbox.disabled = (target=='app'); //allowRecording only if target is App, flex not allow recording


    if (target=='app') {
      recordingCheckbox.disabled = false;
      phoneNumberInput.value = '';
      phoneNumberInput.placeholder = '+15552221234 or john';
      phoneNumberInput.readOnly  = false;
    }
    else if (target=='flex') {
      recordingCheckbox.disabled = true;
      phoneNumberInput.value = CALLER_ID;
      phoneNumberInput.readOnly  = true;
    }

    logDiv.classList.remove("hide");
    logRecordingDiv.classList.remove("hide");

    log("Initializing device");
    device = new Twilio.Device(token, {
      logLevel:1,
      // Set Opus as our preferred codec. Opus generally performs better, requiring less bandwidth and
      // providing better audio quality in restrained network conditions.
      codecPreferences: ["opus", "pcmu"],
    });

    addDeviceListeners(device);

    // Device must be registered in order to receive incoming calls
    device.register();
  }

  // SETUP STEP 4:
  // Listen for Twilio.Device states
  function addDeviceListeners(device) {
    device.on("registered", function () {
      log("Twilio.Device Ready to make and receive calls!");
      callControlsDiv.classList.remove("hide");
    });

    device.on("error", function (error) {
      log("Twilio.Device Error: " + error.message);
    });

    device.on("incoming", handleIncomingCall);

    device.audio.on("deviceChange", updateAllAudioDevices.bind(device));

    // Show audio selection UI if it is supported by the browser.
    if (device.audio.isOutputSelectionSupported) {
      audioSelectionDiv.classList.remove("hide");
    }
  }

  // MAKE AN OUTGOING CALL

  async function makeOutgoingCall() {

    var params = {
      // get the phone number to call from the DOM
      To: phoneNumberInput.value,
    };

    if (recordingCheckbox.checked){
      params.Recording = true;
    }

    if (device) {
      callButton.disabled = true;
      recordingCheckbox.disabled = true;

      log(`Attempting to call ${params.To} ...`);

      // Twilio.Device.connect() returns a Call object
      const call = await device.connect({ params });
      console.log('call', call);

      let time_lapsed = 0;
      callNotAnswered = false;

      pollStatus = setInterval(function(){
        let callStatus = call.status();
        console.log('----call1', callStatus);
        time_lapsed += 5000;
        switch (callStatus){
          case 'ringing':
            if (time_lapsed >= CALL_TIME_OUT){
              callNotAnswered = true;
              clearInterval(pollStatus);
              log("Call not answered.");
              call.disconnect();
            }
            break;
          case 'open' :
          case 'closed' :
            console.log('clear interval');
            clearInterval(pollStatus);
            break;
        }
      },5000);
      // add listeners to the Call
      // "accepted" means the call has finished connecting and the state is now "open"
      call.on("accept", updateUIAcceptedOutgoingCall);
      call.on("disconnect", updateUIDisconnectedOutgoingCall);
      call.on("cancel", updateUIDisconnectedOutgoingCall);
      call.on("error", (err)=>{console.log("call error", err)});

      outgoingCallHangupButton.onclick = () => {
        log("Hanging up ...");
        call.disconnect();
      };

    } else {
      log("Unable to make call.");
    }
  }

  function updateUIAcceptedOutgoingCall(call) {
    log("Call in progress ..."+ call.parameters.CallSid);
    callSid = call.parameters.CallSid;
    callButton.disabled = true;
    outgoingCallHangupButton.classList.remove("hide");
    volumeIndicators.classList.remove("hide");
    bindVolumeIndicators(call);
  }

  async function getVoiceRecording(){

        let recordPolling = setInterval(async function () {
          console.log("polling call SID", callSid);
          const result = await $.getJSON("./get-voice-recording", {'callSid':callSid});
          console.log('recording',result);

          if (result.length>0){
            console.log("clear polling");
            let recordingUrl = `http://api.twilio.com/2010-04-01/Accounts/${result[result.length-1].accountSid}/Recordings/${result[result.length-1].sid}`
            let message = "<a target='_blank' href='" + recordingUrl + "'>Recording for call @ " + result[0].startTime.replace(".000Z","")  +"</a>"
            logRecordingDiv.innerHTML = `<p class="log-entry">&gt;${message} </p>` + logRecordingDiv.innerHTML;
            logRecordingDiv.scrollTop = logRecordingDiv.scrollHeight;
            clearInterval(recordPolling);
          }
      }, 3000);
  }

  function updateUIDisconnectedOutgoingCall() {
    log("Call disconnected.");
    console.log("Polling for recording status", callNotAnswered);
    recordingCheckbox.checked && !callNotAnswered && getVoiceRecording();
    callButton.disabled = false;
    recordingCheckbox.disabled = false;
    outgoingCallHangupButton.classList.add("hide");
    volumeIndicators.classList.add("hide");
  }

  // HANDLE INCOMING CALL

  function handleIncomingCall(call) {
    log(`Incoming call from ${call.parameters.From}`);

    //show incoming call div and incoming phone number
    incomingCallDiv.classList.remove("hide");
    incomingPhoneNumberEl.innerHTML = call.parameters.From;

    //add event listeners for Accept, Reject, and Hangup buttons
    incomingCallAcceptButton.onclick = () => {
      acceptIncomingCall(call);
    };

    incomingCallRejectButton.onclick = () => {
      rejectIncomingCall(call);
    };

    incomingCallHangupButton.onclick = () => {
      hangupIncomingCall(call);
    };

    // add event listener to call object
    call.on("cancel", handleDisconnectedIncomingCall);
    call.on("disconnect", handleDisconnectedIncomingCall);
    call.on("reject", handleDisconnectedIncomingCall);
  }

  // ACCEPT INCOMING CALL

  function acceptIncomingCall(call) {
    call.accept();

    //update UI
    log("Accepted incoming call.");
    incomingCallAcceptButton.classList.add("hide");
    incomingCallRejectButton.classList.add("hide");
    incomingCallHangupButton.classList.remove("hide");
  }

  // REJECT INCOMING CALL

  function rejectIncomingCall(call) {
    call.reject();
    log("Rejected incoming call");
    resetIncomingCallUI();
  }

  // HANG UP INCOMING CALL

  function hangupIncomingCall(call) {
    call.disconnect();
    log("Hanging up incoming call");
    resetIncomingCallUI();
  }

  // HANDLE CANCELLED INCOMING CALL

  function handleDisconnectedIncomingCall() {
    log("Incoming call ended.");
    resetIncomingCallUI();
  }

  // MISC USER INTERFACE

  // Activity log
  function log(message) {
    logDiv.innerHTML += `<p class="log-entry">&gt;&nbsp; ${message} </p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  function setClientNameUI(clientName) {
    var div = document.getElementById("client-name");
    div.innerHTML = `Your client name: <strong>${clientName}</strong>`;
  }

  function resetIncomingCallUI() {
    incomingPhoneNumberEl.innerHTML = "";
    incomingCallAcceptButton.classList.remove("hide");
    incomingCallRejectButton.classList.remove("hide");
    incomingCallHangupButton.classList.add("hide");
    incomingCallDiv.classList.add("hide");
  }

  // AUDIO CONTROLS

  async function getAudioDevices() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    updateAllAudioDevices.bind(device);
  }

  function updateAllAudioDevices() {
    if (device) {
      updateDevices(speakerDevices, device.audio.speakerDevices.get());
      updateDevices(ringtoneDevices, device.audio.ringtoneDevices.get());
    }
  }

  function updateOutputDevice() {
    const selectedDevices = Array.from(speakerDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.speakerDevices.set(selectedDevices);
  }

  function updateRingtoneDevice() {
    const selectedDevices = Array.from(ringtoneDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.ringtoneDevices.set(selectedDevices);
  }

  function bindVolumeIndicators(call) {
    call.on("volume", function (inputVolume, outputVolume) {
      var inputColor = "red";
      if (inputVolume < 0.5) {
        inputColor = "green";
      } else if (inputVolume < 0.75) {
        inputColor = "yellow";
      }

      inputVolumeBar.style.width = Math.floor(inputVolume * 300) + "px";
      inputVolumeBar.style.background = inputColor;

      var outputColor = "red";
      if (outputVolume < 0.5) {
        outputColor = "green";
      } else if (outputVolume < 0.75) {
        outputColor = "yellow";
      }

      outputVolumeBar.style.width = Math.floor(outputVolume * 300) + "px";
      outputVolumeBar.style.background = outputColor;
    });
  }

  // Update the available ringtone and speaker devices
  function updateDevices(selectEl, selectedDevices) {
    selectEl.innerHTML = "";

    device.audio.availableOutputDevices.forEach(function (device, id) {
      var isActive = selectedDevices.size === 0 && id === "default";
      selectedDevices.forEach(function (device) {
        if (device.deviceId === id) {
          isActive = true;
        }
      });

      var option = document.createElement("option");
      option.label = device.label;
      option.setAttribute("data-id", id);
      if (isActive) {
        option.setAttribute("selected", "selected");
      }
      selectEl.appendChild(option);
    });
  }
});
