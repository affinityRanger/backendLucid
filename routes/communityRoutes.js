// backend/routes/communityRoutes.js (already implemented)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  createDiscussionPost,
  getAllDiscussionPosts,
  getDiscussionPostById,
  updateDiscussionPost,
  deleteDiscussionPost,
  getCommunityStats,
} = require('../controllers/communityController');

const protect = require('../middleware/authMiddleware');

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isMime = allowedTypes.test(file.mimetype);
  const isExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMime && isExt) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Routes
router
  .route('/discussions')
  .post(protect, upload.single('image'), createDiscussionPost)
  .get(getAllDiscussionPosts);

router
  .route('/discussions/:id')
  .get(getDiscussionPostById)
  .put(protect, upload.single('image'), updateDiscussionPost)
  .delete(protect, deleteDiscussionPost);

router.get('/stats', getCommunityStats);

module.exports = router;
