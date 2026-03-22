import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../hooks/useVoice';
import ShareableCard from './ShareableCard';
import BackgroundEffects from './BackgroundEffects';
import CinematicLoader from './CinematicLoader';

export default function FinalLetter({ 
  apiKey, 
  coreDesire, 
  profiles, 
  setProfiles: setParentProfiles, 
  socratesHistory,
  personaHistoryActive,
  personaHistoryPassive,
  archetypeData,
  onProceedToReview,
  musicEnabled,
  toggleMusicEnabled,
  voiceEnabled,
  toggleVoiceEnabled
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'passive' | 'archetype'
  const [fontStyle, setFontStyle] = useState('serif'); // 'serif' | 'sans' | 'mono'
  const [letterActive, setLetterActive] = useState(() => sessionStorage.getItem('fs_letterActive') || '');
  const [letterPassive, setLetterPassive] = useState(() => sessionStorage.getItem('fs_letterPassive') || '');
  const [letterArchetype, setLetterArchetype] = useState(() => sessionStorage.getItem('fs_letterArchetype') || '');
  const [writeBack, setWriteBack] = useState(() => sessionStorage.getItem('fs_writeBack') || '');
  const [isLoadingArchetype, setIsLoadingArchetype] = useState(false);
  const [isLoading, setIsLoading] = useState(!letterActive || !letterPassive);
  const [error, setError] = useState('');
  
  const letterActiveRef = useRef(null);
  const letterPassiveRef = useRef(null);
  const letterArchetypeRef = useRef(null);
  const currentRef = activeTab === 'active' ? letterActiveRef : activeTab === 'passive' ? letterPassiveRef : letterArchetypeRef;
  
  const currentLetter = activeTab === 'active' ? letterActive : activeTab === 'passive' ? letterPassive : letterArchetype;
  const paragraphs = currentLetter ? currentLetter.split('\n').filter(p => p.trim() !== '') : [];

  const { 
    speak, 
    stopSpeaking, 
    isSpeaking 
  } = useVoice();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

  // Silent Profile Generation if missing
  useEffect(() => {
    if (!profiles && !error) {
      const generateSilentProfiles = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/generate-profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, coreDesire })
          });
          if (response.ok) {
            const data = await response.json();
            if (setParentProfiles) setParentProfiles(data);
          } else {
            setError('The timelines are unstable. Please return to the beginning.');
          }
        } catch (err) {
          setError('Failed to establish connection to the future.');
        }
      };
      generateSilentProfiles();
    }
  }, [profiles, apiKey, coreDesire]);

  useEffect(() => {
    if (profiles && (!letterActive || !letterPassive)) {
      fetchDualLetters();
    }
  }, [profiles, apiKey, coreDesire, socratesHistory, personaHistoryActive, personaHistoryPassive]);

  useEffect(() => {
    if (profiles && archetypeData && !letterArchetype) {
      const fetchArchetypeLetter = async () => {
        setIsLoadingArchetype(true);
        try {
          const response = await fetch(`${API_BASE}/api/generate-archetype-letter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey,
              archetype: archetypeData,
              coreDesire,
              socratesHistory
            })
          });
          if (!response.ok) throw new Error('Failed to generate archetype letter');
          const data = await response.json();
          setLetterArchetype(data.letter || '');
          sessionStorage.setItem('fs_letterArchetype', data.letter || '');
        } catch (err) {
          console.error('Archetype letter error:', err);
        } finally {
          setIsLoadingArchetype(false);
        }
      };
      fetchArchetypeLetter();
    }
  }, [profiles, archetypeData, apiKey, coreDesire, socratesHistory, letterArchetype]);

  const fetchDualLetters = async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([fetchLetter('active'), fetchLetter('passive')]);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLetter = async (persona) => {
    try {
      const resp = await fetch(`${API_BASE}/api/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey, coreDesire, profiles, personaType: persona,
          socratesHistory,
          personaChatHistory: persona === 'active' ? personaHistoryActive : personaHistoryPassive
        })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      const data = await resp.json();
      if (persona === 'active') {
        setLetterActive(data.letter);
        sessionStorage.setItem('fs_letterActive', data.letter);
      } else {
        setLetterPassive(data.letter);
        sessionStorage.setItem('fs_letterPassive', data.letter);
      }
    } catch (e) { throw e; }
  };

  // Voice effect: stop speaking when switching tabs
  useEffect(() => {
    stopSpeaking();
  }, [activeTab]);

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const rate = activeTab === 'passive' ? 0.8 : 0.86;
      speak(currentLetter, { rate });
    }
  };

  return (
    <>
      {isLoading && (
        <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <BackgroundEffects />
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px]"
          />
          <div className="z-10 w-full flex justify-center">
            <CinematicLoader 
              texts={["Receiving final transmission", "Aligning temporal frequencies", "Translating chronal data", "Breaking the silence"]} 
              className="text-xl md:text-2xl tracking-[0.3em] uppercase text-zinc-400"
            />
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="min-h-screen bg-[#0a0a0f] text-red-500 font-serif flex items-center justify-center p-4">
          <BackgroundEffects />
          <div className="border border-red-500/50 p-12 max-w-lg text-center bg-black/90 shadow-2xl backdrop-blur-md relative z-10">
              <p className="text-xl uppercase tracking-[0.2em] text-red-400 mb-4">The simulation collapsed.</p>
              <p className="text-sm border-t border-red-500/20 pt-4 mt-6 italic opacity-70 mb-8">{error}</p>
              <button 
                onClick={fetchDualLetters}
                className="px-8 py-3 bg-red-950/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-[10px]"
              >
                Retry Transmission
              </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden">
      
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
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all font-sans"
        >
          ◼ Stop Reading
        </button>
      )}

      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px] z-0" />

      {/* Timeline Toggle */}
      <div className="relative z-30 mb-12 flex flex-col items-center w-full">
        <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a84c]/60 mb-6 font-sans font-bold text-center">Choose your letter</p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 border-b border-[#c9a84c]/20 pb-4 max-w-full">
          <button onClick={() => setActiveTab('passive')} className={`text-[10px] md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'passive' ? 'text-zinc-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-zinc-600 hover:text-zinc-400'}`}>The Ghost</button>
          <span className="text-[#c9a84c]/30 hidden md:inline">|</span>
          <button onClick={() => setActiveTab('active')} className={`text-[10px] md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'active' ? 'text-[#c9a84c] drop-shadow-[0_0_20px_rgba(201,168,76,0.5)]' : 'text-[#c9a84c]/40 hover:text-[#c9a84c]/70'}`}>The Architect</button>
          <span className="text-[#c9a84c]/30 hidden md:inline">|</span>
          <button onClick={() => setActiveTab('archetype')} className={`text-[10px] md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'archetype' ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-zinc-600 hover:text-zinc-400'}`}>The Mirror</button>
        </div>
        
        <div className="flex gap-4 mt-6">
          {['serif', 'sans', 'mono'].map(style => (
            <button 
              key={style}
              onClick={() => setFontStyle(style)}
              className={`text-[8px] uppercase tracking-[0.2em] px-3 py-1 border transition-all ${fontStyle === style ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* The Downloadable Letter Container */}
      {/* Both letter containers are always rendered for html2canvas */}
      {['active', 'passive'].map(tab => {
        const letter = tab === 'active' ? letterActive : letterPassive;
        const ref = tab === 'active' ? letterActiveRef : letterPassiveRef;
        const paras = letter ? letter.split('\n').filter(p => p.trim() !== '') : [];
        
        return (
          <div
            key={tab}
            ref={ref}
            style={{ display: activeTab === tab ? 'block' : 'none' }}
            className="relative z-10 w-full max-w-3xl bg-black/60 backdrop-blur-xl border border-[#c9a84c]/30 p-8 md:p-16 lg:p-24 shadow-2xl"
          >
            <div className="bg-black/40 p-4">
              <div className={`space-y-8 text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light text-zinc-200 ${fontStyle === 'serif' ? 'font-serif' : fontStyle === 'sans' ? 'font-sans' : 'font-mono'}`}>
                {paras.length === 0 && (
                  <p className="text-center italic opacity-50">Decoding the transmission...</p>
                )}
                {paras.map((para, index) => {
                  const isLast = index === paras.length - 1;
                  const isFirstPara = index === 0;
                  return (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.2, delay: index * 0.15 }}
                      className={`${isLast ? 'text-right mt-12 text-[#c9a84c] italic pr-4' : ''} ${isFirstPara ? 'pl-2' : ''}`}
                    >
                      {para}
                    </motion.p>
                  );
                })}
              </div>

              <p className="text-xs tracking-[0.3em] uppercase text-[#c9a84c]/30 mt-16 text-center">
                Written to you on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, from 3 years ahead
              </p>
            </div>
          
            {/* Artistic Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#c9a84c]/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#c9a84c]/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#c9a84c]/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#c9a84c]/40" />

            {letter && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleReadAloud}
                  className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]/60 hover:text-[#c9a84c] transition-all group"
                >
                  <span className="text-lg">{isSpeaking ? '◼' : '▶'}</span>
                  <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* The Mirror — Archetype Letter Div */}
      <div
        ref={letterArchetypeRef}
        style={{ display: activeTab === 'archetype' ? 'block' : 'none' }}
        className="relative z-10 w-full max-w-3xl shadow-2xl overflow-hidden bg-black/60 backdrop-blur-xl border border-white/5"
      >
        {/* Character avatar header — Pollinations image */}
        <div className="relative h-48 md:h-64 overflow-hidden"
          style={{ background: `linear-gradient(to bottom, ${archetypeData?.palette?.primary}33, #050508)` }}>
          {archetypeData && (
            <img
              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(
                `cinematic avatar portrait, ${archetypeData.character} from ${archetypeData.origin}, ${archetypeData.mood} atmosphere, oil painting style, dramatic lighting, colour palette dominated by ${archetypeData.palette?.primary || '#c9a84c'}, painterly, no text, no watermark, square format, close crop face and shoulders`
              )}?width=800&height=400&nologo=true`}
              alt={archetypeData.character}
              className="w-full h-full object-cover object-top opacity-60"
              style={{ filter: 'saturate(0.7) contrast(1.1)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-8 right-8">
            <p className="text-[10px] uppercase tracking-[0.5em] mb-1"
              style={{ color: archetypeData?.palette?.accent || '#c9a84c', opacity: 0.7 }}>
              A Letter From Your Mirror
            </p>
            <p className="text-2xl md:text-3xl font-light"
              style={{ color: archetypeData?.palette?.primary || '#c9a84c' }}>
              {archetypeData?.character}
            </p>
            <p className="text-xs opacity-50 text-zinc-400 tracking-widest">
              from {archetypeData?.origin}
            </p>
          </div>
        </div>

        {/* Letter content */}
        <div className="p-8 md:p-16 relative"
          style={{ borderTop: `1px solid ${archetypeData?.palette?.accent || '#c9a84c'}33` }}>
          {isLoadingArchetype ? (
            <div className="flex items-center justify-center py-12 space-x-3">
              <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className={`space-y-6 text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light ${fontStyle === 'serif' ? 'font-serif' : fontStyle === 'sans' ? 'font-sans' : 'font-mono'}`}
              style={{ color: '#e4e4e7' }}>
              {(letterArchetype || '').split('\n').filter(p => p.trim()).map((para, index) => {
                const isLast = index === (letterArchetype || '').split('\n').filter(p => p.trim()).length - 1;
                return (
                  <motion.p 
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: index * 0.15 }}
                    className={isLast ? 'text-right mt-8 italic' : ''}
                    style={isLast ? { color: archetypeData?.palette?.primary || '#c9a84c' } : {}}>
                    {para}
                  </motion.p>
                );
              })}
            </div>
          )}
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-700 mt-12 text-center">
            Written to you on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, from across the fiction
          </p>
          {/* Corner accents using archetype palette */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l" style={{ borderColor: `${archetypeData?.palette?.accent || '#c9a84c'}66` }} />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r" style={{ borderColor: `${archetypeData?.palette?.accent || '#c9a84c'}66` }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l" style={{ borderColor: `${archetypeData?.palette?.accent || '#c9a84c'}66` }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r" style={{ borderColor: `${archetypeData?.palette?.accent || '#c9a84c'}66` }} />
          
          {letterArchetype && (
            <div className="mt-12 flex justify-center pb-8 border-b border-white/5 mx-[-2rem]">
              <button
                onClick={handleReadAloud}
                className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] transition-all group hover:text-white"
                style={{ color: `${archetypeData?.palette?.primary || '#c9a84c'}99` }}
              >
                <span className="text-lg">{isSpeaking ? '◼' : '▶'}</span>
                <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (Not included in the downloaded image) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 2 }}
        className="relative z-20 mt-16 flex flex-col items-center gap-12"
      >
        <ShareableCard 
          cardRef={currentRef} 
          filename={`FutureSelf_Letter_${activeTab === 'archetype' ? archetypeData?.character?.replace(/\s+/g,'_') || 'Mirror' : activeTab}.png`}
          text={currentLetter}
          shareTitle={activeTab === 'archetype' ? `A Letter from ${archetypeData?.character}` : `A Letter from my Future Self (${activeTab === 'active' ? 'Timeline B' : 'Timeline A'})`}
        />

        <div className="w-full max-w-2xl px-6 flex flex-col items-center">
          <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a84c]/60 mb-8 font-sans font-bold border-b border-[#c9a84c]/20 pb-2">Send a reply through time</p>
          <textarea
            value={writeBack}
            onChange={e => {
              setWriteBack(e.target.value);
              sessionStorage.setItem('fs_writeBack', e.target.value);
            }}
            placeholder="Write back to your future self..."
            className="w-full bg-black/40 border border-[#c9a84c]/20 p-6 text-zinc-300 text-lg font-light leading-relaxed resize-none focus:outline-none focus:border-[#c9a84c]/60 transition-all duration-500 placeholder:text-zinc-700 shadow-inner"
            rows={4}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <button 
            onClick={() => {
              sessionStorage.setItem('fs_writeBack', writeBack);
              onProceedToReview();
            }}
            className="px-8 py-3 bg-[#c9a84c] text-[#050508] transition-all uppercase tracking-[0.3em] text-xs font-bold hover:scale-105"
          >
            Leave a Memento
          </button>

          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
            className="px-8 py-3 border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-400 transition-all uppercase tracking-[0.3em] text-[10px]"
          >
            Begin Again
          </button>
        </div>
      </motion.div>

    </div>
    )}
    </>
  );
}
