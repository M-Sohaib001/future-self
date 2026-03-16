import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const emotionColors = {
  fear: '#4a1d96',
  pride: '#c9a84c',
  longing: '#8b5cf6',
  shame: '#3f3f46',
  anger: '#991b1b',
  love: '#db2777',
  guilt: '#374151',
  hope: '#059669',
  resignation: '#4b5563',
  hunger: '#d97706',
  defiance: '#b91c1c',
  grief: '#1e1b4b'
};

export default function EmotionalArcVisual({ data, dominantEmotion, emotionalSummary }) {
  const scrollRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (scrollRef.current) observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  return (
    <div ref={scrollRef} className="w-full max-w-4xl mx-auto py-24 px-4 overflow-hidden bg-black/40 backdrop-blur-md border border-white/5 my-12">
      <div className="text-center mb-16">
        <h3 className="text-xs tracking-[0.4em] uppercase text-[#c9a84c]/60 mb-4 font-bold">The Emotional Resonance</h3>
        {emotionalSummary && <p className="text-sm text-zinc-500 italic font-light tracking-wide">{emotionalSummary}</p>}
      </div>
      
      <div className="relative h-64 w-full flex items-end justify-between gap-2 border-b border-[#c9a84c]/20 pb-4">
        {data.map((point, idx) => {
          const height = Math.max(10, (point.intensity) * 100); // intensity is 0.1 to 1.0
          const color = emotionColors[point.emotion] || '#c9a84c';
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={isVisible ? { height: `${height}%` } : { height: 0 }}
                transition={{ duration: 1.5, delay: idx * 0.1, ease: "easeOut" }}
                className="w-full rounded-t-sm"
                style={{ background: `linear-gradient(to top, ${color}22, ${color}cc)` }}
              />
              <motion.span 
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 2 + (idx * 0.1) }}
                className="text-[8px] uppercase tracking-[0.1em] text-zinc-600 mt-4 absolute top-full whitespace-nowrap -rotate-45 origin-top-left"
              >
                {point.emotion}
              </motion.span>
              
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-[#c9a84c]/30 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                <p className="text-[10px] text-[#c9a84c] uppercase tracking-widest">{point.label}</p>
                <p className="text-[8px] text-zinc-500 uppercase">Intensity: {Math.round(point.intensity * 100)}%</p>
              </div>
            </div>
          );
        })}

        {/* Dynamic Wave SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <motion.path
            d={`M ${data.map((p, i) => `${(i / (data.length - 1 || 1)) * 100}% ${100 - (p.intensity * 100)}%`).join(' L ')}`}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            initial={{ pathLength: 0 }}
            animate={isVisible ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        </svg>
      </div>

      {dominantEmotion && (
        <div className="mt-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-600 mb-2">Dominant Frequency</p>
          <p className="text-2xl uppercase tracking-[0.2em] text-[#c9a84c]" style={{ color: emotionColors[dominantEmotion] }}>{dominantEmotion}</p>
        </div>
      )}
    </div>
  );
}
