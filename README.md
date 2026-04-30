Open 2 terminals.

1st terminal:

cd server

npm install

node src/server.js


2nd terminal:

cd client

npm install

npm run dev

## Email on Railway

Railway Free, Trial, and Hobby plans do not allow outbound SMTP, so Gmail SMTP can time out when password reset emails are sent. Use an HTTPS transactional email API instead.

Recommended Railway variables for Resend:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Debate Platform <reset@your-verified-domain.com>
```

`SMTP_*` variables can still be used locally or on Railway Pro, but `RESEND_API_KEY` takes precedence when it is set.
