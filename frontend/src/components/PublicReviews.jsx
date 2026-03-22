import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const res = await fetch(`${API_BASE}/api/get-reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 60000);
    return () => clearInterval(interval);
  }, []);

  const relativeTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  const RatingDots = ({ n }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="text-[#c9a84c] text-[8px]">
          {i < n ? '●' : '○'}
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full py-12">
      <p className="text-[9px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12 text-center font-bold">Mementos Left Behind</p>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0a0a0f] border border-[#c9a84c]/5 p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-zinc-600 text-sm italic py-12">Be the first to leave a memento</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0a0a0f] border border-[#c9a84c]/10 p-6 rounded-sm flex flex-col justify-between hover:border-[#c9a84c]/30 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 font-bold">{r.name}</p>
                    <RatingDots n={r.rating} />
                  </div>
                  <p className="text-sm text-zinc-300 font-light italic leading-relaxed line-clamp-4">"{r.feedback}"</p>
                </div>
                <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-700 mt-6">{relativeTime(r.timestamp)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
