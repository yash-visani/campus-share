const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Gujarat University"
    domain: { type: String, required: true, unique: true }, // e.g., "gujaratuniversity.ac.in"
    is_active: { type: Boolean, default: true } // Lets you ban a college if needed
});

module.exports = mongoose.model('College', collegeSchema);