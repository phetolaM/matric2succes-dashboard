# Email Configuration Guide

## Overview
The system has two email sending mechanisms:
1. **Next.js API Routes** - Manual "Send Now" and auto-processing of due scheduled emails
2. **Express Backend Worker** - Background worker for scheduled emails (if running Express server)

## Setup SMTP Configuration

Add these variables to your `.env` file in the root directory:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Matric2Succes <no-reply@matric2succes.co.za>"
```

### Gmail Setup
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use the generated 16-character password as `SMTP_PASS`

### Other SMTP Providers
- **SendGrid**: `smtp.sendgrid.net` port 587
- **Mailgun**: `smtp.mailgun.org` port 587
- **Outlook**: `smtp-mail.outlook.com` port 587

## How It Works

### Scheduled Emails (10-minute delay)
1. New APS user registers → `scheduled=true`, `scheduledAt=now+10min`
2. The Next.js dashboard auto-checks every 30 seconds for due emails
3. When countdown reaches 0, the system automatically sends the email
4. Status updates from "Scheduled" to "Sent"

### Manual Send
Click the mail icon to send immediately - requires SMTP configuration.

## Troubleshooting

**Emails not sending?**
1. Check `.env` has correct SMTP credentials
2. Verify SMTP credentials by testing with a simple email client
3. Check browser console and terminal for error messages
4. For Gmail, ensure "Less secure app access" is OFF and use App Password

**Scheduled emails not auto-sending?**
- The dashboard page must be open for auto-processing to work
- Alternatively, run the Express backend server which has a background worker

**Check logs:**
```bash
# Next.js terminal should show:
"Email sent successfully: <messageId> to <email>"
# or errors like:
"Failed to send email: SMTP not configured..."
```

## Testing

1. Create a test user with scheduled email
2. Wait for countdown to reach 0
3. Verify email arrives in inbox
4. Check spam folder if not in inbox
