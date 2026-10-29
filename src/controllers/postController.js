const Post = require('../models/Post');

// @desc    Create a new post or draft
// @route   POST /posts
// @access  Private (Logged-in User)
const createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the post.',
      });
    }

    // Normal users can only set status to 'draft' or 'pending'.
    // Only admin could directly create 'approved', otherwise default to 'draft'.
    let postStatus = 'draft';
    if (status && ['draft', 'pending'].includes(status)) {
      postStatus = status;
    } else if (status === 'approved' && req.user.role === 'admin') {
      postStatus = 'approved';
    }

    const post = await Post.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      content,
      image: image ? image.trim() : '',
      category: category ? category.trim() : 'General',
      status: postStatus,
      createdBy: req.user._id,
    });

    await post.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: postStatus === 'pending' ? 'Post submitted for approval' : 'Draft created successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View all approved posts (Public feed)
// @route   GET /posts
// @access  Public
const getApprovedPosts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const query = { status: 'approved' };

    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View an approved post by ID (or draft/pending if creator/admin)
// @route   GET /posts/:id
// @access  Public (for approved) / Private (for own draft or admin)
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('createdBy', 'name email role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // If post is not approved, only author or admin can view it
    if (post.status !== 'approved') {
      const isCreator = req.user && req.user._id.toString() === post.createdBy._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This post is not yet approved or is private.',
        });
      }
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View your own posts and drafts
// @route   GET /posts/my-posts
// @access  Private (Logged-in User)
const getMyPosts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { createdBy: req.user._id };

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const posts = await Post.find(query)
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

// @desc    Update your own post
// @route   PATCH /posts/:id
// @access  Private (Creator or Admin)
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    const isCreator = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post.',
      });
    }

    const { title, description, content, image, category, status } = req.body;

    if (title !== undefined) post.title = title.trim();
    if (description !== undefined) post.description = description.trim();
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image.trim();
    if (category !== undefined) post.category = category.trim();

    // Status management:
    // If user is admin, they can set any valid status.
    // If standard user, they can only switch between 'draft' and 'pending' (submit for review).
    if (status) {
      if (isAdmin) {
        if (['draft', 'pending', 'approved', 'rejected'].includes(status)) {
          post.status = status;
        }
      } else {
        if (['draft', 'pending'].includes(status)) {
          post.status = status;
        } else {
          return res.status(403).json({
            success: false,
            message: 'Only admins can approve or reject posts.',
          });
        }
      }
    }

    const updatedPost = await post.save();
    await updatedPost.populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete your own post
// @route   DELETE /posts/:id
// @access  Private (Creator or Admin)
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isCreator = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post.',
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
};
