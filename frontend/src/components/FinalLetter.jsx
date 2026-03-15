import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../hooks/useVoice';
import ShareableCard from './ShareableCard';

export default function FinalLetter({ 
  apiKey, 
  coreDesire, 
  profiles, 
  setProfiles: setParentProfiles, 
  socratesHistory,
  personaHistoryActive,
  personaHistoryPassive,
  onProceedToReview 
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'passive'
  const [letterActive, setLetterActive] = useState(() => sessionStorage.getItem('fs_letterActive') || '');
  const [letterPassive, setLetterPassive] = useState(() => sessionStorage.getItem('fs_letterPassive') || '');
  const [isLoading, setIsLoading] = useState(!letterActive || !letterPassive);
  const [error, setError] = useState('');
  
  const letterActiveRef = useRef(null);
  const letterPassiveRef = useRef(null);
  const currentRef = activeTab === 'active' ? letterActiveRef : letterPassiveRef;
  
  const currentLetter = activeTab === 'active' ? letterActive : letterPassive;
  const paragraphs = currentLetter ? currentLetter.split('\n').filter(p => p.trim() !== '') : [];

  const { 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    voiceEnabled, 
    toggleVoiceEnabled 
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

  // Fetch Letters when profiles are available
  useEffect(() => {
    if (!profiles || (letterActive && letterPassive)) return;

    const fetchLetter = async (persona) => {
      try {
        const response = await fetch(`${API_BASE}/api/generate-letter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            coreDesire,
            profiles,
            personaType: persona,
            socratesHistory,
            personaChatHistory: persona === 'active' ? personaHistoryActive : personaHistoryPassive
          })
        });

        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || 'Failed to generate letter');
        }

        const data = await response.json();
        if (persona === 'active') {
          setLetterActive(data.letter || 'The timeline is silent.');
          sessionStorage.setItem('fs_letterActive', data.letter || '');
        } else {
          setLetterPassive(data.letter || 'The timeline is silent.');
          sessionStorage.setItem('fs_letterPassive', data.letter || '');
        }
      } catch (err) {
        console.error(`[FinalLetter] Error fetching ${persona} letter:`, err);
        setError(`Transmission Failure (${persona}): ${err.message}`);
      }
    };

    const loadDualLetters = async () => {
      setIsLoading(true);
      setError('');
      try {
        await Promise.all([fetchLetter('active'), fetchLetter('passive')]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDualLetters();
  }, [profiles, apiKey, coreDesire, socratesHistory, personaHistoryActive, personaHistoryPassive]);

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
          {/* Dynamic Ambient Breathing Animation for Loading State */}
          <motion.div 
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              scale: [0.95, 1.1, 0.95]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px] z-0"
          />
          
          <div className="z-10 text-center space-y-8">
              <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-zinc-400">Receiving Final Transmission</h2>
              <div className="flex justify-center space-x-2">
                <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} />
                <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} />
                <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} />
              </div>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="min-h-screen bg-[#0a0a0f] text-red-500 font-serif flex items-center justify-center p-4">
          <div className="border border-red-500/50 p-12 max-w-lg text-center bg-black/90 shadow-2xl backdrop-blur-md">
              <p className="text-xl uppercase tracking-[0.2em] text-red-400 mb-4">The simulation collapsed.</p>
              <p className="text-sm border-t border-red-500/20 pt-4 mt-4">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden">
      
      {/* Voice controls */}
      <button
        onClick={toggleVoiceEnabled}
        className="absolute top-6 right-6 z-50 text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#c9a84c] transition-all duration-500 flex items-center gap-2"
      >
        <span>{voiceEnabled ? '⬤' : '○'}</span>
        <span>Voice</span>
      </button>

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
      <div className="relative z-30 mb-12 flex flex-col items-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a84c]/60 mb-6 font-sans font-bold">Choose your witness</p>
        <div className="flex space-x-8 border-b border-[#c9a84c]/20 pb-4">
          <button
            onClick={() => setActiveTab('passive')}
            className={`text-xs md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'passive' ? 'text-zinc-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            The Ghost
          </button>
          <span className="text-[#c9a84c]/30">|</span>
          <button
            onClick={() => setActiveTab('active')}
            className={`text-xs md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'active' ? 'text-[#c9a84c] drop-shadow-[0_0_20px_rgba(201,168,76,0.5)]' : 'text-[#c9a84c]/40 hover:text-[#c9a84c]/70'}`}
          >
            The Architect
          </button>
        </div>
      </div>

      {/* The Downloadable Letter Container */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-3xl bg-black/60 backdrop-blur-xl border border-[#c9a84c]/30 p-8 md:p-16 lg:p-24 shadow-2xl"
        >
          <div ref={activeTab === 'active' ? letterActiveRef : letterPassiveRef}>
            <div className="space-y-8 text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light text-zinc-200">
               {paragraphs.length === 0 && (
                 <p className="text-center italic opacity-50">Decoding the transmission...</p>
               )}
               {paragraphs.map((para, index) => {
                 const isLast = index === paragraphs.length - 1;
                 return (
                   <motion.p 
                     key={index}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 1.2, delay: index * 0.15 }}
                     className={`${isLast ? 'text-right mt-12 text-[#c9a84c] italic' : ''}`}
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

          {currentLetter && (
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
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons (Not included in the downloaded image) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 2 }}
        className="relative z-20 mt-16 flex flex-col items-center gap-12"
      >
        <ShareableCard 
          cardRef={currentRef} 
          filename={`FutureSelf_Letter_${activeTab}.png`}
          text={currentLetter}
          shareTitle={`A Letter from my Future Self (${activeTab === 'active' ? 'Timeline B' : 'Timeline A'})`}
        />

        <div className="flex flex-wrap justify-center gap-8">
          <button 
            onClick={onProceedToReview}
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
