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
  try {
    const { client, from } = getTwilio();
    if (!client) {
      console.log('[SMS:FALLBACK]', { to, body });
      return { sid: 'console-fallback' };
    }
    return await client.messages.create({ to, from, body });
  } catch (error) {
    console.error('SMS sending failed:', error);

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\n======================================================`);
      console.warn(`!!! [SMS WORKAROUND] Twilio SMS Sending Failed !!!`);
      console.warn(`To: ${to}`);
      console.warn(`Body: ${body}`);
      console.warn(`======================================================\n`);

      return { sid: 'mock-error-fallback', mock: true };
    }

    throw error;
  }
}

module.exports = { sendSms };
