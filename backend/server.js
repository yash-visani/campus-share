const express = require('express');
const cors = require('cors');

// --- NEW: Import our security tools ---
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const db = require('./config/db'); 

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// A simple test route
app.get('/api/status', (req, res) => {
    res.json({ message: "CampusShare API is running successfully!" });
});


// ==========================================
// --- NEW: AUTHENTICATION ROUTES (JWT) ---
// ==========================================

// 1. REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, course, current_semester } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email already registered!" });
        }

        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user to the database
        const query = 'INSERT INTO Users (username, email, password, course, current_semester) VALUES (?, ?, ?, ?, ?)';
        await db.execute(query, [username, email, hashedPassword, course, current_semester || 1]);

        res.json({ message: "Registration successful! You can now log in." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

// 2. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const [users] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = users[0];

        // Compare the typed password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create a JWT Token (The digital ID card)
        const token = jwt.sign({ id: user.user_id, username: user.username }, 'my_secret_key', { expiresIn: '2h' });

        // Send the token and user info back to React
        res.json({ 
            message: "Login successful!", 
            token: token, 
            user: { username: user.username, course: user.course } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed", details: err.message });
    }
});


// ==========================================
// --- EXISTING MATERIALS ROUTES ---
// ==========================================

// 3. ROUTE TO GET MATERIALS 
app.get('/api/materials', async (req, res) => {
    try {
        const { course, year, semester } = req.query;
        
        let query = 'SELECT * FROM Materials WHERE 1=1';
        const values = [];

        if (course && course !== 'All') { query += ' AND course = ?'; values.push(course); }
        if (year && year !== 'All') { query += ' AND year = ?'; values.push(year); }
        if (semester && semester !== 'All') { query += ' AND semester = ?'; values.push(semester); }

        const [results] = await db.execute(query, values);
        res.json(results); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch materials", details: err.message });
    }
});

// 4. ROUTE TO ADD A NEW MATERIAL
app.post('/api/materials', async (req, res) => {
    try {
        const { title, description, file_url, course, year, semester, subject, student_name } = req.body;
        
        const query = 'INSERT INTO Materials (title, description, file_url, course, year, semester, subject, student_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await db.execute(query, [title, description, file_url, course, year, semester, subject, student_name || 'Anonymous']);
        
        res.json({ message: "✅ Material added successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add material", details: err.message });
    }
});

// 5. IMPROVED ROUTE TO DELETE A MATERIAL
app.delete('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // We trim the name to remove any accidental spaces
        const student_name = req.query.student_name ? req.query.student_name.trim() : "";

        console.log(`Attempting to delete ID: ${id} by User: ${student_name}`);

        // 1. First, check if the material exists and who owns it
        const [rows] = await db.execute('SELECT student_name FROM Materials WHERE material_id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Material not found" });
        }

        // 2. Compare names (case-insensitive check is safer)
        if (rows[0].student_name.toLowerCase() !== student_name.toLowerCase()) {
            return res.status(403).json({ error: "Unauthorized: Name mismatch in database" });
        }

        // 3. If everything matches, delete it
        await db.execute('DELETE FROM Materials WHERE material_id = ?', [id]);

        res.json({ message: "🗑️ Material deleted successfully!" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Delete failed", details: err.message });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});