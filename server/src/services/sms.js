let twilioClient = null;

function getTwilio() {
  const { TWILIO_SID, TWILIO_TOKEN, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  const token = TWILIO_AUTH_TOKEN || TWILIO_TOKEN;
  if (twilioClient) return { client: twilioClient, from: TWILIO_FROM };
  if (TWILIO_SID && token && TWILIO_FROM) {
    twilioClient = require('twilio')(TWILIO_SID, token);
    return { client: twilioClient, from: TWILIO_FROM };
  }
  return { client: null, from: null };
}

async function sendSms(to, body) {
  const { client, from } = getTwilio();
  if (!client) {
    console.log('[SMS:FALLBACK]', { to, body });
    return { sid: 'console-fallback' };
  }
  return client.messages.create({ to, from, body });
}

module.exports = { sendSms };
