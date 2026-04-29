const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    EMAIL_FROM,
  } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    transporter._from = SMTP_FROM || EMAIL_FROM || SMTP_USER;
  } else {
    transporter = {
      sendMail: async ({ to, subject, text, html }) => {
        console.log('[EMAIL:FALLBACK]', { to, subject, text, html });
        return { accepted: [to] };
      },
      _from: 'no-reply@example.com',
    };
  }

  return transporter;
}

async function sendEmail(to, subject, htmlOrText) {
  const t = getTransporter();
  const isHtml = /<[^>]+>/.test(htmlOrText || '');
  const mailOptions = {
    from: t._from,
    to,
    subject,
    ...(isHtml ? { html: htmlOrText } : { text: htmlOrText }),
  };
  return t.sendMail(mailOptions);
}

module.exports = { sendEmail };
