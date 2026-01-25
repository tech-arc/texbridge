require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.log(err);
    else console.log('Connected to SQLite database');
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: true,
}));

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            (err) => {
                if (err) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                res.json({ success: true, message: 'Registration successful' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({ success: true, message: 'Login successful' });
    });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
