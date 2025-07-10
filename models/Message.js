// controllers/messageController.js
const Message = require('../models/Message');
const Listing = require('./Listing'); 
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (senderId.toString() === listing.ownerId.toString()) {
      return res.status(400).json({ message: 'You cannot send a message to your own listing.' });
    }

    const recipientId = listing.ownerId; // Changed from receiverId to recipientId to match model

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId, // Ensure this matches your model
      listing: listingId,
      content: content,
    });

    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully!', message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error while sending message.' });
  }
};