const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    course: { type: String, default: null },
    current_semester: { type: Number, default: null },
    
    // --- NEW OTP FIELDS ---
    is_verified: { type: Boolean, default: false },
    verification_otp: { type: String, default: null },
    reset_otp: { type: String, default: null },
    reset_otp_expiry: { type: Date, default: null },
    // ----------------------

    created_at: { type: Date, default: Date.now },
    college_id: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true }
});

module.exports = mongoose.model('User', userSchema);