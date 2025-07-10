// backend/routes/listingRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Still needed for Multer setup

// --- Import Controller Functions ---
const {
    getAllListings,
    getMyListings,
    getSingleListing,
    createListing,
    updateListing,
    deleteListing
} = require("../controllers/listingsController");

// ⭐ We need to import messageController as well for the message route ⭐
const messageController = require('../controllers/messageController');

const protect = require("../middleware/authMiddleware"); // Authentication middleware

const router = express.Router();

// --- Multer Setup (remains in routes, as it's middleware) ---
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename.replace(/\s+/g, '_')}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
        }
    }
});

// --- API Routes (now using controller functions) ---

// GET: fetch all listings with search, filter, and sort capabilities
router.get("/", getAllListings);

// GET: fetch listings for the authenticated user (for Dashboard "Your Listings")
router.get("/my", protect, getMyListings);

// GET: fetch a single listing by ID
router.get("/:id", getSingleListing);

// POST: create a new listing with image uploads
router.post("/", protect, upload.array("images", 5), createListing);

// PUT: update a listing by ID
router.put("/:id", protect, upload.array("images", 5), updateListing);

// DELETE: delete a listing by ID
router.delete("/:id", protect, deleteListing);

// Route to send a message to a listing owner
router.post('/:listingId/message', protect, messageController.sendMessage);

module.exports = router;