import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext.jsx';
import { 
  ArrowLeft, Save, CheckCircle, Sparkles, Plus, Trash2, 
  ArrowUp, ArrowDown, ChevronRight, Edit2, Play, Eye, EyeOff, HelpCircle,
  Download, FileText, X
} from 'lucide-react';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved' | 'Unsaved Changes' | 'Saving...'
  const [error, setError] = useState('');
  
  // Custom bubble menu states
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState({ top: 0, left: 0 });
  const [highlightedText, setHighlightedText] = useState('');
  const [inlineLoading, setInlineLoading] = useState(false);

  // New heading states
  const [newHeadingTitle, setNewHeadingTitle] = useState('');
  const [newHeadingLevel, setNewHeadingLevel] = useState(2);

  // Export dropdown state and ref
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState('public');
  const [publishTags, setPublishTags] = useState('');

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize TipTap
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setSaveStatus('Unsaved Changes');
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setShowBubbleMenu(false);
        return;
      }

      const text = editor.state.doc.textBetween(from, to, ' ');
      if (!text.trim()) {
        setShowBubbleMenu(false);
        return;
      }
      setHighlightedText(text);

      // Calculate position of bubble menu
      try {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        // Compute positioning centered above the highlighted block
        const editorContainer = view.dom.getBoundingClientRect();
        const top = start.top - editorContainer.top + view.dom.parentElement.scrollTop - 48;
        const left = (start.left + end.left) / 2 - editorContainer.left;

        setBubbleMenuPos({ top, left: Math.max(10, left) });
        setShowBubbleMenu(true);
      } catch (err) {
        console.error('Error computing bubble menu coords:', err);
      }
    }
  });

  // Fetch blog data
  const fetchBlog = async () => {
    try {
      const { data } = await axios.get(`/api/blogs/${id}`);
      if (data.success) {
        setBlog(data.blog);
        setPublishVisibility(data.blog.visibility || 'public');
        setPublishTags(data.blog.tags ? data.blog.tags.join(', ') : '');
        if (editor && data.blog.content) {
          editor.commands.setContent(data.blog.content);
        }
      }
    } catch (err) {
      setError('Failed to fetch blog workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, [id, editor]);

  // Handle Save
  const handleSave = async (silent = false) => {
    if (!silent) setSaveStatus('Saving...');
    try {
      const payload = {
        title: blog.title,
        content: editor.getHTML(),
        outline: blog.outline,
        status: blog.status
      };
      await axios.put(`/api/blogs/${id}/save`, payload);
      setSaveStatus('Saved');
    } catch (err) {
      setSaveStatus('Unsaved Changes');
      if (!silent) alert('Failed to auto-save editor contents.');
    }
  };

  // Auto-Save interval
  useEffect(() => {
    if (saveStatus === 'Unsaved Changes') {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 5000); // Auto save after 5s of inactivity
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Generate Outline blueprint
  const generateOutline = async () => {
    setOutlineLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`/api/blogs/${id}/outline`);
      if (data.success) {
        setBlog(data.blog);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate outline.');
    } finally {
      setOutlineLoading(false);
    }
  };

  // Start content generation stream
  const startGenerationStream = () => {
    if (streaming) return;
    setStreaming(true);
    setError('');
    editor.commands.setContent('<p className="shimmer-text">Aligning cognitive models and initializing streams...</p>');

    let accumulatedHtml = '';
    const eventSource = new EventSource(`/api/blogs/${id}/stream`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setStreaming(false);
        // Sync final content to local state and DB
        setBlog(prev => ({ ...prev, content: accumulatedHtml }));
        setSaveStatus('Unsaved Changes');
      } else {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            eventSource.close();
            setStreaming(false);
            return;
          }
          
          if (accumulatedHtml === '') {
            // Clear the placeholder shimmer text on first token
            editor.commands.setContent('');
          }

          accumulatedHtml += data.text;
          editor.commands.setContent(accumulatedHtml);
        } catch (e) {
          console.error('SSE token parse error:', e);
        }
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Text streaming interrupted.');
      eventSource.close();
      setStreaming(false);
    };
  };

  // Inline action handler
  const handleInlineEdit = async (action, tonePreset = null) => {
    setInlineLoading(true);
    setShowBubbleMenu(false);
    try {
      const payload = {
        text: highlightedText,
        action,
        tone: tonePreset
      };
      
      const { data } = await axios.post('/api/blogs/inline-edit', payload);
      if (data.success && data.text) {
        const { from, to } = editor.state.selection;
        editor.chain().focus().insertContentAt({ from, to }, data.text).run();
        setSaveStatus('Unsaved Changes');
      }
    } catch (err) {
      alert('Inline modification failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setInlineLoading(false);
    }
  };

  // Outline builders helper methods
  const addOutlineSection = () => {
    if (!newHeadingTitle.trim()) return;
    const newSection = {
      heading: newHeadingTitle,
      level: parseInt(newHeadingLevel),
      brief_intent: 'Manually added blueprint block.'
    };
    const updatedOutline = [...blog.outline, newSection];
    setBlog(prev => ({ ...prev, outline: updatedOutline }));
    setNewHeadingTitle('');
    setSaveStatus('Unsaved Changes');
  };

  const deleteOutlineSection = (index) => {
    const updatedOutline = blog.outline.filter((_, idx) => idx !== index);
    setBlog(prev => ({ ...prev, outline: updatedOutline }));
    setSaveStatus('Unsaved Changes');
  };

  const moveOutlineSection = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blog.outline.length - 1) return;
    
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updatedOutline = [...blog.outline];
    const temp = updatedOutline[index];
    updatedOutline[index] = updatedOutline[targetIdx];
    updatedOutline[targetIdx] = temp;

    setBlog(prev => ({ ...prev, outline: updatedOutline }));
    setSaveStatus('Unsaved Changes');
  };

  const toggleSectionLevel = (index) => {
    const updatedOutline = [...blog.outline];
    updatedOutline[index].level = updatedOutline[index].level === 2 ? 3 : 2;
    setBlog(prev => ({ ...prev, outline: updatedOutline }));
    setSaveStatus('Unsaved Changes');
  };

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    setSaveStatus('Saving...');
    try {
      const payload = {
        title: blog.title,
        content: editor.getHTML(),
        outline: blog.outline,
        status: 'published',
        visibility: publishVisibility,
        tags: publishTags
      };
      const { data } = await axios.put(`/api/blogs/${id}`, payload);
      if (data.success) {
        setBlog(data.blog);
        setSaveStatus('Saved');
        setIsPublishModalOpen(false);
        alert('Blog published successfully!');
      }
    } catch (err) {
      setSaveStatus('Unsaved Changes');
      alert('Failed to publish blog: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRevertToDraft = async () => {
    setSaveStatus('Saving...');
    try {
      const payload = {
        title: blog.title,
        content: editor.getHTML(),
        outline: blog.outline,
        status: 'draft',
        visibility: 'private'
      };
      const { data } = await axios.put(`/api/blogs/${id}`, payload);
      if (data.success) {
        setBlog(data.blog);
        setSaveStatus('Saved');
        setIsPublishModalOpen(false);
        alert('Reverted to draft.');
      }
    } catch (err) {
      setSaveStatus('Unsaved Changes');
      alert('Failed to revert to draft: ' + (err.response?.data?.error || err.message));
    }
  };

  // TXT Exporter
  const handleDownloadTxt = () => {
    if (!editor) return;
    const title = blog?.title || 'Untitled Blog';
    const text = editor.getText();
    const fileContent = `${title}\n\n${text}`;
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // PDF Exporter using dynamically imported jsPDF
  const handleDownloadPdf = async () => {
    if (!editor) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.height;
      const margin = 20; // 20mm margins
      const contentWidth = doc.internal.pageSize.width - margin * 2;
      let posY = margin;

      const checkPageBreak = (neededHeight) => {
        if (posY + neededHeight > pageHeight - margin) {
          doc.addPage();
          posY = margin;
        }
      };

      const addText = (text, fontSize, isBold = false, spacingAfter = 6, indent = 0) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        
        const wrappedText = doc.splitTextToSize(text, contentWidth - indent);
        const lineHeight = fontSize * 0.3527 * 1.25;
        const totalHeight = wrappedText.length * lineHeight;

        checkPageBreak(totalHeight + spacingAfter);

        wrappedText.forEach((line) => {
          doc.text(line, margin + indent, posY);
          posY += lineHeight;
        });

        posY += spacingAfter;
      };

      // 1. Title
      const title = blog?.title || 'Untitled Blog';
      addText(title, 24, true, 12, 0);

      // 2. Parse HTML structure into readable sections
      const htmlString = editor.getHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;

      const children = tempDiv.childNodes;
      children.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();
        const text = node.innerText || node.textContent || '';
        if (!text.trim() && tag !== 'ul' && tag !== 'ol') return;

        if (tag === 'h2') {
          addText(text, 16, true, 8, 0);
        } else if (tag === 'h3') {
          addText(text, 13, true, 6, 0);
        } else if (tag === 'p') {
          addText(text, 10, false, 5, 0);
        } else if (tag === 'ul' || tag === 'ol') {
          const listItems = node.childNodes;
          let count = 1;
          listItems.forEach((li) => {
            if (li.nodeType !== Node.ELEMENT_NODE || li.tagName.toLowerCase() !== 'li') return;
            const bullet = tag === 'ul' ? '• ' : `${count}. `;
            const liText = bullet + (li.innerText || li.textContent || '');
            addText(liText, 10, false, 4, 6);
            count++;
          });
          posY += 2;
        }
      });

      doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-aether-dark text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-aether-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span>Configuring creator workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-aether-dark text-slate-800 dark:text-aether-on-surface flex flex-col max-h-screen overflow-hidden relative transition-colors duration-300">
      {/* Editor Header Navigation */}
      <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-[#faf8f5]/85 dark:bg-aether-obsidian/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          
          <input
            type="text"
            className="bg-transparent border-none text-slate-905 dark:text-white font-bold text-lg focus:outline-none focus:ring-0 w-64 sm:w-96 truncate"
            value={blog?.title || ''}
            onChange={(e) => {
              setBlog(prev => ({ ...prev, title: e.target.value }));
              setSaveStatus('Unsaved Changes');
            }}
          />

          <span className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
            saveStatus === 'Saved' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-[#059669]' 
              : 'bg-amber-900/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}>
            <CheckCircle size={12} />
            {saveStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              blog?.status === 'published' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-705 dark:text-[#059669] hover:bg-emerald-500/20' 
                : 'bg-slate-100 dark:bg-aether-container-low border-slate-205 dark:border-white/5 text-slate-600 dark:text-aether-outline hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            {blog?.status === 'published' ? `Published (${blog.visibility})` : 'Publish'}
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              aria-expanded={showDownloadMenu}
              aria-haspopup="true"
              className="px-4 py-1.5 bg-slate-100 dark:bg-aether-container-low border border-slate-200 dark:border-white/5 text-slate-600 dark:text-aether-on-surface-variant hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download size={14} />
              Export
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-aether-container border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                <button
                  onClick={() => {
                    handleDownloadTxt();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-105 dark:hover:bg-white/5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <FileText size={13} className="text-slate-400" />
                  Plain Text (.txt)
                </button>
                <button
                  onClick={() => {
                    handleDownloadPdf();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-105 dark:hover:bg-white/5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <FileText size={13} className="text-emerald-600 dark:text-aether-secondary" />
                  PDF Document (.pdf)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleSave(false)}
            className="px-4 py-1.5 bg-emerald-600/10 dark:bg-aether-primary/20 hover:bg-emerald-600/20 dark:hover:bg-aether-primary/30 border border-emerald-500/20 dark:border-aether-primary/30 text-emerald-700 dark:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Save size={14} />
            Save Draft
          </button>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        
        {/* Left Sidebar - Outline Config */}
        <aside className="w-[350px] border-r border-slate-200 dark:border-white/10 bg-white/70 dark:bg-aether-container/50 backdrop-blur-2xl flex flex-col overflow-hidden shrink-0 shadow-2xl z-10 transition-all duration-300">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-aether-container-lowest/50 flex justify-between items-center shrink-0">
            <span className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Workspace Outline</span>
            {blog?.outline?.length > 0 && (
              <button
                onClick={generateOutline}
                disabled={outlineLoading}
                className="text-xs text-emerald-600 dark:text-aether-secondary hover:text-emerald-750 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              >
                <Sparkles size={12} /> Regenerate
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 m-3 bg-red-950/30 border border-red-500/20 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Outline lists */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {outlineLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-emerald-500 dark:border-aether-secondary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Generating Outline with Groq...</span>
              </div>
            ) : (!blog?.outline || blog.outline.length === 0) ? (
              <div className="py-16 text-center">
                <Sparkles size={36} className="mx-auto text-slate-400 dark:text-slate-700 mb-3" />
                <h4 className="text-slate-700 dark:text-slate-400 font-semibold text-sm">No outline generated</h4>
                <p className="text-slate-500 dark:text-slate-650 text-xs px-4 mt-1.5 mb-6 leading-relaxed">
                  Before streaming contents, build a dynamic sections blueprint.
                </p>
                <button
                  onClick={generateOutline}
                  className="px-4 py-2 bg-slate-100 dark:bg-aether-container-high hover:bg-slate-200 dark:hover:bg-aether-container-highest border border-slate-250 dark:border-none text-slate-800 dark:text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles size={12} className="text-emerald-600 dark:text-aether-secondary" />
                  Build Blueprint
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blog.outline.map((section, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 glass-panel bg-white/95 dark:bg-aether-container-lowest/40 hover:border-emerald-500/30 dark:hover:border-aether-primary/30 border border-slate-200 dark:border-white/5 rounded-2xl flex items-start justify-between group transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          section.level === 2 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-aether-secondary/10 dark:text-aether-secondary dark:border-aether-secondary/20' 
                            : 'bg-indigo-500/10 text-indigo-705 border-indigo-550/20 dark:bg-aether-primary/10 dark:text-aether-primary dark:border-aether-primary/20'
                        }`}>
                          H{section.level}
                        </span>
                        
                        <input
                          type="text"
                          className="bg-transparent border-none text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-0 p-0 w-48"
                          value={section.heading}
                          onChange={(e) => {
                            const updatedOutline = [...blog.outline];
                            updatedOutline[idx].heading = e.target.value;
                            setBlog(prev => ({ ...prev, outline: updatedOutline }));
                            setSaveStatus('Unsaved Changes');
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 line-clamp-1">{section.brief_intent}</p>
                    </div>

                    {/* Actions on outline hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => toggleSectionLevel(idx)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
                        title="Toggle Header Level"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        onClick={() => moveOutlineSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp size={10} />
                      </button>
                      <button 
                        onClick={() => moveOutlineSection(idx, 'down')}
                        disabled={idx === blog.outline.length - 1}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown size={10} />
                      </button>
                      <button 
                        onClick={() => deleteOutlineSection(idx)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add heading section */}
          {blog?.outline?.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-aether-container-lowest/30 space-y-3 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Append Blueprint Section</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Heading title..."
                  className="flex-1 input-recessed px-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-aether-secondary transition"
                  value={newHeadingTitle}
                  onChange={(e) => setNewHeadingTitle(e.target.value)}
                />
                
                <select
                  className="px-2 py-1.5 input-recessed rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-aether-secondary transition"
                  value={newHeadingLevel}
                  onChange={(e) => setNewHeadingLevel(e.target.value)}
                >
                  <option value={2} className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">H2</option>
                  <option value={3} className="bg-white dark:bg-aether-container text-slate-900 dark:text-white">H3</option>
                </select>
              </div>

              <button
                type="button"
                onClick={addOutlineSection}
                className="w-full py-1.5 bg-slate-100 dark:bg-aether-container-highest border border-slate-250 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={14} /> Add Section
              </button>
            </div>
          )}

          {/* Generate Draft button block */}
          {blog?.outline?.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-55/60 dark:bg-aether-container-lowest/40 shrink-0">
              <button
                type="button"
                onClick={startGenerationStream}
                disabled={streaming || outlineLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <Play size={14} fill="currentColor" />
                {streaming ? 'Streaming AI Draft...' : 'Generate AI Draft'}
              </button>
            </div>
          )}
        </aside>

        {/* Right Workspace - Editor Panel */}
        <main className="flex-1 bg-slate-50/30 dark:bg-aether-dark p-8 overflow-y-auto relative flex justify-center z-10 transition-colors duration-300">
          {/* Subtle atmosphere glows */}
          <div className="nebula-glow bg-aether-primary w-[300px] h-[300px] top-[20%] left-[10%] rounded-full opacity-5 pointer-events-none"></div>
          <div className="nebula-glow bg-aether-secondary w-[300px] h-[300px] bottom-[20%] right-[10%] rounded-full opacity-5 pointer-events-none"></div>
          
          <div className="w-full max-w-3xl relative">
            {inlineLoading && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-205 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs backdrop-blur shadow z-10">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing AI inline optimization...</span>
              </div>
            )}

            {/* Selection Popup Menu */}
            {showBubbleMenu && editor && (
              <div 
                style={{ top: bubbleMenuPos.top, left: bubbleMenuPos.left }}
                className="absolute z-30 flex items-center bg-white dark:bg-aether-container/95 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 gap-1 shrink-0 -translate-x-1/2 backdrop-blur-md transition-colors"
              >
                <button
                  onClick={() => handleInlineEdit('humanize')}
                  className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-emerald-600 dark:text-aether-secondary" />
                  Humanize
                </button>
                
                <button
                  onClick={() => handleInlineEdit('expand')}
                  className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                >
                  Expand
                </button>

                <button
                  onClick={() => handleInlineEdit('condense')}
                  className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                >
                  Condense
                </button>

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>

                <div className="relative group/tone">
                  <button
                    className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-[11px] font-semibold transition flex items-center gap-0.5 cursor-pointer"
                  >
                    Tone
                    <ChevronRight size={10} />
                  </button>
                  <div className="hidden group-hover/tone:flex flex-col absolute left-full top-0 ml-1 bg-white dark:bg-aether-container border border-slate-200 dark:border-white/10 rounded-xl p-1 gap-0.5 shadow-2xl z-40 w-28">
                    {['Witty', 'Conversational', 'Highly Technical'].map(t => (
                      <button
                        key={t}
                        onClick={() => handleInlineEdit('tone', t)}
                        className="px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-[10px] text-left font-medium transition cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rich Editor Canvas */}
            <div className="glass-panel bg-white/95 dark:bg-aether-container/30 border border-slate-200/80 dark:border-white/5 rounded-2xl p-8 shadow-2xl min-h-[500px] backdrop-blur-md">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>

      {/* Publish Settings Overlay Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-aether-dark/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl space-y-6" style={{ background: theme === 'light' ? '#fff' : 'rgba(15, 23, 42, 0.9)', borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Publish Settings</h3>
              <button 
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-5">
              {/* Visibility Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-aether-on-surface-variant">Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishVisibility('public')}
                    className={`py-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
                      publishVisibility === 'public'
                        ? 'bg-emerald-500/10 border-emerald-550 text-emerald-700 dark:bg-aether-secondary/15 dark:border-aether-secondary dark:text-aether-secondary'
                        : 'bg-slate-50 dark:bg-aether-container-low border-slate-200 dark:border-white/5 text-slate-500 dark:text-aether-outline hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold">Public Feed</span>
                    <span className="text-[9px] opacity-75">Visible to everyone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishVisibility('private')}
                    className={`py-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
                      publishVisibility === 'private'
                        ? 'bg-indigo-500/10 border-indigo-550 text-indigo-700 dark:bg-aether-primary/15 dark:border-aether-primary dark:text-aether-primary'
                        : 'bg-slate-50 dark:bg-aether-container-low border-slate-200 dark:border-white/5 text-slate-500 dark:text-aether-outline hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold">Private Blog</span>
                    <span className="text-[9px] opacity-75">Only you can read it</span>
                  </button>
                </div>
              </div>

              {/* Tags configuration */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-aether-on-surface-variant">Tags (Optional)</label>
                <input
                  type="text"
                  className="input-recessed w-full h-11 px-4 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-aether-outline-variant focus:outline-none"
                  placeholder="AI, tech, productivity"
                  value={publishTags}
                  onChange={(e) => setPublishTags(e.target.value)}
                />
                <span className="text-[10px] text-slate-500 dark:text-aether-outline font-semibold">Comma-separated tags for reader searches.</span>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="btn-gradient w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 cursor-pointer"
                >
                  {blog?.status === 'published' ? 'Save Changes' : 'Go Live Now'}
                </button>
                
                {blog?.status === 'published' && (
                  <button
                    type="button"
                    onClick={handleRevertToDraft}
                    className="w-full h-11 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition"
                  >
                    Revert to Draft
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
