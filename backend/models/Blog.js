import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  configuration: {
    targetAudience: {
      type: String,
      required: true
    },
    objective: {
      type: String,
      required: true
    },
    tone: {
      type: String,
      required: true
    },
    groundingContext: {
      type: String,
      default: ""
    }
  },
  outline: {
    type: Array,
    default: []
  },
  content: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  tags: {
    type: [String],
    default: []
  }
}, { 
  timestamps: true 
});

const Blog = mongoose.model('Blog', BlogSchema);
export default Blog;
