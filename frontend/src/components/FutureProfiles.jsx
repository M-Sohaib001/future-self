import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';

export default function FutureProfiles({ apiKey, coreDesire, onProceedStep3 }) {
  const [profiles, setProfiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
          const errorData = await response.json();
          let errorMessage = errorData.error?.message || errorData.error || 'Failed to generate profiles.';
          if (errorData.details) {
            try {
              const detailsObj = JSON.parse(errorData.details);
              errorMessage = detailsObj.error?.message || errorMessage;
            } catch (e) {
              errorMessage = `${errorMessage}: ${errorData.details}`;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setProfiles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [apiKey, coreDesire]);

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden">
      <BackgroundEffects />

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
              <motion.div className="w-3 h-3 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }} />
              <motion.div className="w-3 h-3 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} />
              <motion.div className="w-3 h-3 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.8 }} />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-red-900 border border-red-900/50 p-6 text-center text-xl bg-black/50 backdrop-blur-sm">
            {error}
          </div>
        )}

        {profiles && !isLoading && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, staggerChildren: 0.3 }}
              className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start"
            >
              {/* Passive Path */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, delay: 1 }}
                className="flex-1 p-8 border border-[#c9a84c]/10 bg-black/40 backdrop-blur-md rounded-sm hover:border-[#c9a84c]/30 transition-colors duration-700 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <h2 className="text-xs tracking-[0.4em] uppercase text-zinc-500 mb-6">Timeline A: The Passive Reality</h2>
                <h3 className="text-2xl lg:text-3xl mb-6 text-zinc-400 font-light">
                  If you succumb to fear.
                </h3>
                <p className="text-lg leading-relaxed text-zinc-400/80">
                  {profiles.passive}
                </p>
              </motion.div>

              {/* Active Path */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, delay: 2 }}
                className="flex-1 p-8 border border-[#c9a84c]/30 bg-black/60 backdrop-blur-md rounded-sm hover:border-[#c9a84c] transition-colors duration-700 relative group overflow-hidden shadow-[0_0_30px_rgba(201,168,76,0.05)]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#c9a84c]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <h2 className="text-xs tracking-[0.4em] uppercase text-[#c9a84c] mb-6 drop-shadow-md font-bold">Timeline B: The Active Reality</h2>
                <h3 className="text-2xl lg:text-3xl mb-6 text-white font-light drop-shadow-lg">
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
              transition={{ duration: 2, delay: 4 }}
              className="mt-24 text-center"
            >
              <button 
                onClick={() => onProceedStep3(profiles)}
                className="text-sm md:text-base tracking-[0.3em] uppercase border-b border-[#c9a84c]/30 pb-2 hover:border-[#c9a84c] transition-all hover:text-white"
              >
                Face Them Both (Proceed to Step 3)
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
