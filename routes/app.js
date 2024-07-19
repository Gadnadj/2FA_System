const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/2fa_project', { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
