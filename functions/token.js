
//  This is your new function. To start, set the name and path on the left.
function generateName(){
  const ADJECTIVES = [
    "Awesome",
    "Bold",
    "Creative",
    "Dapper",
    "Eccentric",
    "Fiesty",
    "Golden",
    "Holy",
    "Ignominious",
    "Jolly",
    "Kindly",
    "Lucky",
    "Mushy",
    "Natural",
    "Oaken",
    "Precise",
    "Quiet",
    "Rowdy",
    "Sunny",
    "Tall",
    "Unique",
    "Vivid",
    "Wonderful",
    "Xtra",
    "Yawning",
    "Zesty",
  ];

  const FIRST_NAMES = [
    "Anna",
    "Bobby",
    "Cameron",
    "Danny",
    "Emmett",
    "Frida",
    "Gracie",
    "Hannah",
    "Isaac",
    "Jenova",
    "Kendra",
    "Lando",
    "Mufasa",
    "Nate",
    "Owen",
    "Penny",
    "Quincy",
    "Roddy",
    "Samantha",
    "Tammy",
    "Ulysses",
    "Victoria",
    "Wendy",
    "Xander",
    "Yolanda",
    "Zelda",
  ];

  const LAST_NAMES = [
    "Anchorage",
    "Berlin",
    "Cucamonga",
    "Davenport",
    "Essex",
    "Fresno",
    "Gunsight",
    "Hanover",
    "Indianapolis",
    "Jamestown",
    "Kane",
    "Liberty",
    "Minneapolis",
    "Nevis",
    "Oakland",
    "Portland",
    "Quantico",
    "Raleigh",
    "SaintPaul",
    "Tulsa",
    "Utica",
    "Vail",
    "Warsaw",
    "XiaoJin",
    "Yale",
    "Zimmerman",
  ];

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return rand(ADJECTIVES) + rand(FIRST_NAMES) + rand(LAST_NAMES);

}


exports.handler = function(context, event, callback) {
  const { AccessToken } = Twilio.jwt;
  const { VoiceGrant } = AccessToken;

  const { ACCOUNT_SID } = context;
  // set these values in your .env file
  const { TWIML_APPLICATION_SID_APP, TWIML_APPLICATION_SID_FLEX, API_KEY, API_SECRET } = context;

  const accessToken = new AccessToken(ACCOUNT_SID, API_KEY, API_SECRET);
  let identity = event.name || generateName();
  let target = event.target || 'app';

  accessToken.identity = identity.toLowerCase();
  const grant = new VoiceGrant({
    outgoingApplicationSid: (target == 'app') ? TWIML_APPLICATION_SID_APP : TWIML_APPLICATION_SID_FLEX,
    incomingAllow: true,
  });
  accessToken.addGrant(grant);

  const response = new Twilio.Response();

  //Uncomment these lines for CORS support
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  response.appendHeader('Content-Type', 'application/json');
  response.setBody({
    identity: identity,
    token: accessToken.toJwt(),
  });

  return callback(null, response);
};
