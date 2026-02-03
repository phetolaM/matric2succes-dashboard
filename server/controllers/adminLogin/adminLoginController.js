import AdminCredential from "../../models/adminCredentialModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", email);

    try {
        // Find the admin by email (case insensitive)
        const admin = await AdminCredential.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") }, // Case-insensitive regex search
        });

        if (!admin) {
            console.log("Admin not found");
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });
        }

        console.log("Admin found:", admin.email);

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log("Password mismatch");
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });
        }

        console.log("Password match");

        // Generate JWT token
        const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, {
            // Increase token lifetime to 1 day
            expiresIn: "1d",
        });

        console.log("Login successful");
        res.json({ success: true, token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Store codes in-memory for demo (use Redis or DB in production)
const resetCodes = {};

export const sendResetCode = async (req, res) => {
    try {
        console.log("Received sendResetCode request:", req.body);

        const { email } = req.body;
        if (!email) {
            console.log("No email provided in request body");
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        // Check if the entered email exists in the adminCredential collection
        const admin = await AdminCredential.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        if (!admin) {
            console.log("No admin found for email:", email);
            return res.status(404).json({
                success: false,
                message: "No user found with that email.",
            });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Generated code ${code} for ${email}`);

        // Store code (expires in 10 min)
        resetCodes[email.toLowerCase()] = {
            code,
            expires: Date.now() + 10 * 60 * 1000,
        };

        // Send the code to the email in your .env, not to the user input
        const targetEmail = process.env.MY_EMAIL;
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.MY_EMAIL,
                    pass: process.env.MY_EMAIL_PASSWORD,
                },
            });
            console.log("Attempting to send code to ENV email:", targetEmail);
            await transporter.sendMail({
                from: email,
                to: targetEmail,
                subject: "Your Admin Portal Reset Code",
                text: `
The admin user "${email}" requested a password reset code.

Time of request: ${new Date().toLocaleString()}
Reset code: ${code}

This code is valid for 10 minutes.

If you did not request this, please ignore this email or contact support.
                `.trim(),
            });

            console.log("Email sent successfully to:", targetEmail);
            res.json({ success: true });
        } catch (err) {
            console.error("Nodemailer error:", err);
            res.status(500).json({
                success: false,
                message: "Failed to send email.",
                error: err.message,
            });
        }
    } catch (err) {
        console.error("sendResetCode error:", err);
        res.status(500).json({
            success: false,
            message: "Server error in sendResetCode.",
            error: err.message,
        });
    }
};

export const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    const entry = resetCodes[email.toLowerCase()];
    if (!entry || entry.code !== code || Date.now() > entry.expires) {
        return res
            .status(400)
            .json({ success: false, message: "Incorrect or expired code." });
    }
    // Remove code after use
    delete resetCodes[email.toLowerCase()];

    // Issue JWT for login
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        // Increase token lifetime to 1 day
        expiresIn: "1d",
    });
    res.json({ success: true, token });
};
