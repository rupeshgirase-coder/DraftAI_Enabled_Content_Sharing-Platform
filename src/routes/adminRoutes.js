const express = require('express');
const {
  getPendingPosts,
  approvePost,
  rejectPost,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

router.get('/posts/pending', getPendingPosts);
router.patch('/posts/approve/:id', approvePost);
router.patch('/posts/reject/:id', rejectPost);

module.exports = router;
