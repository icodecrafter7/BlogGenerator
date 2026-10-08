import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { User, Mail, Lock, AlertCircle, RefreshCw, UserCircle2, ArrowRight, Eye, EyeOff, Feather, Sun, Moon } from 'lucide-react';

export default function Signup() {
  const { signup, loginAsGuest, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const res = await signup(name, email, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 45; // Subtle tilt
    const rotateY = (centerX - x) / 45;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  return (
    <div className="bg-brand-cream dark:bg-aether-dark text-slate-800 dark:text-aether-on-surface min-h-screen flex items-center justify-center p-6 overflow-hidden relative select-none transition-colors duration-300">
      {/* 3D Particle Cloud */}
      <ThreeBackground />

      {/* Floating Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-650 dark:text-aether-on-surface-variant transition-all cursor-pointer border border-slate-200 dark:border-white/10 shadow-sm"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Atmospheric Glows */}
      <div className="nebula-glow bg-aether-primary w-[500px] h-[500px] top-[-100px] left-[-100px] rounded-full opacity-10 dark:opacity-15 pointer-events-none"></div>
      <div className="nebula-glow bg-aether-secondary w-[500px] h-[500px] bottom-[-100px] right-[-100px] rounded-full opacity-10 dark:opacity-10 pointer-events-none"></div>

      {/* Signup Container */}
      <main className="relative z-10 w-full max-w-[440px] flex items-center justify-center min-h-screen py-10">
        <div 
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-6 w-full"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Gradient Icon Logo */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center shadow-lg shadow-aether-primary/25 border border-white/10">
              <Feather size={22} className="text-aether-dark" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
              Create Account
            </h1>
            <p className="text-slate-500 dark:text-slate-450 text-sm font-medium">
              Start drafting human-aligned content with AI
            </p>
          </div>

          {error && (
            <div className="w-full flex items-start gap-3 bg-red-950/30 border border-red-500/20 text-red-400 dark:text-red-300 p-3 rounded-lg text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-aether-on-surface-variant px-1">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-aether-outline" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-recessed w-full h-12 pl-11 pr-4 rounded-xl text-sm font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-aether-on-surface-variant px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-aether-outline" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-recessed w-full h-12 pl-11 pr-4 rounded-xl text-sm font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-aether-on-surface-variant px-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-aether-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-recessed w-full h-12 pl-11 pr-11 rounded-xl text-sm font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant transition-all"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-aether-outline hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-900 font-sans flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="w-full flex flex-col items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-aether-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 dark:text-aether-secondary font-bold hover:underline transition-all">
                Log in
              </Link>
            </p>

            {/* Social Divider */}
            <div className="flex items-center w-full gap-3">
              <div className="h-[1px] flex-1 bg-slate-150 dark:bg-white/10"></div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-aether-outline-variant uppercase tracking-wider">Or continue with</span>
              <div className="h-[1px] flex-1 bg-slate-150 dark:bg-white/10"></div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={loginAsGuest}
                disabled={loading}
                className="flex-1 h-11 glass-panel rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer border border-slate-200 dark:border-white/10"
              >
                <UserCircle2 size={16} className="text-emerald-600 dark:text-aether-secondary" />
                <span>Guest Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secure Message Footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
          <p className="text-[10px] text-slate-455 dark:text-aether-outline-variant/60 flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Secure AES-256 encrypted authentication
          </p>
        </div>
      </main>
    </div>
  );
}
