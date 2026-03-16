import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function PersonaChat({ 
  apiKey, 
  coreDesire, 
  profiles: initialProfiles, 
  setProfiles: setParentProfiles, 
  personaHistoryActive,
  personaHistoryPassive,
  onHistoryUpdate,
  onProceedStep4,
  musicEnabled,
  toggleMusicEnabled
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  const [activeTab, setActiveTab] = useState('passive'); // 'passive' | 'active'
  
  // Initialize from props if available
  const [historyPassive, setHistoryPassive] = useState(() => personaHistoryPassive || []);
  const [historyActive, setHistoryActive] = useState(() => personaHistoryActive || []);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    voiceEnabled, 
    toggleVoiceEnabled, 
    isListening, 
    startListening, 
    stopListening 
  } = useVoice();
  
  const messagesEndRef = useRef(null);

  const currentHistory = activeTab === 'passive' ? historyPassive : historyActive;
  const setCurrentHistory = activeTab === 'passive' ? setHistoryPassive : setHistoryActive;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentHistory, isLoading]);

  // Bubble history updates to parent
  useEffect(() => {
    if (onHistoryUpdate && historyActive.length > 0) {
      onHistoryUpdate('active', historyActive);
    }
  }, [historyActive]);

  useEffect(() => {
    if (onHistoryUpdate && historyPassive.length > 0) {
      onHistoryUpdate('passive', historyPassive);
    }
  }, [historyPassive]);

  // Fetch initial greeting for a tab if empty
  useEffect(() => {
    if (!profiles) return; // Wait for silent profile generation
    if (activeTab === 'passive' && historyPassive.length === 0) {
      sendMessage('', 'passive');
    } else if (activeTab === 'active' && historyActive.length === 0) {
      sendMessage('', 'active');
    }
  }, [activeTab, profiles]);

  // Silent Profile Generation if missing
  useEffect(() => {
    if (profiles) return;
    
    const generateSilentProfiles = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/generate-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, coreDesire })
        });
        if (response.ok) {
          const data = await response.json();
          setProfiles(data);
          if (setParentProfiles) setParentProfiles(data);
        } else {
          setError('The timelines are unstable. Please return to the beginning.');
        }
      } catch (err) {
        setError('Failed to establish connection to the future.');
      }
    };

    generateSilentProfiles();
  }, [apiKey, coreDesire, profiles, API_BASE]);

  const sendMessage = async (textToSend, tabToUse = activeTab) => {
    const isInitial = textToSend === '';
    
    // Optimistic UI update
    if (!isInitial) {
      if (tabToUse === 'passive') {
        setHistoryPassive(prev => [...prev, { role: 'user', content: textToSend }]);
      } else {
        setHistoryActive(prev => [...prev, { role: 'user', content: textToSend }]);
      }
    }
    
    setInput('');
    setIsLoading(true);
    setError('');

    // Prepare history payload for API (excluding the user message we just appended locally, as we send it directly if it's new)
    const historyState = tabToUse === 'passive' ? historyPassive : historyActive;
    const historyForApi = historyState.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    
    if (!isInitial) {
       historyForApi.push({ role: 'user', parts: [{ text: textToSend }] });
    }

    try {
      const response = await fetch(`${API_BASE}/api/persona-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          personaType: tabToUse,
          profiles,
          coreDesire,
          history: historyForApi
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error?.message || errorData.error || 'Failed to communicate with Persona';
        if (errorData.details) {
          try {
            const detailsObj = JSON.parse(errorData.details);
            errorMessage = detailsObj.error?.message || errorMessage;
          } catch (e) {
            errorMessage = `${errorMessage}: ${errorData.details}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const aiResponse = data.text;

      if (tabToUse === 'passive') {
        setHistoryPassive(prev => [...prev, { role: 'model', content: aiResponse }]);
      } else {
        setHistoryActive(prev => [...prev, { role: 'model', content: aiResponse }]);
      }

      if (voiceEnabled) {
        const speakOptions = tabToUse === 'passive' 
          ? { rate: 0.78, pitch: 0.82, delay: 600 }
          : { rate: 0.84, pitch: 0.9, delay: 600 };
        speak(aiResponse, speakOptions);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-0 relative overflow-hidden">
      {!profiles && !error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#050508]">
           <p className="text-xl md:text-2xl tracking-[0.3em] uppercase text-zinc-400 mb-8 animate-pulse font-bold">Establishing Chronal Link...</p>
           <div className="flex space-x-3">
              <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }} />
              <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} />
              <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.8 }} />
            </div>
        </div>
      )}
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
          onClick={() => {
            stopSpeaking();
          }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all"
        >
          ◼ Stop
        </button>
      )}

      {/* Dynamic Ambient Breathing Animation */}
      <motion.div 
        animate={{ 
          opacity: isLoading ? [0.2, 0.5, 0.2] : [0.05, 0.15, 0.05],
          scale: isLoading ? [0.95, 1.1, 0.95] : [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: isLoading ? 2.5 : 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px] z-0"
      />

      {/* Top Navigation / Togglers */}
      <div className="absolute top-0 left-0 right-0 z-30 p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#050508] to-transparent">
        <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a84c]/60 mb-6 font-sans font-bold">Speak with your Futures</p>
        <div className="flex space-x-6 md:space-x-12 border-b border-[#c9a84c]/20 pb-4">
          <button
            onClick={() => { setActiveTab('passive'); stopSpeaking(); }}
            className={`text-xs md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'passive' ? 'text-zinc-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Timeline A (Passive)
          </button>
          <span className="text-[#c9a84c]/30">|</span>
          <button
            onClick={() => { setActiveTab('active'); stopSpeaking(); }}
            className={`text-xs md:text-sm tracking-[0.4em] uppercase transition-all duration-700 ${activeTab === 'active' ? 'text-[#c9a84c] drop-shadow-[0_0_20px_rgba(201,168,76,0.5)]' : 'text-[#c9a84c]/40 hover:text-[#c9a84c]/70'}`}
          >
            Timeline B (Active)
          </button>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="w-full max-w-4xl flex-1 flex flex-col z-10 relative mt-32 mb-32 border border-[#c9a84c]/10 bg-black/40 backdrop-blur-md rounded-sm overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab} // Forces re-animation when switching tabs
              initial={{ opacity: 0, x: activeTab === 'passive' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'passive' ? 20 : -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {currentHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`block text-[10px] uppercase tracking-[0.4em] font-sans font-bold ${activeTab === 'passive' ? 'text-zinc-500' : 'text-[#c9a84c]/60'}`}>
                          {activeTab === 'passive' ? 'The one who surrendered' : 'The one who fought'}
                        </span>
                        {isSpeaking && index === currentHistory.length - 1 && (
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]"
                          />
                        )}
                      </div>
                    )}
                    <p className={`text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light ${
                      msg.role === 'user' 
                        ? 'text-zinc-400 italic' 
                        : (activeTab === 'passive' ? 'text-zinc-300' : 'text-[#c9a84c] drop-shadow-[0_0_15px_rgba(201,168,76,0.1)]')
                    }`}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex space-x-2">
                    <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]/50" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]/50" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[#c9a84c]/50" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="text-red-500 bg-black p-10 text-center border border-red-500/50 shadow-2xl max-w-lg">
              <p className="font-bold mb-4 uppercase tracking-[0.3em] text-sm text-red-400">Timeline Collapse</p>
              <p className="text-lg leading-relaxed mb-8">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-red-950/30 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs"
              >
                Return to the beginning
              </button>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-8 md:p-12 bg-black/60 backdrop-blur-xl border-t border-[#c9a84c]/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask the ${activeTab} timeline...`}
              disabled={isLoading || error}
              className={`w-full bg-transparent border-b pb-6 text-lg md:text-xl text-white/90 focus:outline-none transition-all duration-700 placeholder:text-zinc-800 disabled:opacity-50 tracking-wide font-light ${activeTab === 'passive' ? 'border-zinc-800 focus:border-zinc-500' : 'border-[#c9a84c]/20 focus:border-[#c9a84c]'}`}
            />
            <button
              type="button"
              onClick={() => isListening ? stopListening() : startListening((t) => setInput(t))}
              className={`absolute right-0 bottom-4 p-2 transition-all duration-500 ${
                isListening 
                  ? (activeTab === 'passive' ? 'text-zinc-400' : 'text-[#c9a84c]') + ' animate-pulse' 
                  : 'text-zinc-600 hover:text-white/60'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <motion.div 
              style={{ originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: input.length > 0 ? 1 : 0 }}
              className={`absolute bottom-0 left-0 right-0 h-[1.5px] transition-transform duration-700 ${activeTab === 'passive' ? 'bg-zinc-500' : 'bg-[#c9a84c]'}`}
            />
          </form>
        </div>
      </div>

      {/* Final Action - Move to Step 4 */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-8 flex justify-center bg-gradient-to-t from-[#0a0a0f] to-transparent">
        <button 
          onClick={onProceedStep4}
          className="text-xs md:text-sm tracking-[0.3em] uppercase border-b border-[#c9a84c]/30 pb-2 hover:border-[#c9a84c] transition-all hover:text-white"
        >
          I have heard enough. Give me the letter.
        </button>
      </div>

    </div>
  );
}
