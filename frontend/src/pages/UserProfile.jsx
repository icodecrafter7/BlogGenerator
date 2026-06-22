import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { 
  ArrowLeft, Calendar, ThumbsUp, MessageSquare, BookOpen, 
  UserCircle2, Edit2, X, Feather, LayoutDashboard, Eye, Clock, Sun, Moon
} from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams();
  const { user, updateProfileInState } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // Profile editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');



  // Fetch public user stats & blogs
  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/auth/profile/${userId}`);
      if (data.success) {
        setProfile(data.profile);
        setEditName(data.profile.name || '');
        setEditBio(data.profile.bio || '');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.error || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();

    // Auto-refresh when page gains focus to keep stats aligned
    window.addEventListener('focus', fetchProfileDetails);
    return () => {
      window.removeEventListener('focus', fetchProfileDetails);
    };
  }, [userId, location.key]);

  // Save profile updates
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Name field is required.');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      const { data } = await axios.put('/api/auth/profile', { name: editName, bio: editBio });
      if (data.success) {
        // Update auth state
        updateProfileInState(data.user);
        // Refresh profile stats
        setProfile(prev => ({
          ...prev,
          name: data.user.name,
          bio: data.user.bio
        }));
        setShowEditModal(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setEditLoading(false);
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
  const formatJoinedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-aether-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-xs">Fetching profile databases...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass-panel max-w-md p-8 rounded-3xl space-y-4">
          <UserCircle2 size={48} className="text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Profile Error</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'This user database does not exist.'}</p>
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

  const isCurrentUserOwner = user && user.id === profile.id;

  return (
    <div className={`min-h-screen relative pb-20 font-sans ${theme === 'light' ? 'text-slate-800' : 'text-aether-on-surface'}`}>
      {/* 3D Particles for Dark Mode */}
      {theme === 'dark' && <ThreeBackground />}

      {/* Atmospheric Blur Glows */}
      <div className="nebula-glow bg-aether-primary w-[450px] h-[450px] top-[-5%] left-[-5%] rounded-full opacity-10 pointer-events-none"></div>
      <div className="nebula-glow bg-aether-secondary w-[450px] h-[450px] bottom-[-5%] right-[-5%] rounded-full opacity-10 pointer-events-none"></div>

      {/* Simple navigation header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl shrink-0 ${
        theme === 'light' 
          ? 'bg-[#faf8f5]/80 border-slate-200 shadow-sm' 
          : 'bg-[#0c1324]/50 border-white/5 shadow-md'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Feed
          </button>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
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
      <main className="max-w-4xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column - User Info Panel */}
        <section className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col items-center text-center gap-5 shrink-0 ${
          theme === 'light' ? 'bg-white border-slate-200/80 shadow-sm' : 'glass-panel bg-aether-container/30 border-white/5 shadow-xl'
        }`}>
          {/* Large Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border border-aether-primary/30 p-[2px] bg-slate-800/50 flex items-center justify-center overflow-hidden">
              <UserCircle2 size={88} className="text-slate-400" />
            </div>
            {isCurrentUserOwner && (
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 shadow-md cursor-pointer transition"
                title="Edit Profile Info"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {profile.name}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Calendar size={12} />
              Joined {formatJoinedDate(profile.joinedDate)}
            </p>
          </div>

          {/* User Bio */}
          <p className={`text-xs leading-relaxed max-w-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            {profile.bio || 'This creator hasn\'t written a bio description yet.'}
          </p>

          <div className="h-[1px] w-full bg-white/5"></div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 w-full text-center">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
              <span className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{profile.totalBlogs}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Articles</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
              <span className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{profile.totalLikesReceived}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Likes</span>
            </div>
          </div>

          {isCurrentUserOwner && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl cursor-pointer transition"
            >
              Edit Profile details
            </button>
          )}
        </section>

        {/* Right Column - User Blogs list */}
        <section className="lg:col-span-8 space-y-6">
          <div className="border-b pb-4 border-slate-200/40">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <BookOpen size={18} className="text-aether-secondary" />
              Public Articles by {profile.name.split(' ')[0]}
            </h3>
          </div>

          {profile.blogs.length === 0 ? (
            <div className={`py-16 text-center border border-dashed rounded-3xl ${
              theme === 'light' ? 'bg-slate-50/50 border-slate-250' : 'bg-transparent border-white/5'
            }`}>
              <BookOpen size={36} className="mx-auto text-slate-600 mb-3" />
              <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>No public blogs</h4>
              <p className="text-xs text-slate-500 mt-1">This user hasn't published any public blogs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.blogs.map((blog) => (
                <div
                  key={blog._id}
                  onClick={() => navigate(`/blog/${blog._id}`)}
                  className={`p-6 rounded-3xl border cursor-pointer group flex flex-col justify-between min-h-[180px] transition-all hover:-translate-y-1 relative ${
                    theme === 'light'
                      ? 'bg-white border-slate-200/85 hover:shadow-md'
                      : 'glass-panel bg-aether-container/30 border-white/5 hover:border-aether-primary/30 shadow-xl'
                  }`}
                >
                  <div className="space-y-3">
                    <h4 className={`text-sm font-extrabold leading-snug tracking-tight group-hover:text-aether-secondary transition-colors line-clamp-2 ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {blog.title}
                    </h4>
                    <p className={`text-xs line-clamp-3 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {blog.content ? blog.content.replace(/<[^>]*>/g, ' ').trim() : ''}
                    </p>
                  </div>

                  {/* Card Footer info */}
                  <div className="pt-4 border-t border-slate-200/5 flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-4">
                    <span className="flex items-center gap-1"><Clock size={11} />{getReadingTime(blog.content)}</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-0.5"><ThumbsUp size={11} />{blog.likes ? blog.likes.length : 0}</span>
                      <span className="flex items-center gap-0.5"><MessageSquare size={11} />{blog.comments ? blog.comments.length : 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-aether-dark/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl space-y-6" style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center border border-white/10 shadow">
                  <Feather size={14} className="text-aether-dark" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Profile Details</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-aether-on-surface-variant">Profile Name</label>
                <input
                  type="text"
                  required
                  className="input-recessed w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-aether-outline-variant focus:outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-aether-on-surface-variant">Biography</label>
                <textarea
                  className="input-recessed w-full min-h-[90px] p-4 rounded-xl text-sm text-white placeholder:text-aether-outline-variant focus:outline-none resize-none"
                  placeholder="Tell the community about yourself, your interests, and topics you specialize in..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="btn-gradient w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 cursor-pointer flex items-center justify-center"
              >
                {editLoading ? 'Saving Profile Details...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
