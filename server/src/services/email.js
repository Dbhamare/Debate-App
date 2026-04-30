const nodemailer = require('nodemailer');

let transporter = null;
const RESEND_API_URL = 'https://api.resend.com/emails';
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

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

function resolveApiFromAddress() {
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (hasValue(from)) return from;
  throw new Error('Email sender is not configured. Set RESEND_FROM or EMAIL_FROM.');
}

function resolveGmailFromAddress() {
  const from = process.env.GMAIL_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (hasValue(from)) return from;
  throw new Error('Gmail sender is not configured. Set GMAIL_FROM.');
}

function buildMailOptions(to, subject, content, from) {
  const isObjectContent = content && typeof content === 'object';
  const htmlOrText = isObjectContent ? content.html || content.text || '' : content;
  const isHtml = Boolean(isObjectContent ? content.html : /<[^>]+>/.test(htmlOrText || ''));

  return {
    from,
    to,
    subject,
    ...(isHtml ? { html: isObjectContent ? content.html : htmlOrText } : { text: htmlOrText }),
    ...(isObjectContent && content.text ? { text: content.text } : {}),
  };
}

function hasFullGmailConfig() {
  return [
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REFRESH_TOKEN,
  ].every(hasValue);
}

function resolveEmailProvider() {
  const provider = String(process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  if (['gmail', 'resend', 'smtp'].includes(provider)) return provider;
  if (hasFullGmailConfig()) return 'gmail';
  if (hasValue(process.env.RESEND_API_KEY)) return 'resend';
  return 'smtp';
}

function encodeHeader(value) {
  const clean = String(value || '').replace(/[\r\n]+/g, ' ').trim();
  return `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`;
}

function normalizeRecipients(to) {
  return Array.isArray(to) ? to.join(', ') : String(to || '');
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage({ from, to, subject, text, html }) {
  const headers = [
    `From: ${from}`,
    `To: ${normalizeRecipients(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
  ];

  if (html && text) {
    const boundary = `debate-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      text,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      `--${boundary}--`,
      '',
    ].join('\r\n');
  }

  return [
    ...headers,
    `Content-Type: ${html ? 'text/html' : 'text/plain'}; charset="UTF-8"`,
    'Content-Transfer-Encoding: 7bit',
    '',
    html || text || '',
  ].join('\r\n');
}

async function getGmailAccessToken() {
  if (!hasFullGmailConfig()) {
    throw new Error('Gmail API is not fully configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.');
  }

  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Gmail token refresh failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function sendWithGmail(mailOptions) {
  const accessToken = await getGmailAccessToken();
  const raw = base64UrlEncode(buildMimeMessage(mailOptions));

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Gmail send failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function sendWithResend(mailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!hasValue(apiKey)) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailOptions.from,
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      ...(mailOptions.html ? { html: mailOptions.html } : {}),
      ...(mailOptions.text ? { text: mailOptions.text } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend email failed with ${response.status}: ${body}`);
  }

  return response.json();
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
  const provider = resolveEmailProvider();

  if (provider === 'gmail') {
    return sendWithGmail(buildMailOptions(to, subject, content, resolveGmailFromAddress()));
  }

  if (provider === 'resend') {
    return sendWithResend(buildMailOptions(to, subject, content, resolveApiFromAddress()));
  }

  const t = getTransporter();
  const mailOptions = buildMailOptions(to, subject, content, t._from);
  return t.sendMail(mailOptions);
}

module.exports = { sendEmail, resolveFromAddress, sendWithGmail, sendWithResend };
