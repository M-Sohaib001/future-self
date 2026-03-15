import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function DisclaimerScreen({ onAcknowledge }) {
  const { toggleVoiceEnabled, voiceEnabled } = useVoice();
  const [userCount, setUserCount] = useState(null);
  const initializedRef = useRef(false);

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
        const data = await res.json();
        setUserCount(data.userCount);
      } catch (e) {
        console.error('Failed to sync archives:', e);
      }
    };

    fetchAndIncrement();
  }, []);
  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgroundEffects />

      {/* Voice toggle */}
      <button
        onClick={toggleVoiceEnabled}
        className="absolute top-6 right-6 z-50 text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
      >
        <span>{voiceEnabled ? '⬤' : '○'}</span>
        <span>Voice</span>
      </button>
      
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
           className="mt-20"
        >
          <button 
            onClick={onAcknowledge}
            className="text-sm tracking-[0.3em] uppercase border-b border-[#c9a84c]/30 pb-2 hover:border-[#c9a84c] transition-all hover:text-white"
          >
            I understand. Proceed.
          </button>
        </motion.div>

        {userCount !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6.5, duration: 2 }}
            className="mt-12 text-[9px] uppercase tracking-[0.4em] text-[#c9a84c]/30"
          >
            {userCount.toLocaleString()} souls have peered into the mirror
          </motion.div>
        )}
      </div>
    </div>
  );
}
