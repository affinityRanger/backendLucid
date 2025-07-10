// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User"); 
const protect = require("../middleware/authMiddleware"); 

router.get("/:id", protect, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("name email phone");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }


        res.status(200).json(user);

    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error while fetching user details.", error: error.message });
    }
});

module.exports = router;