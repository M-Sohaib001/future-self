import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundEffects from './BackgroundEffects';
import { useVoice } from '../hooks/useVoice';

export default function ApiKeyOnboarding({ onStart, musicEnabled, toggleMusicEnabled, voiceEnabled, toggleVoiceEnabled }) {
  const [apiKey, setApiKey] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowTeaser(false), 7000);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onStart(apiKey.trim());
    }
  };

  return (
    <>
      <AnimatePresence>
        {showTeaser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#050508] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden text-center fixed inset-0 z-50"
          >
            <BackgroundEffects />
            <div className="relative z-10 max-w-2xl space-y-12">
              {[
                { delay: 0.5, text: "In the next few minutes, an oracle will ask you questions no one has ever asked you." },
                { delay: 2.5, text: "It will find something true about you." },
                { delay: 4.5, text: "Then it will show you what happens next — in both directions." }
              ].map((line, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: line.delay, duration: 1.5 }}
                  className="text-xl md:text-3xl font-light text-zinc-300 leading-relaxed tracking-wide">
                  {line.text}
                </motion.p>
              ))}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 6, duration: 1 }}
                onClick={() => setShowTeaser(false)}
                className="text-[10px] uppercase tracking-[0.5em] text-[#c9a84c]/60 hover:text-[#c9a84c] transition-all border-b border-transparent hover:border-[#c9a84c]/40 pb-1"
              >
                I'm ready
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showTeaser && (
        <div className="min-h-screen bg-[#0a0a0f] text-[#c9a84c] font-serif flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
      
      {/* Dynamic Ambient Breathing Animation */}
      <motion.div 
        animate={{ 
          opacity: [0.05, 0.15, 0.05],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a84c]/20 via-transparent to-transparent blur-[100px] z-0"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="max-w-md w-full relative z-10"
      >
        <h1 className="text-4xl md:text-5xl text-center mb-8 tracking-widest uppercase opacity-90">Future Self</h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#c9a84c] opacity-50 w-5 h-5" />
            <input
              type="password"
              placeholder="Enter Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#111116] border border-[#c9a84c]/30 rounded-none px-10 py-4 text-lg text-white focus:outline-none focus:border-[#c9a84c] transition-colors placeholder:text-zinc-600"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full mt-6 bg-[#c9a84c] text-[#0a0a0f] py-4 text-xl tracking-wider hover:bg-[#d4b55c] transition-colors duration-300 uppercase font-semibold disabled:opacity-50"
            disabled={!apiKey.trim()}
          >
            Begin Journey
          </button>
        </form>

        <p className="text-center text-sm text-[#c9a84c]/60 mb-8 italic">
          "Your key is never stored, never sent anywhere except directly to Google."
        </p>

        <div className="border border-[#c9a84c]/20 rounded-none">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#c9a84c]/5 transition-colors"
          >
            <span className="text-lg tracking-wide">How to get your free Gemini API key</span>
            {showGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-[#c9a84c]/20 text-[#c9a84c]/80 text-sm md:text-base leading-relaxed">
                  <ol className="list-decimal list-inside space-y-3">
                    <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Google AI Studio</a></li>
                    <li>Sign in with your Google Account</li>
                    <li>Click on "Get API Key" in the left menu</li>
                    <li>Click the "Create API key" button</li>
                    <li>Copy your new key and paste it above</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
        </div>
      )}
    </>
  );
}
