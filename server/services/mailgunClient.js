import FormData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config(); // load .env variables if available

export async function sendCustomEmail(userEmail, firstName) {
    // Use environment variables - required for security
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
        throw new Error(
            "Missing MAILGUN_API_KEY or MAILGUN_DOMAIN environment variables",
        );
    }

    // Log which values are being used
    console.log("Using API Key:", apiKey ? "Configured" : "Missing");
    console.log(
        "Using Domain:",
        domain === FALLBACK_DOMAIN ? "Fallback" : "Env",
    );

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: "api",
        key: apiKey,
    });

    try {
        const data = await mg.messages.create(domain, {
            from: `Matric2Succes <team@${domain}>`,
            to: [`${firstName} <${userEmail}>`],
            subject: "Thank You for Using Matric2Succes! 🎓",
            html: `
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
            <h2 style="color: #00563b; margin-top: 0; font-weight: 600;">Hi ${firstName}!</h2>
            
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
      `,
        });

        console.log("✅ Custom email sent successfully:", data);
    } catch (error) {
        console.error("❌ Error sending custom email:", error);
    }
}

// Exported for other modules to call. No example invocation here.
