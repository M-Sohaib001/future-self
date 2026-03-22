import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';

export default function WallOfTruths({ onBack }) {
  const [truths, setTruths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

  useEffect(() => {
    const fetchWall = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wall`);
        if (!res.ok) throw new Error('Failed to load the wall');
        const data = await res.json();
        setTruths(data.wall || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWall();
  }, [API_BASE]);

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif p-6 relative overflow-hidden overflow-y-auto">
      <BackgroundEffects />
      
      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={onBack}
          className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2 border-b border-transparent hover:border-[#c9a84c]/20 pb-1"
        >
          ← Return
        </button>
      </div>

      <div className="max-w-7xl mx-auto pt-24 pb-12 relative z-10 flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl tracking-[0.3em] uppercase opacity-90 mb-4 text-center">Wall of Human Truths</h2>
        <p className="text-sm md:text-base tracking-widest text-zinc-500 mb-20 text-center max-w-2xl italic">
          "What we hide in the dark, another has already spoken to the void."
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
             {/* Loading state matches global cinematic loaders later */}
             <p className="text-sm tracking-[0.4em] uppercase text-zinc-600 animate-pulse">Reading the stones...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm tracking-widest uppercase">{error}</div>
        ) : truths.length === 0 ? (
          <div className="text-center text-zinc-600 italic tracking-wider">The wall is currently blank.</div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full space-y-6">
            {truths.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className="bg-black/40 backdrop-blur-sm border border-[#c9a84c]/10 p-6 break-inside-avoid hover:border-[#c9a84c]/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <p className="text-zinc-300 text-lg md:text-xl font-light leading-relaxed font-serif">"{t.text}"</p>
                <div className="mt-4 flex justify-between items-end border-t border-[#c9a84c]/10 pt-4">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-600">
                    {new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {t.resonanceCount > 0 && (
                    <span className="text-[9px] tracking-[0.3em] uppercase text-[#c9a84c]/60">
                      Resonated with {t.resonanceCount}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
