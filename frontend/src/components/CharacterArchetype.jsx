import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';
import ShareableCard from './ShareableCard';
import { saveSession } from '../utils/sessionMemory';

export default function CharacterArchetype({ 
  apiKey, 
  coreDesire, 
  history, 
  onProceed, 
  onArchetypeGenerated, 
  onEmotionAnalysed,
  musicEnabled, 
  toggleMusicEnabled,
  voiceEnabled,
  toggleVoiceEnabled
}) {
  const [archetype, setArchetype] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const { 
    speak, 
    stopSpeaking, 
    isSpeaking 
  } = useVoice();

  const haptic = (v = [30]) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    const fetchArchetype = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
        const response = await fetch(`${API_BASE}/api/generate-archetype`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, coreDesire, history })
        });
        if (response.ok) {
          const data = await response.json();
          setArchetype(data);
          if (onArchetypeGenerated) onArchetypeGenerated(data);
          haptic([100, 50, 100]);
          
          if (voiceEnabled) {
            speak(`Your journey mirrors that of ${data.character}. ${data.comparison}`, { rate: 0.82, pitch: 0.88, delay: 1000 });
          }

          // Trigger analytics & stats in parallel
          fetch(`${API_BASE}/api/analyse-emotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, history })
          }).then(res => res.json()).then(result => {
            if (onEmotionAnalysed) onEmotionAnalysed(result);
            saveSession({ coreDesire, archetype: data, emotionalSummary: result.emotionalSummary });
          }).catch(console.error);

          fetch(`${API_BASE}/api/increment-stats`, { method: 'POST' }).catch(console.error);
        } else {
          throw new Error('The mirror is clouded.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArchetype();
  }, [apiKey, coreDesire]);

  useEffect(() => {
    if (!archetype) return;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `dark cinematic portrait, ${archetype.character} from ${archetype.origin}, ${archetype.mood} atmosphere, oil painting style, dramatic chiaroscuro lighting, colour palette dominated by ${archetype.palette?.primary || '#c9a84c'}, painterly brushstrokes, no text, no watermark, square format`
    )}?width=512&height=512&nologo=true`;

    const img = new Image();
    img.src = imageUrl;
    
    const timeout = setTimeout(() => {
      if (!img.complete) {
        setUseFallback(true);
        setImageLoaded(true);
      }
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      setImageLoaded(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      setUseFallback(true);
      setImageLoaded(true);
    };

    return () => clearTimeout(timeout);
  }, [archetype]);

  const fontMap = {
    'serif-light': 'font-serif font-light tracking-[0.15em]',
    'serif-bold': 'font-serif font-bold tracking-[0.05em]',
    'condensed': 'font-sans font-bold tracking-[0.3em] uppercase',
    'elegant': 'font-serif font-extralight tracking-[0.25em] italic',
    'stark': 'font-sans font-black tracking-[-0.02em] uppercase'
  };

  const getFontClass = (fontTag) => fontMap[fontTag] || fontMap['serif-light'];

  if (isLoading || (archetype && !imageLoaded)) {
    return (
      <div className="min-h-screen bg-[#050508] text-[#c9a84c] flex flex-col items-center justify-center p-6">
        <BackgroundEffects />
        <motion.div 
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.98, 1, 0.98] }} 
          transition={{ duration: 3, repeat: Infinity }}
          className="text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.6em] mb-4 font-bold">
            {isLoading ? 'Analysing Psychological Imprint...' : 'Manifesting Visual Archetype...'}
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce" />
            <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce [animation-delay:0.2s]" />
            <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce [animation-delay:0.4s]" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-red-500 font-serif flex items-center justify-center p-4">
        <div className="border border-red-500/50 p-12 max-w-lg text-center bg-black/90 shadow-2xl backdrop-blur-md">
            <p className="text-xl uppercase tracking-[0.2em] text-red-400 mb-4">The mirror shattered.</p>
            <p className="text-sm border-t border-red-500/20 pt-4 mt-4 opacity-60 italic">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-8 py-2 border border-red-500/40 text-[10px] uppercase tracking-widest hover:bg-red-500/10">Retry</button>
        </div>
      </div>
    );
  }

  const palette = archetype.palette || { primary: '#c9a84c', secondary: '#1a1a1a', accent: '#ffffff' };
  const fontClass = getFontClass(archetype.font);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-serif flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Fixed top-right controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={toggleMusicEnabled} 
          className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all flex items-center gap-2"
        >
          <span>{musicEnabled ? '⬤' : '○'}</span>
          <span>Music</span>
        </button>
        <button
          onClick={toggleVoiceEnabled}
          className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
        >
          <span>{voiceEnabled ? '⬤' : '○'}</span>
          <span>Voice</span>
        </button>
      </div>

      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/60 transition-all font-sans"
        >
          ◼ Stop Speaking
        </button>
      )}

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-5xl w-full flex flex-col md:flex-row border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm"
        ref={cardRef}
        style={{ 
          background: `radial-gradient(ellipse at top left, ${palette.primary}22, transparent 60%), radial-gradient(ellipse at bottom right, ${palette.secondary}33, transparent 60%), #050508`
        }}
      >
        {/* Left Side: Portrait */}
        <div className="w-full md:w-1/2 aspect-square relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {useFallback ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40 relative">
               <motion.span 
                 animate={{ opacity: [0.3, 0.5, 0.3] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="text-[180px] md:text-[240px] select-none pointer-events-none"
                 style={{ 
                   fontFamily: '"Cormorant Garamond", serif', 
                   color: palette.primary,
                   filter: `drop-shadow(0 0 40px ${palette.primary}44)` 
                 }}
               >
                 {archetype.character.charAt(0)}
               </motion.span>
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 1.1, filter: 'blur(20px)' }}
              animate={{ scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2 }}
              className="w-full h-full relative"
            >
              {/* Breathing glow behind image */}
              <motion.div 
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 z-0"
                style={{ background: `radial-gradient(circle, ${palette.primary}44 0%, transparent 70%)` }}
              />
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(
                  `dark cinematic portrait, ${archetype.character} from ${archetype.origin}, ${archetype.mood} atmosphere, oil painting style, dramatic chiaroscuro lighting, colour palette dominated by ${palette.primary}, painterly brushstrokes, no text, no watermark, square format`
                )}?width=512&height=512&nologo=true`}
                alt={archetype.character}
                className="w-full h-full object-cover relative z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20" />
            </motion.div>
          )}

          {/* Character Label Overlay */}
          <div className="absolute bottom-10 left-10 right-10 z-20">
             <motion.p 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1, duration: 1 }}
               className="text-[10px] uppercase tracking-[0.5em] text-white/40 mb-2 font-sans"
             >
               Psychological Mirror
             </motion.p>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 1 }}
                className={`text-4xl md:text-5xl ${getFontClass(archetype.font)}`}
                style={{ 
                  color: palette.primary,
                  textShadow: `0 0 20px ${palette.primary}66`
                }}
              >
                {archetype.character}
              </motion.h2>
          </div>
        </div>

        {/* Right Side: Analysis */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center relative bg-gradient-to-br from-transparent to-white/[0.02]">
           <div className="space-y-10">
              <section>
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4 font-sans font-bold">The Narrative Origin</h3>
                <p className="text-xl font-light italic" style={{ color: `${palette.secondary}99` }}>from {archetype.origin}</p>
              </section>

              <section>
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4 font-sans font-bold">Psychological Parallel</h3>
                <p className="text-lg md:text-xl leading-relaxed text-zinc-300 font-light tracking-wide">
                  "{archetype.comparison}"
                </p>
              </section>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t" style={{ borderImage: `linear-gradient(to right, ${palette.accent}99, transparent) 1` }}>
                <section>
                   <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/20 mb-2 font-sans">Shared Wound</h3>
                   <p className="text-xs uppercase tracking-[0.2em]" style={{ color: palette.secondary }}>{archetype.sharedWound}</p>
                </section>
                <section>
                   <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/20 mb-2 font-sans">Core Trait</h3>
                   <p className={`text-xs ${getFontClass(archetype.font)}`} style={{ color: palette.accent }}>{archetype.trait}</p>
                </section>
              </div>

              {archetype.divergence && (
                 <section className="pt-6">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/20 mb-2 font-sans">Their Warning</h3>
                    <p className="text-sm italic leading-relaxed" style={{ color: `${palette.primary}cc` }}>
                      {archetype.divergence}
                    </p>
                 </section>
              )}
           </div>

           <div className="absolute top-10 right-10">
               <span 
                 className="px-4 py-1 border rounded-full text-[8px] uppercase tracking-[0.4em]"
                 style={{ 
                   borderColor: palette.accent, 
                   backgroundColor: `${palette.accent}22`, 
                   color: palette.accent 
                 }}
               >
                 {archetype.mood}
               </span>
           </div>
        </div>

        {/* Artistic Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l" style={{ borderColor: palette.accent }} />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r" style={{ borderColor: palette.accent }} />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l" style={{ borderColor: palette.accent }} />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r" style={{ borderColor: palette.accent }} />
      </motion.div>

      {/* Action Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="relative z-20 mt-16 flex flex-col items-center gap-10"
      >
        <ShareableCard 
          cardRef={cardRef} 
          filename={`FutureSelf_Archetype_${archetype.character.replace(/\s+/g, '_')}.png`}
          text={`I've been told I share a psychological archetype with ${archetype.character} from ${archetype.origin}. "${archetype.trait}"`}
          shareTitle="My Future Self Archetype"
        />

        <button
          onClick={() => onProceed(archetype)}
          className="group relative px-16 py-4 border border-white/10 overflow-hidden transition-all duration-500 hover:border-white/30"
        >
          <div 
            className="absolute inset-x-0 bottom-0 h-0.5 transition-all duration-500 group-hover:h-full -z-10 opacity-10"
            style={{ backgroundColor: palette.primary }}
          />
          <span className="text-xs uppercase tracking-[0.6em] text-zinc-400 group-hover:text-white transition-colors duration-500">
            Proceed to the Letters
          </span>
        </button>
      </motion.div>
    </div>
  );
}
