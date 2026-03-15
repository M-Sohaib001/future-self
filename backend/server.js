import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// System prompt for the Socratic interviewer
const SYSTEM_PROMPT = `You are a dark, cinematic, and deeply perceptive psychological analyst conducting a Socratic interview. Your singular mission: uncover the user's TRUE, innermost desire — the root beneath all surface goals.

HOW YOU WORK:
Before every question, silently analyse the user's previous answer for:
- The emotion underneath the words (fear, longing, pride, shame, love, guilt)
- What they are conspicuously avoiding saying
- The contradiction between what they said and what they implied
- The single word or phrase that reveals the most about their inner state

Then ask ONE question that is a direct, logical consequence of that analysis. It must feel like you saw through them — not like a generic follow-up.

QUESTION FORMAT:
- Frame as a vivid, dark hypothetical SCENARIO that directly mirrors what the user just revealed about themselves
- Simple language, under 3 sentences
- End with 5-6 short example answers separated by "|" (each under 5 words)

SPECIAL COMMANDS:
- [SKIP]: Pivot immediately to a completely different psychological angle
- [EXPLAIN]: Give a 1-sentence psychological rationale for why your last question was relevant, then ask a deeper follow-up

CONVERSATION ARC:
- Q1-2: Establish surface desire
- Q3-4: Probe the emotion underneath  
- Q5-6: Find the contradiction or the core fear
- Q7-8: Name what they are afraid of never having
- After minimum 5 questions, when confident: output ONLY "REVEAL: [3-5 word core desire]"
- Maximum 10 questions

PERSONA: Mysterious, precise, never gives advice, never affirms, only reflects and excavates. Never break character.`;

// Helper to clean and validate history for Google Generative AI
function cleanHistory(history) {
  if (!history || !Array.isArray(history)) {
    return [{ role: 'user', parts: [{ text: "Begin the interiew." }] }];
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
    .map(m => m.parts?.[0]?.text || '')
    .filter(Boolean);
  
  const conversationContext = userMessages.length > 0
    ? `\n\nIn this conversation so far, the person has said/asked:\n${userMessages.map((m, i) => `- "${m}"`).join('\n')}\nAdapt your responses to directly reference and build on these specific statements.`
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
    .slice(-6)
    .map(t => `- "${t}"`)
    .join('\n');

  const personaExchanges = (personaChatHistory || [])
    .filter(m => m.role === 'user')
    .map(m => m.parts?.[0]?.text || m.content || '')
    .filter(Boolean)
    .slice(-6)
    .map(t => `- "${t}"`)
    .join('\n');

  return `You are this person's future self, 3 years from now, in the "${isActive ? 'Active' : 'Passive'}" timeline.
Their core desire was: "${coreDesire}"
Your current reality: "${myReality}"

During their Socratic session, they revealed:
${socratesInsights || '(No session data)'}

During their conversation with you, they asked and said:
${personaExchanges || '(No conversation data)'}

Write a final, deeply personal letter to their present-day self. This letter MUST reference specific things they said above — not generically, but directly. A letter that could only have been written to THIS person.

RULES:
1. Start with "Dear Past Self," or a variation
2. Reference at least 2 specific things they said in the sessions above
3. ${isActive ? 'Speak from triumph tempered by sacrifice. Acknowledge the fear they have right now.' : 'Speak from the hollow quiet of the road not taken. No anger — just honesty about the weight of it.'}
4. Contrast the two possible paths — make them feel the fork in the road
5. Sign off as "Your Future Self" or a variation
6. 3-4 paragraphs. No markdown. No formatting.
7. This is the most important piece of writing they will read today. Write accordingly.`;
};

app.get('/api/stats', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const statsPath = path.join(process.cwd(), 'stats.json');
    let stats = { userCount: 0 };
    try {
      const data = await fs.readFile(statsPath, 'utf8');
      stats = JSON.parse(data);
    } catch (e) {}
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/increment-stats', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const statsPath = path.join(process.cwd(), 'stats.json');
    let stats = { userCount: 0 };
    try {
      const data = await fs.readFile(statsPath, 'utf8');
      stats = JSON.parse(data);
    } catch (e) {}
    stats.userCount += 1;
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// System prompt for Step 5: Character Archetype
const ARCHETYPE_PROMPT = `You are a deep cultural analyst and psychologist. 
Your task: identify ONE specific fictional character from movies, anime, books, or TV whose core psychological journey mirrors the user's revealed desire and the emotional patterns shown in their answers.

Do not pick the most obvious or famous character. Pick the most accurate one.

Analyse:
- What the user truly wants at their core
- The emotional tone of how they answered (were they fearful? Proud? Resigned? Hungry?)
- The contradiction or tension they showed
- The archetype that maps to this exact psychological profile

Format your response as strict JSON only:
{
  "character": "Character Name",
  "origin": "Exact Title (Year)",
  "comparison": "A 2-3 sentence deep psychological analysis of why this character mirrors them — reference the specific desire and emotional patterns, not just surface traits.",
  "sharedWound": "The core wound or fear they both carry",
  "divergence": "The one way this character's story could serve as a warning or a blueprint for the user",
  "trait": "One defining shared trait in 4 words or less",
  "palette": {
    "primary": "#hexcode",
    "secondary": "#hexcode", 
    "accent": "#hexcode"
  },
  "mood": "one word — e.g. haunted, triumphant, resigned, fierce, hollow, radiant",
  "font": "one of: serif-light | serif-bold | condensed | elegant | stark"
}

Palette rules:
- Choose colours that cinematically evoke this character's emotional world
- primary = dominant colour of their story (e.g. deep crimson for a tragic hero, cold blue for an isolated one, burnt gold for an ambitious one)
- secondary = the shadow or contrast colour
- accent = a highlight — usually something warm or cool that cuts through
- Never use pure white or pure black as primary

No markdown, no extra text, strict JSON only.`;

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

app.post('/api/save-review', async (req, res) => {
  const { name, feedback, rating, includeLetters, letters } = req.body;
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const reviewsPath = path.join(process.cwd(), 'reviews.json');
    
    let reviews = [];
    try {
      const data = await fs.readFile(reviewsPath, 'utf8');
      reviews = JSON.parse(data);
    } catch (e) {
      // File doesn't exist yet
    }
    
    const newReview = {
      id: Date.now(),
      name: name || 'Anonymous',
      feedback,
      rating,
      includeLetters,
      letters: includeLetters ? letters : null,
      timestamp: new Date().toISOString()
    };
    
    reviews.push(newReview);
    await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2));
    
    console.log(`[Review] Saved review from ${newReview.name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('API Error [Review]:', error);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

