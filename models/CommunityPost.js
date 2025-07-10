const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // ✅ this enables createdAt and updatedAt
  }
);

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
module.exports = CommunityPost;
