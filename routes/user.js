const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fa_secret: { type: String }
});

UserSchema.methods.setPassword = async function(password) {
    this.password = await bcrypt.hash(password, 10);
};

UserSchema.methods.checkPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
