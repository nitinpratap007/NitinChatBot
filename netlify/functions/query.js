const { getSupabase } = require('./_lib/supabase');
const { corsResponse, handleCors } = require('./_lib/cors');
const https = require('https');

const SYSTEM_PROMPT = `You are NitinChatBot, a smart AI assistant powered by Gemini. You can answer ANY question like ChatGPT - math, science, coding, general knowledge, life advice, writing, translations, anything.

You also have access to a course catalog. When a user asks about learning, courses, or a topic that matches a course in the catalog, recommend the relevant course(s) naturally.

Rules:
- Always respond in markdown format (use **bold**, lists, code blocks when needed)
- Be conversational, friendly, and helpful like ChatGPT
- Answer ALL questions - not just course-related ones
- Use emojis occasionally
- Keep responses concise but thorough
- If you know the answer, give it directly. Only suggest courses when it makes sense.
- For coding questions, use code blocks
- For math, show your work step by step`;

function callGemini(userMessage, courseCatalog) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Promise.reject(new Error('No GEMINI_API_KEY'));

  const prompt = `Available Courses:\n${courseCatalog}\n\n---\n\nUser: ${userMessage}`;

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 25000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return resolve(text);
          reject(new Error('Empty response'));
        } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getSmartFallback(q) {
  const query = q.toLowerCase();
  if (query.includes('react') || query.includes('frontend') || query.includes('html') || query.includes('web')) {
    return "Great question about web development! 🚀\n\nTo build modern interactive web applications:\n- **Master React:** Start with components, props, state (`useState`), and side-effects (`useEffect`).\n- **Styling:** Use CSS Grid, Flexbox, and modern CSS variables for responsive layouts.\n\n📚 **Recommended Course:** Check out **React Masterclass** or **Next.js Full Stack** in our Courses section!";
  }
  if (query.includes('python') || query.includes('backend') || query.includes('node') || query.includes('api')) {
    return "Backend engineering is all about scalability, APIs, and databases! 💻\n\nKey areas to focus on:\n- **RESTful APIs & CRUD operations**\n- **Authentication & Authorization (JWT)**\n- **Database design & optimization**\n\n📚 **Recommended Course:** Check out **Node.js API Mastery** or **Python for Backend** in our catalog!";
  }
  if (query.includes('ai') || query.includes('data') || query.includes('machine learning')) {
    return "Artificial Intelligence & Data Science are transformative fields! 🤖\n\nCore learning path:\n1. Python fundamentals & statistics\n2. Data analysis with Pandas & NumPy\n3. Machine Learning algorithms with Scikit-Learn\n4. Deep Learning architectures (CNNs, Transformers)\n\n📚 **Recommended Course:** Take a look at **Data Science Bootcamp** or **Machine Learning with Python** in our Courses tab!";
  }
  return `Thank you for your question about **"${q}"**! 🎓\n\nNitinChatBot is your student learning assistant. You can:\n1. 📚 Browse our **Courses** catalog for curated tech tracks.\n2. 📝 Take notes in **My Notes** to track your learning journey.\n3. 🗂️ Group related topics in **Study Collections**.\n\nFeel free to ask any specific coding, science, or course recommendation question!`;
}

async function handleQuery(event) {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  let body;
  try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON' }); }

  const { question, student } = body;
  if (!question || !question.trim()) return corsResponse(400, { error: 'Question required' });

  const supabase = getSupabase();
  let answer = '';

  if (process.env.GEMINI_API_KEY) {
    try {
      let catalog = 'React Masterclass, Node.js API Mastery, Python for Backend, SQL & Database Design, Machine Learning with Python';
      if (supabase) {
        const { data: courses } = await supabase.from('courses').select('name, description, category').limit(20);
        if (courses && courses.length > 0) {
          catalog = courses.map(c => `- ${c.name} [${c.category}]: ${c.description}`).join('\n');
        }
      }
      answer = await callGemini(question.trim(), catalog);
    } catch (e) {
      console.error('[Gemini Error]', e.message);
    }
  }

  if (!answer) {
    answer = getSmartFallback(question.trim());
  }

  if (supabase) {
    try {
      await supabase.from('queries').insert({ student: student || 'Anonymous', question: question.trim(), answer: answer.substring(0, 500) });
    } catch (e) {}
  }

  return corsResponse(200, { answer, courses: [] });
}

exports.handler = handleQuery;
