import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { 
  Search, Flame, Calendar, Clock, ThumbsUp, MessageSquare, 
  ArrowRight, Sparkles, Feather, LogIn, LayoutDashboard, Sun, Moon,
  BookOpen, Eye, UserCircle2, Hash
} from 'lucide-react';

export default function CommunityFeed() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [blogs, setBlogs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);


  // Fetch all public blogs
  const fetchPublicBlogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/blogs/public');
      if (data.success) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Error fetching public blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending blogs
  const fetchTrendingBlogs = async () => {
    setTrendingLoading(true);
    try {
      const { data } = await axios.get('/api/blogs/trending');
      if (data.success) {
        setTrending(data.blogs);
      }
    } catch (err) {
      console.error('Error fetching trending blogs:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicBlogs();
    fetchTrendingBlogs();

    // Auto-refresh when page gains focus to keep community stats aligned
    window.addEventListener('focus', fetchPublicBlogs);
    window.addEventListener('focus', fetchTrendingBlogs);
    return () => {
      window.removeEventListener('focus', fetchPublicBlogs);
      window.removeEventListener('focus', fetchTrendingBlogs);
    };
  }, [location.key]);

  // Handle live search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchPublicBlogs();
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await axios.get(`/api/blogs/search?q=${encodeURIComponent(searchQuery)}`);
        if (data.success) {
          setBlogs(data.blogs);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce delay

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Helper to strip HTML tags and generate an excerpt
  const getExcerpt = (htmlContent) => {
    if (!htmlContent) return 'No content preview available.';
    const cleanText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText.length <= 180) return cleanText;
    return cleanText.substring(0, 180) + '...';
  };

  // Helper to compute reading time
  const getReadingTime = (htmlContent) => {
    if (!htmlContent) return '1 min read';
    const cleanText = htmlContent.replace(/<[^>]*>/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  // Format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
  };

  return (
    <div className={`min-h-screen relative font-sans ${theme === 'light' ? 'text-slate-800' : 'text-aether-on-surface'}`}>
      {/* Dynamic 3D Particle Cloud behind Dark Mode */}
      {theme === 'dark' && <ThreeBackground />}

      {/* Atmospheric Glow Blurs */}
      <div className="nebula-glow bg-aether-primary w-[500px] h-[500px] top-[-10%] right-[-10%] rounded-full opacity-10 pointer-events-none"></div>
      <div className="nebula-glow bg-aether-secondary w-[400px] h-[400px] bottom-[-5%] left-[-5%] rounded-full opacity-10 pointer-events-none"></div>

      {/* Navigation Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        theme === 'light' 
          ? 'bg-[#faf8f5]/80 border-slate-200 shadow-sm' 
          : 'bg-[#0c1324]/50 border-white/5 shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center border border-white/10 shadow">
              <Feather size={18} className="text-aether-dark" />
            </div>
            <span className={`font-sans text-lg font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              EmpathWrite
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <div className={`flex items-center px-4 py-1.5 rounded-full border transition-all ${
              theme === 'light' 
                ? 'bg-slate-100 border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-600 focus-within:bg-white' 
                : 'bg-aether-container-lowest/80 border-white/10 focus-within:ring-1 focus-within:ring-aether-secondary focus-within:bg-aether-container-lowest'
            }`}>
              <Search size={16} className="text-slate-400 mr-2 shrink-0" />
              <input 
                type="text"
                className={`bg-transparent border-none w-full text-sm focus:outline-none focus:ring-0 ${
                  theme === 'light' ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-aether-outline-variant'
                }`}
                placeholder="Search by title, author, topic, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="w-4 h-4 border-2 border-aether-secondary border-t-transparent rounded-full animate-spin shrink-0"></div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                theme === 'light' 
                  ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-aether-on-surface-variant'
              }`}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <div 
                  onClick={() => navigate('/dashboard')}
                  className="w-9 h-9 rounded-full border border-aether-primary/30 p-[2px] cursor-pointer hover:border-aether-secondary transition-colors"
                >
                  <img 
                    className="w-full h-full rounded-full object-cover bg-slate-800" 
                    alt="User avatar" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMF3Qs4cKXFzHHvo54B5IDRdt3o-DlHImHLHZut_asB3SHMBGwJ4PHu0ULYsJAoKLEc0V4J75MBXgWc_INjLLlnfmQiEntPrEMHRNPgplqrUktDpDTG4CWc2_lSIynfNC1O16a8z5XUcW9ELN6k8xZA9nYuKeWLGn9eNyt0vManTIcXXMlvTH8BEoS1veztEwaLXwp4oaHjR3S1ihDUD_UmBV5N_-2-GQ5-EIN6Rb8TEAnrRgDo0L5MibTw8RiyNASLRND6da3-yc"
                  />
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-aether-primary to-aether-secondary hover:opacity-90 text-slate-900 rounded-xl text-xs font-bold transition shadow"
              >
                <LogIn size={14} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search on mobile */}
      <div className="sm:hidden px-6 pt-4">
        <div className={`flex items-center px-4 py-2 rounded-full border transition-all ${
          theme === 'light' 
            ? 'bg-slate-100 border-slate-200 focus-within:bg-white' 
            : 'bg-aether-container-lowest/80 border-white/10'
        }`}>
          <Search size={16} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text"
            className={`bg-transparent border-none w-full text-xs focus:outline-none focus:ring-0 ${
              theme === 'light' ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-aether-outline-variant'
            }`}
            placeholder="Search blogs, authors, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Hero Welcome banner */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-6 text-center md:text-left">
          <div className={`p-8 md:p-12 rounded-[2rem] border relative overflow-hidden ${
            theme === 'light'
              ? 'bg-white border-slate-200/80 shadow-md'
              : 'glass-panel bg-gradient-to-br from-aether-container/60 to-aether-dark/30 border-white/5 shadow-2xl'
          }`}>
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                theme === 'light' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-aether-secondary/10 border-aether-secondary/20 text-aether-secondary animate-pulse'
              }`}>
                ✨ Community feed
              </span>
              <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Explore the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-aether-primary to-aether-secondary">Agentic Blogging</span>
              </h2>
              <p className={`text-sm leading-relaxed max-w-lg ${theme === 'light' ? 'text-slate-600' : 'text-aether-on-surface-variant'}`}>
                Read high-quality, humanized tech narratives and creative articles drafted by users and curated using Google's Gemini models.
              </p>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Create AI Draft
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-aether-primary to-aether-secondary text-slate-900 rounded-xl text-xs font-bold hover:opacity-95 transition shadow-lg"
                >
                  Join the Community
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:flex items-center justify-center opacity-30 pointer-events-none">
              <Feather size={200} className={theme === 'light' ? 'text-slate-200' : 'text-white/5'} />
            </div>
          </div>
        </section>
      )}

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Public Blogs Feed */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200/40">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <BookOpen size={18} className="text-aether-secondary" />
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Articles'}
            </h3>
            <span className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} font-semibold`}>
              {blogs.length} articles found
            </span>
          </div>

          {loading ? (
            // Shimmer/Skeleton Loaders
            <div className="space-y-6">
              {[1, 2, 3].map(n => (
                <div key={n} className={`p-6 rounded-3xl border animate-pulse space-y-4 ${
                  theme === 'light' ? 'bg-white border-slate-100' : 'glass-panel bg-white/5 border-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600/30"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-3 bg-slate-600/30 rounded"></div>
                      <div className="w-16 h-2.5 bg-slate-600/20 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-slate-600/30 rounded-md"></div>
                    <div className="w-full h-3 bg-slate-600/20 rounded"></div>
                    <div className="w-5/6 h-3 bg-slate-600/20 rounded"></div>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-slate-200/5">
                    <div className="flex gap-4">
                      <div className="w-12 h-3 bg-slate-600/20 rounded"></div>
                      <div className="w-12 h-3 bg-slate-600/20 rounded"></div>
                    </div>
                    <div className="w-20 h-4 bg-slate-600/30 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            // Empty State
            <div className={`py-20 text-center rounded-3xl border border-dashed ${
              theme === 'light' ? 'bg-slate-50/50 border-slate-200' : 'bg-transparent border-white/5'
            }`}>
              <BookOpen size={48} className="mx-auto text-slate-500 mb-4" />
              <h4 className={`text-base font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>No articles found</h4>
              <p className={`text-xs max-w-xs mx-auto mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {searchQuery ? "We couldn't find any blogs matching your search filters." : "No blogs are published publicly yet. Be the first to share one!"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 cursor-pointer transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            // Blog list
            <div className="space-y-6">
              {blogs.map((blog, idx) => (
                <article 
                  key={blog._id}
                  onClick={() => navigate(`/blog/${blog._id}`)}
                  className={`p-6 md:p-8 rounded-3xl border cursor-pointer group transition-all duration-300 hover:-translate-y-1 relative ${
                    theme === 'light'
                      ? 'bg-white border-slate-200/80 shadow hover:shadow-lg'
                      : 'glass-panel bg-aether-container/30 border-white/5 hover:border-aether-primary/30 shadow-xl'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Author Meta */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2.5">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/${blog.userId?._id}`);
                          }}
                          className={`w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-aether-secondary cursor-pointer transition`}
                        >
                          <UserCircle2 size={28} className="text-slate-400 hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${blog.userId?._id}`);
                            }}
                            className={`font-bold hover:underline cursor-pointer ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}
                          >
                            {blog.userId?.name || 'Anonymous Creator'}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <span className="flex items-center gap-0.5"><Calendar size={10} />{formatDate(blog.createdAt)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><Clock size={10} />{getReadingTime(blog.content)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Views */}
                      <span className="flex items-center gap-1 font-semibold text-[11px] text-slate-500">
                        <Eye size={12} />
                        {blog.views || 0}
                      </span>
                    </div>

                    {/* Blog Title & Excerpt */}
                    <div className="space-y-2">
                      <h4 className={`text-lg md:text-xl font-bold tracking-tight group-hover:text-aether-secondary transition-colors ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>
                        {blog.title}
                      </h4>
                      <p className={`text-xs md:text-sm leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-350'}`}>
                        {getExcerpt(blog.content)}
                      </p>
                    </div>

                    {/* Tags List */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {blog.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagClick(tag);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition ${
                              theme === 'light'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            <Hash size={9} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Engagement / Read More Row */}
                    <div className="pt-4 border-t border-slate-200/5 flex items-center justify-between text-xs text-slate-400 font-semibold bg-transparent">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={14} className="text-slate-400" />
                          {blog.likes ? blog.likes.length : 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} className="text-slate-400" />
                          {blog.comments ? blog.comments.length : 0}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-aether-secondary font-bold group-hover:translate-x-1.5 transition-transform">
                        Read Article
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Trending Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Trending Blogs List */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'light' ? 'bg-white border-slate-200/80 shadow-sm' : 'glass-panel bg-aether-container/30 border-white/5 shadow-xl'
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <Flame size={16} className="text-amber-500 fill-amber-500" />
              Trending on EmpathWrite
            </h3>

            {trendingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="animate-pulse flex items-start gap-3">
                    <div className="w-5 h-6 bg-slate-600/30 rounded text-center font-bold text-sm shrink-0"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="w-full h-3 bg-slate-600/30 rounded"></div>
                      <div className="w-20 h-2 bg-slate-600/20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trending.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No trending articles right now.</p>
            ) : (
              <div className="space-y-4">
                {trending.map((blog, idx) => (
                  <div 
                    key={blog._id}
                    onClick={() => navigate(`/blog/${blog._id}`)}
                    className="flex items-start gap-4 cursor-pointer group"
                  >
                    <span className="text-2xl font-black text-slate-700/60 group-hover:text-aether-secondary leading-none w-6 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className={`text-xs font-bold leading-snug line-clamp-2 group-hover:underline ${
                        theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        {blog.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        by {blog.userId?.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prompt AI Writing Call-To-Action */}
          <div className={`p-6 rounded-3xl border bg-gradient-to-br from-aether-container to-aether-container-highest border-white/5 space-y-4 ${
            theme === 'light' ? 'shadow-sm' : 'shadow-xl'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-aether-secondary/15 flex items-center justify-center border border-aether-secondary/20">
                <Sparkles size={18} className="text-aether-secondary" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Write with Gemini</h4>
                <p className="text-[10px] text-aether-secondary font-bold">Free AI Generation Workspace</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Join EmpathWrite to generate structured outlines and draft articles using Google Gemini, fully humanized and clean of AI-isms.
            </p>
            {user ? (
              <Link
                to="/dashboard"
                className="w-full py-2.5 rounded-xl bg-aether-secondary/20 border border-aether-secondary/30 text-white text-[11px] font-bold text-center block hover:bg-aether-secondary/30 transition-all cursor-pointer"
              >
                Go to Workspace
              </Link>
            ) : (
              <Link
                to="/signup"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-aether-primary to-aether-secondary text-slate-900 text-[11px] font-bold text-center block hover:opacity-95 transition-all cursor-pointer shadow-lg"
              >
                Start Writing Free
              </Link>
            )}
          </div>

          {/* Popular tags section */}
          {!trendingLoading && trending.length > 0 && (
            <div className={`p-6 rounded-3xl border ${
              theme === 'light' ? 'bg-white border-slate-200/80 shadow-sm' : 'glass-panel bg-aether-container/30 border-white/5 shadow-xl'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Topics of interest
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(trending.flatMap(b => b.tags || []))).slice(0, 8).map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    onClick={() => handleTagClick(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      theme === 'light'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
