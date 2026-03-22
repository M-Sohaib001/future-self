import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicLoader({ 
  texts = ["Processing...", "Analysing...", "Finalising..."], 
  interval = 2500,
  className = "text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#c9a84c]/80 font-bold"
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.8 }}
            className={`text-center ${className}`}
          >
            {texts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex space-x-3 mt-4">
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i}
            className="w-1 h-1 rounded-full bg-[#c9a84c]/40" 
            animate={{ opacity: [0.2, 1, 0.2] }} 
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }} 
          />
        ))}
      </div>
    </div>
  );
}
