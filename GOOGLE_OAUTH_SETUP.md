# Google OAuth Login Implementation Guide

## What Has Been Done

I've successfully integrated Google OAuth 2.0 authentication into your TexBridge application. Here's what was implemented:

### 1. **Backend Updates** (server.js)
- ✅ Added Passport.js and Google OAuth strategy
- ✅ Updated database schema to support Google authentication (added `googleId` and `profilePicture` fields)
- ✅ Configured Google OAuth routes
- ✅ Added authentication status endpoint

### 2. **Frontend Updates** (reglogin.js)
- ✅ Added Google login button event listeners
- ✅ Redirects to backend OAuth flow when clicked

### 3. **Dependencies** (package.json)
- ✅ Added `passport` and `passport-google-oauth20` packages

---

## Setup Instructions

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Google+ API"
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for local development)
   - Your production URL when deployed
7. Copy your **Client ID** and **Client Secret**

### Step 2: Update Environment Variables
Edit `backend/.env` file:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_from_google
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_google
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5500
```

### Step 3: Install New Dependencies
Run in the `backend/` directory:
```bash
npm install
```

### Step 4: Start Your Server
```bash
npm start
```

---

## How It Works

1. **User clicks Google login button** → Redirected to `/auth/google`
2. **Google OAuth flow** → User signs in with their Google account
3. **Callback received** → Backend creates/updates user in database
4. **Session created** → User is logged in and redirected to homepage
5. **User data stored** → Email, name, profile picture saved in database

---

## Database Changes

Your `users` table now has new columns:
- `googleId` (TEXT UNIQUE) - Google's unique user ID
- `profilePicture` (TEXT) - URL to user's Google profile picture
- `password` (now optional) - NULL for OAuth users, hashed for traditional login

---

## Files Modified

1. **backend/package.json** - Added passport dependencies
2. **backend/server.js** - Added OAuth strategy, routes, and database setup
3. **backend/.env** - Configuration for OAuth credentials
4. **Frontend/reglogin.js** - Added Google login button handlers

---

## Testing

1. Start your backend server: `npm start`
2. Open your frontend in a browser
3. Click the Google icon in the login/registration form
4. Sign in with your Google account
5. You should be redirected to your homepage

---

## Features

✅ Automatic user creation on first Google login
✅ Automatic login on subsequent visits  
✅ Profile picture stored from Google account
✅ Works alongside traditional username/password login
✅ Session management integrated
✅ CORS configured for your frontend

---

## Troubleshooting

**Issue: "Callback URL mismatch"**
- Make sure your Google OAuth credentials redirect URI matches exactly in Google Console

**Issue: "Missing credentials"**
- Ensure your `.env` file has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Issue: "Localhost redirect issues"**
- Make sure your frontend is served from `http://localhost:5500` or `http://127.0.0.1:5500`

---

## Next Steps (Optional)

- Add logout functionality that also clears Google session
- Display user's Google profile picture on homepage
- Add more OAuth providers (Facebook, GitHub)
- Add "Remember Me" functionality
