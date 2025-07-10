const asyncHandler = require('express-async-handler');
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');

// @desc    Create a new discussion post
// @route   POST /api/community/discussions
// @access  Private (Auth required)
const createDiscussionPost = asyncHandler(async (req, res) => {
  console.log('--- Inside createDiscussionPost ---');
  console.log('req.body (from frontend):', req.body);
  console.log('req.file (from Multer):', req.file);
  console.log('req.user (from protect middleware):', req.user ? req.user.id : 'User NOT populated');

  const { title, content } = req.body;
  let imageUrl = '';

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.imageUrl) {
    imageUrl = req.body.imageUrl;
  }

  if (!title || !content) {
    res.status(400);
    throw new Error('Please add a title and content for the discussion post');
  }

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized, user data missing from token.');
  }

  try {
    const post = await CommunityPost.create({
      title,
      content,
      imageUrl,
      author: req.user.id
    });

    const populatedPost = await CommunityPost.findById(post._id).populate('author', 'name email');
    res.status(201).json(populatedPost);

  } catch (dbError) {
    console.error('*** DATABASE SAVE ERROR IN createDiscussionPost ***:', dbError);
    if (dbError.name === 'ValidationError') {
        res.status(400);
        throw new Error(`Validation failed: ${dbError.message}`);
    }
    res.status(500);
    throw new Error('Failed to create discussion post due to an internal server error.');
  }
});

// @desc    Update a discussion post
// @route   PUT /api/community/discussions/:id
// @access  Private (Auth required, Author only)
const updateDiscussionPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  let newImageUrl = '';

  if (req.file) {
    newImageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.hasOwnProperty('imageUrl')) {
    newImageUrl = req.body.imageUrl;
  }

  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Discussion post not found');
  }

  if (post.author.toString() !== req.user.id) {
    res.status(403);
    throw new Error('User not authorized to update this post');
  }

  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content cannot be empty.');
  }

  const updateFields = { title, content };

  if (req.file || req.body.hasOwnProperty('imageUrl')) {
    updateFields.imageUrl = newImageUrl;
  }

  const updatedPost = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).populate('author', 'name email');

  res.status(200).json(updatedPost);
});

const deleteDiscussionPost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await CommunityPost.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error('Discussion post not found');
  }

  if (post.author.toString() !== req.user.id) {
    res.status(403);
    throw new Error('User not authorized to delete this post');
  }

  await CommunityPost.deleteOne({ _id: postId });
  res.status(200).json({ message: 'Discussion post deleted successfully', id: postId });
});

const getAllDiscussionPosts = asyncHandler(async (req, res) => {
  const { limit } = req.query;

  let query = CommunityPost.find({})
    .populate('author', 'name _id') 
    .sort({ createdAt: -1 });

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query = query.limit(parsedLimit);
    }
  }

  const posts = await query;
  res.status(200).json(posts);
});

// @desc    Get a single discussion post by ID
// @route   GET /api/community/discussions/:id
// @access  Public
const getDiscussionPostById = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id)
    .populate('author', 'name email');

  if (!post) {
    res.status(404);
    throw new Error('Discussion post not found');
  }

  res.status(200).json(post);
});

// @desc    Get community statistics
// @route   GET /api/community/stats
// @access  Public
const getCommunityStats = asyncHandler(async (req, res) => {
  try {
    const totalPosts = await CommunityPost.countDocuments();
    const totalMembers = await User.countDocuments();

    const stats = {
      totalPosts,
      totalMembers,
      activeDiscussions: 0,
      newPostsThisWeek: 0,
      onlineNow: 0
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching community stats:", error);
    res.status(500).json({ error: "Failed to fetch community stats", message: error.message });
  }
});

module.exports = {
  createDiscussionPost,
  updateDiscussionPost,
  getAllDiscussionPosts,
  getDiscussionPostById,
  deleteDiscussionPost,
  getCommunityStats
};
