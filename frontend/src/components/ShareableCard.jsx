import React, { useState } from 'react';
import html2canvas from 'html2canvas';

/**
 * ShareableCard - Reusable download-as-image + copy-text + share utility
 * 
 * Props:
 * - cardRef: The ref to the DOM element to capture
 * - filename: Custom filename for the download
 * - text: The text to be copied or shared
 * - shareTitle: Title for the Web Share API
 */
const ShareableCard = ({ cardRef, filename = "FutureSelf_Card.png", text, shareTitle = "Future Self" }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy Text');

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#050508',
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture card:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel('Copied ✓');
      setTimeout(() => setCopyLabel('Copy Text'), 2000);
    } catch (err) {
      console.error('Failed to copy state:', err);
      setCopyLabel('Failed');
      setTimeout(() => setCopyLabel('Copy Text'), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: text,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          handleCopy(); // Fallback to copy
        }
      }
    } else {
      handleCopy(); // Fallback to copy
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
      <button
        onClick={handleDownload}
        disabled={isCapturing}
        className="px-6 py-2 border border-[#c9a84c]/40 hover:bg-[#c9a84c]/20 text-[#c9a84c] text-[10px] uppercase tracking-[0.3em] transition-all bg-black/40 backdrop-blur-sm disabled:opacity-50"
      >
        {isCapturing ? 'Capturing...' : 'Download as Image'}
      </button>

      <button
        onClick={handleCopy}
        className="px-6 py-2 border border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 text-[10px] uppercase tracking-[0.3em] transition-all bg-black/40 backdrop-blur-sm"
      >
        {copyLabel}
      </button>

      <button
        onClick={handleShare}
        className="px-6 py-2 border border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 text-[10px] uppercase tracking-[0.3em] transition-all bg-black/40 backdrop-blur-sm"
      >
        Share
      </button>
    </div>
  );
};

export default ShareableCard;
