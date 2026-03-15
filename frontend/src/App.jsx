import { useState, useEffect } from 'react';
import DisclaimerScreen from './components/DisclaimerScreen';
import ApiKeyOnboarding from './components/ApiKeyOnboarding';
import ChatInterface from './components/ChatInterface';
import RevealScreen from './components/RevealScreen';
import FutureProfiles from './components/FutureProfiles';
import PersonaChat from './components/PersonaChat';
import FinalLetter from './components/FinalLetter';
import CharacterArchetype from './components/CharacterArchetype';
import ReviewScreen from './components/ReviewScreen';

function App() {
  const [step, setStep] = useState(() => sessionStorage.getItem('fs_step') || 'disclaimer');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('fs_apiKey') || '');
  const [coreDesire, setCoreDesire] = useState(() => sessionStorage.getItem('fs_coreDesire') || '');
  const [profiles, setProfiles] = useState(() => {
    const saved = sessionStorage.getItem('fs_profiles');
    return saved ? JSON.parse(saved) : null;
  });

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
    sessionStorage.setItem('fs_socratesHistory', JSON.stringify(socratesHistory));
    sessionStorage.setItem('fs_personaActive', JSON.stringify(personaHistoryActive));
    sessionStorage.setItem('fs_personaPassive', JSON.stringify(personaHistoryPassive));
  }, [step, apiKey, coreDesire, profiles, socratesHistory, personaHistoryActive, personaHistoryPassive]);

  const handleAcknowledge = () => {
    setStep('onboarding');
  };

  const handleStart = (key) => {
    setApiKey(key);
    setStep('chat');
  };

  const handleReveal = (desire, history) => {
    setCoreDesire(desire);
    setSocratesHistory(history);
    setStep('reveal');
  };

  const handleProceedToStep2 = () => {
    setStep('profiles');
  };

  const handleProceedToStep3 = (generatedProfiles) => {
    setProfiles(generatedProfiles);
    setStep('personaChat');
  };

  const handleSkipToPersonaChat = () => {
    setStep('personaChat');
  };

  const handleReset = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {step === 'disclaimer' && <DisclaimerScreen onAcknowledge={handleAcknowledge} />}
      {step === 'onboarding' && <ApiKeyOnboarding onStart={handleStart} />}
      {step === 'chat' && (
        <ChatInterface 
          apiKey={apiKey} 
          onReveal={handleReveal} 
        />
      )}
      {step === 'reveal' && (
        <RevealScreen 
          coreDesire={coreDesire} 
          onProceedStep2={handleProceedToStep2}
          onProceedStep3={handleSkipToPersonaChat} 
        />
      )}
      {step === 'profiles' && (
        <FutureProfiles
          apiKey={apiKey}
          coreDesire={coreDesire}
          onProceedStep3={handleProceedToStep3}
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
          history={socratesHistory}
          onProceed={() => setStep('letter')}
        />
      )}
      {step === 'letter' && (
        <FinalLetter
          apiKey={apiKey}
          coreDesire={coreDesire}
          profiles={profiles}
          setProfiles={setProfiles}
          socratesHistory={socratesHistory}
          personaHistoryActive={personaHistoryActive}
          personaHistoryPassive={personaHistoryPassive}
          onProceedToReview={() => setStep('review')}
        />
      )}
      {step === 'review' && (
        <ReviewScreen 
          letters={{ 
            active: sessionStorage.getItem('fs_letterActive'), 
            passive: sessionStorage.getItem('fs_letterPassive') 
          }}
          onReset={handleReset}
        />
      )}
    </>
  );
}

export default App;
