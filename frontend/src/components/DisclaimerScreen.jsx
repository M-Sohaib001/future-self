import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';
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
    
    const fetchAndIncrement = async () => {
      try {
        // Increment only if not already done this session
        const hasBeenCounted = sessionStorage.getItem('fs_counted');
        
        if (!hasBeenCounted) {
          await fetch(`${API_BASE}/api/increment-stats`, { method: 'POST' });
          sessionStorage.setItem('fs_counted', 'true');
        }
        
        const res = await fetch(`${API_BASE}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          setUserCount(data?.userCount || 0);
        } else {
          setUserCount(0);
        }
      } catch (e) {
        console.error('Failed to sync archives:', e);
      }
    };

    fetchAndIncrement();
  }, []);
  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgroundEffects />

      {/* Fixed top-right controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={toggleMusicEnabled} 
          className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2"
        >
          <span>{musicEnabled ? '⬤' : '○'}</span>
          <span>Music</span>
        </button>
        <button
          onClick={toggleVoiceEnabled}
          className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
        >
          <span>{voiceEnabled ? '⬤' : '○'}</span>
          <span>Voice</span>
        </button>
      </div>
      
      {/* Dynamic Ambient Breathing Animation */}
      <motion.div 
        animate={{ 
          opacity: [0.05, 0.15, 0.05],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px] z-0"
      />
      
      {lastSession && !dismissed ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-2xl z-10 relative px-6"
        >
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12 font-bold">You have been here before</p>
          <h2 className="text-2xl md:text-4xl font-light mb-4 text-zinc-300">Last time, you discovered you wanted</h2>
          <p className="text-4xl md:text-7xl text-[#c9a84c] font-bold my-8 drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">{lastSession.coreDesire}</p>
          {lastSession.archetypeName && (
            <p className="text-zinc-600 text-xs tracking-[0.3em] uppercase mb-16 font-bold">
              Your mirror was {lastSession.archetypeName} — {lastSession.archetypeOrigin}
            </p>
          )}
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={onAcknowledge} 
              className="px-12 py-4 border border-[#c9a84c]/40 hover:border-[#c9a84c] text-xs uppercase tracking-[0.4em] transition-all hover:bg-[#c9a84c]/10 text-white"
            >
              Begin Again — I May Have Changed
            </button>
            <button 
              onClick={() => setDismissed(true)} 
              className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 hover:text-zinc-500 transition-all border-b border-transparent hover:border-zinc-600 pb-1 font-bold"
            >
              Continue Without Resetting
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="relative z-10 text-center max-w-2xl w-full px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="text-xl md:text-2xl tracking-[0.2em] uppercase text-[#c9a84c]/80 mb-8 font-bold"
          >
            A Warning Before We Begin
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 2 }}
            className="space-y-6 text-xl md:text-3xl leading-relaxed font-light text-zinc-300"
          >
            <p>
              We are about to peer into two distinct realities of your future.
            </p>
            <p>
              This requires uncovering a <span className="text-[#c9a84c] italic">deep truth</span> about what you truly desire. 
            </p>
            <p className="text-center text-sm text-[#c9a84c]/80 mb-8 italic font-bold">
              To make this journey, you will need to provide your own Google Gemini API Key. Your data remains strictly on your device.
            </p>
          </motion.div>

          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 2, delay: 5 }}
             className="mt-20 flex flex-col items-center gap-6"
          >
            <button 
              onClick={onAcknowledge}
              className="group relative px-12 py-4 bg-transparent border border-[#c9a84c]/40 hover:border-[#c9a84c] transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#c9a84c]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 text-sm tracking-[0.5em] uppercase text-[#c9a84c] group-hover:text-white transition-colors duration-500">
                I understand. Proceed.
              </span>
            </button>
            
            {userCount !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 2 }}
                className="text-[9px] uppercase tracking-[0.4em] text-[#c9a84c]/30 font-bold"
              >
                {userCount.toLocaleString()} souls have peered into the mirror
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
