import { useState } from 'react';
import { motion } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function ReviewScreen({ letters, onReset }) {
  const { toggleVoiceEnabled, voiceEnabled, isSpeaking, stopSpeaking } = useVoice();
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [includeLetters, setIncludeLetters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${API_BASE}/api/save-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous',
          feedback,
          rating,
          includeLetters,
          letters: includeLetters ? letters : null
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Failed to save review');
      }
    } catch (err) {
      setError('The system encountered a resistance. Try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-[#c9a84c] font-serif flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <BackgroundEffects />
        {/* Voice controls for submitted screen */}
        <button
          onClick={toggleVoiceEnabled}
          className="absolute top-6 right-6 z-50 text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
        >
          <span>{voiceEnabled ? '⬤' : '○'}</span>
          <span>Voice</span>
        </button>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all font-sans"
          >
            ◼ Stop Reading
          </button>
        )}
        <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(5,5,8,0.5)_100%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-8"
        >
          <h2 className="text-3xl tracking-widest uppercase font-light">Contribution Received</h2>
          <p className="text-zinc-500 italic">Your voice has been etched into the system logs. Every perspective strengthens the simulation.</p>
          <button
            onClick={onReset}
            className="px-12 py-4 border border-[#c9a84c]/40 hover:bg-[#c9a84c]/10 text-xs uppercase tracking-[0.5em] transition-all transition-colors"
          >
            Begin Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#c9a84c] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Voice controls */}
      <button
        onClick={toggleVoiceEnabled}
        className="absolute top-6 right-6 z-50 text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
      >
        <span>{voiceEnabled ? '⬤' : '○'}</span>
        <span>Voice</span>
      </button>

      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all font-sans"
        >
          ◼ Stop Reading
        </button>
      )}

      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(5,5,8,0.5)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/5 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl bg-black/60 backdrop-blur-xl border border-[#c9a84c]/20 p-8 md:p-12 shadow-2xl"
      >
        <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-center mb-12">Leave a Memento</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]/60">Your Identity (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
              className="w-full bg-transparent border-b border-[#c9a84c]/20 pb-2 focus:outline-none focus:border-[#c9a84c] transition-colors text-zinc-300 placeholder:text-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]/60">Atmosphere Rating</label>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`w-10 h-10 border transition-all ${rating >= num ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#c9a84c]/10 text-zinc-700'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]/60">Final Feedback</label>
            <textarea
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="What did you see in the mirror?"
              className="w-full bg-transparent border border-[#c9a84c]/20 p-4 focus:outline-none focus:border-[#c9a84c] transition-colors text-zinc-300 placeholder:text-zinc-800 resize-none"
            />
          </div>

          <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setIncludeLetters(!includeLetters)}>
            <div className={`w-5 h-5 border flex items-center justify-center transition-all ${includeLetters ? 'border-[#c9a84c] bg-[#c9a84c]/20' : 'border-[#c9a84c]/20'}`}>
              {includeLetters && <div className="w-2 h-2 bg-[#c9a84c]" />}
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]/60 group-hover:text-[#c9a84c] transition-colors">Attach my future letters to this record</span>
          </div>

          {error && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#c9a84c] text-[#050508] font-bold uppercase tracking-[0.4em] text-xs hover:bg-[#c9a84c]/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Syncing...' : 'Etch Review'}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full text-[10px] uppercase tracking-[0.4em] text-zinc-600 hover:text-zinc-400 transition-colors pt-4"
          >
            Skip & Restart
          </button>
        </form>
      </motion.div>
    </div>
  );
}
