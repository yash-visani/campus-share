const mysql = require('mysql2');

// Create the connection pool
// A pool is better than a single connection because it handles multiple users accessing your site at once
const pool = mysql.createPool({
    host: 'localhost',      // XAMPP runs on your local machine
    user: 'root',           // Default XAMPP username
    password: '',           // Default XAMPP password is empty
    database: 'campus_share', // The database you just created
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert the pool to use Promises so we can use async/await in our routes
const db = pool.promise();

// Test the connection
db.getConnection()
    .then(() => {
        console.log('✅ Successfully connected to the MySQL Database (campus_share)');
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = db;