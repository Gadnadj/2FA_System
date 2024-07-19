const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for the User model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fa_secret: { type: String }
});

// Method to set a hashed password for the user
userSchema.methods.setPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password, salt);
};

// Method to check if a provided password matches the stored hashed password
userSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Export the User model based on the defined schema
module.exports = mongoose.model('User', userSchema);
