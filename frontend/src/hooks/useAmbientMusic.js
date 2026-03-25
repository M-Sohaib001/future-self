import { useRef, useState, useEffect, useCallback } from 'react';

export function useAmbientMusic() {
  const audioCtxRef = useRef(null);
  const nodesRef = useRef([]);
  const gainRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(() => {
    return localStorage.getItem('fs_musicEnabled') !== 'false';
  });

  const createAmbientDrone = useCallback(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 6); // Louder and slower fade in
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    // Layer 1 — Sub drone (40Hz)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.4;
    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start();

    // Layer 2 — Mid drone (80Hz) with LFO wobble
    const mid = ctx.createOscillator();
    mid.type = 'sine';
    mid.frequency.setValueAtTime(80, ctx.currentTime);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.8;
    lfo.connect(lfoGain);
    lfoGain.connect(mid.frequency);
    const midGain = ctx.createGain();
    midGain.gain.value = 0.3;
    mid.connect(midGain);
    midGain.connect(masterGain);
    mid.start();
    lfo.start();

    // Layer 3 — Shimmer (320Hz) — DECLARE shimmerGain FIRST
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.12; // Boosted high-end sparkle
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(320, ctx.currentTime);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 0.125;
    const shimmerLfoGain = ctx.createGain();
    shimmerLfoGain.gain.value = 0.02;
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain);
    shimmer.start();
    shimmerLfo.start();

    // Layer 4 — Reverb
    const convolver = ctx.createConvolver();
    const reverbLength = ctx.sampleRate * 3;
    const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = reverbBuffer.getChannelData(ch);
      for (let i = 0; i < reverbLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2);
      }
    }
    convolver.buffer = reverbBuffer;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.65; // Doubled reverb depth for immersion
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    nodesRef.current = [sub, mid, shimmer, shimmerLfo, lfo];
    setIsPlaying(true);
  }, []);

  const start = useCallback(() => {
    if (!musicEnabled || audioCtxRef.current) return;
    try { createAmbientDrone(); }
    catch (e) { console.warn('Web Audio not supported:', e); }
  }, [musicEnabled, createAmbientDrone]);

  const stop = useCallback(() => {
    if (!audioCtxRef.current) return;
    const gain = gainRef.current;
    const ctx = audioCtxRef.current;
    if (gain) gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      nodesRef.current.forEach(n => { try { n.stop(); } catch (e) {} });
      try { ctx.close(); } catch (e) {}
      audioCtxRef.current = null;
      nodesRef.current = [];
      setIsPlaying(false);
    }, 2000);
  }, []);

  const toggleMusicEnabled = useCallback(() => {
    const newVal = !musicEnabled;
    setMusicEnabled(newVal);
    localStorage.setItem('fs_musicEnabled', String(newVal));
    if (!newVal) stop();
  }, [musicEnabled, stop]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach(n => { try { n.stop(); } catch (e) {} });
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
    };
  }, []);

  return { start, stop, isPlaying, musicEnabled, toggleMusicEnabled };
}
