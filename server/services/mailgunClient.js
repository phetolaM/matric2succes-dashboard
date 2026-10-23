import FormData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config();

export async function sendCustomEmail(userEmail, firstName) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
        throw new Error(
            "Missing MAILGUN_API_KEY or MAILGUN_DOMAIN environment variables",
        );
    }

    const mailgun = new Mailgun(FormData);
    const client = mailgun.client({ username: "api", key: apiKey });

    const data = await client.messages.create(domain, {
        from: `Matric2Succes <team@${domain}>`,
        to: [`${firstName || "Student"} <${userEmail}>`],
        subject: "Thank You for Using Matric2Succes! 🎓",
        html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto;">
                  <div style="text-align: center; background-color: #00563b;">
                    <img src="https://matric2succes.co.za/logo.png" alt="Matric2Succes Logo" style="max-width: 100%; height: 100%;" />
                  </div>
                  <div style="padding: 40px 30px;">
                    <h2 style="color: #00563b;">Hi ${firstName || "Student"}!</h2>
                    <p>Thank you for using <strong>Matric2Succes</strong>!</p>
                    <p>We hope our platform helped you find courses you qualify for and make the right decision for your future.</p>
                    <p>Wishing you all the best in your educational journey!</p>
                    <p>Warm regards,<br><strong>The Matric2Succes Team</strong></p>
                  </div>
                </div>
            </body>
            </html>
        `,
    });

    console.log("Mailgun: message sent:", data.id || data);
    return data;
}
