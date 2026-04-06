require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const User = require('./models/User');
const Material = require('./models/Material');
const College = require('./models/College');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Debugging check to ensure .env is loading
console.log("Checking Email Config: ", process.env.EMAIL_USER ? "✅ Loaded" : "❌ EMAIL_USER missing in .env");

app.get('/api/status', (req, res) => {
    res.json({ message: "CampusShare API is running on MongoDB!" });
});

// ==========================================
// --- AUTHENTICATION ROUTES (JWT) ---
// ==========================================

app.post('/api/register', async (req, res) => {
    console.log(`🚀 Registration attempt for: ${req.body.email}`);
    try {
        const { username, email, password, course, current_semester } = req.body;

        const emailDomain = email.split('@')[1].toLowerCase();
        const approvedCollege = await College.findOne({ domain: emailDomain });

        if (!approvedCollege) {
            return res.status(403).json({ error: `The domain @${emailDomain} is not supported.` });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            username, email, password: hashedPassword, course,
            current_semester: current_semester || 1,
            college_id: approvedCollege._id,
            verification_otp: otpCode
        });

        // --- GMAIL TRANSPORTER CONFIGURATION ---
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 1. Send the email FIRST
        await transporter.sendMail({
            from: `"Campus Share" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Campus Share - Verify Your Account',
            text: `Hello ${username},\n\nWelcome to Campus Share! Your official verification code is: ${otpCode}\n\nPlease enter this code on the website to verify your account.\n\nBest regards,\nThe Campus Share Team`
        });

        // 2. ONLY save the user if the email successfully sent
        await newUser.save();

        console.log("📧 OTP Email sent successfully to:", email);
        res.json({ message: "OTP sent! Please check your email to verify your account." });
    } catch (err) {
        console.error("❌ Registration/Email Error:", err);
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid email or password" });

        if (user.is_verified === false) {
            return res.status(403).json({ error: "Account not verified! Check email for OTP." });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, 'my_secret_key', { expiresIn: '2h' });
        res.json({
            message: "Login successful!",
            token: token,
            user: { _id: user._id, username: user.username, course: user.course }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

// ==========================================
// --- MATERIALS ROUTES ---
// ==========================================

app.get('/api/materials', async (req, res) => {
    try {
        const { course, year, semester } = req.query;
        let filter = { is_hidden: { $ne: true } };

        if (course && course !== 'All') filter.course = course;
        if (year && year !== 'All') filter.year = Number(year);
        if (semester && semester !== 'All') filter.semester = Number(semester);

        const results = await Material.find(filter);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch materials" });
    }
});

app.post('/api/materials', async (req, res) => {
    try {
        const { title, description, file_url, course, year, semester, subject, student_name, uploader_id } = req.body;
        const newMaterial = new Material({
            title, description, file_url, course,
            year: Number(year), semester: Number(semester), subject,
            uploader_id: uploader_id || null,
            student_name: student_name || 'Anonymous'
        });
        await newMaterial.save();
        res.json({ message: "✅ Material added successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to add material" });
    }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const student_name = req.query.student_name ? req.query.student_name.trim() : "";
        const material = await Material.findById(id);

        if (!material) return res.status(404).json({ error: "Material not found" });

        if (material.student_name.toLowerCase() !== student_name.toLowerCase()) {
            return res.status(403).json({ error: "Unauthorized: Name mismatch" });
        }

        await Material.findByIdAndDelete(id);
        res.json({ message: "🗑️ Material deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// ==========================================
// --- RATING & REPORTING ROUTES ---
// ==========================================

app.post('/api/materials/:id/rate', async (req, res) => {
    console.log(`📥 Rating attempt for Material ID: ${req.params.id}`);
    console.log(`📊 Data received from React:`, req.body);

    try {
        const { id } = req.params;
        const { user_id, score } = req.body;

        if (score < 1 || score > 5) {
            console.log("❌ Rejected: Score is invalid!");
            return res.status(400).json({ error: "Score 1-5 required" });
        }

        const material = await Material.findById(id);
        if (!material) {
            console.log("❌ Rejected: Material not found in DB!");
            return res.status(404).json({ error: "Material not found" });
        }

        const existingRatingIndex = material.ratings.findIndex(r => r.user_id && r.user_id.toString() === user_id);

        if (existingRatingIndex >= 0) material.ratings[existingRatingIndex].score = score;
        else material.ratings.push({ user_id, score });

        const totalScore = material.ratings.reduce((sum, r) => sum + r.score, 0);
        material.average_rating = totalScore / material.ratings.length;

        await material.save();
        console.log(`✅ Rating saved! New Average: ${material.average_rating}`);
        res.json({ message: "Rating saved!", average_rating: material.average_rating });
    } catch (err) {
        console.error("⭐ RATING CRASH ERROR:", err);
        res.status(500).json({ error: "Rating failed", details: err.message });
    }
});

// ==========================================
// --- REPORT ROUTE ---
// ==========================================
app.post('/api/materials/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const material = await Material.findById(id);
        if (!material) return res.status(404).json({ error: "Material not found" });

        material.report_count += 1;
        if (material.report_count >= 3) material.is_hidden = true;

        await material.save();
        res.json({ message: "Reported successfully." });
    } catch (err) {
        console.error("🚩 REPORT ERROR:", err);
        res.status(500).json({ error: "Report failed" });
    }
});

// ==========================================
// --- OTP VERIFICATION ROUTES ---
// ==========================================

app.post('/api/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.verification_otp === otp) {
            user.is_verified = true;
            user.verification_otp = null;
            await user.save();
            res.json({ message: "Email verified successfully! You can now log in." });
        } else {
            res.status(400).json({ error: "Invalid OTP code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// Forgot Password - Request OTP
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.reset_otp = otp;
        user.reset_otp_expiry = Date.now() + 3600000;
        await user.save();

        // --- GMAIL TRANSPORTER CONFIGURATION ---
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Campus Share" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Campus Share - Password Reset',
            text: `Hello ${user.username},\n\nYou requested a password reset for your Campus Share account.\n\nYour reset code is: ${otp}\n\nPlease enter this code on the website to choose a new password.\n\nBest regards,\nThe Campus Share Team`
        });

        res.json({ message: "Reset OTP sent to email!" });
    } catch (err) {
        console.error("🚨 EMAIL ERROR REVEALED:", err); // Added this to catch any future email errors!
        res.status(500).json({ error: "Error sending reset email" });
    }
});

// Verify OTP & Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found." });

        if (user.reset_otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP code." });
        }
        if (user.reset_otp_expiry < Date.now()) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.reset_otp = null;
        user.reset_otp_expiry = null;

        await user.save();
        res.json({ message: "Password reset successful! You can now log in with your new password." });
    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ error: "Failed to reset password", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});