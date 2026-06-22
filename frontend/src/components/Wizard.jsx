import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, X, BookOpen, User, Volume2, AlignLeft, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext.jsx';

const STEPS = [
  { id: 'title', name: 'Topic' },
  { id: 'audience', name: 'Audience & Goal' },
  { id: 'tone', name: 'Voice & Tone' },
  { id: 'grounding', name: 'Reference Context' }
];

const AUDIENCE_OPTIONS = ['Casual Readers', 'Tech Enthusiasts', 'Corporate Executives', 'Students'];
const OBJECTIVE_OPTIONS = ['Inform/Educate', 'Persuade/Sell', 'Entertain', 'Storytelling'];
const TONE_OPTIONS = ['Empathetic', 'Conversational', 'Witty', 'Academic', 'Highly Technical'];

export default function Wizard({ isOpen, initialValues, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  // Form states
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [objective, setObjective] = useState(OBJECTIVE_OPTIONS[0]);
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [groundingContext, setGroundingContext] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setTitle(initialValues.title || '');
        setTargetAudience(initialValues.targetAudience || AUDIENCE_OPTIONS[0]);
        setObjective(initialValues.objective || OBJECTIVE_OPTIONS[0]);
        setTone(initialValues.tone || TONE_OPTIONS[0]);
        setGroundingContext(initialValues.groundingContext || '');
      } else {
        setTitle('');
        setTargetAudience(AUDIENCE_OPTIONS[0]);
        setObjective(OBJECTIVE_OPTIONS[0]);
        setTone(TONE_OPTIONS[0]);
        setGroundingContext('');
      }
      setCurrentStep(0);
      setDirection(0);
      setError('');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === 0 && !title.trim()) {
      setError('A working title or topic is required to continue.');
      return;
    }
    setError('');
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        title,
        configuration: {
          targetAudience,
          objective,
          tone,
          groundingContext
        }
      };

      const { data } = await axios.post('/api/blogs', payload);
      if (data.success) {
        onComplete(data.blog);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create blog project.');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div 
        className="glass-panel w-full max-w-2xl bg-white dark:bg-aether-container/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-3xl transition-colors duration-300"
      >
        {/* Header Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-250/60 dark:border-white/5 bg-slate-50 dark:bg-aether-container-lowest/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold text-sm">
            <Sparkles size={16} className="text-emerald-600 dark:text-aether-secondary animate-pulse" />
            <span>Workspace Alignment Profiler</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Map */}
        <div className="flex px-8 py-4 bg-slate-50/20 dark:bg-aether-container-lowest/25 border-b border-slate-250/60 dark:border-white/5 justify-between items-center text-[11px]">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold border transition-all ${
                idx <= currentStep 
                  ? 'bg-emerald-600/10 dark:bg-aether-primary/20 border-emerald-600 dark:border-aether-primary text-emerald-800 dark:text-aether-primary shadow-sm dark:shadow-aether-primary/25' 
                  : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-aether-outline-variant'
              }`}>
                {idx < currentStep ? <Check size={10} strokeWidth={3} /> : idx + 1}
              </span>
              <span className={idx === currentStep ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-450 dark:text-aether-outline-variant font-semibold'}>
                {step.name}
              </span>
              {idx < STEPS.length - 1 && <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/5 hidden sm:block mx-1"></div>}
            </div>
          ))}
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Body */}
        <div className="flex-1 p-8 overflow-y-auto min-h-[250px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full flex flex-col justify-center"
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-aether-on-surface-variant mb-2">
                    <BookOpen size={20} className="text-emerald-600 dark:text-aether-secondary" />
                    <h3 className="text-base font-bold text-slate-850 dark:text-white">Define your topic</h3>
                  </div>
                  <p className="text-slate-600 dark:text-aether-on-surface-variant text-xs leading-relaxed">
                    Enter the topic, prompt context, or tentative headline you wish to create.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-aether-outline uppercase tracking-wider px-1">Working Title / Theme</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 input-recessed rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant transition-all font-sans"
                      placeholder="e.g., The Future of Agentic Software Architectures"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setError('');
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-slate-550 dark:text-aether-on-surface-variant mb-2">
                    <User size={20} className="text-emerald-600 dark:text-aether-secondary" />
                    <h3 className="text-base font-bold text-slate-850 dark:text-white">Who is this for?</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Target Demographic</label>
                      <select
                        className="w-full px-4 py-3 input-recessed rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-aether-secondary transition-all cursor-pointer font-sans"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      >
                        {AUDIENCE_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">{opt}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Primary Objective</label>
                      <select
                        className="w-full px-4 py-3 input-recessed rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-aether-secondary transition-all cursor-pointer font-sans"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                      >
                        {OBJECTIVE_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-550 dark:text-aether-on-surface-variant mb-2">
                    <Volume2 size={20} className="text-emerald-600 dark:text-aether-secondary" />
                    <h3 className="text-base font-bold text-slate-850 dark:text-white">Align voice and tone</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider px-1">Narrative Style Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TONE_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTone(opt)}
                          className={`px-4 py-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left transition-all duration-205 hover:-translate-y-0.5 ${
                            tone === opt 
                              ? 'bg-emerald-600/10 dark:bg-aether-primary/20 border-emerald-500 dark:border-aether-primary text-emerald-800 dark:text-white shadow-md dark:shadow-aether-primary/10' 
                              : 'bg-slate-100 dark:bg-aether-container-low/40 border-slate-205 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-slate-600 dark:text-aether-on-surface-variant hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-550 dark:text-aether-on-surface-variant mb-2">
                    <AlignLeft size={20} className="text-emerald-600 dark:text-aether-secondary" />
                    <h3 className="text-base font-bold text-slate-850 dark:text-white">Grounding sources (Optional)</h3>
                  </div>
                  <p className="text-slate-600 dark:text-aether-on-surface-variant text-xs leading-relaxed">
                    Paste up to 8,000 characters of facts, raw data or reference materials to guide generation filters.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1 px-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-aether-outline uppercase tracking-wider">Reference context</label>
                      <span className={`text-[9px] font-semibold ${groundingContext.length > 8000 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {groundingContext.length} / 8000
                      </span>
                    </div>
                    <textarea
                      maxLength={8200}
                      rows={5}
                      className="w-full px-4 py-3 input-recessed rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant transition resize-none font-mono"
                      placeholder="Paste bullet notes, stats, or reference data here..."
                      value={groundingContext}
                      onChange={(e) => setGroundingContext(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-aether-container-lowest/30">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-aether-on-surface-variant hover:text-slate-900 dark:hover:text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-slate-100 dark:bg-aether-container-highest border border-slate-250 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || groundingContext.length > 8000}
              className="btn-gradient px-5 py-2 text-slate-900 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Aligning...
                </>
              ) : (
                <>
                  Create Workspace
                  <Sparkles size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
