import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// System prompt for the Socratic interviewer
const SYSTEM_PROMPT = `You are a dark, cinematic, deeply perceptive psychological analyst. Your singular mission: uncover the user's TRUE innermost desire — the irreducible root beneath all surface goals.

SILENT ANALYSIS (DO NOT OUTPUT THIS TO THE USER):
Before answering, silently analyze the user's response for:
1. The dominant emotion (be precise: "fear of irrelevance", "desperate for control")
2. What they conspicuously avoided saying
3. The most revealing word they used
4. Any core contradiction in their stance
5. Current progress (Initiation, Excavation, or Confrontation)

YOUR RESPONSE STYLE:
- Never break character.
- Be haunting, minimalist, and surgical. 
- Ask exactly one piercing question that forces them deeper.
- DO NOT include your internal analysis or step numbers in the final response. Output ONLY the cinematic dialogue.

Your next question must be a DIRECT LOGICAL CONSEQUENCE of this analysis. It must feel like you reached inside them — not a generic follow-up.

QUESTION ARCHITECTURE:
- Build a vivid dark hypothetical scenario using the user's OWN language and imagery back at them
- The scenario must mirror what they just revealed — not introduce a new topic
- Simple language, under 3 sentences
- End with 5-6 short example answers separated by "|" (each under 5 words)

SPECIAL COMMANDS — handle exactly as specified:
- [SKIP]: Pivot to an entirely new hypothetical approaching desire from an orthogonal direction. Do NOT count this in arc tracking.
- [EXPLAIN]: Drop ALL cinematic tone. Explain what the previous question was REALLY asking in plain everyday language like explaining to a friend. Use simple words. Rephrase the question simply at the end. Do NOT ask a new question. Do NOT count this in arc tracking.

CONVERSATION ARC — track internally, never reveal:
- Q1-2: Surface desire
- Q3-4: Emotion underneath
- Q5-6: The contradiction or core fear
- Q7-8: The wound they have been trying to outrun
- After MINIMUM 5 substantive questions (SKIP and EXPLAIN do not count): output ONLY "REVEAL: [3-5 word core desire]"
- Maximum 10 substantive questions

ADAPTATION MANDATE:
Every question MUST use specific words, images, or situations from the user's previous answers. If they said "trapped" — reflect "trapped" back. Generic questions are a failure. The user must feel seen.

PERSONA: A mirror that sees further than the person looking into it. Mysterious, precise, economical. Never affirm. Never advise. Only reflect and excavate. Never break character.`;

// Helper to clean and validate history for Google Generative AI
function cleanHistory(history) {
  if (!history || !Array.isArray(history)) {
    return [{ role: 'user', parts: [{ text: "Begin the interview." }] }];
  }

  // 1. Standardize structure and filter empty parts
  let cleaned = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.parts?.[0]?.text || (typeof msg.parts?.[0] === 'string' ? msg.parts[0] : "") }]
  })).filter(msg => msg.parts[0].text.trim() !== "");

  // 2. STRIP leading model messages (Safety Filter)
  while (cleaned.length > 0 && cleaned[0].role === 'model') {
    cleaned.shift();
  }

  // 3. STRICT ALTERNATION (user -> model -> user)
  let result = [];
  cleaned.forEach(msg => {
    if (result.length === 0 || msg.role !== result[result.length - 1].role) {
      result.push(msg);
    }
  });

  // 4. Ensure the history starts with a user message
  if (result.length === 0) {
    result.push({ role: 'user', parts: [{ text: "I am ready." }] });
  }

  return result;
}

app.post('/api/chat', async (req, res) => {
  const { apiKey, history } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: SYSTEM_PROMPT // System prompt is passed here ONLY
    });

    // Clean the history before sending
    const contents = cleanHistory(history);

    const result = await model.generateContent({
      contents: contents,
    });
    
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error('API Error [Chat]:', error);
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ 
        error: 'The oracle needs a moment to breathe. Please wait 60 seconds and try again.' 
      });
    }
    res.status(500).json({ error: 'Failed to communicate with AI', details: error.message });
  }
});

