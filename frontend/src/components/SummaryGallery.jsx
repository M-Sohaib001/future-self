import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import ShareableCard from './ShareableCard';
import EmotionalArcVisual from './EmotionalArcVisual';
import PublicReviews from './PublicReviews';
import BackgroundEffects from './BackgroundEffects';

export default function SummaryGallery({ coreDesire, archetype, profiles, letters, stats, emotionalArc, onProceed }) {
  if (!coreDesire || !archetype || !profiles) return null;
  const [activeTab, setActiveTab] = useState('active');
  const cardRef = useRef(null);
  const archetypeRef = useRef(null);

  const formatDuration = (ms) => {
    if (!ms) return '0m';
    const mins = Math.floor(ms / 60000);
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Journey Header */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 text-center z-10">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-[10px] uppercase tracking-[0.6em] text-[#c9a84c]/60 mb-8 font-bold"
        >
          Journey Log #FS-7742
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-4xl md:text-7xl font-light mb-16 tracking-tight"
        >
          You sought <span className="text-white italic">{coreDesire}</span>
        </motion.h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl w-full border-t border-b border-[#c9a84c]/20 py-12">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a84c]/40 mb-2">Substantive Interrogations</p>
            <p className="text-2xl font-bold">{stats?.questionCount || 0}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a84c]/40 mb-2">Chronal Depth</p>
            <p className="text-2xl font-bold">{formatDuration(stats?.duration)}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a84c]/40 mb-2">Dominant Frequency</p>
            <p className="text-2xl font-bold uppercase tracking-wider">{emotionalArc?.dominantEmotion || 'Neutral'}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a84c]/40 mb-2">Current Epoch</p>
            <p className="text-2xl font-bold">2026-2029</p>
          </div>
        </div>
        
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-600">Scroll to Decipher</p>
          <div className="w-px h-12 bg-gradient-to-b from-[#c9a84c]/40 to-transparent" />
        </motion.div>
      </section>

      {/* Section 1: Core Desire Card */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm border-t border-white/5 relative z-10">
        <div ref={cardRef} className="max-w-2xl w-full p-12 border border-[#c9a84c]/30 bg-black/60 shadow-2xl relative group">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-8 font-bold text-center">The Root of Your Future</p>
          <p className="text-3xl md:text-5xl text-center text-white font-light italic leading-relaxed">
            "{coreDesire}"
          </p>
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#c9a84c]/60" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#c9a84c]/60" />
        </div>
        <ShareableCard 
          cardRef={cardRef} 
          text={`My core desire is ${coreDesire}. Peered into my future self today.`} 
          shareTitle="My Core Desire"
        />
      </section>

      {/* Section 2: EmotionalArcVisual */}
      <section className="bg-black relative z-10">
        <EmotionalArcVisual 
          data={emotionalArc?.arc} 
          dominantEmotion={emotionalArc?.dominantEmotion} 
          emotionalSummary={emotionalArc?.emotionalSummary} 
        />
      </section>

      {/* Section 3: Archetype Compact Card */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 border-t border-white/5 relative z-10">
        <div ref={archetypeRef} className="max-w-5xl w-full flex flex-col md:flex-row border border-[#c9a84c]/20 bg-black/60 backdrop-blur-md overflow-hidden shadow-2xl">
          <div className="w-full md:w-1/3 aspect-square bg-[#c9a84c]/5 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#c9a84c]/10">
             <span className="text-9xl md:text-[12rem] font-serif text-[#c9a84c]/20 italic">{archetype.character.charAt(0)}</span>
          </div>
          <div className="p-12 flex-1 space-y-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/40 mb-2 font-bold font-sans">The Mirror</p>
              <h3 className="text-4xl font-light text-white">{archetype.character}</h3>
              <p className="text-zinc-500 italic mt-2">from {archetype.origin}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/40 mb-2 font-bold font-sans">The Essence</p>
              <p className="text-xl text-zinc-300 leading-relaxed italic">"{archetype.trait}"</p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#c9a84c]/10">
               <div>
                 <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/30 mb-1">Shared Wound</p>
                 <p className="text-[10px] uppercase tracking-widest text-white">{archetype.sharedWound}</p>
               </div>
               <div>
                 <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/30 mb-1">Divergence</p>
                 <p className="text-[10px] uppercase tracking-widest text-[#c9a84c]">{archetype.divergence}</p>
               </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <ShareableCard 
            cardRef={archetypeRef} 
            text={`I share a psychological archetype with ${archetype.character}. ${archetype.trait}`} 
            shareTitle="My Archetype"
          />
        </div>
      </section>

      {/* Section 4 & 5: Two Futures Side-by-Side */}
      <section className="min-h-screen py-24 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          <div className="flex-1 p-12 border border-zinc-900 bg-white/[0.02] backdrop-blur-sm group hover:border-white/10 transition-all duration-700">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-6 font-bold">The Ghost (Passive)</h3>
            <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed italic">
              {profiles.passive}
            </p>
          </div>
          <div className="flex-1 p-12 border border-[#c9a84c]/20 bg-[#c9a84c]/5 backdrop-blur-sm group hover:border-[#c9a84c] transition-all duration-700">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/40 mb-6 font-bold">The Architect (Active)</h3>
            <p className="text-lg md:text-xl text-[#c9a84c] font-light leading-relaxed italic">
              {profiles.active}
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Letters */}
      <section className="min-h-screen py-24 px-6 bg-black/40 border-t border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-4 font-bold">Final Epistles</p>
            <h2 className="text-2xl md:text-4xl font-light">Letters from Your Futures</h2>
          </div>

          {/* Desktop side-by-side */}
          <div className="hidden md:flex gap-12">
            <div className="flex-1 p-10 bg-zinc-950/40 border border-zinc-900 text-zinc-500 text-xs italic leading-loose whitespace-pre-wrap font-serif">
              {letters.passive}
            </div>
            <div className="flex-1 p-10 bg-[#c9a84c]/5 border border-[#c9a84c]/20 text-[#c9a84c]/80 text-xs italic leading-loose whitespace-pre-wrap font-serif shadow-[0_0_30px_rgba(201,168,76,0.05)]">
              {letters.active}
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden">
            <div className="flex border-b border-zinc-900 mb-8">
               <button onClick={() => setActiveTab('passive')} className={`flex-1 py-4 text-[10px] uppercase tracking-widest transition-all ${activeTab === 'passive' ? 'text-[#c9a84c] border-b border-[#c9a84c]' : 'text-zinc-700'}`}>Passive</button>
               <button onClick={() => setActiveTab('active')} className={`flex-1 py-4 text-[10px] uppercase tracking-widest transition-all ${activeTab === 'active' ? 'text-[#c9a84c] border-b border-[#c9a84c]' : 'text-zinc-700'}`}>Active</button>
            </div>
            <div className={`p-8 italic text-xs leading-loose whitespace-pre-wrap font-serif ${activeTab === 'active' ? 'text-[#c9a84c]/80' : 'text-zinc-500'}`}>
               {activeTab === 'active' ? letters.active : letters.passive}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: PublicReviews */}
      <section className="relative z-10">
        <PublicReviews />
      </section>

      {/* Section 8: CTA Buttons */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 border-t border-[#c9a84c]/10 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-light tracking-wide">The journey is etched.</h2>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] font-bold">What will you do with this knowledge?</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
          <button 
            onClick={onProceed}
            className="flex-1 py-6 bg-[#c9a84c] text-black font-bold uppercase tracking-[0.5em] text-xs hover:bg-white hover:scale-105 transition-all shadow-[0_20px_40px_rgba(201,168,76,0.1)]"
          >
            Leave a Memento
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 py-6 border border-zinc-800 text-zinc-600 font-bold uppercase tracking-[0.5em] text-xs hover:border-zinc-400 hover:text-zinc-400 transition-all"
          >
            Vanish Into the Void
          </button>
        </div>

        <p className="mt-24 text-[8px] uppercase tracking-[0.8em] text-zinc-800 font-bold">Future Self Protocol v2.1.0-Phase2</p>
      </section>
    </div>
  );
}
