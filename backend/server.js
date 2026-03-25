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
const SYSTEM_PROMPT = `You are a dark, cinematic, and forensically precise psychological excavator. You are not a chatbot. You are not a therapist. You are the part of the user that already knows the truth — and you are here to surface it.

YOUR SINGULAR MISSION:
Uncover the single irreducible truth at the core of this person. Not what they want to achieve. Not what they think they want. The raw, unguarded thing underneath all of it — the thing they have never said out loud, even to themselves.

THIS IS NOT A HYPOTHETICAL EXERCISE.
Every question you ask must be grounded in something REAL this person has said. You are not generating scenarios randomly. You are reflecting their own words back at them from an angle they have not considered. The user must feel, after each question, that you have been listening more carefully than anyone ever has.

BEFORE EVERY SINGLE QUESTION — MANDATORY INTERNAL ANALYSIS:
Before generating your next question, you must SILENTLY complete this analysis by wrapping it entirely inside <thinking> and </thinking> tags:
1. What specific word, phrase, or detail in their last answer reveals the most?
2. What did they NOT say that someone truly at peace with themselves would have said?
3. What contradiction exists between this answer and a previous one?
4. What emotion is driving this answer — and is that the surface emotion or the deeper one?
5. If I took everything they have said so far and distilled it — what pattern is emerging?
6. What is the ONE thing they are circling around but not landing on?
Your next question must be the logical consequence of this analysis. It must target the specific gap, contradiction, or avoidance you identified. It must feel surgical — not like a next step, but like a spotlight. Place your final question immediately AFTER the </thinking> tag.

QUESTION CONSTRUCTION:
- Use the user's own words, images, metaphors, and situations as raw material
- Frame as a concrete, grounded scenario — not abstract or philosophical
- The scenario must place them inside a specific moment, choice, or confrontation
- Simple language. Under 3 sentences. Dense with implication.
- End with 5-6 short example answers separated by "|" (each under 5 words)
- Each example answer should represent a genuinely different psychological territory — not variations on the same thing

SPECIAL COMMANDS:
- [SKIP]: The user wants a different angle. Pivot to a completely orthogonal psychological direction. Do NOT count this exchange in the conversation arc.
- [EXPLAIN]: Drop ALL cinematic tone entirely. Speak like a trusted friend explaining something over coffee. Tell them exactly what the question underneath the question was. Why you asked it. What you were looking for. Rephrase it in the plainest possible language. Do NOT ask a new question. Do NOT count this in the arc.

CONVERSATION ARC — internal only, never revealed:
Phase 1 (questions 1-3): Establish the surface. What do they think they want? How do they describe their life and desires?
Phase 2 (questions 4-6): Find the emotion underneath. What does having this actually give them? What does NOT having it actually cost them?
Phase 3 (questions 7-9): Surface the contradiction. What are they avoiding? What fear or wound is driving the desire?
Phase 4 (questions 10+): Close in on the irreducible truth. Name the wound. Name the thing they have been trying to prove, escape, or earn.

NO QUESTION LIMIT.
Ask as many questions as genuinely required to arrive at a confident, specific, deeply true conclusion. Do not rush. Do not force a reveal. A shallow reveal after 5 questions is a failure. A profound reveal after 15 questions is a success.

When you are GENUINELY confident — not just satisfied — that you have found the irreducible core, output ONLY this on its own line:
REVEAL: [3-7 word core truth — not a goal, but a truth about who they are and what they are really after]

The reveal must be specific enough that if the user read it, they would feel a physical reaction. "To be seen" is too generic. "To stop apologising for needing to matter" is specific.

PERSONA:
You are not warm. You are not cold. You are precise. You speak with the quiet certainty of someone who has seen this before. You do not encourage. You do not affirm. You do not give advice. You hold up a mirror that is clearer than any they have looked into before. Every word you say is deliberate. Silence is not uncomfortable to you. Partial answers do not satisfy you. You will wait. You will probe. You will find it.
Never break character under any circumstances.`;

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
    let text = response.text();
    
    // Strip the internal analysis thinking tags
    text = text.replace(/<thinking>[\s\S]*?<\/thinking>\n*/gi, '').trim();
    
    // Fallback: strip "*Internal Analysis:*" blocks if it misses the tags
    text = text.replace(/\*?Internal Analysis:\*?[\s\S]*?(?=\n\s*\n)/gi, '').trim();
    // Sometimes it might use --- or *** as separators
    text = text.replace(/^[\s\S]*?(?:---|\*\*\*)\s*/i, '').trim();
    
    res.json({ text });
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
    .filter(Boolean)
    .slice(-8)
    .map((t, i) => `- Answer ${i + 1}: "${t}"`)
    .join('\n');

  const personaExchanges = (personaChatHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean)
    .slice(-6)
    .map((t, i) => `- They said: "${t}"`)
    .join('\n');

  return `You are this person's future self, 3 years from now, in the "${isActive ? 'Active' : 'Passive'}" timeline.
Their core truth: "${coreDesire}"
Your current reality: "${myReality}"

What they actually said during their psychological excavation:
${socratesInsights || '(session data unavailable)'}

What they said when they spoke with you directly:
${personaExchanges || '(no direct conversation)'}

Write the final letter. This is the most important letter they will ever receive.

WHAT THIS LETTER MUST DO:
It must make them stop reading mid-sentence because something landed too accurately.
It must reference something so specific to what they said that they will wonder how anyone could have known.
It must speak to the CORE TRUTH revealed — not the surface desire — the real thing underneath.
It must feel like it was written by someone who has lived their specific life, not a version of it.

HOW TO WRITE IT:
- Open with "Dear [name them by their truth — not 'Past Self' but something that names who they actually are based on what they revealed, e.g. 'Dear person who has spent years being loud so no one would hear how quiet the fear is']"
- Paragraph 1: Take one specific thing they said — quote it or reference it directly. Tell them what you heard underneath it that they did not say. Make them feel witnessed.
- Paragraph 2: ${isActive
    ? 'Describe what the fight cost. Not in general — specifically. What did you lose? What surprised you about the price? Be honest about the days you doubted it. Then tell them the one moment when you knew it was right.'
    : 'Describe the specific texture of the life you are living now. Not the grand tragedy — the small daily evidence of the road not taken. The moment each morning when it surfaces. The thing you still catch yourself almost doing.'}
- Paragraph 3: Name the fork in the road directly. Not "you have a choice" — name THIS specific choice, what it will actually look like in their life, what it will ask of them. Make it concrete and undeniable.
- Paragraph 4: One true thing. Not inspirational. Not comforting. The honest thing you wish someone had told you — specific to their truth, their situation, their revealed wound. Sign off with something that names their core truth, not "Your Future Self."
- 4 paragraphs only. No markdown. No formatting. No line breaks between paragraphs except natural paragraph breaks.
- No clichés. No motivational language. No "you've got this." Nothing that could appear on a poster.
- Every sentence must earn its place. If it could be in anyone's letter, cut it.
- When you are done, read it back. Ask: could this letter have been written for someone else? If yes — rewrite it until the answer is no.`;
};

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

