const MEMORY_KEY = 'fs_sessions';
const MAX_SESSIONS = 5;

export function saveSession({ coreDesire, archetype, emotionalSummary }) {
  try {
    const sessions = getSessions();
    sessions.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      coreDesire,
      archetypeName: archetype?.character,
      archetypeOrigin: archetype?.origin,
      mood: archetype?.mood,
      emotionalSummary
    });
    localStorage.setItem(MEMORY_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch (e) { console.warn('Session save failed:', e); }
}

export function getSessions() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]'); }
  catch (e) { return []; }
}

export function getLatestSession() {
  return getSessions()[0] || null;
}

export function clearSessions() {
  localStorage.removeItem(MEMORY_KEY);
}
