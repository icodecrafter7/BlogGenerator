import express from 'express';
import Blog from '../models/Blog.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Apply protection middleware to all comment routes
router.use(protect);

// @desc    Edit own comment
// @route   PUT /api/comments/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    // Find the blog containing the comment
    const blog = await Blog.findOne({ 'comments._id': req.params.id });
    if (!blog) {
      return res.status(404).json({ error: 'Comment or blog not found' });
    }

    // Find comment in array
    const comment = blog.comments.id(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Validate ownership
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    // Update comment
    comment.content = content.trim();
    await blog.save();

    // Populate comments user info before returning
    const updatedBlog = await Blog.findById(blog._id).populate('comments.userId', 'name');

    res.status(200).json({ 
      success: true, 
      message: 'Comment updated successfully',
      comments: updatedBlog.comments 
    });
  } catch (error) {
    console.error(`Edit Comment Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error editing comment' });
  }
});

// @desc    Delete own comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Find the blog containing the comment
    const blog = await Blog.findOne({ 'comments._id': req.params.id });
    if (!blog) {
      return res.status(404).json({ error: 'Comment or blog not found' });
    }

    const comment = blog.comments.id(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Validate ownership: Either the comment author or the blog author can delete the comment
    if (comment.userId.toString() !== req.user.id && blog.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Remove comment
    blog.comments.pull(req.params.id);
    await blog.save();

    // Populate comments user info before returning
    const updatedBlog = await Blog.findById(blog._id).populate('comments.userId', 'name');

    res.status(200).json({ 
      success: true, 
      message: 'Comment deleted successfully',
      comments: updatedBlog.comments 
    });
  } catch (error) {
    console.error(`Delete Comment Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error deleting comment' });
  }
});

export default router;
