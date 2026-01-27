require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
    password TEXT,
    googleId TEXT UNIQUE,
    profilePicture TEXT
)`);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'https://tech-arc.github.io', 'https://texbridge.onrender.com'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        db.get(`SELECT * FROM users WHERE googleId = ?`, [profile.id], (err, user) => {
            if (err) return done(err);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            const email = profile.emails[0].value;
            const username = profile.displayName.replace(/\s+/g, '_') + '_' + Date.now();
            const profilePicture = profile.photos[0]?.value || '';
            
            db.run(
                `INSERT INTO users (username, email, googleId, profilePicture) VALUES (?, ?, ?, ?)`,
                [username, email, profile.id, profilePicture],
                function(err) {
                    if (err) return done(err);
                    return done(null, { id: this.lastID, username, email, googleId: profile.id, profilePicture });
                }
            );
        });
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
        done(err, user);
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'TexBridge Auth API is running' });
});

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

// Login endpoint - supports both username and email
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username/Email and password required' });
    }

    // Check if input is email or username
    const isEmail = username.includes('@');
    const query = isEmail 
        ? `SELECT * FROM users WHERE email = ?` 
        : `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], async (err, user) => {
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

// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5500/Frontend/homepage.html');
});

app.get('/auth/failure', (req, res) => {
    res.redirect(process.env.FRONTEND_URL + '/Frontend/reglogin.html' || 'http://localhost:5500/Frontend/reglogin.html');
});

// Check authentication status
app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
