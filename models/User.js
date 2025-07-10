// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: { // ⭐ This is the field you need to ensure is present
        type: String,
        // You can add more validation here if desired:
        // required: true, // Make it mandatory if every user must have a phone
        // unique: true,   // If phone numbers must be unique
        // match: [/^(\+\d{1,3}[- ]?)?\d{10}$/, 'Please enter a valid phone number (e.g., +2547XXXXXXXX or 07XXXXXXXX)']
    },

}, {
    timestamps: true
});


// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;