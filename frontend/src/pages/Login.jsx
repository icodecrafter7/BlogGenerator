import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import ThreeBackground from '../components/ThreeBackground.jsx';
import { Mail, Lock, AlertCircle, RefreshCw, UserCircle2, ArrowRight, Eye, EyeOff, Feather } from 'lucide-react';

export default function Login() {
  const { login, loginAsGuest, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const res = await login(email, password);
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
    
    const rotateX = (y - centerY) / 45; // Subtle tilt effect
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
    <div className="bg-aether-obsidian text-aether-on-surface min-h-screen flex items-center justify-center p-6 overflow-hidden relative select-none">
      {/* 3D Particle Cloud */}
      <ThreeBackground />

      {/* Atmospheric Glows */}
      <div className="nebula-glow bg-aether-primary w-[500px] h-[500px] top-[-100px] left-[-100px] rounded-full opacity-15"></div>
      <div className="nebula-glow bg-aether-secondary w-[500px] h-[500px] bottom-[-100px] right-[-100px] rounded-full opacity-10"></div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[440px] flex items-center justify-center min-h-screen py-10">
        <div 
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-6 w-full"
          style={{ 
            backdropFilter: 'blur(40px)', 
            background: 'rgba(15, 23, 42, 0.4)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(139, 92, 246, 0.2), 0 0 80px rgba(76, 215, 246, 0.1)' 
          }}
        >
          {/* Brand Identity */}
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Gradient Icon Logo */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aether-primary to-aether-secondary flex items-center justify-center shadow-lg shadow-aether-primary/25 border border-white/10">
              <Feather size={22} className="text-aether-dark" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-sm">
              Continue your creative journey with AI
            </p>
          </div>

          {error && (
            <div className="w-full flex items-start gap-3 bg-red-950/30 border border-red-500/20 text-red-300 p-3 rounded-lg text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-aether-on-surface-variant px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-aether-outline" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-recessed w-full h-12 pl-11 pr-4 rounded-xl text-sm font-sans text-white placeholder:text-aether-outline-variant transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-aether-on-surface-variant">
                  Password
                </label>
                <a className="text-xs font-semibold text-aether-secondary hover:text-aether-primary transition-colors" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-aether-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-recessed w-full h-12 pl-11 pr-11 rounded-xl text-sm font-sans text-white placeholder:text-aether-outline-variant transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-aether-outline hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer group w-fit">
              <div className="relative flex items-center">
                <input 
                  type="checkbox"
                  className="peer appearance-none w-4 h-4 rounded border border-aether-outline-variant bg-aether-container-low checked:bg-aether-primary checked:border-aether-primary transition-all cursor-pointer"
                />
                <span className="absolute inset-0 text-aether-container-lowest text-[12px] flex items-center justify-center font-bold opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">✓</span>
              </div>
              <span className="text-xs text-aether-on-surface-variant group-hover:text-white transition-colors">
                Remember this device
              </span>
            </label>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-900 font-sans flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="w-full flex flex-col items-center gap-4 pt-4 border-t border-white/5">
            <p className="text-xs text-aether-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/signup" className="text-aether-secondary font-bold hover:underline transition-all">
                Sign Up
              </Link>
            </p>

            {/* Social Login Divider */}
            <div className="flex items-center w-full gap-3">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-[10px] font-bold text-aether-outline-variant uppercase tracking-wider">Or continue with</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={loginAsGuest}
                disabled={loading}
                className="flex-1 h-11 glass-panel rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                <UserCircle2 size={16} className="text-aether-secondary" />
                <span>Guest Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secure Message Footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
          <p className="text-[10px] text-aether-outline-variant/60 flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Secure AES-256 encrypted authentication
          </p>
        </div>
      </main>
    </div>
  );
}
