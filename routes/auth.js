const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../routes/user');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    await user.setPassword(password);
    await user.save();
    res.send('Registration successful');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await user.checkPassword(password)) {
        res.redirect(`/verify_2fa/${user._id}`);
    } else {
        res.status(401).send('Login failed');
    }
});

router.get('/setup_2fa', async (req, res) => {
    const user = await User.findById(req.query.userId);
    const secret = speakeasy.generateSecret({ length: 20 });
    user.fa_secret = secret.base32;
    await user.save();
    const otpAuthUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: user.email,
        issuer: 'YourAppName'
    });
    QRCode.toDataURL(otpAuthUrl, (err, dataUrl) => {
        res.send(`<img src="${dataUrl}"><br>Scan the QR code with your 2FA app`);
    });
});

router.post('/verify_2fa/:userId', async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.params.userId);
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
});

module.exports = router;