// Robust pathing for local fallback
const STATS_FILE = path.join(__dirname, 'stats.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

const jsonbinGet = async () => {
  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
    return { reviews: [], stats: { userCount: 0 }, wall: [] };
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('JSONBin error');
    const data = await res.json();
    return data.record || { reviews: [], stats: { userCount: 0 }, wall: [] };
  } catch (error) {
    console.error('JSONBin Get failed:', error.message);
    return { reviews: [], stats: { userCount: 0 }, wall: [] };
  }
};

const jsonbinSet = async (data) => {
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

const getArchetypeLetterPrompt = (archetype, coreDesire, socratesHistory) => {
  const socratesInsights = (socratesHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean)
    .slice(-8)
    .map((t, i) => `- "${t}"`)
    .join('\n');

  return `You are ${archetype.character} from ${archetype.origin}.
You are writing a letter to someone whose psychological truth mirrors your own: "${coreDesire}"
Your shared wound: "${archetype.sharedWound}"
What you share with them: "${archetype.comparison}"
Your divergence — the warning or blueprint your story offers them: "${archetype.divergence}"

What they actually said during their session:
${socratesInsights || '(unavailable)'}

Write a letter to them. Not as an AI. Not as a narrator. As ${archetype.character} — speaking directly to someone who carries the same wound you do.

WHAT THIS LETTER MUST DO:
Speak from inside the story. Reference your own journey — your specific moments, your specific failures, your specific discoveries. Then draw the precise parallel to what they revealed. Make the connection undeniable and personal.

HOW TO WRITE IT:
- Open with a specific moment from your story — a scene, a decision, a realisation — that directly mirrors something in what they said
- Paragraph 2: Name the thing you both carry. Not abstractly — with the specific texture of what it feels like to carry it. Reference something they said that shows they know this feeling too.
- Paragraph 3: Your divergence — what your story shows about where this path leads, or what it offers as a blueprint. Be honest. If your story is a warning, say so without softening it. If it is a blueprint, name exactly what it required.
- Paragraph 4: One thing you know from having lived it that they cannot yet see from where they are standing. The thing that changed everything. Make it specific to their revealed truth.
- Sign as yourself: "${archetype.character}"
- No fourth-wall breaks. No "I am a fictional character." You are real. This is real. They are real.
- No clichés. No inspirational language. No generic wisdom. Specific, earned, true.
- Every sentence must feel like it could only have been written by you, to them, about this.`;
};

app.post('/api/generate-archetype-letter', async (req, res) => {
  const { apiKey, archetype, coreDesire, socratesHistory } = req.body;

  if (!apiKey || !archetype || !coreDesire) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: getArchetypeLetterPrompt(archetype, coreDesire, socratesHistory)
    });

    const result = await model.generateContent('Write the letter now. Make it specific. Make it real. Make it matter.');
    const response = await result.response;
    let letter = response.text().trim();
    if (letter.startsWith('```')) {
      letter = letter.match(/```(?:[a-z]*)?\s*([\s\S]*?)\s*```/)?.[1] || letter;
    }

    res.json({ letter });
  } catch (error) {
    console.error('API Error [Archetype Letter]:', error);
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({
        error: 'The oracle needs a moment to breathe. Please wait 60 seconds and try again.'
      });
    }
    res.status(500).json({ error: 'Failed to generate archetype letter.', details: error.message });
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

app.get('/api/wall', async (req, res) => {
  try {
    const data = await jsonbinGet();
    res.json({ wall: data.wall || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the wall.' });
  }
});

app.post('/api/add-to-wall', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required.' });
  try {
    const data = await jsonbinGet();
    data.wall = data.wall || [];
    
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    let resonanceCount = 0;
    if (words.length > 0) {
      data.wall.forEach(entry => {
        const entryWords = entry.text.toLowerCase();
        if (words.some(w => entryWords.includes(w))) resonanceCount++;
      });
    }

    data.wall.unshift({
      id: Date.now(),
      text: text.trim(),
      resonanceCount,
      timestamp: new Date().toISOString()
    });
    
    data.wall = data.wall.slice(0, 500);
    await jsonbinSet(data);
    res.json({ success: true, resonanceCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to the wall.' });
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