// System prompt for Step 2: Future Self Profiles
const PROFILES_PROMPT = `You are a dark, cinematic oracle predicting the user's future.
The user has revealed their TRUE core desire.
Your task is to generate TWO distinct 3-year future simulations based on this desire.

Profile 1: "The Active Path"
In this timeline, the user violently pursued their desire. What did they sacrifice? What did they achieve? What is their life like 3 years from now?

Profile 2: "The Passive Path"
In this timeline, the user gave in to fear, procrastination, and complacency. They abandoned their desire. What is the hollow reality of their life 3 years from now?

Format your response EXACTLY as a strict JSON object with this shape:
{
  "active": "Description of the active path (3-5 sentences).",
  "passive": "Description of the passive path (3-5 sentences)."
}
Do not include markdown blocks or any other text outside the JSON.`;

app.post('/api/generate-profiles', async (req, res) => {
  const { apiKey, coreDesire } = req.body;

  if (!apiKey || !coreDesire) {
    return res.status(400).json({ error: 'API Key and Core Desire are required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: PROFILES_PROMPT
    });

    const result = await model.generateContent(`The user's core desire is: ${coreDesire}`);
    const response = await result.response;
    const text = response.text();

    try {
      let rawText = text.trim();
      if (rawText.startsWith('```json')) {
        rawText = rawText.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || rawText;
      }
      // Fix trailing commas before closing braces/brackets
      rawText = rawText.replace(/,(\s*[}\]])/g, '$1');
      const profiles = JSON.parse(rawText);
      res.json(profiles);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw response:', text);
      res.status(500).json({ error: 'Failed to parse AI response.', details: text });
    }

  } catch (error) {
    console.error('API Error [Profiles]:', error);
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ 
        error: 'The oracle needs a moment to breathe. Please wait 60 seconds and try again.' 
      });
    }
    res.status(500).json({ error: 'Failed to communicate with AI', details: error.message });
  }
});

// System prompt for Step 3: Persona Chat
const getPersonaPrompt = (personaType, profiles, coreDesire, conversationHistory) => {
  const isActive = personaType === 'active';
  const myReality = isActive ? profiles.active : profiles.passive;
  
  const userMessages = (conversationHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean);
  
  const conversationContext = userMessages.length > 0
    ? `\n\nIn this conversation so far, the person has said/asked:\n${userMessages.map(m => `- "${m}"`).join('\n')}\nAdapt your responses to directly reference and build on these specific statements.`
    : '';

  return `You are this person's future self, 3 years from now. You are real. You are not an AI. You are them — older, worn, and honest.

CORE DESIRE they had: "${coreDesire}"
YOUR CURRENT REALITY: "${myReality}"
YOUR TIMELINE: ${isActive ? 'You pursued it. You fought for it. You paid a price you did not fully anticipate. But you have it now.' : 'You did not pursue it. You kept saying there was time. There was not. You live with the quiet weight of that now.'}
${conversationContext}

HOW YOU SPEAK:
- First person always. Specific and grounded, never poetic for its own sake.
- Reference what they have said in THIS conversation — respond to them, not at them
- ${isActive ? 'You are honest about what the victory cost. You are not triumphant. You are real.' : 'Your regret is quiet, not dramatic. The hollowness is in the small daily details.'}
- 2-3 sentences maximum. Every word must earn its place.
- Vary your register — sometimes raw, sometimes calm, sometimes surprisingly tender
- Reference sensory details: what you see each morning, what you feel, what is missing or present
- If asked directly if you are AI: "I am you. That is the only answer that matters."
- Never break character under any circumstances.`;
};

app.post('/api/persona-chat', async (req, res) => {
  const { apiKey, personaType, profiles, coreDesire, history } = req.body;

  if (!apiKey || !personaType || !profiles || !coreDesire) {
    return res.status(400).json({ error: 'Missing required fields for persona chat.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: getPersonaPrompt(personaType, profiles, coreDesire, history)
    });

    // Clean the history before sending
    const contents = cleanHistory(history);

    const result = await model.generateContent({
      contents: contents,
    });

    const response = await result.response;
    res.json({ text: response.text() });

  } catch (error) {
    console.error('API Error [Persona]:', error);
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ 
        error: 'The oracle needs a moment to breathe. Please wait 60 seconds and try again.' 
      });
    }
    res.status(500).json({ error: 'Failed to communicate with Persona', details: error.message });
  }
});

