/**
 * Send an email using Mailgun with Next.js environment variables.
 */
export async function sendEmail(userEmail, firstName) {
    const apiKey = process.env.API_KEY_2;
    const domain = process.env.MAILGUN_DOMAIN;

    console.log("📧 Mailgun Config Check:");
    console.log("   API Key present:", !!apiKey);
    console.log("   Domain:", domain);

    if (!apiKey || !domain) {
        throw new Error(
            "Mailgun not configured. Set API_KEY_2 and MAILGUN_DOMAIN in .env"
        );
    }

    const formData = new URLSearchParams();
    formData.append("from", `Matric2Succes <team@${domain}>`);
    formData.append("to", `${firstName} <${userEmail}>`);
    formData.append("subject", "Thank You for Using Matric2Succes! 🎓");
    formData.append("html", `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #333333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center;  background-color: #00563b;">
            <img src="https://matric2succes.co.za/logo.png" alt="Matric2Succes Logo" style="max-width: 100%; height: 100%;" />
          </div>
          
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

          <div style="padding: 25px 30px; text-align: center; background-color: #f1f1f1; font-size: 14px; color: #666;">
            <p style="margin-bottom: 10px;">
              <a href="https://matric2succes.co.za" style="color: #00563b; text-decoration: none; font-weight: 500;">Visit Our Website</a> • 
              <a href="https://www.facebook.com/profile.php?id=61583215727466" style="color: #00563b; text-decoration: none; font-weight: 500;">Facebook</a>
            </p>
            <p style="margin: 0; font-size: 13px;">
              © 2025 Matric2Succes. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `);

    // Use Buffer for Node.js runtime base64 encoding
    const authString = `api:${apiKey}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    console.log("📤 Sending to Mailgun:");
    console.log("   To:", userEmail);
    console.log("   From: team@" + domain);
    console.log("   URL: https://api.mailgun.net/v3/" + domain + "/messages");

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${base64Auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });

    console.log("📬 Mailgun Response Status:", response.status, response.statusText);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Mailgun API Error:", response.status, errorText);
        throw new Error(`Mailgun API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Email queued by Mailgun. Message ID:", data.id);
    return data;
}
