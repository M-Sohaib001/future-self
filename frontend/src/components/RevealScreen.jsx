import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';
import ShareableCard from './ShareableCard';

export default function RevealScreen({ coreDesire, onProceedStep2, onProceedStep3 }) {
  const cardRef = useRef(null);
  const { 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    voiceEnabled, 
    toggleVoiceEnabled 
  } = useVoice();

  useEffect(() => {
    if (voiceEnabled) {
      speak(`What you really want is ${coreDesire}`, { rate: 0.68, pitch: 0.78, delay: 2500 });
    }
  }, [coreDesire, voiceEnabled]);
  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden">
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
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all"
        >
          ◼ Stop
        </button>
      )}
      
      {/* Dynamic Ambient Breathing Animation */}
      <motion.div 
        animate={{ 
          opacity: [0.08, 0.2, 0.08],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/30 via-transparent to-transparent blur-[100px] z-0"
      />
      
      <div className="relative z-10 text-center max-w-4xl w-full">
        <h2 className="text-xs tracking-[0.4em] uppercase text-[#c9a84c] mb-6 drop-shadow-md font-bold">Timeline B: The Active Reality</h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 1 }}
          className="text-xl md:text-2xl tracking-[0.2em] uppercase text-[#c9a84c]/80 mb-8 font-bold"
        >
          The Truth Revealed
        </motion.p>
        
        <div ref={cardRef} className="p-12 bg-black/20 backdrop-blur-sm border border-white/5 rounded-lg mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 2 }}
            className="text-4xl md:text-7xl leading-tight font-light"
          >
            What you <i className="italic">really</i> want is <span className="block mt-6 text-[#c9a84c] font-bold drop-shadow-2xl">{coreDesire}.</span>
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
            text={`What I really want is ${coreDesire}.`}
            shareTitle="My Core Desire Revealed"
          />
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 2, delay: 6 }}
           className="mt-24 flex justify-center"
        >
          <button 
            onClick={onProceedStep2}
            className="group relative px-12 py-4 bg-transparent border border-[#c9a84c]/40 hover:border-[#c9a84c] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#c9a84c]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 text-sm tracking-[0.5em] uppercase text-[#c9a84c] group-hover:text-white transition-colors duration-500">
              Step into the Future
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
