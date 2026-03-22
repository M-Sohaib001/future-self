import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import ShareableCard from './ShareableCard';
import EmotionalArcVisual from './EmotionalArcVisual';
import PublicReviews from './PublicReviews';
import { useVoice } from '../hooks/useVoice';

export default function SummaryGallery({ 
  coreDesire, archetype, profiles, emotionalArc, 
  letterActive, letterPassive, sessionStats, 
  musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled, 
  onProceedToReview, onReset 
}) {
  const [letterFont, setLetterFont] = useState('serif');
  const [activeLetterTab, setActiveLetterTab] = useState('active');
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  
  const desireCardRef = useRef();
  const archetypeCardRef = useRef();
  const letterActiveGalleryRef = useRef();
  const letterPassiveGalleryRef = useRef();

  const fontOptions = [
    { id: 'serif', label: 'Serif', class: 'font-serif font-light' },
    { id: 'modern', label: 'Modern', class: 'font-sans font-light tracking-wide' },
    { id: 'elegant', label: 'Elegant', class: 'font-serif font-extralight italic tracking-wider' }
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.5 } }
  };

  const Divider = () => (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent my-24" />
  );

  return (
    <div className="min-h-screen bg-[#050508] font-serif relative overflow-x-hidden text-zinc-300">
      <BackgroundEffects />
      
      {/* Global Controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button onClick={toggleMusicEnabled} className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2">
          <span>{musicEnabled ? '⬤' : '○'}</span>
          <span>Music</span>
        </button>
        <button onClick={toggleVoiceEnabled} className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2">
          <span>{voiceEnabled ? '⬤' : '○'}</span>
          <span>Voice</span>
        </button>
      </div>

      {isSpeaking && (
        <button onClick={stopSpeaking} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all">
          ◼ Stop
        </button>
      )}

      {/* SECTION 1 — Journey Header */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="max-w-3xl mx-auto py-32 px-6 text-center"
      >
        <p className="text-[9px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12">The Records of Choice</p>
        <p className="text-sm tracking-[0.2em] text-zinc-500 mb-8 uppercase font-bold">
          In {sessionStats?.questionCount || '?'} questions, the oracle found your truth.
        </p>
        
        {emotionalArc?.dominantEmotion && (
          <div className="inline-block px-4 py-1 rounded-full border border-[#c9a84c]/30 text-[10px] uppercase tracking-widest text-[#c9a84c] mb-8 bg-[#c9a84c]/5">
            Frequency: {emotionalArc.dominantEmotion}
          </div>
        )}

        <p className="text-xl md:text-2xl text-zinc-400 italic mb-12 leading-loose px-4">
          {emotionalArc?.emotionalSummary}
        </p>
        
        <p className="text-xs zinc-700 uppercase tracking-widest opacity-50">
          {sessionStats?.duration || '?'} minutes of unravelling
        </p>

        <h1 className="text-6xl md:text-8xl lg:text-9xl text-[#c9a84c] font-bold mt-20 tracking-tighter drop-shadow-[0_0_30px_rgba(201,168,76,0.2)]">
          {coreDesire}
        </h1>
      </motion.section>

      <Divider />

      {/* SECTION 2 — Core Desire Card */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="px-6"
      >
        <div ref={desireCardRef} className="max-w-2xl mx-auto bg-black/60 border border-[#c9a84c]/30 p-12 md:p-20 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#c9a84c]/40 group-hover:border-[#c9a84c] transition-colors" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#c9a84c]/40 group-hover:border-[#c9a84c] transition-colors" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#c9a84c]/40 group-hover:border-[#c9a84c] transition-colors" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#c9a84c]/40 group-hover:border-[#c9a84c] transition-colors" />
          
          <div className="relative z-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-12 font-bold">What I really want is</p>
            <h2 className="text-4xl md:text-6xl text-[#c9a84c] font-bold tracking-tight mb-16">{coreDesire}</h2>
            <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-700">Discovered via Future Self Protocol</p>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <ShareableCard 
            cardRef={desireCardRef} 
            filename="FutureSelf_Desire.png"
            text={`What I really want is ${coreDesire}.\n\nDiscovered via Future Self.`}
            shareTitle="My Core Desire — Future Self" 
          />
        </div>
      </motion.section>

      <Divider />

      {/* SECTION 3 — Emotional Arc */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="max-w-4xl mx-auto px-6"
      >
        <EmotionalArcVisual arcData={emotionalArc?.arc} dominantEmotion={emotionalArc?.dominantEmotion} emotionalSummary={emotionalArc?.emotionalSummary} />
      </motion.section>

      <Divider />

      {/* SECTION 4 — Character Archetype Card */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="px-6"
      >
        <div 
          ref={archetypeCardRef} 
          className="max-w-4xl mx-auto p-12 relative overflow-hidden bg-black border border-[#c9a84c]/10"
          style={{
            background: `radial-gradient(circle at center, ${archetype?.palette?.primary}11 0%, transparent 80%)`
          }}
        >
          <div className="absolute top-4 left-4 text-[8px] uppercase tracking-widest text-zinc-900 border-l border-t border-white/5 pl-2 pt-1">
            Psyche Map #72
          </div>
          
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-[#c9a84c]/20 flex items-center justify-center p-4 relative">
              <div className="absolute inset-0 rounded-full animate-pulse border border-[#c9a84c]/10" />
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-[#c9a84c]/40 mb-1">Archetype</p>
                <p className="text-zinc-300 font-light italic text-xs">{archetype?.trait}</p>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-[9px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-2 font-bold">The Mirror</p>
              <h3 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight" style={{ color: archetype?.palette?.primary }}>
                {archetype?.character}
              </h3>
              <p className="text-zinc-500 text-sm italic mb-8 uppercase tracking-widest">{archetype?.origin}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] uppercase tracking-widest leading-relaxed">
                 <div>
                   <p className="text-zinc-600 mb-2">The Wound</p>
                   <p className="text-white">{archetype?.sharedWound}</p>
                 </div>
                 <div>
                   <p className="text-zinc-600 mb-2">The Blueprint</p>
                   <p style={{ color: archetype?.palette?.secondary }}>{archetype?.divergence}</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/5 italic text-zinc-400 text-sm leading-loose">
            {archetype?.comparison}
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <ShareableCard 
            cardRef={archetypeCardRef} 
            filename={`FutureSelf_Archetype_${archetype?.character?.replace(/\s+/g,'_')}.png`}
            text={`I am ${archetype?.character} from ${archetype?.origin}.\n\n${archetype?.comparison}\n\nShared wound: ${archetype?.sharedWound}\n\nDiscovered via Future Self`}
            shareTitle={`My Character Archetype — ${archetype?.character}`}
          />
        </div>
      </motion.section>

      <Divider />

      {/* SECTION 5 — The Two Futures */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="max-w-6xl mx-auto px-6"
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-black/40 border border-zinc-800 p-8 hover:bg-black/60 transition-all duration-700">
            <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 mb-6 font-bold">Timeline A — The Ghost</p>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-8">If you stayed comfortable.</p>
            <p className="text-zinc-400 font-light leading-[2] italic text-sm md:text-base">
              {profiles?.passive}
            </p>
          </div>
          <div className="flex-1 bg-black/60 border border-[#c9a84c]/20 p-8 shadow-[0_0_50px_rgba(201,168,76,0.05)]">
            <p className="text-[9px] uppercase tracking-[0.4em] text-[#c9a84c]/60 mb-6 font-bold">Timeline B — The Architect</p>
            <p className="text-white text-xs uppercase tracking-widest mb-8">If you pursued the truth.</p>
            <p className="text-[#c9a84c]/90 font-light leading-[2] italic text-sm md:text-base">
              {profiles?.active}
            </p>
          </div>
        </div>
      </motion.section>

      <Divider />

      {/* SECTION 6 — The Letters */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="py-12"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center gap-4 mb-12">
            {fontOptions.map(f => (
              <button 
                key={f.id}
                onClick={() => setLetterFont(f.id)}
                className={`text-[8px] uppercase tracking-widest px-4 py-2 border transition-all ${letterFont === f.id ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5' : 'border-zinc-800 text-zinc-600'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex flex-row gap-12">
            <div className="flex-1 flex flex-col items-center">
              <div ref={letterPassiveGalleryRef} className="bg-black/80 border border-zinc-800 p-12 lg:p-16 shadow-2xl relative w-full h-full min-h-[600px]">
                 <div className="absolute top-6 left-6 text-[8px] uppercase tracking-widest text-zinc-800">The Ghost</div>
                 <div className={`whitespace-pre-wrap leading-loose ${fontOptions.find(f => f.id === letterFont).class} text-zinc-500 text-sm lg:text-base`}>
                   {letterPassive}
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => speak(letterPassive)} className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-white transition-all underline decoration-zinc-800 underline-offset-8">Read Aloud</button>
                 <ShareableCard cardRef={letterPassiveGalleryRef} filename="FutureSelf_Letter_Ghost.png" text={letterPassive} shareTitle="A Letter from my Future Self — The Ghost" />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <div ref={letterActiveGalleryRef} className="bg-[#c9a84c]/[0.02] border border-[#c9a84c]/30 p-12 lg:p-16 shadow-2xl relative w-full h-full min-h-[600px]">
                 <div className="absolute top-6 left-6 text-[8px] uppercase tracking-widest text-[#c9a84c]/40">The Architect</div>
                 <div className={`whitespace-pre-wrap leading-loose ${fontOptions.find(f => f.id === letterFont).class} text-[#c9a84c]/80 text-sm lg:text-base`}>
                   {letterActive}
                 </div>
                 <div className="absolute bottom-6 right-6 w-12 h-12 border-r border-b border-[#c9a84c]/20" />
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => speak(letterActive)} className="text-[9px] uppercase tracking-widest text-[#c9a84c]/60 hover:text-[#c9a84c] transition-all underline decoration-[#c9a84c]/20 underline-offset-8">Read Aloud</button>
                 <ShareableCard cardRef={letterActiveGalleryRef} filename="FutureSelf_Letter_Architect.png" text={letterActive} shareTitle="A Letter from my Future Self — The Architect" />
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            <div className="flex border-b border-zinc-900 mb-8">
              <button 
                onClick={() => setActiveLetterTab('passive')}
                className={`flex-1 py-4 text-[10px] uppercase tracking-[0.3em] transition-all ${activeLetterTab === 'passive' ? 'text-zinc-200 border-b border-white' : 'text-zinc-700'}`}
              >
                The Ghost
              </button>
              <button 
                onClick={() => setActiveLetterTab('active')}
                className={`flex-1 py-4 text-[10px] uppercase tracking-[0.3em] transition-all ${activeLetterTab === 'active' ? 'text-[#c9a84c] border-b border-[#c9a84c]' : 'text-zinc-700'}`}
              >
                The Architect
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div 
                ref={activeLetterTab === 'active' ? letterActiveGalleryRef : letterPassiveGalleryRef} 
                className={`w-full p-8 border ${activeLetterTab === 'active' ? 'bg-[#c9a84c]/[0.03] border-[#c9a84c]/30' : 'bg-black/60 border-zinc-800'}`}
              >
                <div className={`whitespace-pre-wrap leading-[2] text-sm italic ${fontOptions.find(f => f.id === letterFont).class} ${activeLetterTab === 'active' ? 'text-[#c9a84c]' : 'text-zinc-400'}`}>
                  {activeLetterTab === 'active' ? letterActive : letterPassive}
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => speak(activeLetterTab === 'active' ? letterActive : letterPassive)} className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Read Aloud</button>
                 <ShareableCard 
                    cardRef={activeLetterTab === 'active' ? letterActiveGalleryRef : letterPassiveGalleryRef} 
                    filename={`FutureSelf_Letter_${activeLetterTab}.png`} 
                    text={activeLetterTab === 'active' ? letterActive : letterPassive} 
                    shareTitle={`Letter from my Future Self — ${activeLetterTab}`} 
                  />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Divider />

      {/* SECTION 7 — Public Reviews */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="max-w-6xl mx-auto px-6"
      >
        <PublicReviews />
      </motion.section>

      <Divider />

      {/* SECTION 8 — CTA */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
        className="max-w-3xl mx-auto py-32 px-6 text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-600 mb-16 font-bold">Your journey has been saved to this device.</p>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center">
           <button 
             onClick={onProceedToReview}
             className="px-12 py-5 bg-[#c9a84c] text-[#050508] text-[10px] uppercase tracking-[0.5em] font-bold hover:bg-white transition-all shadow-[0_20px_60px_rgba(201,168,76,0.1)] active:scale-95"
           >
             Leave a Memento
           </button>
           <button 
             onClick={onReset}
             className="px-12 py-5 border border-zinc-800 text-zinc-600 text-[10px] uppercase tracking-[0.5em] hover:border-zinc-400 hover:text-zinc-400 transition-all active:scale-95"
           >
             Begin Again
           </button>
        </div>
        
        <div className="mt-40 text-[8px] uppercase tracking-[1em] text-zinc-900 font-bold">
           Future Self Protocol v2.1.0-Final
        </div>
      </motion.section>
    </div>
  );
}
