import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { 
  ArrowLeft, Calendar, Clock, ThumbsUp, MessageSquare, 
  Send, Trash2, Edit2, Check, X, ShieldAlert, Eye, UserCircle2, Sun, Moon
} from 'lucide-react';

export default function BlogDetails() {
  const { blogId } = useParams();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  // Likes State
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Authentication Modal Overlay
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authActionType, setAuthActionType] = useState('like'); // 'like' | 'comment'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);



  // Fetch blog detail on load
  const fetchBlogDetails = async () => {
    try {
      const { data } = await axios.get(`/api/blogs/${blogId}`);
      if (data.success) {
        setBlog(data.blog);
        setLikes(data.blog.likes || []);
        setComments(data.blog.comments || []);
        
        if (user) {
          const liked = data.blog.likes.some(like => like.userId === user.id || like.userId?._id === user.id);
          setHasLiked(liked);
        }
      }
    } catch (err) {
      console.error('Error fetching blog details:', err);
      setError(err.response?.data?.error || 'Failed to load blog article.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogDetails();

    // Auto-refresh when page gains focus to keep likes/comments fresh
    window.addEventListener('focus', fetchBlogDetails);
    return () => {
      window.removeEventListener('focus', fetchBlogDetails);
    };
  }, [blogId, user, location.key]);

  // Check if current user liked when likes list changes
  useEffect(() => {
    if (user && likes.length > 0) {
      const liked = likes.some(like => {
        const uId = like.userId?._id || like.userId;
        return uId === user.id;
      });
      setHasLiked(liked);
    } else {
      setHasLiked(false);
    }
  }, [likes, user]);

  // Handle Like Toggle
  const handleLikeToggle = async () => {
    if (!user) {
      setAuthActionType('like');
      setShowAuthModal(true);
      return;
    }

    setLikesLoading(true);
    try {
      if (hasLiked) {
        // Unlike API
        const { data } = await axios.delete(`/api/blogs/${blogId}/like`);
        if (data.success) {
          setLikes(data.likes || []);
          setHasLiked(false);
        }
      } else {
        // Like API
        const { data } = await axios.post(`/api/blogs/${blogId}/like`);
        if (data.success) {
          setLikes(data.likes || []);
          setHasLiked(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle like.');
    } finally {
      setLikesLoading(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthActionType('comment');
      setShowAuthModal(true);
      return;
    }

    if (!commentInput.trim()) return;

    setCommentLoading(true);
    try {
      const { data } = await axios.post(`/api/blogs/${blogId}/comment`, { content: commentInput });
      if (data.success) {
        setComments(data.comments || []);
        setCommentInput('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  // Edit Comment Mode
  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveCommentEdit = async (commentId) => {
    if (!editingContent.trim()) return;

    try {
      const { data } = await axios.put(`/api/comments/${commentId}`, { content: editingContent });
      if (data.success) {
        setComments(data.comments || []);
        setEditingCommentId(null);
        setEditingContent('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save comment edit.');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete your comment?')) return;

    try {
      const { data } = await axios.delete(`/api/comments/${commentId}`);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  // Handle Inline Authentication Form Submission
  const handleInlineAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const { data } = await axios.post('/api/auth/login', { email: authEmail, password: authPassword });
      if (data.success) {
        // Authenticated successfully in place
        localStorage.setItem('empathwrite_user', JSON.stringify(data.user));
        // Force state refresh
        window.location.reload();
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Failed to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper to compute reading time
  const getReadingTime = (htmlContent) => {
    if (!htmlContent) return '1 min read';
    const cleanText = htmlContent.replace(/<[^>]*>/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-aether-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-xs">Fetching blog article details...</span>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass-panel max-w-md p-8 rounded-3xl space-y-4">
          <ShieldAlert size={48} className="text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Access Error</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'Article does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition cursor-pointer"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative pb-20 font-sans ${theme === 'light' ? 'text-slate-800' : 'text-aether-on-surface'}`}>
      {/* 3D Particles for Dark Mode */}
      {theme === 'dark' && <ThreeBackground />}

      {/* Ambient glows */}
      <div className="nebula-glow bg-aether-primary w-[400px] h-[400px] top-[10%] left-[-10%] rounded-full opacity-10 pointer-events-none"></div>
      <div className="nebula-glow bg-aether-secondary w-[400px] h-[400px] bottom-[20%] right-[-10%] rounded-full opacity-10 pointer-events-none"></div>

      {/* Mini top navigation */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl shrink-0 ${
        theme === 'light' 
          ? 'bg-[#faf8f5]/80 border-slate-200 shadow-sm' 
          : 'bg-[#0c1324]/50 border-white/5 shadow-md'
      }`}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Feed
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                theme === 'light' 
                  ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-aether-on-surface-variant'
              }`}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            
            {user ? (
              <Link 
                to="/dashboard" 
                className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-aether-primary to-aether-secondary text-slate-900 rounded-lg transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 pt-10 space-y-12 relative z-10">
        
        {/* Article Header */}
        <section className="space-y-6">
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-aether-secondary border border-white/5'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            {blog.title}
          </h1>

          {/* Author Card Block */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200/40">
            <div 
              onClick={() => navigate(`/user/${blog.userId?._id}`)}
              className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-aether-secondary cursor-pointer transition"
            >
              <UserCircle2 size={44} className="text-slate-400 hover:text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                <span 
                  onClick={() => navigate(`/user/${blog.userId?._id}`)}
                  className="hover:underline cursor-pointer"
                >
                  {blog.userId?.name || 'Anonymous Creator'}
                </span>
                {blog.userId?._id === user?.id && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] rounded font-bold uppercase tracking-wider">Author</span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-0.5"><Calendar size={12} />{formatDate(blog.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Clock size={12} />{getReadingTime(blog.content)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Eye size={12} />{blog.views || 0} views</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Canvas */}
        <article className="prose max-w-none prose-invert ProseMirror text-sm sm:text-base leading-relaxed text-slate-350">
          <div dangerouslySetInnerHTML={{ __html: blog.content || '<p className="italic text-slate-500">No blog body content generated yet.</p>' }} />
        </article>

        {/* Engagement Action Bar */}
        <section className="py-6 border-y border-slate-200/40 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={handleLikeToggle}
              disabled={likesLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                hasLiked
                  ? 'bg-aether-secondary/15 border-aether-secondary text-aether-secondary'
                  : theme === 'light'
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
              }`}
            >
              <ThumbsUp size={14} className={hasLiked ? 'fill-aether-secondary' : ''} />
              <span>{hasLiked ? 'Liked' : 'Like'} ({likes.length})</span>
            </button>

            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <MessageSquare size={14} />
              {comments.length} Comments
            </span>
          </div>

          {/* Share notification / copy */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Article link copied to clipboard!');
            }}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            Share Article
          </button>
        </section>

        {/* Author Bio Card Footer */}
        {blog.userId && (
          <section className={`p-6 rounded-3xl border flex flex-col sm:flex-row gap-5 items-center ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'glass-panel bg-white/5 border-white/5'
          }`}>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              <UserCircle2 size={56} className="text-slate-400" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left min-w-0">
              <h4 className={`text-base font-bold ${theme === 'light' ? 'text-slate-850' : 'text-white'}`}>
                About the Author: <span onClick={() => navigate(`/user/${blog.userId?._id}`)} className="hover:underline cursor-pointer text-aether-secondary">{blog.userId?.name}</span>
              </h4>
              <p className={`text-xs leading-normal leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {blog.userId?.bio || 'This creator hasn\'t written a bio description yet. Explore their profile to read more public blogs.'}
              </p>
              <button
                onClick={() => navigate(`/user/${blog.userId?._id}`)}
                className="text-[11px] font-bold text-aether-primary hover:underline"
              >
                View Public Profile →
              </button>
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section className="space-y-6">
          <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Comments ({comments.length})
          </h3>

          {/* New Comment Input Box */}
          <form onSubmit={handleAddComment} className="flex flex-col gap-3">
            <textarea
              className={`w-full min-h-[90px] p-4 rounded-2xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-aether-secondary transition-all resize-none ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'input-recessed text-white placeholder:text-aether-outline-variant bg-aether-container-lowest/80'
              }`}
              placeholder="What are your thoughts on this article? Share with the community..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onClick={() => {
                if (!user) {
                  setAuthActionType('comment');
                  setShowAuthModal(true);
                }
              }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Send size={12} />
                Post Comment
              </button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="py-10 text-center text-slate-500 border border-dashed border-slate-200/5 rounded-2xl">
              <p className="text-xs font-medium">No comments posted yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment._id}
                  className={`p-5 rounded-2xl border ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel bg-white/5 border-white/5'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Comment Header info */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => navigate(`/user/${comment.userId?._id || comment.userId}`)}
                          className={`font-bold hover:underline cursor-pointer ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}
                        >
                          {comment.userId?.name || 'Anonymous Writer'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{formatCommentDate(comment.createdAt)}</span>
                      </div>

                      {/* Edit/Delete Actions */}
                      {user && (comment.userId?._id === user.id || comment.userId === user.id) && (
                        <div className="flex items-center gap-2">
                          {editingCommentId !== comment._id ? (
                            <>
                              <button 
                                onClick={() => startEditComment(comment)}
                                className="p-1 text-slate-500 hover:text-slate-350 cursor-pointer"
                                title="Edit Comment"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment._id)}
                                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                                title="Delete Comment"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleSaveCommentEdit(comment._id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                title="Save Edit"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={cancelEditComment}
                                className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                                title="Cancel Edit"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Body */}
                    {editingCommentId === comment._id ? (
                      <textarea
                        className={`w-full min-h-[60px] p-3 border text-xs font-sans rounded-xl focus:outline-none focus:ring-1 focus:ring-aether-secondary resize-none ${
                          theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'input-recessed text-white bg-aether-container-lowest/90'
                        }`}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                      />
                    ) : (
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sleek In-Place Authentication Modal Gate */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-aether-dark/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm p-8 rounded-3xl space-y-6" style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center border border-white/10 shadow">
                  <Feather size={14} className="text-aether-dark" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authentication Gate</h3>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5 text-center">
              <h4 className="text-base font-bold text-white">Login Required</h4>
              <p className="text-xs text-slate-400">
                You need to log in to your account to {authActionType === 'like' ? 'like this article' : 'post a comment'}.
              </p>
            </div>

            {authError && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-300 p-3 rounded-xl text-[11px] leading-relaxed">
                {authError}
              </div>
            )}

            <form onSubmit={handleInlineAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-aether-on-surface-variant">Email</label>
                <input
                  type="email"
                  required
                  className="input-recessed w-full h-10 px-3.5 rounded-xl text-xs text-white placeholder:text-aether-outline-variant focus:outline-none"
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-aether-on-surface-variant">Password</label>
                <input
                  type="password"
                  required
                  className="input-recessed w-full h-10 px-3.5 rounded-xl text-xs text-white placeholder:text-aether-outline-variant focus:outline-none"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-gradient w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {authLoading ? 'Signing In...' : 'Log In & Continue'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-aether-secondary font-bold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
