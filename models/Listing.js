// backend/models/Listing.js
const mongoose = require('mongoose');

// Define the schema
const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title for the listing'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    price: {
        type: Number, // Keeping as Number for consistency with schema best practices
        required: [true, 'Please add a price'],
        min: [0, 'Price cannot be negative'],
    },
    // Optional: If you want to allow "negotiable" as a separate indicator
    isNegotiable: {
        type: Boolean,
        default: false,
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: [ 
            "Tractors and Machinery",
            "Fertilizers",
            "Crop Seeds",
            "Irrigation Systems",
            "Veggies",
            "More"
        ],
    },
    condition: { // Added a condition field, common for marketplaces
        type: String,
        enum: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair', 'For Parts'],
        default: 'Used - Good', // Default condition
    },
    location: {
        type: String,
        required: [true, 'Please add a location'],
        trim: true,
    },
    images: { // Changed from 'image' to 'images' (Array of Strings for multiple images)
        type: [String], // Array of strings to store multiple image URLs/paths
        default: [], // Default to an empty array
    },
    seller: { // Renamed from ownerId for clarity (can be kept as ownerId too)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true, // A listing must belong to a user
    },

}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// ⭐ Crucial Fix: Check if the model already exists before compiling it
// This prevents Mongoose from trying to recompile the model if it's already been compiled
// (which can happen in development with hot-reloading or multiple require calls).
const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

module.exports = Listing;