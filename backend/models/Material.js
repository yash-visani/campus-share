// models/Material.js
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    file_url: { type: String, required: true },
    course: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    subject: { type: String, required: true },
    student_name: { type: String, default: 'Anonymous' },
    uploader_id: { type: String, default: null },
    
    // 👇 MAKE SURE YOU HAVE THESE TWO FIELDS 👇
ratings: [
        {
            user_id: { type: String },
            score: { type: Number }
        }
    ],
    average_rating: { type: Number, default: 0 },
    
    report_count: { type: Number, default: 0 },
    is_hidden: { type: Boolean, default: false }
});

module.exports = mongoose.model('Material', MaterialSchema);