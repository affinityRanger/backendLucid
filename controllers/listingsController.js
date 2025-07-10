// backend/controllers/listingsController.js
const Listing = require('../models/Listing'); 
const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler'); 

// @desc    Get all listings with search, filter, and sort capabilities
// @route   GET /api/listings
// @access  Public
const getAllListings = asyncHandler(async (req, res) => {
    // 1. Initialize Mongoose Query Filters
    const query = {};

    // 2. Apply Search Term (if provided)
    // Searches 'title', 'description', and 'location' fields case-insensitively
    if (req.query.search) {
        const searchTerm = req.query.search;
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // 3. Apply Category Filter (if provided)
    // Ensure category is not an empty string if it's sent from frontend for "All Categories"
    if (req.query.category && req.query.category !== '') {
        query.category = req.query.category;
    }

    // 4. Apply Price Range Filter (if provided)
    // This assumes your 'price' field in the Listing model is a Number.
    if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) {
            query.price.$gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
            query.price.$lte = parseFloat(req.query.maxPrice);
        }
    }

    // 5. Initialize Sort Options
    let sortOptions = {};
    if (req.query.sortBy) {
        switch (req.query.sortBy) {
            case 'priceAsc':
                sortOptions.price = 1; // Ascending
                break;
            case 'priceDesc':
                sortOptions.price = -1; // Descending
                break;
            case 'newest':
            default: 
                sortOptions.createdAt = -1; 
                break;
        }
    } else {
        sortOptions.createdAt = -1; // Default to newest if no sortBy parameter at all
    }

    // 6. Execute the Mongoose Query
    const listings = await Listing.find(query)
                                  .sort(sortOptions)
                                  .populate('seller', 'name email phone'); // Adjust fields as per your User model

    // 7. Format image URLs for the frontend response
    const formattedListings = listings.map((item) => {
        const itemObject = item.toObject();
        itemObject.images = itemObject.images.map(imagePath =>
            `${req.protocol}://${req.get("host")}/${imagePath.replace(/\\/g, "/")}`
        );
        return itemObject;
    });

    res.json(formattedListings);
});

// @desc    Get listings for the authenticated user
// @route   GET /api/listings/my
// @access  Private
const getMyListings = asyncHandler(async (req, res) => {
    // req.user.id is set by the 'protect' middleware
    const listings = await Listing.find({ seller: req.user.id }); // Use 'seller' field as defined in your Listing model

    const formattedListings = listings.map((item) => {
        const itemObject = item.toObject();
        itemObject.images = itemObject.images.map(imagePath =>
            `${req.protocol}://${req.get("host")}/${imagePath.replace(/\\/g, "/")}`
        );
        return itemObject;
    });

    res.status(200).json(formattedListings);
});

// @desc    Get a single listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getSingleListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate('seller', 'name email phone');

    if (!listing) {
        res.status(404);
        throw new Error("Listing not found"); 
    }

    const listingObject = listing.toObject();
    listingObject.images = listingObject.images.map(imagePath =>
        `${req.protocol}://${req.get("host")}/${imagePath.replace(/\\/g, "/")}`
    );

    res.json(listingObject);
});

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private
const createListing = asyncHandler(async (req, res) => {
    const { title, location, category, description, price, isNegotiable, condition } = req.body;

    if (!title || !location || !category || !description || price === undefined) {
        res.status(400);
        throw new Error("Missing required fields: title, location, category, description, and price are mandatory.");
    }

    // `req.files` is populated by Multer middleware in the route definition
    const imagePaths = req.files ? req.files.map(file => path.join("uploads", file.filename)) : [];

    const listing = new Listing({
        title,
        location,
        category,
        images: imagePaths,
        description,
        price: Number(price),
        isNegotiable: isNegotiable === 'true',
        condition,
        seller: req.user.id
    });

    await listing.save();

    const responseListing = listing.toObject();
    responseListing.images = responseListing.images.map(imagePath =>
        `${req.protocol}://${req.get("host")}/${imagePath.replace(/\\/g, "/")}`
    );

    res.status(201).json(responseListing);
});

// @desc    Update a listing by ID
// @route   PUT /api/listings/:id
// @access  Private
const updateListing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, location, category, description, price, isNegotiable, condition, existingImages } = req.body;

    let listing = await Listing.findById(id);

    if (!listing) {
        res.status(404);
        throw new Error("Listing not found");
    }

    // Authorization check: Make sure the user is the owner of the listing
    if (listing.seller.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this listing. You are not the owner.");
    }

    // Handle image deletion logic
    const imagesToKeep = Array.isArray(existingImages) ? existingImages : (existingImages ? [existingImages] : []);
    const oldImagesToDelete = listing.images.filter(img => !imagesToKeep.includes(img));

    oldImagesToDelete.forEach(imagePath => {
        // Adjust path: from `uploads/filename.jpg` to `backend/uploads/filename.jpg`
        // Assuming your 'uploads' folder is at the same level as 'backend'
        const imageFullPath = path.join(__dirname, '..', imagePath);
        fs.unlink(imageFullPath, (err) => {
            if (err) console.error(`Failed to delete old image file: ${imageFullPath}`, err);
            else console.log(`Old image file deleted: ${imageFullPath}`);
        });
    });

    const newImagePaths = req.files ? req.files.map(file => path.join("uploads", file.filename)) : [];
    const updatedImages = [...imagesToKeep, ...newImagePaths];

    const updateFields = {
        title,
        location,
        category,
        description,
        images: updatedImages,
        price: Number(price),
        isNegotiable: isNegotiable === 'true',
        condition
    };

    listing = await Listing.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });

    const responseListing = listing.toObject();
    responseListing.images = responseListing.images.map(imagePath =>
        `${req.protocol}://${req.get("host")}/${imagePath.replace(/\\/g, "/")}`
    );

    res.status(200).json({ message: "Listing updated successfully", listing: responseListing });
});

// @desc    Delete a listing by ID
// @route   DELETE /api/listings/:id
// @access  Private
const deleteListing = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        res.status(404);
        throw new Error("Listing not found");
    }

    // Authorization check: Make sure the user is the owner of the listing
    if (listing.seller.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this listing. You are not the owner.");
    }

    // Delete associated images from the file system
    if (listing.images && listing.images.length > 0) {
        listing.images.forEach(imagePath => {
            // Adjust path similarly to updateListing
            const imageFullPath = path.join(__dirname, '..', imagePath);
            fs.unlink(imageFullPath, (err) => {
                if (err) {
                    console.error('Failed to delete image file:', imageFullPath, err);
                } else {
                    console.log('Image file deleted successfully:', imageFullPath);
                }
            });
        });
    }

    await Listing.findByIdAndDelete(id);

    res.status(200).json({ message: "Listing deleted successfully" });
});


module.exports = {
    getAllListings,
    getMyListings,
    getSingleListing,
    createListing,
    updateListing,
    deleteListing,
};