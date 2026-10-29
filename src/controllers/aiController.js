const Post = require('../models/Post');
const { improveContentWithGemini } = require('../services/geminiService');

// @desc    Improve content using AI and save as a new draft under the same user
// @route   POST /ai/improve/:postId
// @access  Private (Owner of post or Admin)
const improvePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { instructions } = req.body;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found',
      });
    }

    // Check permission: author or admin
    const isOwner = originalPost.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to improve this post.',
      });
    }

    // Call Gemini AI service
    const improved = await improveContentWithGemini({
      title: originalPost.title,
      description: originalPost.description,
      content: originalPost.content,
      promptFeedback: instructions,
    });

    // Save as a brand new draft with a new ID under the user, preserving original draft
    const newDraft = await Post.create({
      title: improved.title,
      description: improved.description,
      content: improved.content,
      image: originalPost.image,
      category: originalPost.category,
      status: 'draft',
      createdBy: req.user._id,
    });

    await newDraft.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Post content improved with AI and saved as a new draft',
      originalPost: {
        id: originalPost._id,
        title: originalPost.title,
        status: originalPost.status,
      },
      newDraft,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  improvePost,
};
