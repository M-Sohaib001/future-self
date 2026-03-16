import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default function PublicReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${API_BASE}/api/get-reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 text-center">
      <div className="animate-pulse space-y-8">
        <div className="h-4 bg-zinc-900 w-32 mx-auto rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-40 bg-zinc-900 rounded" />
          <div className="h-40 bg-zinc-900 rounded" />
        </div>
      </div>
    </div>
  );
  
  if (reviews.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 border-t border-[#c9a84c]/10">
      <h3 className="text-xs tracking-[0.4em] uppercase text-[#c9a84c]/60 mb-16 text-center font-bold">Chronal Registry</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-8 border border-white/5 bg-white/[0.02] backdrop-blur-sm relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] mb-1">{review.name}</p>
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest">{formatRelativeTime(review.timestamp)}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${i < review.rating ? 'bg-[#c9a84c]' : 'bg-zinc-800'}`} />
                  ))}
                </div>
              </div>
              
              <p className="text-zinc-400 font-light italic leading-relaxed text-sm md:text-base">
                "{review.feedback}"
              </p>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#c9a84c]/20 group-hover:border-[#c9a84c]/60 transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
