import { useState, useRef, useCallback, useEffect } from 'react';

// A single hook that manages both Speech Recognition (STT) and Speech Synthesis (TTS)
// Export this and use it across ChatInterface, PersonaChat, and FinalLetter

export function useVoice() {
  // STT state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  // TTS state  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('fs_voiceEnabled') !== 'false'; // Default ON
  });

  // Toggle voice on/off globally
  const toggleVoiceEnabled = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    localStorage.setItem('fs_voiceEnabled', String(newVal));
    if (!newVal) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  // SPEAK — Text to Speech
  const speak = useCallback((text, options = {}) => {
    if (!voiceEnabled) return;
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    // A slightly faster rate and natural pitch reduces the "robotic drawl" effect.
    utterance.rate = options.rate || 0.92;       
    utterance.pitch = options.pitch || 0.95;     
    utterance.volume = options.volume || 1.0;
    
    // Try to find the most natural available voice — 'Natural' and 'Online' voices use cloud TTS
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => 
      v.name.includes('Natural') ||        // Edge/Windows high-quality natural voices
      v.name.includes('Online') ||         // Microsoft online voices
      v.name.includes('Google US English') || // Google Chrome HQ
      v.name.includes('Daniel') ||         // macOS standard fallback
      v.name.includes('Google UK')         // Chrome fallback
    );
    if (preferred) utterance.voice = preferred;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Small delay for cinematic feel — let text animation start first
    setTimeout(() => {
      if (window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
    }, options.delay || 300);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // LISTEN — Speech to Text
  const startListening = useCallback((onTranscript) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      onTranscript(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stopSpeaking, isSpeaking, voiceEnabled, toggleVoiceEnabled, isListening, startListening, stopListening };
}
