
function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
}

exports.handler = function(context, event, callback) {
  // set these values in your .env file

  const twiml = new Twilio.twiml.VoiceResponse();

   if (event.To) {
    /*
     * Wrap the phone number or client name in the appropriate TwiML verb
     * if is a valid phone number
     */
    const attr = isAValidPhoneNumber(event.To) ? 'number' : 'client';
    const record = event.Recording ?'record-from-answer' : 'do-not-record';
    console.log("voice.....");
    console.log(event.Recording, record);

    const dial = twiml.dial({
      answerOnBridge: true,
      callerId: process.env.CALLER_ID,
      record : record
    });

    dial[attr]({}, (event.To).toLowerCase());
  }
  else {
    twiml.say('Thanks for calling!');
  }

  return callback(null, twiml);
};
