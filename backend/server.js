require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/donations');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

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

// Create donations table
db.run(`CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    contact TEXT NOT NULL,
    location_lat REAL,
    location_lon REAL,
    photos TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
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

// Google OAuth Routes - Register
app.get('/auth/google/register', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Routes - Login
app.get('/auth/google/login', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
    // Determine redirect based on the original request origin
    const registerRedirect = 'https://tech-arc.github.io/texbridge/Frontend/reglogin.html';
    const loginRedirect = 'https://tech-arc.github.io/texbridge/Frontend/homepage.html';
    
    // Default to login redirect
    const redirectUrl = req.query.state && req.query.state.includes('register') ? registerRedirect : loginRedirect;
    res.redirect(redirectUrl);
});

app.get('/auth/failure', (req, res) => {
    res.redirect('https://tech-arc.github.io/texbridge/Frontend/reglogin.html');
});

// Check authentication status
app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
};

// POST - Submit donation with photos
app.post('/api/donations', isAuthenticated, upload.array('photos', 10), (req, res) => {
    const { quantity, category, condition, description, address, contact, location_lat, location_lon } = req.body;
    const userId = req.user.id;

    // Validate all required fields
    if (!quantity || !category || !condition || !description || !address || !contact) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if at least one photo was uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'At least one photo is required' });
    }

    // Get file paths
    const photoPaths = req.files.map(file => file.path).join(',');

    db.run(
        `INSERT INTO donations (userId, quantity, category, condition, description, address, contact, location_lat, location_lon, photos) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, quantity, category, condition, description, address, contact, location_lat || null, location_lon || null, photoPaths],
        function(err) {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Failed to save donation' });
            }
            res.json({ 
                success: true, 
                message: 'Donation submitted successfully!',
                donationId: this.lastID
            });
        }
    );
});

// GET - Retrieve all donations (with optional user filter)
app.get('/api/donations', (req, res) => {
    const userId = req.query.userId;
    
    let query = 'SELECT * FROM donations ORDER BY createdAt DESC';
    let params = [];

    if (userId) {
        query = 'SELECT * FROM donations WHERE userId = ? ORDER BY createdAt DESC';
        params = [userId];
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to fetch donations' });
        }
        res.json({ success: true, donations: rows });
    });
});

// GET - Retrieve single donation by ID
app.get('/api/donations/:id', (req, res) => {
    const donationId = req.params.id;

    db.get('SELECT * FROM donations WHERE id = ?', [donationId], (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to fetch donation' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Donation not found' });
        }
        res.json({ success: true, donation: row });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
