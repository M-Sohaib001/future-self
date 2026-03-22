import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';

export default function PauseScreen({ onContinue }) {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanContinue(true);
      if (navigator.vibrate) navigator.vibrate([30]);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <BackgroundEffects />
      
      <div className="relative z-10 max-w-2xl space-y-12 flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-xl md:text-3xl font-light text-zinc-300 leading-relaxed tracking-wide italic"
        >
          "The distance between who you were and who you will become is measured in the truth you just told."
        </motion.p>
        
        <div className="h-12 w-full flex justify-center items-end mt-12">
          <AnimatePresence>
            {canContinue && (
               <motion.button
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1 }}
                 onClick={onContinue}
                 className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/60 hover:text-[#c9a84c] transition-all border-b border-transparent hover:border-[#c9a84c]/40 pb-1"
               >
                 Review your journey
               </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
