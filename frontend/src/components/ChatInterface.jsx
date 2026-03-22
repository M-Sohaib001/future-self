import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function ChatInterface({ apiKey, onReveal, onQuestionCountUpdate, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [substantiveCounter, setSubstantiveCounter] = useState(0);
  const [typewriterIndex, setTypewriterIndex] = useState(-1);
  const [openingInput, setOpeningInput] = useState('');
  const [openingSubmitted, setOpeningSubmitted] = useState(false);
  const [reactions, setReactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fs_reactions') || '[]'); } catch { return []; }
  });
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const haptic = (v = [30]) => { if (navigator.vibrate) navigator.vibrate(v); };
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

  const { 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    isListening, 
    startListening, 
    stopListening 
  } = useVoice();

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const threshold = 150;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        if (force || isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  useEffect(() => {
    scrollToBottom(messages.length <= 1);
  }, [messages, isLoading]);

  const initializedRef = useRef(false);

  useEffect(() => {
    // The chat now begins via the opening question submit button instead of auto-running on mount.
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, []);

  const sendMessage = async (currentInput) => {
    const isInitial = currentInput === '';
    
    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    }
    
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      let nextCounter = substantiveCounter;
      if (!isInitial) {
        const lower = currentInput.toLowerCase();
        if (!lower.includes('[skip]') && !lower.includes('[explain]')) {
          nextCounter = substantiveCounter + 1;
          setSubstantiveCounter(nextCounter);
          if (onQuestionCountUpdate) onQuestionCountUpdate(nextCounter);
        }
      }

      let historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      if (isInitial && openingInput.trim()) {
        historyForApi = [{ role: 'user', parts: [{ text: `Before the session began, I was asked what brought me here today. I said: "${openingInput}"` }] }];
      }

      if (!isInitial) {
        historyForApi.push({ role: 'user', parts: [{ text: currentInput }] });
      }

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, history: historyForApi })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection failed');
      }

      const data = await response.json();
      const aiResponse = data.text;

      if (aiResponse.includes('REVEAL:')) {
        haptic([200, 100, 200]);
        const match = aiResponse.match(/REVEAL:\s*(.*)/);
        const coreDesire = match ? match[1].trim() : 'Unknown';
        if (voiceEnabled) speak(`What you really want... is ${coreDesire}`, { rate: 0.7, pitch: 0.8 });
        onReveal(coreDesire, [...messages, { role: 'model', content: aiResponse }], nextCounter);
      } else {
        const messageParts = aiResponse.split('|');
        let mainText = aiResponse;
        let options = [];

        if (messageParts.length > 1) {
          const splitIndex = aiResponse.indexOf('?') !== -1 ? aiResponse.indexOf('?') + 1 : aiResponse.indexOf('.') + 1;
          mainText = aiResponse.slice(0, splitIndex).trim();
          options = aiResponse.slice(splitIndex).split('|').map(o => o.trim()).filter(Boolean);
        }
        
        const newMsgIdx = messages.length + (isInitial ? 0 : 1);
        setMessages(prev => [...prev, { role: 'model', content: mainText, options, layer: nextCounter + (isInitial ? 1 : 0) }]);
        setTypewriterIndex(newMsgIdx);
        haptic();
        if (voiceEnabled) speak(mainText, { delay: 800 });
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

  const handleReaction = (idx) => {
    if (reactions.includes(idx)) return;
    const updated = [...reactions, idx];
    setReactions(updated);
    localStorage.setItem('fs_reactions', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate([15]);
  };

  return (
    <div 
      className="min-h-screen text-[#c9a84c] font-serif flex flex-col items-center justify-center p-0 relative overflow-hidden"
      style={{
        backgroundColor: `hsl(${30 * Math.min(substantiveCounter / 10, 1)}, ${8 * Math.min(substantiveCounter / 10, 1)}%, ${3 + (2 * Math.min(substantiveCounter / 10, 1))}%)`,
        transition: 'background-color 3s ease'
      }}
    >
      <BackgroundEffects />
      
      {!openingSubmitted && messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center z-[100] px-6"
          style={{ backgroundColor: '#050508' }}
        >
          <BackgroundEffects />
          <div className="relative z-10 max-w-xl w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/40 mb-8">Before We Begin</p>
            <p className="text-2xl md:text-3xl font-light text-zinc-300 leading-relaxed mb-12">
              What brought you here today?
            </p>
            <textarea
              value={openingInput}
              onChange={e => setOpeningInput(e.target.value)}
              placeholder="Say as much or as little as you want..."
              className="w-full bg-transparent border-b border-[#c9a84c]/20 focus:border-[#c9a84c] text-white/80 text-lg font-light leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700 transition-all duration-700 pb-4"
              rows={3}
              autoFocus
            />
            <motion.button
              onClick={() => {
                setOpeningSubmitted(true);
                sendMessage('');
              }}
              disabled={!openingInput.trim()}
              className="mt-8 text-sm tracking-[0.4em] uppercase border-b border-[#c9a84c]/30 pb-2 hover:border-[#c9a84c] transition-all text-[#c9a84c] disabled:opacity-20"
            >
              Begin the excavation
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Depth Pulse — left side vertical indicator */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2 hidden md:flex" suppressHydrationWarning>
        <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-700 mb-2"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
          Depth
        </p>
        <div className="w-px h-48 bg-zinc-900 relative overflow-hidden rounded-full">
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-full"
            style={{ background: 'linear-gradient(to top, #c9a84c, #4a1d96)' }}
            animate={{ height: `${Math.min((substantiveCounter / 8) * 100, 100)}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex flex-col gap-1 mt-2">
          {['surface', 'layers', 'core'].map((label, i) => (
            <p key={label}
              className="text-[7px] uppercase tracking-widest transition-all duration-1000"
              style={{
                color: substantiveCounter >= i * 3 ? '#c9a84c' : '#374151',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)'
              }}>
              {label}
            </p>
          ))}
        </div>
      </div>

      {/* Fixed top-right controls */}
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

      <AnimatePresence>
        {isSpeaking && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={stopSpeaking}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/60 hover:text-[#c9a84c] border border-[#c9a84c]/20 px-6 py-2 backdrop-blur-md bg-black/40 transition-all font-sans"
          >
            ◼ Stop
          </motion.button>
        )}
      </AnimatePresence>
      
      <div className="w-full max-w-3xl flex-1 flex flex-col z-10 relative">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-40 md:py-60 space-y-24 scrollbar-none custom-scroll overflow-x-hidden"
        >
          <div className="max-w-[600px] mx-auto w-full">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => {
                const isNewest = idx === typewriterIndex && msg.role === 'model';
                const layerNum = msg.layer || 0;
                const counterLabel = layerNum <= 1 ? 'The Excavation Begins' : `Layer ${layerNum} — Unravelling`;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.role === 'model' ? -10 : 10, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex w-full mb-20 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`relative group max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.role === 'model' && (
                        <>
                          <div className="absolute -inset-x-6 -inset-y-4 bg-black/40 backdrop-blur-md border-x border-[#c9a84c]/30 rounded-sm -z-10 group-hover:bg-black/60 transition-all duration-1000 shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
                          <div className="absolute -top-4 -left-6 w-3 h-3 border-t border-l border-[#c9a84c]/50" />
                          <div className="flex items-center gap-3 mb-5">
                            <span className="block text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/60 font-sans font-bold">
                              {counterLabel}
                            </span>
                            {isSpeaking && idx === messages.length - 1 && (
                              <motion.div 
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]"
                              />
                            )}
                          </div>
                        </>
                      )}
                      
                      <div className={`text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light ${
                        msg.role === 'user' 
                          ? 'text-zinc-500 italic' 
                          : 'text-[#c9a84c] font-serif drop-shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                      }`}>
                        {isNewest ? (
                          <TypewriterText 
                            text={msg.content} 
                            onComplete={() => setTypewriterIndex(-1)} 
                            onStart={() => haptic([30])} 
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                      
                      {msg.role === 'model' && msg.options && msg.options.length > 0 && idx === messages.length - 1 && !isLoading && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1, duration: 1 }}
                          className="flex flex-wrap justify-center gap-4 mt-12 w-full"
                        >
                          {msg.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (!isLoading) sendMessage(opt);
                              }}
                              className="px-8 py-3 bg-black/60 border border-[#c9a84c]/20 text-[10px] md:text-xs text-[#c9a84c]/60 hover:bg-[#c9a84c]/20 hover:border-[#c9a84c]/60 hover:text-[#c9a84c] transition-all duration-500 rounded-sm tracking-[0.3em] uppercase backdrop-blur-md active:scale-95"
                            >
                              {opt}
                            </button>
                          ))}
                        </motion.div>
                      )}

                      {msg.role === 'model' && (
                        <button
                          onClick={() => handleReaction(idx)}
                          className={`mt-4 text-[9px] uppercase tracking-[0.4em] transition-all duration-700 ${
                            reactions.includes(idx)
                              ? 'text-[#c9a84c]/60'
                              : 'text-zinc-800 hover:text-zinc-600'
                          }`}
                        >
                          {reactions.includes(idx) ? 'this hit ·' : 'this hit'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-6 mt-12 mb-20 px-2 justify-center"
              >
                <div className="flex space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i}
                      className="w-1 h-1 bg-[#c9a84c]/60 rounded-full" 
                      animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.4, 1] }} 
                      transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5 }} 
                    />
                  ))}
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} className="h-60" />
          </div>
        </div>

        {error && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-6 bg-black/40 backdrop-blur-sm">
            <div className="max-w-md w-full bg-[#0a0a0f] p-10 text-center border border-red-950 shadow-2xl">
              <p className="font-bold mb-4 uppercase tracking-[0.4em] text-xs text-red-800">Connection Ruptured</p>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 italic">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 border border-red-950/20 text-[10px] uppercase tracking-[0.4em] text-red-600 hover:bg-red-950/20"
              >
                Re-establish Link
              </button>
            </div>
          </div>
        )}

        {/* Bottom fade gradient above input */}
        <div className="fixed bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-[#050508] to-transparent pointer-events-none z-30" />

        <div className="fixed bottom-0 left-0 right-0 py-12 px-6 lg:px-12 z-40">
          <div className="max-w-xl mx-auto relative group">
            <div className={`absolute -inset-x-8 -inset-y-6 bg-black/60 backdrop-blur-xl border rounded-sm -z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ${
              isListening ? 'border-[#c9a84c] ring-1 ring-[#c9a84c]/30' : 'border-[#c9a84c]/20'
            }`} />
            
            <div className="flex justify-center space-x-8 mb-4">
              <button
                type="button"
                onClick={() => sendMessage('[SKIP]')}
                disabled={isLoading || !!error || messages.length === 0}
                className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-10 active:scale-95"
              >
                DIFFERENT QUESTION
              </button>
              <button
                type="button"
                onClick={() => sendMessage('[EXPLAIN]')}
                disabled={isLoading || !!error || messages.length === 0}
                className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-10 active:scale-95"
              >
                EXPLAIN SIMPLY
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Echo your core truth..."
                disabled={isLoading || !!error}
                className="w-full bg-transparent border-b border-[#c9a84c]/30 pb-6 text-lg md:text-xl text-white/90 focus:outline-none focus:border-[#c9a84c] transition-all duration-1000 placeholder:text-zinc-800 disabled:opacity-20 tracking-[0.1em] font-light"
              />
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening((t) => setInput(t))}
                className={`absolute right-0 bottom-4 p-2 transition-all duration-500 ${
                  isListening 
                    ? 'text-[#c9a84c] animate-pulse drop-shadow-[0_0_10px_rgba(201,168,76,0.8)]' 
                    : 'text-zinc-700 hover:text-[#c9a84c]/60'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <div 
                className={`absolute bottom-0 left-0 right-0 h-[1px] bg-[#c9a84c] transition-all duration-700 ${input.length > 0 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypewriterText({ text, onComplete, onStart }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (onStart) onStart();
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 25);
    return () => clearInterval(interval);
  }, [text]);
  return <>{displayed}</>;
}
