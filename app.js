const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const authRoutes = require('./routes/auth');
require('dotenv').config(); // Charger les variables d'environnement
const path = require('path');

const app = express();
app.use(express.json()); // Pour traiter les requêtes POST avec des données JSON
app.use(express.urlencoded({ extended: true })); // Pour traiter les requêtes POST avec des données URL-encoded

// Configuration des sessions
app.use(session({
    secret: process.env.SESSION_SECRET, // Utilisez la variable d'environnement
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Utilisez true si vous utilisez HTTPS
}));

// Middleware pour vérifier si l'utilisateur est connecté
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.session.is2FAAuthenticated) {
        return next();
    } else {
        res.redirect('/');
    }
}

// Rendre le middleware disponible pour auth.js
app.use((req, res, next) => {
    req.isAuthenticated = isAuthenticated;
    next();
});

// Configuration de Mongoose
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

app.use('/auth', authRoutes);

// Servir des fichiers statiques depuis le répertoire "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route pour servir le fichier HTML de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route pour servir le fichier HTML d'enregistrement
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route pour servir le fichier HTML de vérification 2FA
app.get('/verify_2fa/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify_2fa.html'));
});

// Route de succès (protégée)
app.get('/success', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Route de base
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware pour gérer les routes non trouvées (404)
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

module.exports = app; // Exporter l'application pour les tests

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server started on http://localhost:3000');
    });
}
