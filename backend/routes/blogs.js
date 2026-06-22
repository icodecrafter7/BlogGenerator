import express from 'express';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import optionalProtect from '../middleware/optionalAuth.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// ==========================================
// PUBLIC / SEMI-PUBLIC ENDPOINTS
// ==========================================

// @desc    Get all public published blogs
// @route   GET /api/blogs/public
// @access  Public
router.get('/public', optionalProtect, async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published', visibility: 'public' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error(`Get Public Blogs Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error retrieving public blogs' });
  }
});

// @desc    Search public published blogs
// @route   GET /api/blogs/search
// @access  Public
router.get('/search', optionalProtect, async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, blogs: [] });
    }

    const keyword = q.trim();

    // Find users whose names match the query
    const matchingUsers = await User.find({ name: { $regex: keyword, $options: 'i' } }).select('_id');
    const userIds = matchingUsers.map(user => user._id);

    const blogs = await Blog.find({
      status: 'published',
      visibility: 'public',
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
        { userId: { $in: userIds } }
      ]
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error(`Search Blogs Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error searching blogs' });
  }
});

// @desc    Get trending public blogs
// @route   GET /api/blogs/trending
// @access  Public
router.get('/trending', optionalProtect, async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published', visibility: 'public' })
      .populate('userId', 'name');

    // Calculate engagement score: views + likes * 5 + comments * 3
    const trendingBlogs = blogs
      .map(blog => {
        const likesCount = blog.likes ? blog.likes.length : 0;
        const commentsCount = blog.comments ? blog.comments.length : 0;
        const viewsCount = blog.views || 0;
        const score = viewsCount + (likesCount * 5) + (commentsCount * 3);
        return { blog, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.blog);

    res.status(200).json({ success: true, blogs: trendingBlogs });
  } catch (error) {
    console.error(`Get Trending Blogs Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error retrieving trending blogs' });
  }
});

// @desc    Get single blog by ID (supports public and owner reads)
// @route   GET /api/blogs/:id
// @access  Public / Private
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('userId', 'name')
      .populate('comments.userId', 'name');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const isPublic = blog.status === 'published' && blog.visibility === 'public';
    const isOwner = req.user && req.user.id === blog.userId._id.toString();

    if (!isPublic && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this blog' });
    }

    // Increment views only when read by another user on a public article
    if (isPublic && (!req.user || req.user.id !== blog.userId._id.toString())) {
      blog.views = (blog.views || 0) + 1;
      await blog.save();
    }

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error(`Get Single Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error retrieving blog' });
  }
});

// ==========================================
// PROTECTED USER WRITE ENDPOINTS
// ==========================================

// @desc    Get all blogs for current user (Private dashboard list)
// @route   GET /api/blogs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const blogs = await Blog.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error(`Get Owner Blogs Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error retrieving blogs' });
  }
});

// @desc    Create a new blog shell
// @route   POST /api/blogs
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, configuration } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Please provide a title' });
    }

    const targetAudience = configuration?.targetAudience || 'Casual Readers';
    const objective = configuration?.objective || 'Inform/Educate';
    const tone = configuration?.tone || 'Empathetic';
    const groundingContext = configuration?.groundingContext || '';

    const blog = await Blog.create({
      userId: req.user.id,
      title,
      configuration: {
        targetAudience,
        objective,
        tone,
        groundingContext
      },
      outline: [],
      content: '',
      status: 'draft',
      visibility: 'private',
      tags: []
    });

    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error(`Create Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error creating blog' });
  }
});

// @desc    Publish/Unpublish a blog
// @route   POST /api/blogs/publish
// @access  Private
router.post('/publish', protect, async (req, res) => {
  try {
    const { blogId, visibility, tags } = req.body;
    if (!blogId) {
      return res.status(400).json({ error: 'Please provide a blog ID' });
    }

    const blog = await Blog.findOne({ _id: blogId, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    blog.status = 'published';
    blog.visibility = visibility || 'public';
    
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) 
        ? tags 
        : tags.split(',').map(t => t.trim()).filter(t => t);
    }

    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error(`Publish Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error publishing blog' });
  }
});

// @desc    Update a blog details / publish config
// @route   PUT /api/blogs/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, outline, status, visibility, tags } = req.body;

    const blog = await Blog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (outline !== undefined) blog.outline = outline;
    if (status !== undefined) blog.status = status;
    if (visibility !== undefined) blog.visibility = visibility;
    
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) 
        ? tags 
        : tags.split(',').map(t => t.trim()).filter(t => t);
    }

    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error(`Update Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error saving blog' });
  }
});

// @desc    Update / save a blog draft (legacy backward compatibility)
// @route   PUT /api/blogs/:id/save
// @access  Private
router.put('/:id/save', protect, async (req, res) => {
  try {
    const { title, content, outline, status, visibility, tags } = req.body;

    const blog = await Blog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (outline !== undefined) blog.outline = outline;
    if (status !== undefined) blog.status = status;
    if (visibility !== undefined) blog.visibility = visibility;
    
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) 
        ? tags 
        : tags.split(',').map(t => t.trim()).filter(t => t);
    }

    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error(`Save Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error saving blog' });
  }
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error(`Delete Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error deleting blog' });
  }
});

// ==========================================
// SOCIAL ENGAGEMENT: LIKES & COMMENTS
// ==========================================

// @desc    Like a blog
// @route   POST /api/blogs/:id/like
// @access  Private
router.post('/:id/like', protect, rateLimiter(60, 60 * 1000), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!blog.likes) {
      blog.likes = [];
    }

    // Prevent duplicate likes
    const alreadyLiked = blog.likes.some(like => like.userId.toString() === req.user.id);
    if (alreadyLiked) {
      return res.status(400).json({ error: 'You already liked this blog' });
    }

    blog.likes.push({ userId: req.user.id });
    await blog.save();

    res.status(200).json({ 
      success: true, 
      totalLikes: blog.likes.length,
      likes: blog.likes 
    });
  } catch (error) {
    console.error(`Like Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error liking blog' });
  }
});

// @desc    Unlike a blog
// @route   DELETE /api/blogs/:id/like
// @access  Private
router.delete('/:id/like', protect, rateLimiter(60, 60 * 1000), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!blog.likes) {
      blog.likes = [];
    }

    const likeItem = blog.likes.find(like => like.userId.toString() === req.user.id);
    if (likeItem) {
      blog.likes.pull(likeItem._id);
      await blog.save();
    }

    res.status(200).json({ 
      success: true, 
      totalLikes: blog.likes.length,
      likes: blog.likes 
    });
  } catch (error) {
    console.error(`Unlike Blog Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error unliking blog' });
  }
});

// @desc    Comment on a blog
// @route   POST /api/blogs/:id/comment
// @access  Private
router.post('/:id/comment', protect, rateLimiter(30, 60 * 1000), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!blog.comments) {
      blog.comments = [];
    }

    // Escaping dangerous HTML tags for comment sanitization (XSS protection)
    const cleanContent = content
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    blog.comments.push({
      userId: req.user.id,
      content: cleanContent
    });

    await blog.save();

    // Populate commenter info before returning
    const updatedBlog = await Blog.findById(blog._id).populate('comments.userId', 'name');

    res.status(201).json({ 
      success: true, 
      comments: updatedBlog.comments 
    });
  } catch (error) {
    console.error(`Comment Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error posting comment' });
  }
});

export default router;
