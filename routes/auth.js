const express = require('express');
const router = express.Router();
const User = require('./models/user');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Route d'enregistrement
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Received values:', username, email, password);

        if (!username || !email || !password) {
            return res.status(400).send('All fields are required');
        }

        const secret = speakeasy.generateSecret({ name: username });
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        const user = new User({ username, email, fa_secret: secret.base32 });
        await user.setPassword(password);
        await user.save();

        res.redirect(`/auth/show_qr?qrCodeUrl=${encodeURIComponent(qrCodeUrl)}`);
    } catch (error) {
        res.status(500).send('Registration failed: ' + error.message);
    }
});

// Route pour afficher le QR code
router.get('/show_qr', (req, res) => {
    const qrCodeUrl = req.query.qrCodeUrl;
    res.send(`
        <html>
        <body>
            <h1>Scan this QR code with Google Authenticator</h1>
            <img src="${qrCodeUrl}" alt="QR Code" />
        </body>
        </html>
    `);
});
// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Received login values:', email, password);

        const user = await User.findOne({ email });
        if (user) {
            const isPasswordValid = await user.checkPassword(password);
            console.log('Password is valid:', isPasswordValid);

            if (isPasswordValid) {
                res.redirect(`/verify_2fa/${user._id}`);
                console.log(user._id)
            } else {
                res.status(401).send('Login failed: Invalid password');
            }
        } else {
            res.status(401).send('Login failed: User not found');
        }
    } catch (error) {
        res.status(500).send('Login failed: ' + error.message);
    }
});

// Route de configuration de 2FA
router.post('/verify_2fa/:userId', async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const verified = speakeasy.totp.verify({
            secret: user.fa_secret,
            encoding: 'base32',
            token
        });
        if (verified) {
            res.send('2FA verification successful');
        } else {
            res.status(401).send('Invalid 2FA token');
        }
    } catch (error) {
        res.status(500).send('2FA verification failed: ' + error.message);
    }
});


// Route de vérification de 2FA
router.post('/verify_2fa/:userId', async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const verified = speakeasy.totp.verify({
            secret: user.fa_secret,
            encoding: 'base32',
            token
        });
        if (verified) {
            res.send('2FA verification successful');
        } else {
            res.status(401).send('Invalid 2FA token');
        }
    } catch (error) {
        res.status(500).send('2FA verification failed: ' + error.message);
    }
});

module.exports = router;
