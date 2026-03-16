import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function ChatInterface({ apiKey, onReveal, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [substantiveCounter, setSubstantiveCounter] = useState(0);
  const [typewriterIndex, setTypewriterIndex] = useState(-1);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const haptic = (v = 30) => { if (navigator.vibrate) navigator.vibrate(v); };
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
    if (!initializedRef.current) {
      initializedRef.current = true;
      sendMessage('');
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
      if (!isInitial) {
        const lower = currentInput.toLowerCase();
        if (!lower.includes('[skip]') && !lower.includes('[explain]')) {
          setSubstantiveCounter(prev => {
            const next = prev + 1;
            if (onQuestionCountUpdate) onQuestionCountUpdate(next);
            return next;
          });
        }
      }

      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
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
        onReveal(coreDesire, [...messages, { role: 'model', content: aiResponse }]);
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
        setMessages(prev => [...prev, { role: 'model', content: mainText, options, layer: substantiveCounter + (isInitial ? 1 : 0) }]);
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

  return (
    <div className="min-h-screen bg-[#050508] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-0 relative overflow-hidden">
      <BackgroundEffects />

      {/* Voice controls */}
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
          ◼ Stop
        </button>
      )}
      
      {/* Viewport grain overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-[0.1] bg-noise" />

      <div className="w-full max-w-3xl flex-1 flex flex-col z-10 relative">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-40 md:py-60 space-y-24 scrollbar-none custom-scroll overflow-x-hidden"
        >
          <div className="max-w-[600px] mx-auto w-full">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => {
                const isNewest = idx === typewriterIndex && msg.role === 'model';
                const counterLabel = msg.layer === 1 ? 'The Excavation Begins' : `Layer ${msg.layer} — Unravelling`;

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
                          <motion.div 
                            animate={{ left: ['-100%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a84c]/5 to-transparent -z-5"
                          />
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
                      
                      <p className={`text-lg md:text-xl lg:text-2xl leading-[1.6] md:leading-[1.7] tracking-wider font-light ${
                        msg.role === 'user' 
                          ? 'text-zinc-400 italic' 
                          : 'text-[#c9a84c] font-serif drop-shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                      }`}>
                        {isNewest ? <TypewriterText text={msg.content} onComplete={() => setTypewriterIndex(-1)} onStart={() => haptic(30)} /> : msg.content}
                      </p>
                      
                      {msg.role === 'model' && msg.options && msg.options.length > 0 && idx === messages.length - 1 && !isLoading && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="flex flex-wrap justify-center gap-4 mt-12 w-full"
                        >
                          {msg.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (!isLoading) sendMessage(opt);
                              }}
                              className="px-8 py-3 bg-black/60 border border-[#c9a84c]/20 text-[10px] md:text-xs text-[#c9a84c]/60 hover:bg-[#c9a84c]/20 hover:border-[#c9a84c]/60 hover:text-[#c9a84c] hover:scale-105 transition-all duration-500 rounded-sm tracking-[0.3em] uppercase backdrop-blur-md hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]"
                            >
                              {opt}
                            </button>
                          ))}
                        </motion.div>
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-[100] px-6 bg-black/40 backdrop-blur-sm"
          >
            {(() => {
              const isRateLimit = error.includes('oracle') || error.includes('429');
              return (
                <div className={`max-w-md w-full bg-[#0a0a0f] p-10 text-center border shadow-2xl ${isRateLimit ? 'border-amber-900 shadow-[0_0_50px_rgba(180,83,9,0.15)]' : 'border-red-950 shadow-[0_0_50px_rgba(153,27,27,0.15)]'}`}>
                  <p className={`font-bold mb-4 uppercase tracking-[0.4em] text-xs ${isRateLimit ? 'text-amber-500' : 'text-red-800'}`}>
                    {isRateLimit ? 'Equilibrium Required' : 'Connection Ruptured'}
                  </p>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8 italic">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className={`w-full py-4 border text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${isRateLimit ? 'border-amber-900/40 text-amber-700/80 hover:bg-amber-950/20 hover:text-amber-600' : 'border-red-950/20 hover:text-red-600'}`}
                  >
                    {isRateLimit ? 'Wait for Clarity' : 'Re-establish Link'}
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Bottom fade gradient above input */}
        <div className="fixed bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-[#050508] to-transparent pointer-events-none z-30" />

        <div className="fixed bottom-0 left-0 right-0 py-8 px-6 lg:px-12 z-40">
          <div className="max-w-xl mx-auto relative group">
            <div className={`absolute -inset-x-8 -inset-y-6 bg-black/60 backdrop-blur-xl border rounded-sm -z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ${
              isListening ? 'border-[#c9a84c] ring-1 ring-[#c9a84c]/30 animate-pulse-subtle' : 'border-[#c9a84c]/20'
            }`} />
            
            <div className="flex justify-center space-x-6 mb-4">
              <button
                type="button"
                onClick={() => sendMessage('[SKIP]')}
                disabled={isLoading || !!error || messages.length === 0}
                className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-10"
              >
                Different Question
              </button>
              <button
                type="button"
                onClick={() => sendMessage('[EXPLAIN]')}
                disabled={isLoading || !!error || messages.length === 0}
                className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-10"
              >
                Explain Simply
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Echo your core truth..."
                disabled={isLoading || !!error}
                className="w-full bg-transparent border-b border-[#c9a84c]/30 pb-6 text-lg md:text-xl text-white/90 focus:outline-none focus:border-[#c9a84c] transition-all duration-1000 placeholder:text-zinc-700 disabled:opacity-20 tracking-[0.1em] font-light"
              />
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening((t) => setInput(t))}
                className={`absolute right-0 bottom-4 p-2 transition-all duration-500 ${
                  isListening 
                    ? 'text-[#c9a84c] animate-pulse drop-shadow-[0_0_10px_rgba(201,168,76,0.8)]' 
                    : 'text-zinc-600 hover:text-[#c9a84c]/60'
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
                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#c9a84c] transition-transform duration-700" 
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
