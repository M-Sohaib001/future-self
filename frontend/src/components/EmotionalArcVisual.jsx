import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const EMOTION_COLORS = {
  fear: '#4a1d96', pride: '#c9a84c', longing: '#1e40af',
  shame: '#7f1d1d', anger: '#991b1b', love: '#9d174d',
  guilt: '#374151', hope: '#065f46', resignation: '#1f2937',
  hunger: '#92400e', defiance: '#1e3a5f', grief: '#312e81'
};

export default function EmotionalArcVisual({ arcData, dominantEmotion, emotionalSummary }) {
  if (!arcData || arcData.length === 0) {
    return (
      <div className="w-full p-8 border border-[#c9a84c]/20 bg-black/40 text-center">
        <p className="text-zinc-600 text-xs italic">Emotional data unavailable</p>
      </div>
    );
  }

  const width = 800;
  const height = 200;
  const padding = 60;
  const stepX = (width - padding * 2) / (arcData.length > 1 ? arcData.length - 1 : 1);

  const points = arcData.map((d, i) => ({
    x: padding + i * stepX,
    y: 180 - (d.intensity * 160),
    emotion: d.emotion,
    label: d.label,
    intensity: d.intensity
  }));

  const d = points.length > 1 
    ? points.reduce((acc, p, i, a) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = a[i - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        return `${acc} C ${cp1x} ${prev.y}, ${cp1x} ${p.y}, ${p.x} ${p.y}`;
      }, "")
    : `M ${padding} ${points[0].y} L ${width - padding} ${points[0].y}`;

  return (
    <div className="w-full p-12 bg-black/40 border border-[#c9a84c]/10 rounded-sm shadow-2xl relative overflow-hidden group">
      <p className="text-[9px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12 text-center font-bold">Your Emotional Signature</p>
      
      <div className="relative aspect-[4/1] w-full max-w-4xl mx-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <motion.path
            d={d}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {points.map((p, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={6 + p.intensity * 8}
                fill={EMOTION_COLORS[p.emotion] || '#333'}
                stroke="#c9a84c"
                strokeWidth="1"
                className="cursor-help"
              >
                <title>{p.label}</title>
              </circle>
            </motion.g>
          ))}
        </svg>
      </div>

      <div className="mt-12 text-center">
        <p className="text-4xl md:text-5xl font-light text-[#c9a84c] uppercase tracking-widest opacity-80 mb-4 drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">
          {dominantEmotion}
        </p>
        <p className="max-w-xl mx-auto text-zinc-400 text-sm md:text-base italic leading-relaxed font-light">
          {emotionalSummary}
        </p>
      </div>
    </div>
  );
}
