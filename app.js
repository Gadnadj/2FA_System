const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const authRoutes = require('./routes/auth');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.session.is2FAAuthenticated) {
        return next();
    } else {
        res.redirect('/');
    }
}

// Make the middleware available for auth.js
app.use((req, res, next) => {
    req.isAuthenticated = isAuthenticated;
    next();
});

// Mongoose configuration
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

app.use('/auth', authRoutes);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the login HTML file
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to serve the registration HTML file
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route to serve the 2FA verification HTML file
app.get('/verify_2fa/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify_2fa.html'));
});

// Success route (protected)
app.get('/success', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Base route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware to handle 404 Not Found
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

module.exports = app; // Export the application for testing

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server started on http://localhost:3000');
    });
}