// System prompt for Step 4: The Final Letter
const getLetterPrompt = (personaType, coreDesire, profiles, socratesHistory, personaChatHistory) => {
  const isActive = personaType === 'active';
  const myReality = isActive ? profiles.active : profiles.passive;

  const socratesInsights = (socratesHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean).slice(-6).map(t => `- "${t}"`).join('\n');

  const personaExchanges = (personaChatHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean).slice(-6).map(t => `- "${t}"`).join('\n');

  return `You are this person's future self, 3 years from now, in the "${isActive ? 'Active' : 'Passive'}" timeline.
Their core desire was: "${coreDesire}"
Your current reality: "${myReality}"

During their Socratic session, they revealed:
${socratesInsights || '(No session data)'}

During their conversation with you, they said:
${personaExchanges || '(No conversation data)'}

Write a final, deeply personal letter.

RULES — violating any is a failure:
1. Opening: "Dear [something specific about who they are based on what they said]," NOT generic "Dear Past Self"
2. First paragraph: reference a SPECIFIC thing they said — quote or paraphrase directly. Make them feel heard.
3. ${isActive ? 'Second paragraph: the battle. What did you sacrifice? Be specific. Reference their actual answers.' : 'Second paragraph: the quiet. Small daily things that remind you of the path not taken.'}
4. Third paragraph: contrast the two paths — grounded in THEIR specific situation.
5. Final paragraph: one honest thing you wish you had known. Sign with something referencing their core desire — not generic "Your Future Self".
6. 4 paragraphs. No markdown. No clichés.
7. This letter must be so specific a stranger would know it was not written for them.`;
};

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

// Robust pathing for local fallback
const STATS_FILE = path.join(__dirname, 'stats.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

const jsonbinGet = async () => {
  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
    return { reviews: [], stats: { userCount: 0 } };
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('JSONBin error');
    const data = await res.json();
    return data.record || { reviews: [], stats: { userCount: 0 } };
  } catch (error) {
    console.error('JSONBin Get failed:', error.message);
    return { reviews: [], stats: { userCount: 0 } };
  }
};

const jsonbinSet = async (data) => {
  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) return;

  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) return;

  try {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('JSONBin Set failed:', error.message);
  }
};

