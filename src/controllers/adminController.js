const Post = require('../models/Post');

// @desc    View posts awaiting approval (status: 'pending')
// @route   GET /admin/posts/pending
// @access  Private (Admin only)
const getPendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a post
// @route   PATCH /admin/posts/approve/:id
// @access  Private (Admin only)
const approvePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.status = 'approved';
    await post.save();
    await post.populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post approved successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a post
// @route   PATCH /admin/posts/reject/:id
// @access  Private (Admin only)
const rejectPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.status = 'rejected';
    await post.save();
    await post.populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post rejected successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingPosts,
  approvePost,
  rejectPost,
};
