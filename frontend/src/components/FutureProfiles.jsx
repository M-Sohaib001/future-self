import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function FutureProfiles({ apiKey, coreDesire, onProceedStep3, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const [profiles, setProfiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const haptic = (v = [30]) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
    const fetchProfiles = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/generate-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, coreDesire })
        });

        if (!response.ok) {
          throw new Error('Chronal stabilization failed.');
        }

        const data = await response.json();
        setProfiles(data);
        haptic([50, 20, 50]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [apiKey, coreDesire]);

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Fixed top-right controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button onClick={toggleMusicEnabled} className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2">
          <span>{musicEnabled ? '⬤' : '○'}</span>
          <span>Music</span>
        </button>
        <button onClick={toggleVoiceEnabled} className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2">
          <span>{voiceEnabled ? '⬤' : '○'}</span>
          <span>Voice</span>
        </button>
      </div>

      <AnimatePresence>
        {isSpeaking && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={stopSpeaking}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all font-sans"
          >
            ◼ Stop
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-6xl mt-12 mb-24">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <p className="text-xl md:text-2xl tracking-[0.2em] uppercase text-[#c9a84c]/80 mb-8 animate-pulse font-bold">
              Observing the diverging paths...
            </p>
            <div className="flex space-x-3">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/40" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/40" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/40" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.8 }} />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-red-900 border border-red-950 p-10 text-center text-xl bg-black/50 backdrop-blur-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        {profiles && !isLoading && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5 }}
              className="flex flex-col md:flex-row gap-8 lg:gap-16 items-stretch"
            >
              {/* Passive Path */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="flex-1 p-10 border border-[#c9a84c]/10 bg-black/40 backdrop-blur-md rounded-sm hover:border-zinc-700 transition-all duration-700 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-950/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <h2 className="text-[10px] tracking-[0.4em] uppercase text-zinc-600 mb-8 font-bold">Timeline A: The Passive Reality</h2>
                <h3 className="text-2xl lg:text-3xl mb-8 text-zinc-400 font-light italic">
                  If you succumb to fear.
                </h3>
                <p className="text-lg leading-relaxed text-zinc-500 italic">
                  {profiles.passive}
                </p>
              </motion.div>

              {/* Active Path */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, delay: 1 }}
                className="flex-1 p-10 border border-[#c9a84c]/30 bg-black/60 backdrop-blur-md rounded-sm hover:border-[#c9a84c] transition-all duration-700 relative group shadow-[0_0_50px_rgba(201,168,76,0.05)]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#c9a84c]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#c9a84c] mb-8 font-bold drop-shadow-md">Timeline B: The Active Reality</h2>
                <h3 className="text-2xl lg:text-3xl mb-8 text-white font-light drop-shadow-lg">
                  If you pursue the truth.
                </h3>
                <p className="text-lg leading-relaxed text-[#c9a84c]/90">
                  {profiles.active}
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 3 }}
              className="mt-24 text-center"
            >
              <button 
                onClick={() => onProceedStep3(profiles)}
                className="text-[10px] md:text-xs tracking-[0.4em] uppercase border-b border-[#c9a84c]/20 pb-2 hover:border-[#c9a84c] transition-all hover:text-white font-bold"
              >
                Face Them Both
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
