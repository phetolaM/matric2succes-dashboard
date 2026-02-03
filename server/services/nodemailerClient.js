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
      <p>Hi ${firstName || "Student"},</p>
      <p>Thank you for using Matric2Succes! We hope our platform helped you.</p>
      <p>Best regards,<br/>Matric2Succes Team</p>
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
