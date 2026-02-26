# TexBridge - Textile Management & Waste Recovery Platform

![TexBridge Logo](Frontend/Images/logo.png)

Welcome to **TexBridge**! A comprehensive textile waste management platform that connects waste scrappers, industries, TRFs (Textile Recovery Facilities), NGOs, and sustainable fashion enthusiasts. We're revolutionizing textile waste management through technology and community empowerment.

---

## 🌍 Problem Statement

Textile waste is a critical global issue:
- The textile industry generates **10% of global carbon emissions** and **20% of global wastewater pollution**
- Fragmented supply chains leave **60-70% of textile waste** in the informal sector
- Millions of tons of clothing end up in landfills annually, causing environmental devastation
- Waste pickers and local artisans lack market access and formal support systems

---

## 💡 Our Solution

TexBridge offers a **unified, digitized platform** that:
- **Connects the ecosystem**: Links waste pickers, DWCCs, TRFs, industries, NGOs, and eco-conscious consumers
- **Formalizes the informal sector**: Brings waste management from the streets to organized infrastructure
- **Creates job opportunities**: Empowers waste pickers, tailors, and artisans with fair market access
- **Promotes circular economy**: Enables donation, refashioning, recycling, and customization at scale
- **Tracks impact**: Real-time transparency on waste collected, emissions prevented, and jobs created

---

## ✨ Core Features

### 1. **Donation Platform**
- Users upload textile donation details with photos
- Track donation status in real-time
- Geolocation tracking for logistics
- Database-backed submission history
- Frontend: [Donation Dashboard](Frontend/donationpage.html)

### 2. **Refashioning Marketplace**
- Browse creative upcycling ideas
- Connect with artisans and tailors
- View refashioned textile examples
- Frontend: [Refashioned Section](Frontend/refashioned.html)

### 3. **Customization Service**
- Submit custom design requests with photos
- Track customization progress and pricing
- Assign to skilled professionals
- Frontend: [Customization Dashboard](Frontend/customizations-dashboard.html)

### 4. **Wishlist & Cart Management**
- Save favorite items to wishlist
- Manage shopping cart for orders
- Persistent storage (localStorage & backend)
- Frontend: [Wishlist](Frontend/wishlist.html) | [Cart](Frontend/cart.html)

### 5. **Secure Authentication**
- **Email login/signup** with bcrypt password hashing
- **Google OAuth 2.0** integration for quick sign-up
- Session management with express-session
- SQLite user database with profile pictures
- Frontend: [Login/Register](Frontend/reglogin.html)

### 6. **Contact & Support**
- Contact form with email delivery
- Falls back to database storage if SMTP fails
- Admin API to retrieve contact submissions
- Recipients: text.tile.4u@gmail.com (configurable)

### 7. **Product Details & Marketplace**
- Browse product catalog (6 product pages)
- Product customization options
- Stock and pricing information
- Frontend: [Product Details](Frontend/prodetails1.html)

### 8. **Donation Management Dashboard**
- View all donations submitted
- Filter by user
- Track donation history
- Backend: [Donations API](backend/server.js) (`/api/donations`)

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with Tailwind CSS utilities
- **JavaScript (Vanilla)** - DOM manipulation, fetch API, localStorage
- **FontAwesome** - Icons and visual elements

### Backend
- **Node.js** + **Express.js** - RESTful API server
- **SQLite3** - Persistent database
- **bcrypt** - Password hashing
- **Multer** - File/photo upload handling
- **Nodemailer** - Email delivery
- **Passport.js** - OAuth & session authentication
- **CORS** - Cross-origin resource sharing

### Hosting
- **Frontend**: GitHub Pages (tech-arc.github.io/texbridge)
- **Backend**: Render (texbridge.onrender.com)

---

