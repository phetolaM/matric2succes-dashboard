import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Build transporter from env or use a simple fallback (not recommended for production)
function createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
        ? Number(process.env.SMTP_PORT)
        : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });
    }

    // Fallback to direct send using ethereal (dev) or throw
    console.warn(
        "SMTP env vars not set. Nodemailer transporter cannot be created reliably."
    );
    return null;
}

const transporter = createTransporter();

export async function sendNodemailerEmail(userEmail, firstName) {
    if (!transporter) {
        throw new Error(
            "No SMTP transporter configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in env."
        );
    }

    const from =
        process.env.MAIL_FROM || `Matric2Succes <no-reply@matric2succes.co.za>`;
    const subject = "Thank You for Using Matric2Succes! 🎓";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #333333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="text-align: center;  background-color: #00563b;">
            <img src="https://matric2succes.co.za/logo.png" alt="Matric2Succes Logo" style="max-width: 100%; height: 100%;" />
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #00563b; margin-top: 0; font-weight: 600;">Hi ${
                firstName || "Student"
            }!</h2>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for using <strong style="color: #00563b;">Matric2Succes</strong>! We truly appreciate you taking the time to explore our platform.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              We hope our app helped you in finding courses you qualify for and assisted you in making the right decision for your future academic journey.
            </p>

            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #00563b; margin: 30px 0;">
              <h3 style="color: #00563b; margin-top: 0;">Spread the Word 📣</h3>
              <p style="margin-bottom: 15px; font-size: 15px;">
                If you found our platform helpful, please consider sharing it with friends, family, or classmates who might also benefit from discovering their educational opportunities.
              </p>

              <h3 style="color: #00563b; margin-top: 25px;">Stay Connected 📱</h3>
              <p style="margin-bottom: 0; font-size: 15px;">
                Follow us on Facebook for updates, tips, and more educational resources:
              </p>
              <a href="https://www.facebook.com/profile.php?id=61583215727466"
                 style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #00563b; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 15px;">
                Follow on Facebook
              </a>
            </div>

            <p style="font-size: 16px; margin-bottom: 25px;">
              <strong>Important:</strong> This is a one-off email to express our gratitude. You will not receive another email like this for future use of our platform.
            </p>

            <p style="font-size: 16px; color: #00563b; font-weight: 500;">
              Wishing you all the best in your educational journey!
            </p>

            <p style="font-size: 16px;">
              Warm regards,<br>
              <strong>The Matric2Succes Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 25px 30px; text-align: center; background-color: #f1f1f1; font-size: 14px; color: #666;">
            <p style="margin-bottom: 10px;">
              <a href="https://matric2succes.co.za" style="color: #00563b; text-decoration: none; font-weight: 500;">Visit Our Website</a> •
              <a href="https://www.facebook.com/profile.php?id=61583215727466" style="color: #00563b; text-decoration: none; font-weight: 500;">Facebook</a>
            </p>
            <p style="margin: 0; font-size: 13px;">
              © 2025 Matric2Succes. All rights reserved.<br>
              <span style="font-size: 12px; color: #888;">Empowering students to make informed educational decisions</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
        from,
        to: userEmail,
        subject,
        html,
    });

    console.log("Nodemailer: message sent:", info.messageId || info);
    return info;
}
