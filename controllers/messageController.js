// backend/controllers/messageController.js (assuming this is the correct relative path)
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User'); 

// @desc    Send a message to a listing owner
// @route   POST /api/listings/:listingId/message (This route will call this controller)
// @access  Private (requires authentication)
exports.sendMessage = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { content } = req.body;
        const senderId = req.user.id; 

        // Basic validation for message content
        if (!content || typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ message: 'Message content cannot be empty.' });
        }
        if (content.length > 500) { // Example: Limit message length
            return res.status(400).json({ message: 'Message content too long (max 500 characters).' });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found.' });
        }


        if (senderId.toString() === listing.seller.toString()) {
            return res.status(400).json({ message: 'You cannot send a message to yourself about your own listing.' });
        }

        const recipientId = listing.seller; 

       

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            listing: listingId,
            content: content.trim(),
        });

        await newMessage.save();

        // Populate sender and recipient details for the response if desired
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('recipient', 'name email');

        res.status(201).json({ message: 'Message sent successfully!', data: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation error: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error while sending message.', error: error.message });
    }
};