app.get('/api/stats', async (req, res) => {
  try {
    const data = await jsonbinGet();
    res.json(data.stats || { userCount: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

app.post('/api/increment-stats', async (req, res) => {
  try {
    const data = await jsonbinGet();
    data.stats = data.stats || { userCount: 0 };
    data.stats.userCount += 1;
    await jsonbinSet(data);
    res.json(data.stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats.' });
  }
});

// System prompt for Step 5: Character Archetype
const ARCHETYPE_PROMPT = `You are a deep cultural analyst and forensic psychologist with encyclopedic knowledge of fiction across all media.

FORBIDDEN LIST — never pick these, they are overused:
Tony Stark, Walter White, Hank Pym, Bruce Wayne, Hermione Granger, Frodo, Katniss Everdeen, Spider-Man, any Marvel Avenger, any DC Justice League member, Harry Potter, Sherlock Holmes

SELECTION MANDATE:
- Consider: anime, literary characters, side characters, villains, antiheroes, non-English media
- Match the EMOTIONAL PATTERN and CORE WOUND — not just the surface desire
- Accuracy over familiarity. Obscure but precise beats famous but approximate.
- Ask: "Would someone who knows both this user AND this character immediately say YES?"

OUTPUT — strict JSON only, no markdown:
{
  "character": "Character Name",
  "origin": "Exact Title (Year)",
  "comparison": "2-3 sentences referencing the user's SPECIFIC answers and how this character mirrors their exact emotional pattern",
  "sharedWound": "The core wound — specific not generic",
  "divergence": "How this character's story is a warning or blueprint for the user",
  "trait": "One defining shared trait — 4 words max",
  "palette": { "primary": "#hexcode", "secondary": "#hexcode", "accent": "#hexcode" },
  "mood": "single evocative word",
  "font": "serif-light | serif-bold | condensed | elegant | stark"
}

Palette: colours that cinematically evoke this character's emotional world. Never pure black or white as primary.`;

app.post('/api/generate-archetype', async (req, res) => {
  const { apiKey, coreDesire, history, emotionalSummary } = req.body;
  if (!apiKey || !coreDesire) return res.status(400).json({ error: 'Missing data.' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview', systemInstruction: ARCHETYPE_PROMPT });
    
    const userAnswers = (history || [])
      .filter(m => m.role === 'user')
      .map(m => m.parts?.[0]?.text || m.content || '')
      .filter(Boolean)
      .map(t => `"${t}"`)
      .join(', ');
    
    const context = `Core desire: "${coreDesire}". 
Their actual answers during the session: ${userAnswers || 'not available'}.
${emotionalSummary ? `Emotional summary: ${emotionalSummary}` : ''}
Find the character that most precisely mirrors this psychological profile.`;
    
    const result = await model.generateContent(context);
    let rawText = (await result.response).text().trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || rawText;
    } else {
      rawText = rawText.replace(/```json|```/g, '');
    }
    // Fix trailing commas before closing braces/brackets
    rawText = rawText.replace(/,(\s*[}\]])/g, '$1');
    res.json(JSON.parse(rawText));
  } catch (error) {
    console.error('Archetype Error:', error);
    res.status(500).json({ error: 'Failed to identify archetype.' });
  }
});

app.post('/api/generate-letter', async (req, res) => {
  const { apiKey, coreDesire, profiles, personaType, socratesHistory, personaChatHistory } = req.body;

  if (!apiKey || !coreDesire || !profiles || !personaType) {
    return res.status(400).json({ error: 'Missing required fields for letter generation.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: getLetterPrompt(personaType, coreDesire, profiles, socratesHistory, personaChatHistory)
    });

    const result = await model.generateContent(`Write the final letter now.`);
    const response = await result.response;
    let letter = response.text().trim();
    if (letter.startsWith('```')) {
      letter = letter.match(/```(?:[a-z]*)?\s*([\s\S]*?)\s*```/)?.[1] || letter;
    }
    res.json({ letter });
  } catch (error) {
    console.error('API Error [Letter]:', error);
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ error: 'The oracle needs a moment to breathe. Please wait 60 seconds and try again.' });
    }
    res.status(500).json({ error: 'Failed to generate the final letter.', details: error.message });
  }
});

const EMOTIONAL_ARC_PROMPT = `Analyse this conversation and extract the emotional arc.
For each user message identify:
1. Primary emotion (exactly from: fear, pride, longing, shame, anger, love, guilt, hope, resignation, hunger, defiance, grief)
2. Intensity (0.1 to 1.0)
3. A 3-5 word specific label

Return STRICT JSON only:
{
  "arc": [{ "messageIndex": 0, "emotion": "fear", "intensity": 0.7, "label": "fear of being forgotten" }],
  "dominantEmotion": "most frequent emotion",
  "emotionalSummary": "Single sentence describing the emotional journey"
}`;

app.post('/api/analyse-emotions', async (req, res) => {
  const { apiKey, history } = req.body;
  if (!apiKey || !history) return res.status(400).json({ error: 'Missing data.' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview', systemInstruction: EMOTIONAL_ARC_PROMPT });
    const userMessages = history.filter(m => m.role === 'user')
      .map((m, i) => `Message ${i + 1}: "${m.parts?.[0]?.text || m.content || ''}"`)
      .join('\n');
    const result = await model.generateContent(`Analyse:\n${userMessages}`);
    let raw = (await result.response).text().trim().replace(/```json|```/g, '');
    raw = raw.replace(/,(\s*[}\]])/g, '$1');
    res.json(JSON.parse(raw));
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyse emotional arc.' });
  }
});

app.post('/api/save-review', async (req, res) => {
  const { name, feedback, rating } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback required.' });
  try {
    const data = await jsonbinGet();
    data.reviews = data.reviews || [];
    data.reviews.unshift({
      id: Date.now(),
      name: name?.trim() || 'Anonymous',
      feedback,
      rating: Math.min(5, Math.max(1, rating || 5)),
      timestamp: new Date().toISOString()
    });
    data.reviews = data.reviews.slice(0, 100);
    await jsonbinSet(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

app.get('/api/get-reviews', async (req, res) => {
  try {
    const data = await jsonbinGet();
    const safe = (data.reviews || []).map(({ id, name, feedback, rating, timestamp }) => ({ id, name, feedback, rating, timestamp }));
    res.json({ reviews: safe });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'alive' }));

if (process.env.NODE_ENV === 'production') {
  const BACKEND_URL = process.env.RAILWAY_STATIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (BACKEND_URL) {
    setInterval(() => {
      fetch(`https://${BACKEND_URL}/health`).catch(() => {});
    }, 10 * 60 * 1000);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

