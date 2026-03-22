import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';
import ShareableCard from './ShareableCard';

export default function RevealScreen({ coreDesire, onProceedStep2, onProceedStep3, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const cardRef = useRef(null);
  const [showWallOptIn, setShowWallOptIn] = useState(false);
  const [wallStatus, setWallStatus] = useState('idle');
  const [resonance, setResonance] = useState(undefined);
  const { 
    speak, 
    stopSpeaking, 
    isSpeaking 
  } = useVoice();

  const haptic = (v = [50]) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    haptic([200, 100, 200]);
    if (voiceEnabled) {
      speak(`What you really want... is ${coreDesire}`, { rate: 0.68, pitch: 0.78, delay: 2500 });
    }
    
    const t = setTimeout(() => setShowWallOptIn(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const handleAddToWall = async () => {
    setWallStatus('submitting');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/add-to-wall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: coreDesire })
      });
      if (res.ok) {
        const data = await res.json();
        setResonance(data.resonanceCount);
      }
    } catch (e) { console.error(e); }
    setWallStatus('done');
  };

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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all"
          >
            ◼ Stop
          </motion.button>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 text-center max-w-4xl w-full">
        <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a84c]/40 mb-12 font-bold">The Truth Surfaces</p>
        
        <div ref={cardRef} className="p-12 md:p-24 bg-black/40 backdrop-blur-xl border border-white/5 rounded-sm mb-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <motion.h1
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 3, delay: 1 }}
            className="text-4xl md:text-7xl leading-tight font-light"
          >
            What you <i className="italic">really</i> want is <span className="block mt-6 text-[#c9a84c] font-bold drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">{coreDesire}.</span>
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 4 }}
        >
          <ShareableCard 
            cardRef={cardRef} 
            filename="FutureSelf_CoreDesire.png" 
            text={`What I really want is ${coreDesire}. Path revealed by Future Self.`}
            shareTitle="My Core Desire"
          />
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 2, delay: 5.5 }}
           className="mt-24 flex flex-col items-center gap-8"
        >
          <AnimatePresence>
            {showWallOptIn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full max-w-xl mx-auto overflow-hidden bg-black/40 border border-[#c9a84c]/20 p-8 backdrop-blur-md mb-8"
              >
                <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#c9a84c]/80 mb-6 font-bold">Leave your truth behind anonymously</p>
                {wallStatus === 'idle' && (
                  <div className="flex justify-center gap-6">
                    <button onClick={handleAddToWall} className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase bg-[#c9a84c] text-black px-8 py-3 hover:bg-white transition-all font-bold">
                      Add to the Wall
                    </button>
                    <button onClick={() => setWallStatus('done')} className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase border border-zinc-700 text-zinc-500 px-8 py-3 hover:text-white transition-all font-bold">
                      Keep it private
                    </button>
                  </div>
                )}
                {wallStatus === 'submitting' && (
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/40 animate-pulse py-3">Carving into stone...</p>
                )}
                {wallStatus === 'done' && (
                  <div className="py-2">
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#c9a84c]/60">
                      {resonance !== undefined ? `Added. Your truth resonated with ${resonance} others.` : "Your truth belongs only to you."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={onProceedStep2}
            className="group relative px-16 py-4 bg-[#c9a84c] text-black transition-all duration-500 hover:bg-white active:scale-95"
          >
            <span className="relative z-10 text-sm tracking-[0.5em] uppercase font-bold">
              Step into the Future
            </span>
          </button>

          <button 
            onClick={onProceedStep3}
            className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 hover:text-zinc-500 transition-all border-b border-zinc-900 hover:border-zinc-700 pb-1 font-bold"
          >
            Skip Profiles — Speak with Future Self
          </button>
        </motion.div>
      </div>
    </div>
  );
}
