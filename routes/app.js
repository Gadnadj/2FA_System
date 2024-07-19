const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
