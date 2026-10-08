import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Wizard from '../components/Wizard.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { 
  Plus, Search, LogOut, FileText, BarChart2, Clock, 
  Trash2, ArrowRight, Sparkles, Feather, FileCode, CheckCircle,
  HelpCircle, Settings, Bell, ChevronRight, TrendingUp, Lightbulb, Zap, 
  UserCircle2, Folders, BookOpen, Archive, User, MoreVertical, PlusCircle, X, Sun, Moon
} from 'lucide-react';

const COVER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD6DpajLSWaXXaQpuszkcC-yFh6cp0UzLwkJBOTRWjSrL18VadPNAvMbgRN0BraZqBu9Y7FBLUA-uOGzna4jb2yU9vLftiIEK3zTsUsgn_2F8LL_764jKgXISG_ZC6SBUizhQOlH31GKS7UH28MdrE6v_mDN7HTbJJLDQD6aos69uTztG0iW1sDWG_7UTbvRTPyvM_LoV5WRc-kzqmNBvWGSTG9LLNoNeE9t8G8WDSB3mxRVrsLEsX2CzKgGGVV4n09YF1jUaLPwyU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDmD9_n2CozDYvS5IGl2g5I52zq7cyc_NC803KD5TJeZzZe_e-0mP7yFYKi3PXeZ5wRWgQDywisUB3ssHtsO2X92jR4dwcSqPpMBI99TXMtj1NXB0rsqJlM3IQR1zHkj5i2mA-Kmw4DxtjwmP-TVJPx8sxCmgYxANRayHkbAuAPITeKcSLmUKcfJPfaASjeFabUJ5Z1fJzWHCe8uo0GtjbPEDtI7_hvVaLVB-xuSoQMcMypS2rmQU4VJLYHujNTUX7GULdMsSi4eHQ'
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDefaults, setWizardDefaults] = useState(null);
  const [error, setError] = useState('');

  // Sub-Navigation and Modal states
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'drafts' | 'insights' | 'library' | 'archive'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Settings inputs
  const [displayName, setDisplayName] = useState(user?.name || 'Alex Rivera');
  const [selectedDefaultTone, setSelectedDefaultTone] = useState('Empathetic');

  // Support inputs
  const [supportSubject, setSupportSubject] = useState('General Inquiry');
  const [supportMessage, setSupportMessage] = useState('');

  // Local user name persistence
  const [currentName, setCurrentName] = useState(() => {
    const saved = localStorage.getItem('empathwrite_user');
    if (saved) {
      return JSON.parse(saved).name;
    }
    return user?.name || 'Alex Rivera';
  });

  // System notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, text: "🚀 EmpathWrite AI v2.0 initialized: WebGL particles ready.", time: "10m ago" },
    { id: 2, text: "📝 Auto-save completed for 'Neural Nexus Branding' draft.", time: "45m ago" },
    { id: 3, text: "🔑 Guest Session logged on with unlimited workspace allocation.", time: "1h ago" }
  ]);

  const notificationMenuRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch blogs on load
  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get('/api/blogs');
      if (data.success) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      setError('Failed to retrieve blog listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Stop navigation trigger
    if (!window.confirm('Are you sure you want to delete this blog draft?')) return;
    
    try {
      await axios.delete(`/api/blogs/${id}`);
      setBlogs(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      alert('Failed to delete blog draft.');
    }
  };

  const handleWizardComplete = (newBlog) => {
    setIsWizardOpen(false);
    navigate(`/editor/${newBlog._id}`);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const saved = localStorage.getItem('empathwrite_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.name = displayName;
      localStorage.setItem('empathwrite_user', JSON.stringify(parsed));
    }
    setCurrentName(displayName);
    setIsSettingsOpen(false);
    alert('Settings updated successfully!');
  };

  // Compute metrics
  const totalDocs = blogs.length;
  const totalWords = blogs.reduce((acc, curr) => {
    const text = curr.content || '';
    const cleanText = text.replace(/<[^>]*>/g, ' '); // Strip HTML tags
    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
    return acc + words.length;
  }, 0);

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.configuration.tone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-aether-dark text-slate-800 dark:text-aether-on-surface relative select-none transition-colors duration-300">
      {/* Three.js Particle Background (conditionally loaded in hook itself, but handles null if light) */}
      <ThreeBackground />

      {/* Background Atmospheric Blurs */}
      <div className="nebula-glow bg-aether-primary w-[600px] h-[600px] top-[-10%] right-[-10%] rounded-full opacity-10 dark:opacity-10 pointer-events-none"></div>
      <div className="nebula-glow bg-aether-secondary w-[500px] h-[500px] bottom-[-5%] left-[-5%] rounded-full opacity-10 dark:opacity-10 pointer-events-none"></div>

      {/* SideNavBar Shell */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white/70 dark:bg-aether-container/50 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 p-6 gap-6 z-40 shadow-2xl shadow-slate-100 dark:shadow-aether-primary/5 transition-all duration-300">
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center shadow-lg border border-white/10">
              <Feather size={20} className="text-aether-dark" />
            </div>
            <div>
              <h1 className="font-sans text-base font-bold text-slate-900 dark:text-white leading-tight">EmpathWrite</h1>
              <p className="font-sans text-xs text-slate-500 dark:text-aether-on-surface-variant opacity-70">AI Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all scale-[1.02] border cursor-pointer text-left w-full ${
              activeTab === 'workspace'
                ? 'bg-emerald-600/10 dark:bg-aether-tertiary-container text-emerald-800 dark:text-aether-on-tertiary-container border-emerald-500/20 dark:border-white/5 shadow-sm dark:shadow-active-purple font-bold'
                : 'text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent font-semibold'
            }`}
          >
            <Sparkles size={18} />
            <span className="text-xs">Workspace</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all scale-[1.02] border cursor-pointer text-left w-full ${
              activeTab === 'drafts'
                ? 'bg-emerald-600/10 dark:bg-aether-tertiary-container text-emerald-800 dark:text-aether-on-tertiary-container border-emerald-500/20 dark:border-white/5 shadow-sm dark:shadow-active-purple font-bold'
                : 'text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent font-semibold'
            }`}
          >
            <FileText size={18} />
            <span className="text-xs">Drafts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all scale-[1.02] border cursor-pointer text-left w-full ${
              activeTab === 'insights'
                ? 'bg-emerald-600/10 dark:bg-aether-tertiary-container text-emerald-800 dark:text-aether-on-tertiary-container border-emerald-500/20 dark:border-white/5 shadow-sm dark:shadow-active-purple font-bold'
                : 'text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent font-semibold'
            }`}
          >
            <TrendingUp size={18} />
            <span className="text-xs">AI Insights</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all scale-[1.02] border cursor-pointer text-left w-full ${
              activeTab === 'library'
                ? 'bg-emerald-600/10 dark:bg-aether-tertiary-container text-emerald-800 dark:text-aether-on-tertiary-container border-emerald-500/20 dark:border-white/5 shadow-sm dark:shadow-active-purple font-bold'
                : 'text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent font-semibold'
            }`}
          >
            <BookOpen size={18} />
            <span className="text-xs">Library</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all scale-[1.02] border cursor-pointer text-left w-full ${
              activeTab === 'archive'
                ? 'bg-emerald-600/10 dark:bg-aether-tertiary-container text-emerald-800 dark:text-aether-on-tertiary-container border-emerald-500/20 dark:border-white/5 shadow-sm dark:shadow-active-purple font-bold'
                : 'text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent font-semibold'
            }`}
          >
            <Archive size={18} />
            <span className="text-xs">Archive</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-2.5">
          <button 
            onClick={() => {
              setWizardDefaults(null);
              setIsWizardOpen(true);
            }}
            className="btn-gradient w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus size={16} />
            New Draft
          </button>
          
          <button 
            onClick={() => setIsSupportOpen(true)}
            className="flex items-center gap-3.5 p-3 text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer text-left w-full font-semibold"
          >
            <HelpCircle size={18} />
            <span className="text-xs">Support</span>
          </button>
          
          <button 
            onClick={() => setIsAccountOpen(true)}
            className="flex items-center gap-3.5 p-3 text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-150/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer text-left w-full font-semibold"
          >
            <User size={18} />
            <span className="text-xs">Account</span>
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3.5 p-3 text-slate-600 dark:text-aether-on-surface-variant hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all cursor-pointer text-left w-full font-semibold"
          >
            <LogOut size={18} />
            <span className="text-xs">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col relative z-10">
        
        {/* TopNavBar Header */}
        <header className="flex justify-between items-center w-full px-8 py-3 sticky top-0 z-30 bg-[#faf8f5]/80 dark:bg-aether-obsidian/45 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-4 flex-1">
            <div className="recessed-input flex items-center px-4 py-1.5 rounded-full w-full max-w-md group focus-within:ring-1 focus-within:ring-emerald-500 dark:focus-within:ring-aether-secondary transition-all">
              <Search size={16} className="text-slate-405 dark:text-aether-outline mr-2" />
              <input 
                type="text"
                className="bg-transparent border-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant focus:outline-none focus:ring-0 w-full text-sm font-sans"
                placeholder="Search workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-aether-on-surface-variant hover:text-slate-800 dark:hover:text-aether-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent dark:border-none"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notifications Toggler */}
            <div className="relative" ref={notificationMenuRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-expanded={showNotifications}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-aether-on-surface-variant hover:text-slate-800 dark:hover:text-aether-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all relative cursor-pointer"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 dark:bg-aether-secondary rounded-full border border-brand-cream dark:border-aether-obsidian animate-pulse"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-aether-container border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md text-xs">
                  <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 dark:border-white/5">
                    <span className="font-bold text-slate-800 dark:text-white">System Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-[10px] text-emerald-600 dark:text-aether-secondary hover:underline cursor-pointer font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 dark:text-aether-outline text-[11px]">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-2 bg-slate-50 dark:bg-aether-container-low/40 rounded-lg border border-slate-100 dark:border-white/5 space-y-0.5">
                          <p className="text-[11px] leading-normal text-slate-700 dark:text-white">{n.text}</p>
                          <p className="text-[9px] text-slate-400 dark:text-aether-outline font-semibold">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-aether-on-surface-variant hover:text-slate-800 dark:hover:text-aether-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <Settings size={18} />
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{currentName}</p>
                <p className="text-[10px] text-emerald-600 dark:text-aether-secondary opacity-85 leading-tight font-semibold uppercase tracking-wider">Premium Plan</p>
              </div>
              <div 
                onClick={() => setIsAccountOpen(true)}
                className="w-10 h-10 rounded-full border border-aether-primary/30 p-[2px] cursor-pointer hover:border-aether-secondary transition-colors"
              >
                <img 
                  className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-aether-container" 
                  alt="User avatar" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMF3Qs4cKXFzHHvo54B5IDRdt3o-DlHImHLHZut_asB3SHMBGwJ4PHu0ULYsJAoKLEc0V4J75MBXgWc_INjLLlnfmQiEntPrEMHRNPgplqrUktDpDTG4CWc2_lSIynfNC1O16a8z5XUcW9ELN6k8xZA9nYuKeWLGn9eNyt0vManTIcXXMlvTH8BEoS1veztEwaLXwp4oaHjR3S1ihDUD_UmBV5N_-2-GQ5-EIN6Rb8TEAnrRgDo0L5MibTw8RiyNASLRND6da3-yc"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Grid */}
        <section className="p-8 lg:p-10 space-y-10 max-w-[1440px] mx-auto w-full flex-1 z-10">
          
          {activeTab === 'workspace' && (
            <>
              {/* Welcome and Bento Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end animate-in fade-in duration-200">
                <div className="lg:col-span-12">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-aether-primary dark:to-aether-secondary">{currentName.split(' ')[0]}</span>
                  </h2>
                  <p className="text-sm text-slate-650 dark:text-aether-on-surface-variant max-w-2xl">
                    Your AI models have generated 3 new campaign insights since your last login.
                  </p>
                </div>

                {/* Metrics cards */}
                <div className="lg:col-span-4 glass-panel rounded-[2rem] p-6 flex flex-col gap-4 floating-layer" style={{ animationDelay: '0s' }}>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-650/10 dark:bg-aether-primary/10 flex items-center justify-center border border-emerald-500/20 dark:border-aether-primary/20">
                      <Folders size={24} className="text-emerald-600 dark:text-aether-primary" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-aether-secondary">+12% vs last month</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-aether-on-surface-variant uppercase tracking-widest opacity-60">Total Documents</p>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 leading-none">1,284</p>
                  </div>
                </div>

                <div className="lg:col-span-4 glass-panel rounded-[2rem] p-6 flex flex-col gap-4 floating-layer" style={{ animationDelay: '0.8s' }}>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-teal-650/10 dark:bg-aether-secondary/10 flex items-center justify-center border border-teal-500/20 dark:border-aether-secondary/20">
                      <BookOpen size={24} className="text-teal-605 dark:text-aether-secondary" />
                    </div>
                    <span className="text-xs font-semibold text-teal-600 dark:text-aether-secondary">+2.4k today</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-aether-on-surface-variant uppercase tracking-widest opacity-60">Aggregate Words</p>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 leading-none">84.2k</p>
                  </div>
                </div>

                <div className="lg:col-span-4 glass-panel rounded-[2rem] p-6 flex flex-col gap-4 floating-layer" style={{ animationDelay: '1.6s' }}>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-650/10 dark:bg-aether-tertiary/10 flex items-center justify-center border border-indigo-500/20 dark:border-aether-tertiary/20">
                      <Clock size={24} className="text-indigo-600 dark:text-aether-tertiary" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-aether-on-surface-variant">Active now</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-aether-on-surface-variant uppercase tracking-widest opacity-60">Drafting Hours</p>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 leading-none">312</p>
                  </div>
                </div>
              </div>

              {/* Core Content Layout split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                
                {/* Active Campaigns Panel */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      Active Campaigns
                      <span className="px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-aether-secondary/10 text-emerald-700 dark:text-aether-secondary text-[10px] font-bold border border-emerald-200 dark:border-aether-secondary/20 uppercase tracking-wider">Live Now</span>
                    </h3>
                  </div>

                  {loading ? (
                    <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3 glass-panel rounded-3xl">
                      <div className="w-8 h-8 border-2 border-aether-secondary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Loading campaign databases...</span>
                    </div>
                  ) : filteredBlogs.length === 0 ? (
                    <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-slate-200 dark:border-white/5 bg-transparent flex flex-col items-center">
                      <FileCode className="text-slate-400 dark:text-aether-outline mb-4" size={44} />
                      <h3 className="text-slate-650 dark:text-slate-400 font-semibold text-sm">No campaigns found</h3>
                      <p className="text-slate-500 dark:text-slate-600 text-xs max-w-sm mx-auto mt-1">
                        {searchQuery ? "No drafts match your active query filters." : "You haven't generated any dynamic drafts yet."}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => {
                            setWizardDefaults(null);
                            setIsWizardOpen(true);
                          }}
                          className="mt-6 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Create Campaign
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredBlogs.map((blog, idx) => (
                        <div 
                           key={blog._id}
                           onClick={() => navigate(`/editor/${blog._id}`)}
                           className="glass-panel rounded-3xl overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[220px] transition-all hover:-translate-y-1 relative"
                        >
                          {/* Image Cover Block */}
                          <div className="h-44 relative overflow-hidden">
                            <div 
                              className="w-full h-full bg-cover bg-center transition-transform duration-750 group-hover:scale-105" 
                              style={{ backgroundImage: `url('${COVER_IMAGES[idx % COVER_IMAGES.length]}')` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-cream/80 dark:from-aether-dark via-transparent to-transparent"></div>
                            <div className="absolute top-4 right-4">
                              <span className="bg-white/80 dark:bg-aether-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold border border-slate-200 dark:border-white/10 uppercase tracking-wider text-emerald-600 dark:text-aether-secondary">
                                {blog.status === 'published' ? 'Published' : 'In Progress'}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            {/* Title */}
                            <h4 className="text-base font-bold text-slate-800 dark:text-white tracking-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-aether-secondary transition-colors">
                              {blog.title}
                            </h4>
                          </div>

                          {/* Footer Info */}
                          <div className="p-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-aether-on-surface-variant bg-slate-50/50 dark:bg-aether-container-lowest/30">
                            <div className="flex gap-2">
                              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-aether-container-low border border-slate-200 dark:border-white/5 rounded-md font-semibold text-slate-600 dark:text-slate-350">
                                {blog.configuration.tone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-650 dark:text-aether-secondary font-bold group-hover:translate-x-1 transition-transform">
                              <span>Write</span>
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Insights & System Widget Panel */}
                <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Insights</h3>
                  <div className="space-y-4">
                    
                    {/* Insights Cards */}
                    <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-emerald-500 dark:border-l-aether-primary flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-aether-primary/10 flex items-center justify-center text-emerald-605 dark:text-aether-primary">
                        <TrendingUp size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Emotional Tone Shift</p>
                        <p className="text-[11px] text-slate-600 dark:text-aether-on-surface-variant leading-relaxed">
                          Your recent drafts show a 15% increase in 'Supportive' empathy markers.
                        </p>
                      </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-teal-500 dark:border-l-aether-secondary flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-teal-500/10 dark:bg-aether-secondary/10 flex items-center justify-center text-teal-605 dark:text-aether-secondary">
                        <Lightbulb size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Content Opportunity</p>
                        <p className="text-[11px] text-slate-600 dark:text-aether-on-surface-variant leading-relaxed">
                          New trending keywords in 'Sustainable Tech' match your active project.
                        </p>
                      </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-indigo-500 dark:border-l-aether-tertiary flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-aether-tertiary/10 flex items-center justify-center text-indigo-605 dark:text-aether-tertiary">
                        <Zap size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Optimization Tip</p>
                        <p className="text-[11px] text-slate-600 dark:text-aether-on-surface-variant leading-relaxed">
                          Reducing complex adjectives could increase readability for global audiences.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Widget */}
                  <div className="glass-panel rounded-3xl p-6 space-y-4 bg-gradient-to-br from-white to-slate-50 dark:from-aether-container dark:to-aether-container-highest border border-slate-200 dark:border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">Plan Usage</h4>
                      <span className="text-emerald-600 dark:text-aether-secondary font-black">78%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-aether-primary dark:to-aether-secondary w-[78%] rounded-full shadow-[0_0_10px_rgba(76,215,246,0.3)]"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1 text-[11px]">
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant uppercase font-semibold">Token Limit</p>
                        <p className="font-bold text-slate-700 dark:text-white">78.5k / 100k</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant uppercase font-semibold">Resets In</p>
                        <p className="font-bold text-slate-700 dark:text-white">12 Days</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAccountOpen(true)}
                      className="w-full py-2 text-xs font-bold border border-emerald-500/30 dark:border-aether-primary/30 rounded-xl text-emerald-700 dark:text-aether-primary hover:bg-emerald-50/50 dark:hover:bg-aether-primary/5 transition-all cursor-pointer"
                    >
                      Upgrade Capacity
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Documents Bento Grid Section */}
              <div className="space-y-6 pt-4 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="glass-panel rounded-3xl p-5 h-40 flex flex-col justify-between hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="p-2.5 bg-emerald-500/10 dark:bg-aether-primary/10 rounded-xl text-emerald-605 dark:text-aether-primary">
                        <FileText size={18} />
                      </span>
                      <button className="text-slate-400 dark:text-aether-outline hover:text-slate-800 dark:hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Q4 Strategy Roadmap</p>
                      <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant font-semibold mt-1">Last edited 2h ago</p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-5 h-40 flex flex-col justify-between hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="p-2.5 bg-teal-500/10 dark:bg-aether-secondary/10 rounded-xl text-teal-605 dark:text-aether-secondary">
                        <Sparkles size={18} />
                      </span>
                      <button className="text-slate-400 dark:text-aether-outline hover:text-slate-800 dark:hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Product Pitch AI Flow</p>
                      <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant font-semibold mt-1">Last edited 5h ago</p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-5 h-40 flex flex-col justify-between hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="p-2.5 bg-indigo-500/10 dark:bg-aether-tertiary/10 rounded-xl text-indigo-605 dark:text-aether-tertiary">
                        <FileText size={18} />
                      </span>
                      <button className="text-slate-400 dark:text-aether-outline hover:text-slate-800 dark:hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Client Onboarding Mailer</p>
                      <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant font-semibold mt-1">Last edited yesterday</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setWizardDefaults(null);
                      setIsWizardOpen(true);
                    }}
                    className="glass-panel rounded-3xl p-5 h-40 flex flex-col justify-between hover:translate-y-[-4px] transition-transform cursor-pointer border-dashed border-2 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-aether-primary/40 bg-transparent flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-aether-outline group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">
                      <PlusCircle size={28} />
                      <p className="text-xs font-bold uppercase tracking-wider">New Template</p>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {activeTab === 'drafts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  Active Drafts
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-aether-primary/10 text-emerald-700 dark:text-aether-primary text-[10px] font-bold border border-emerald-200 dark:border-aether-primary/20 uppercase tracking-wider">
                    {blogs.filter(b => b.status === 'draft').length} Drafts
                  </span>
                </h3>
              </div>

              {blogs.filter(b => b.status === 'draft').length === 0 ? (
                <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-slate-200 dark:border-white/5 bg-transparent flex flex-col items-center">
                  <FileCode className="text-slate-400 dark:text-aether-outline mb-4" size={44} />
                  <h3 className="text-slate-650 dark:text-slate-400 font-semibold text-sm">No drafts found</h3>
                  <p className="text-slate-500 dark:text-slate-650 text-xs mt-1">You haven't generated or saved any blog drafts yet.</p>
                  <button
                    onClick={() => {
                      setWizardDefaults(null);
                      setIsWizardOpen(true);
                    }}
                    className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Create a Draft
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.filter(b => b.status === 'draft').map((blog, idx) => (
                    <div 
                      key={blog._id}
                      onClick={() => navigate(`/editor/${blog._id}`)}
                      className="glass-panel rounded-3xl overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[220px] transition-all hover:-translate-y-1 relative"
                    >
                      <div className="h-40 relative overflow-hidden">
                        <div 
                          className="w-full h-full bg-cover bg-center transition-transform duration-750 group-hover:scale-105" 
                          style={{ backgroundImage: `url('${COVER_IMAGES[idx % COVER_IMAGES.length]}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream/80 dark:from-aether-dark via-transparent to-transparent"></div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight line-clamp-2 group-hover:text-emerald-605 dark:group-hover:text-aether-secondary transition-colors">
                          {blog.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-aether-outline mt-1.5 uppercase font-semibold tracking-wider font-semibold">Tone: {blog.configuration.tone}</p>
                      </div>
                      <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-emerald-650 dark:text-aether-secondary font-bold bg-slate-50/50 dark:bg-aether-container-lowest/30">
                        <span>Open Draft</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dynamic AI Insights</h3>
                <p className="text-xs text-slate-550 dark:text-aether-on-surface-variant mt-1">Deep analysis metrics for your EmpathWrite content assets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Metric 1 */}
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 dark:bg-aether-primary/10 rounded-2xl text-emerald-605 dark:text-aether-primary">
                      <TrendingUp size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Readability Rating</h4>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100 dark:text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-500 dark:text-aether-secondary" strokeWidth="3" strokeDasharray="86, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="text-xs font-black text-slate-800 dark:text-white">86%</span>
                    </div>
                    <p className="text-[11px] text-slate-550 dark:text-aether-on-surface-variant leading-relaxed">
                      Content features a high readability profile suitable for conversational and global audiences.
                    </p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 dark:bg-aether-secondary/10 rounded-2xl text-teal-605 dark:text-aether-secondary">
                      <Lightbulb size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Semantic Anchors</h4>
                  </div>
                  <div className="space-y-1.5 pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                    <div className="flex justify-between p-2 bg-slate-50 dark:bg-aether-container-low/40 rounded-xl">
                      <span>"generative agents"</span>
                      <span className="text-emerald-650 dark:text-aether-secondary">SEO High</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 dark:bg-aether-container-low/40 rounded-xl">
                      <span>"cognitive layers"</span>
                      <span className="text-indigo-650 dark:text-aether-primary">Relevant</span>
                    </div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 dark:bg-aether-tertiary/10 rounded-2xl text-indigo-605 dark:text-aether-tertiary">
                      <Zap size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Empathy Index</h4>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[10px] text-slate-550 dark:text-aether-on-surface-variant">
                      <span>Empathy Markers</span>
                      <span className="text-indigo-600 dark:text-aether-tertiary font-bold">Optimal</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 dark:bg-aether-tertiary w-[92%] rounded-full shadow-[0_0_10px_rgba(255,175,211,0.3)]"></div>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-aether-outline italic font-semibold">Analyzed tone presets match natural conversational rhythm.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Writing Templates Library</h3>
                <p className="text-xs text-slate-550 dark:text-aether-on-surface-variant mt-1">Pre-structured outline profiles to launch campaigns quickly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Tech Blog Outline", desc: "For deeply technical product releases and agentic blueprints.", type: "Tech" },
                  { title: "Executive Update", desc: "Short, punched business reports styled for high-level summaries.", type: "Corporate" },
                  { title: "Landing Page Copy", desc: "Conversational copy structure to increase target conversions.", type: "Marketing" },
                  { title: "Narrative Storytelling", desc: "Empathy-rich narrative guidelines for VR and creative posts.", type: "Creative" }
                ].map((temp, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setWizardDefaults({
                        title: temp.title,
                        targetAudience: temp.type === 'Tech' ? 'Tech Enthusiasts' : temp.type === 'Corporate' ? 'Corporate Executives' : 'Casual Readers',
                        tone: temp.type === 'Creative' ? 'Empathetic' : temp.type === 'Tech' ? 'Highly Technical' : 'Conversational',
                        objective: 'Inform/Educate',
                        groundingContext: ''
                      });
                      setIsWizardOpen(true);
                    }}
                    className="glass-panel rounded-3xl p-5 h-44 flex flex-col justify-between hover:translate-y-[-4px] transition-transform cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center text-aether-dark font-black text-xs">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">{temp.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-aether-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">{temp.desc}</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-aether-secondary uppercase tracking-wider flex items-center gap-1">
                      Use Template <ArrowRight size={10} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  Archived & Published Campaigns
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                    {blogs.filter(b => b.status === 'published').length} Published
                  </span>
                </h3>
              </div>

              {blogs.filter(b => b.status === 'published').length === 0 ? (
                <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-slate-200 dark:border-white/5 bg-transparent flex flex-col items-center">
                  <CheckCircle className="text-slate-400 dark:text-aether-outline mb-4" size={44} />
                  <h3 className="text-slate-650 dark:text-slate-400 font-semibold text-sm">No archived campaigns</h3>
                  <p className="text-slate-500 dark:text-slate-600 text-xs mt-1">You haven't marked any campaign drafts as published yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.filter(b => b.status === 'published').map((blog, idx) => (
                    <div 
                      key={blog._id}
                      onClick={() => navigate(`/editor/${blog._id}`)}
                      className="glass-panel rounded-3xl overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[220px] transition-all hover:-translate-y-1 relative"
                    >
                      <div className="h-40 relative overflow-hidden">
                        <div 
                          className="w-full h-full bg-cover bg-center transition-transform duration-750 group-hover:scale-105" 
                          style={{ backgroundImage: `url('${COVER_IMAGES[idx % COVER_IMAGES.length]}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream/80 dark:from-aether-dark via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className="bg-emerald-50 dark:bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Published
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight line-clamp-2 group-hover:text-emerald-605 dark:group-hover:text-aether-secondary transition-colors">
                          {blog.title}
                        </h4>
                      </div>
                      <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-emerald-650 dark:text-emerald-400 font-bold bg-slate-50/50 dark:bg-aether-container-lowest/30">
                        <span>View Campaign</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>

        {/* Footer Area */}
        <footer className="mt-auto p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-aether-obsidian/20 backdrop-blur-md relative z-10 text-xs transition-colors duration-300">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-aether-on-surface-variant">© 2026 EmpathWrite AI. Powered by Aether 3D Engine.</p>
            <div className="flex gap-6">
              <a className="text-slate-500 dark:text-aether-on-surface-variant hover:text-emerald-600 dark:hover:text-aether-primary transition-colors" href="#">Privacy</a>
              <a className="text-slate-500 dark:text-aether-on-surface-variant hover:text-emerald-600 dark:hover:text-aether-primary transition-colors" href="#">Terms</a>
              <a className="text-slate-500 dark:text-aether-on-surface-variant hover:text-emerald-600 dark:hover:text-aether-primary transition-colors" href="#">API Docs</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel w-full max-w-md bg-white dark:bg-aether-container/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-3xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-bold text-slate-805 dark:text-white flex items-center gap-2">
                <Settings size={18} className="text-emerald-600 dark:text-aether-primary" />
                Workspace Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Display Name</label>
                <input 
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-recessed w-full h-11 px-4 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Default Tone Preset</label>
                <select
                  value={selectedDefaultTone}
                  onChange={(e) => setSelectedDefaultTone(e.target.value)}
                  className="input-recessed w-full h-11 px-4 rounded-xl text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Empathetic" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Empathetic</option>
                  <option value="Conversational" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Conversational</option>
                  <option value="Witty" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Witty</option>
                  <option value="Highly Technical" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Highly Technical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Model Config</label>
                <input 
                  type="text"
                  disabled
                  value="llama-3.3-70b-versatile (Groq)"
                  className="input-recessed w-full h-11 px-4 rounded-xl text-xs text-slate-400 opacity-60"
                />
              </div>

              <button 
                type="submit"
                className="btn-gradient w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 mt-2 cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel w-full max-w-md bg-white dark:bg-aether-container/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-3xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <User size={18} className="text-emerald-600 dark:text-aether-primary" />
                User Profile
              </h3>
              <button onClick={() => setIsAccountOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-aether-container-low/40 border border-slate-200 dark:border-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full border border-aether-primary/30 p-[2px]">
                  <img 
                    className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-aether-container" 
                    alt="User avatar" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMF3Qs4cKXFzHHvo54B5IDRdt3o-DlHImHLHZut_asB3SHMBGwJ4PHu0ULYsJAoKLEc0V4J75MBXgWc_INjLLlnfmQiEntPrEMHRNPgplqrUktDpDTG4CWc2_lSIynfNC1O16a8z5XUcW9ELN6k8xZA9nYuKeWLGn9eNyt0vManTIcXXMlvTH8BEoS1veztEwaLXwp4oaHjR3S1ihDUD_UmBV5N_-2-GQ5-EIN6Rb8TEAnrRgDo0L5MibTw8RiyNASLRND6da3-yc"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{currentName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-aether-outline">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 dark:border-white/5 p-4 rounded-2xl bg-slate-50/50 dark:bg-aether-container-lowest/30">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 dark:text-aether-outline">Plan Type:</span>
                  <span className="font-bold text-emerald-600 dark:text-aether-secondary uppercase tracking-wider">Premium Plan</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 dark:text-aether-outline">User ID:</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{user?.id || 'guest_id'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 dark:text-aether-outline">Token Quota:</span>
                  <span className="font-bold text-slate-800 dark:text-white">78.5k / 100k generated</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-aether-outline">Active campaigns:</span>
                  <span className="font-bold text-slate-805 dark:text-white">{totalDocs}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-aether-container-highest border border-slate-250 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => setIsAccountOpen(false)}
                  className="flex-1 py-2.5 btn-gradient text-slate-900 font-bold rounded-xl transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel w-full max-w-lg bg-white dark:bg-aether-container/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-emerald-600 dark:text-aether-primary" />
                Help & Support Center
              </h3>
              <button onClick={() => setIsSupportOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-aether-secondary uppercase tracking-wider">Frequently Asked Questions</h4>
                <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-aether-on-surface-variant">
                  <div className="p-3 bg-slate-50 dark:bg-aether-container-low/40 border border-slate-200 dark:border-white/5 rounded-xl">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">How does dynamic text streaming work?</p>
                    <p>When you trigger outline content drafting, we establish an SSE stream to our Groq llama-3.3 model to stream tokens directly into the editor viewport real-time.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-aether-container-low/40 border border-slate-200 dark:border-white/5 rounded-xl">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">Can guest users download PDFs?</p>
                    <p>Yes. Both TXT and PDF exporters run entirely client-side, translating your workspace editor nodes into structured vector pages without hitting quotas.</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-white/5"></div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Support Ticket Submitted Successfully! Our helpdesk will email you shortly.');
                  setSupportMessage('');
                  setIsSupportOpen(false);
                }} 
                className="space-y-3"
              >
                <h4 className="text-xs font-bold text-emerald-600 dark:text-aether-primary uppercase tracking-wider">Submit Helpdesk Ticket</h4>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider">Subject</label>
                  <select 
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="input-recessed w-full h-10 px-3 rounded-xl text-xs text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="General Inquiry" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">General Inquiry</option>
                    <option value="Technical Issue" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Technical Issue</option>
                    <option value="Quota/Billing Query" className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">Quota/Billing Query</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider">Message Description</label>
                  <textarea
                    required
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your inquiry..."
                    className="input-recessed w-full p-3 rounded-xl text-xs text-slate-900 dark:text-white resize-none font-sans"
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-gradient w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 cursor-pointer"
                >
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Stepper Dialog */}
      <Wizard 
        isOpen={isWizardOpen} 
        initialValues={wizardDefaults}
        onClose={() => setIsWizardOpen(false)} 
        onComplete={handleWizardComplete} 
      />
    </div>
  );
}
