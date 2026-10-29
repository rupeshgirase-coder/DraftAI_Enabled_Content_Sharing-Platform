const express = require('express');
const { improvePost } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Content improvement route
router.post('/improve/:postId', protect, improvePost);

module.exports = router;
