const nodemailer = require('nodemailer');

let transporter = null;

function hasValue(value) {
  return String(value || '').trim() !== '';
}

function stripQuotes(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function extractEmailAddress(value) {
  const raw = stripQuotes(value);
  const match = raw.match(/<([^>]+)>/);
  return stripQuotes(match ? match[1] : raw);
}

function extractDisplayName(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(.+?)\s*<[^>]+>/);
  return stripQuotes(match ? match[1] : '');
}

function formatAddress(name, email) {
  const cleanEmail = extractEmailAddress(email);
  const cleanName = stripQuotes(name);
  return cleanName ? `"${cleanName}" <${cleanEmail}>` : cleanEmail;
}

function resolveFromAddress({ SMTP_HOST, SMTP_USER, SMTP_FROM, EMAIL_FROM }) {
  if (hasValue(SMTP_FROM)) return SMTP_FROM;

  const configuredFrom = EMAIL_FROM || SMTP_USER;
  const smtpUserEmail = extractEmailAddress(SMTP_USER);

  if (
    /gmail/i.test(String(SMTP_HOST || '')) &&
    hasValue(EMAIL_FROM) &&
    smtpUserEmail &&
    extractEmailAddress(EMAIL_FROM).toLowerCase() !== smtpUserEmail.toLowerCase()
  ) {
    return formatAddress(extractDisplayName(EMAIL_FROM) || 'Debate Platform', smtpUserEmail);
  }

  return configuredFrom;
}

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

  const smtpValues = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS];
  const hasAnySmtpConfig = smtpValues.some(hasValue);
  const hasFullSmtpConfig = smtpValues.every(hasValue);

  if (hasFullSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    transporter._from = resolveFromAddress({ SMTP_HOST, SMTP_USER, SMTP_FROM, EMAIL_FROM });
  } else if (process.env.NODE_ENV === 'production' || hasAnySmtpConfig) {
    throw new Error('SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
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

async function sendEmail(to, subject, content) {
  const t = getTransporter();
  const isObjectContent = content && typeof content === 'object';
  const htmlOrText = isObjectContent ? content.html || content.text || '' : content;
  const isHtml = Boolean(isObjectContent ? content.html : /<[^>]+>/.test(htmlOrText || ''));
  const mailOptions = {
    from: t._from,
    to,
    subject,
    ...(isHtml ? { html: isObjectContent ? content.html : htmlOrText } : { text: htmlOrText }),
    ...(isObjectContent && content.text ? { text: content.text } : {}),
  };
  return t.sendMail(mailOptions);
}

module.exports = { sendEmail, resolveFromAddress };
