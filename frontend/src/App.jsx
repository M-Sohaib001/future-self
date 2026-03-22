import { useState, useEffect } from 'react';
import DisclaimerScreen from './components/DisclaimerScreen';
import ApiKeyOnboarding from './components/ApiKeyOnboarding';
import ChatInterface from './components/ChatInterface';
import RevealScreen from './components/RevealScreen';
import FutureProfiles from './components/FutureProfiles';
import PersonaChat from './components/PersonaChat';
import FinalLetter from './components/FinalLetter';
import CharacterArchetype from './components/CharacterArchetype';
import SummaryGallery from './components/SummaryGallery';
import ReviewScreen from './components/ReviewScreen';
import { useAmbientMusic } from './hooks/useAmbientMusic';
import { useVoice } from './hooks/useVoice';
import { clearSessions } from './utils/sessionMemory';

function App() {
  const [step, setStep] = useState(() => sessionStorage.getItem('fs_step') || 'disclaimer');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('fs_apiKey') || '');
  const [coreDesire, setCoreDesire] = useState(() => sessionStorage.getItem('fs_coreDesire') || '');
  const [profiles, setProfiles] = useState(() => {
    const saved = sessionStorage.getItem('fs_profiles');
    return saved ? JSON.parse(saved) : null;
  });
  const [archetypeData, setArchetypeData] = useState(() => {
    const saved = sessionStorage.getItem('fs_archetype');
    return saved ? JSON.parse(saved) : null;
  });
  const [emotionalArc, setEmotionalArc] = useState(null);
  const [sessionStats, setSessionStats] = useState(() => {
    const saved = sessionStorage.getItem('fs_sessionStats');
    return saved ? JSON.parse(saved) : { questionCount: 0, startTime: null, duration: 0 };
  });

  const { start: startMusic, stop: stopMusic, musicEnabled, toggleMusicEnabled } = useAmbientMusic();
  const { voiceEnabled, toggleVoiceEnabled } = useVoice();

  // History states
  const [socratesHistory, setSocratesHistory] = useState(() => {
    const saved = sessionStorage.getItem('fs_socratesHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [personaHistoryActive, setPersonaHistoryActive] = useState(() => {
    const saved = sessionStorage.getItem('fs_personaActive');
    return saved ? JSON.parse(saved) : [];
  });
  const [personaHistoryPassive, setPersonaHistoryPassive] = useState(() => {
    const saved = sessionStorage.getItem('fs_personaPassive');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem('fs_step', step);
    sessionStorage.setItem('fs_apiKey', apiKey);
    sessionStorage.setItem('fs_coreDesire', coreDesire);
    if (profiles) sessionStorage.setItem('fs_profiles', JSON.stringify(profiles));
    if (archetypeData) sessionStorage.setItem('fs_archetype', JSON.stringify(archetypeData));
    sessionStorage.setItem('fs_socratesHistory', JSON.stringify(socratesHistory));
    sessionStorage.setItem('fs_personaActive', JSON.stringify(personaHistoryActive));
    sessionStorage.setItem('fs_personaPassive', JSON.stringify(personaHistoryPassive));
    sessionStorage.setItem('fs_sessionStats', JSON.stringify(sessionStats));
  }, [step, apiKey, coreDesire, profiles, archetypeData, socratesHistory, personaHistoryActive, personaHistoryPassive, sessionStats]);

  const handleAcknowledge = () => {
    startMusic();
    setStep('onboarding');
  };

  const handleStart = (key) => {
    setApiKey(key);
    setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
    setStep('chat');
  };

  const handleReveal = (desire, history, questionCount) => {
    setCoreDesire(desire);
    setSocratesHistory(history);
    const duration = sessionStats.startTime
      ? Math.round((Date.now() - sessionStats.startTime) / 60000)
      : 0;
    setSessionStats(prev => ({ ...prev, duration, questionCount }));
    setStep('reveal');
  };

  const handleReset = () => {
    stopMusic();
    clearSessions();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {step === 'disclaimer' && (
        <DisclaimerScreen 
          onAcknowledge={handleAcknowledge} 
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
        />
      )}
      {step === 'onboarding' && (
        <ApiKeyOnboarding 
          onStart={handleStart} 
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
        />
      )}
      {step === 'chat' && (
        <ChatInterface 
          apiKey={apiKey} 
          onReveal={handleReveal}
          onQuestionCountUpdate={(count) => setSessionStats(prev => ({ ...prev, questionCount: count }))}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
        />
      )}
      {step === 'reveal' && (
        <RevealScreen 
          coreDesire={coreDesire} 
          onProceedStep2={() => setStep('profiles')}
          onProceedStep3={() => setStep('personaChat')} 
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
        />
      )}
      {step === 'profiles' && (
        <FutureProfiles
          apiKey={apiKey}
          coreDesire={coreDesire}
          onProceedStep3={(generatedProfiles) => {
            setProfiles(generatedProfiles);
            setStep('personaChat');
          }}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
        />
      )}
      {step === 'personaChat' && (
        <PersonaChat
          apiKey={apiKey}
          coreDesire={coreDesire}
          profiles={profiles}
          setProfiles={setProfiles}
          personaHistoryActive={personaHistoryActive}
          personaHistoryPassive={personaHistoryPassive}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
          onHistoryUpdate={(type, history) => {
            if (type === 'active') setPersonaHistoryActive(history);
            else setPersonaHistoryPassive(history);
          }}
          onProceedStep4={() => setStep('archetype')}
        />
      )}
      {step === 'archetype' && (
        <CharacterArchetype
          apiKey={apiKey}
          coreDesire={coreDesire}
          socratesHistory={socratesHistory}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
          onArchetypeGenerated={(data) => {
            setArchetypeData(data);
          }}
          onEmotionAnalysed={(data) => setEmotionalArc(data)}
          onProceed={() => setStep('letter')}
        />
      )}
      {step === 'letter' && (
        <FinalLetter
          apiKey={apiKey}
          coreDesire={coreDesire}
          profiles={profiles}
          socratesHistory={socratesHistory}
          personaHistoryActive={personaHistoryActive}
          personaHistoryPassive={personaHistoryPassive}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
          onProceedToReview={() => setStep('summary')}
        />
      )}
      {step === 'summary' && (
        <SummaryGallery
          coreDesire={coreDesire}
          archetype={archetypeData}
          profiles={profiles}
          emotionalArc={emotionalArc}
          letterActive={sessionStorage.getItem('fs_letterActive')}
          letterPassive={sessionStorage.getItem('fs_letterPassive')}
          sessionStats={sessionStats}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
          onProceedToReview={() => setStep('review')}
          onReset={handleReset}
        />
      )}
      {step === 'review' && (
        <ReviewScreen 
          apiKey={apiKey}
          coreDesire={coreDesire}
          archetype={archetypeData}
          profiles={profiles}
          letters={{
            active: sessionStorage.getItem('fs_letterActive'),
            passive: sessionStorage.getItem('fs_letterPassive')
          }}
          sessionStats={sessionStats}
          emotionalArc={emotionalArc}
          musicEnabled={musicEnabled}
          toggleMusicEnabled={toggleMusicEnabled}
          voiceEnabled={voiceEnabled}
          toggleVoiceEnabled={toggleVoiceEnabled}
          onReset={handleReset}
        />
      )}
    </>
  );
}

export default App;
