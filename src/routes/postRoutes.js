const express = require('express');
const {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public / general post routes
router.get('/', getApprovedPosts);

// Authenticated user posts route (MUST be defined before /:id)
router.get('/my-posts', protect, getMyPosts);

// Create post or draft
router.post('/', protect, createPost);

// Single post operations
router.get('/:id', optionalAuth, getPostById);
router.patch('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
