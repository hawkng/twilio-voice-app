
exports.handler = async function(context, event, callback) {
    const client = context.getTwilioClient();
    const callSid = event.callSid;

    const resVoice = await client.recordings
                                 .list({callSid: callSid, limit: 50});
                                 //.then(recordings => recordings.forEach(r => console.log(r.sid)));

    console.log(resVoice);
    return callback(null, resVoice);
};
