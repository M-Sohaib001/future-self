import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import BackgroundEffects from './BackgroundEffects';
import { getLatestSession } from '../utils/sessionMemory';

export default function DisclaimerScreen({ onAcknowledge, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const [userCount, setUserCount] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const initializedRef = useRef(false);
  
  const lastSession = getLatestSession();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          setUserCount(data?.userCount || 0);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    fetchStats();
  }, []);

  if (lastSession && !dismissed) {
    return (
      <div className="min-h-screen bg-[#050508] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden text-zinc-300">
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

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:2}} className="relative z-10 text-center max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12 font-bold">You Have Been Here Before</p>
          <h2 className="text-2xl md:text-4xl font-light mb-4 text-zinc-300">Last time, you discovered you wanted</h2>
          <p className="text-4xl md:text-7xl text-[#c9a84c] font-bold my-8 drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">{lastSession.coreDesire}</p>
          {lastSession.archetypeName && (
            <p className="text-zinc-600 text-xs tracking-[0.3em] uppercase mb-16 font-bold">
              Your mirror was {lastSession.archetypeName} — {lastSession.archetypeOrigin}
            </p>
          )}
          <div className="flex flex-col items-center gap-6">
            <button onClick={onAcknowledge} className="px-12 py-4 border border-[#c9a84c]/40 hover:border-[#c9a84c] text-xs uppercase tracking-[0.4em] transition-all text-[#c9a84c] hover:bg-[#c9a84c]/5 active:scale-95">
              Begin Again — I May Have Changed
            </button>
            <button onClick={() => setDismissed(true)} className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 hover:text-zinc-500 transition-all border-b border-transparent hover:border-zinc-600 pb-1 font-bold">
              Continue Without Resetting
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
      
      <div className="relative z-10 text-center max-w-2xl w-full px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          className="text-xl md:text-2xl tracking-[0.2em] uppercase text-[#c9a84c]/80 mb-8 font-bold"
        >
          A Warning Before We Begin
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 1 }}
          className="space-y-6 text-xl md:text-3xl leading-relaxed font-light text-zinc-300"
        >
          <p>We are about to peer into two distinct realities of your future.</p>
          <p>This requires uncovering a <span className="text-[#c9a84c] italic">deep truth</span> about what you truly desire.</p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 2, delay: 3 }}
           className="mt-20 flex flex-col items-center gap-8"
        >
          <button 
            onClick={onAcknowledge}
            className="group relative px-12 py-4 bg-transparent border border-[#c9a84c]/40 hover:border-[#c9a84c] transition-all duration-500 active:scale-95"
          >
            <div className="absolute inset-0 bg-[#c9a84c]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 text-sm tracking-[0.5em] uppercase text-[#c9a84c] group-hover:text-white transition-colors duration-500">
              I understand. Proceed.
            </span>
          </button>
          
          {userCount !== null && (
            <p className="text-[10px] text-zinc-700 tracking-[0.4em] uppercase font-bold">
              {userCount.toLocaleString()} futures revealed so far
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
