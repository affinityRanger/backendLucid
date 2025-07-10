// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const asyncHandler = require('express-async-handler'); 

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            
            console.log("Backend Auth Middleware: Token decoded. Decoded ID:", decoded.user.id);


            req.user = await User.findById(decoded.user.id).select('-password');

            // This log helps debug user lookup issues.
            console.log("Backend Auth Middleware: User found (or not):", req.user ? req.user.email : 'User NOT found');

            // If user not found (e.g., token for a deleted user)
            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next(); // Proceed to the next middleware or route handler

        } catch (error) {
            // This catch block will now be hit by errors from jwt.verify or User.findById
            console.error("Backend Auth Middleware: Error during token verification or user lookup:", error);

            if (error.name === 'TokenExpiredError') {
                res.status(401);
                throw new Error('Not authorized, token expired'); // Specific message for expired token
            } else if (error.name === 'JsonWebTokenError') {
                res.status(401);
                throw new Error('Not authorized, invalid token'); // Specific message for invalid token
            } else {
                // Generic error for other issues
                res.status(401);
                throw new Error('Not authorized, token failed');
            }
        }
    } else { // If no token is provided at all
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = protect; // ⭐ IMPORTANT: Direct export of the protect function ⭐