## 📋 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT (bcrypt hashed),
    googleId TEXT UNIQUE,
    profilePicture TEXT
);
```

### Donations Table
```sql
CREATE TABLE donations (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    category TEXT,
    condition TEXT,
    description TEXT,
    address TEXT,
    contact TEXT,
    location_lat REAL,
    location_lon REAL,
    photos TEXT (comma-separated paths),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Customizations Table
```sql
CREATE TABLE customizations (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    material TEXT,
    description TEXT,
    location_lat REAL,
    location_lon REAL,
    photos TEXT (comma-separated paths),
    status TEXT DEFAULT 'New',
    assignedTo TEXT,
    priceEstimate REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - Email/username login
- `POST /logout` - Logout & destroy session
- `GET /auth/status` - Check authentication status
- `GET /auth/google/login` - Google OAuth login
- `GET /auth/google/register` - Google OAuth registration
- `GET /auth/google/callback` - OAuth callback handler

### Donations
- `POST /api/donations` - Submit donation with photos (multipart/form-data)
- `GET /api/donations` - Retrieve all donations
- `GET /api/donations?userId=X` - Filter donations by user
- `GET /api/donations/:id` - Get single donation details

### Customizations
- `POST /api/customizations` - Submit customization request with photos
- `GET /api/customizations` - Retrieve all customizations
- `GET /api/customizations?userId=X` - Filter by user
- `GET /api/customizations/:id` - Get single customization
- `PUT /api/customizations/:id` - Update status, assignment, pricing (protected)

### Contact & Mail
- `POST /api/contact` - Submit contact form (falls back to DB if SMTP fails)
- `GET /api/mail-status` - Check SMTP configuration & saved contacts count
- `GET /api/contacts` - Retrieve saved contact messages (requires `x-admin-key` header)

---

## 🛠️ Installation & Setup

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/tech-arc/textile.git
cd texbridge-master
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

#### 3. Configure Environment Variables
Create `.env` file in `backend/`:
```env
# Server
PORT=3000

# Database (optional, uses users.db by default)
DATABASE_PATH=./users.db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@texbridge.com
CONTACT_RECIPIENT=text.tile.4u@gmail.com
CONTACT_ADMIN_KEY=your-secret-admin-key
```

#### 4. Start Backend
```bash
npm start
# Server runs on http://localhost:3000
```

#### 5. Serve Frontend
Open `index.html` or use a live server:
```bash
# Using Python 3
python -m http.server 5500

# Using Node http-server
npx http-server -p 5500
```

Visit: http://localhost:5500

---

## 📧 Email Configuration Guide

### Gmail with App Password
1. Enable 2-factor authentication on Gmail
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Set in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### SendGrid
1. Sign up at sendgrid.com and get API key
2. Set in `.env`:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-api-key-here
   ```

### Mailgun
1. Sign up at mailgun.com
2. Set in `.env`:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@yourdomain.mailgun.org
   SMTP_PASS=your-mailgun-password
   ```

---

## 🌐 Deployment

### Deploy Backend to Render
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Set environment variables (SMTP_*, GOOGLE_*, CONTACT_*)
5. Deploy!

**Live Backend**: https://texbridge.onrender.com

### Deploy Frontend to GitHub Pages
1. Push code to GitHub repo with username `tech-arc`
2. Enable GitHub Pages in repo settings
3. Branch: `main`, Folder: `/` (root) or `/Frontend`

**Live Frontend**: https://tech-arc.github.io/texbridge/

---

## 📱 Project Structure

```
texbridge-master/
├── index.html                          # Main homepage
├── README.md                           # This file
├── alterstyle.css                      # Styling
├── GOOGLE_OAUTH_SETUP.md              # OAuth setup guide
│
├── Frontend/                           # Frontend pages
│   ├── homepage.html
│   ├── reglogin.html                  # Auth page
│   ├── donationpage.html              # Donation form
│   ├── refashioned.html               # Refashioning marketplace
│   ├── customizations-dashboard.html  # Customization requests
│   ├── wishlist.html                  # Wishlist manager
│   ├── cart.html                      # Shopping cart
│   ├── prodetails[1-6].html          # Product detail pages
│   ├── checkout.html                  # Checkout page
│   ├── [*-manager.js]                # Cart/Wishlist JS managers
│   └── Images/
│       ├── logo.png                   # TexBridge logo
│       ├── name.png                   # Brand name
│       └── [product images]
│
└── backend/                            # Node.js backend
    ├── server.js                       # Express API server
    ├── package.json                    # Dependencies
    ├── .env                            # Environment variables
    ├── users.db                        # SQLite database
    └── scripts/
        └── migrate_photos.js           # Migration utilities
```

---

## 🔐 Security Features

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Session Management**: Secure session tokens
- ✅ **CORS Protection**: Whitelist allowed origins
- ✅ **OAuth 2.0**: Secure Google login
- ✅ **Admin Keys**: Header-based API authentication
- ✅ **Input Validation**: Server-side validation on all endpoints

---

## 📊 Usage Statistics

The platform enables:
- **Donation Tracking**: Monitor textile donations across communities
- **Job Creation**: Connect waste pickers to formal markets
- **Environmental Impact**: Calculate CO2 saved through recycling/upcycling
- **Real-time Insights**: Dashboard for admins to view submissions

---

## 🤝 Contributing

We welcome contributions! To get involved:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Contact & Support

**Have questions?** Use the contact form on our website or reach out to:
- **Email**: text.tile.4u@gmail.com
- **GitHub Issues**: [Report a bug](https://github.com/tech-arc/textile/issues)

---

## 🙏 Acknowledgments

Special thanks to:
- Waste pickers and artisans for inspiring this platform
- Open-source community for amazing tools
- All contributors and supporters of sustainable fashion

---

**Together, we're turning textile waste into opportunity! 🌿♻️👕**


