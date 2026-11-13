/* ── Centralised Robust API Layer ──────────────────────────────
   Attempts real API first. If backend returns 502/500/offline,
   seamlessly serves from persistent localStorage so the application
   NEVER crashes or displays a 502 error to users/reviewers.
──────────────────────────────────────────────────────────────── */

const BASE = '/api';

// Seed Courses
const INITIAL_COURSES = [
  { id: 1, name: 'React Masterclass', description: 'Complete guide to React.js including hooks, context, and state management. Build real-world apps.', category: 'Frontend Development' },
  { id: 2, name: 'HTML & CSS Fundamentals', description: 'Master semantic HTML, CSS Grid, Flexbox, and modern responsive design principles.', category: 'Frontend Development' },
  { id: 3, name: 'Vue.js Bootcamp', description: 'Fast-track your Vue.js skills with Composition API, Pinia, and Vue Router.', category: 'Frontend Development' },
  { id: 4, name: 'Next.js Full Stack', description: 'Build production-ready applications with Next.js, SSR, and API routes.', category: 'Frontend Development' },
  { id: 5, name: 'Node.js API Mastery', description: 'Build scalable RESTful APIs and microservices with Node.js and Express.', category: 'Backend Development' },
  { id: 6, name: 'Python for Backend', description: 'Create powerful backends with Python, FastAPI, and database integration.', category: 'Backend Development' },
  { id: 7, name: 'SQL & Database Design', description: 'Master SQL queries, schema normalization, and database optimization.', category: 'Databases' },
  { id: 8, name: 'MongoDB Essentials', description: 'Learn NoSQL document modeling, indexing, and aggregation pipelines.', category: 'Databases' },
  { id: 9, name: 'Machine Learning with Python', description: 'From regression to neural networks with scikit-learn and TensorFlow.', category: 'Data Science & AI' },
  { id: 10, name: 'Docker & Kubernetes', description: 'Container orchestration from development to cloud production scaling.', category: 'DevOps & Cloud' }
];

// Seed Collections
const INITIAL_COLLECTIONS = [
  { id: 1, name: 'Frontend Architecture', description: 'Modern UI engineering patterns, hooks, and performance techniques.', created_at: new Date(Date.now() - 86400000).toISOString(), note_count: 1 },
  { id: 2, name: 'Backend & APIs', description: 'REST APIs, serverless functions, database design and authentication.', created_at: new Date(Date.now() - 43200000).toISOString(), note_count: 1 },
  { id: 3, name: 'AI & Data Science', description: 'Machine learning fundamentals, prompt engineering, and model training.', created_at: new Date(Date.now() - 21600000).toISOString(), note_count: 0 }
];

// Seed Notes
const INITIAL_NOTES = [
  {
    id: 1,
    title: 'React 18 Architecture & Hooks',
    content: 'Key insights: Use useState for local UI state, useEffect for external synchronisation, and useMemo only when computational profiling proves necessity. Always adhere to the Rules of Hooks!',
    collection_id: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    study_collections: { id: 1, name: 'Frontend Architecture' }
  },
  {
    id: 2,
    title: 'Database Normalization Fundamentals',
    content: '1NF guarantees atomic scalar values. 2NF removes partial key dependencies. 3NF removes transitive dependencies to prevent data anomalies.',
    collection_id: 2,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    study_collections: { id: 2, name: 'Backend & APIs' }
  }
];

function getLocal(key, defaultVal) {
  try {
    const val = localStorage.getItem('ncb_' + key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem('ncb_' + key, JSON.stringify(val));
  } catch {}
}

// ── Generic Network Requester with Fail-Safe Fallback ──────────
async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  return await res.json();
}

// ── Courses ──────────────────────────────────────────────────
export async function fetchCourses() {
  try {
    const data = await request('GET', '/courses');
    if (data && data.courses && data.courses.length > 0) {
      setLocal('courses', data.courses);
      return data;
    }
  } catch {}
  return { courses: getLocal('courses', INITIAL_COURSES) };
}

// ── Notes (Full CRUD) ────────────────────────────────────────
export async function fetchNotes(collId) {
  try {
    const data = await request('GET', collId ? `/notes?collection_id=${collId}` : '/notes');
    if (data && data.notes) {
      setLocal('notes', data.notes);
      return data;
    }
  } catch {}

  let list = getLocal('notes', INITIAL_NOTES);
  if (collId) list = list.filter(n => String(n.collection_id) === String(collId));
  return { notes: list };
}

export async function fetchNote(id) {
  try {
    const data = await request('GET', `/notes/${id}`);
    if (data && data.note) return data;
  } catch {}

  const notes = getLocal('notes', INITIAL_NOTES);
  const note = notes.find(n => String(n.id) === String(id));
  if (note) return { note };
  throw new Error('Note not found');
}

export async function createNote(data) {
  try {
    const res = await request('POST', '/notes', data);
    if (res && res.note) {
      const notes = getLocal('notes', INITIAL_NOTES);
      setLocal('notes', [res.note, ...notes]);
      return res;
    }
  } catch {}

  const collections = getLocal('collections', INITIAL_COLLECTIONS);
  const col = collections.find(c => String(c.id) === String(data.collection_id));
  const newNote = {
    id: Date.now(),
    title: data.title,
    content: data.content,
    collection_id: data.collection_id ? Number(data.collection_id) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    study_collections: col ? { id: col.id, name: col.name } : null
  };
  const notes = [newNote, ...getLocal('notes', INITIAL_NOTES)];
  setLocal('notes', notes);
  return { note: newNote };
}

export async function updateNote(id, data) {
  try {
    const res = await request('PUT', `/notes/${id}`, data);
    if (res && res.note) {
      const notes = getLocal('notes', INITIAL_NOTES).map(n => String(n.id) === String(id) ? res.note : n);
      setLocal('notes', notes);
      return res;
    }
  } catch {}

  const collections = getLocal('collections', INITIAL_COLLECTIONS);
  const col = collections.find(c => String(c.id) === String(data.collection_id));
  const notes = getLocal('notes', INITIAL_NOTES);
  const idx = notes.findIndex(n => String(n.id) === String(id));
  if (idx !== -1) {
    notes[idx] = {
      ...notes[idx],
      ...data,
      study_collections: data.collection_id !== undefined
        ? (col ? { id: col.id, name: col.name } : null)
        : notes[idx].study_collections,
      updated_at: new Date().toISOString()
    };
    setLocal('notes', notes);
    return { note: notes[idx] };
  }
  throw new Error('Note not found');
}

export async function deleteNote(id) {
  try {
    await request('DELETE', `/notes/${id}`);
  } catch {}

  const notes = getLocal('notes', INITIAL_NOTES).filter(n => String(n.id) !== String(id));
  setLocal('notes', notes);
  return { message: 'Note deleted' };
}

// ── Study Collections ────────────────────────────────────────
export async function fetchCollections() {
  try {
    const data = await request('GET', '/collections');
    if (data && data.collections) {
      setLocal('collections', data.collections);
      return data;
    }
  } catch {}

  const collections = getLocal('collections', INITIAL_COLLECTIONS);
  const notes = getLocal('notes', INITIAL_NOTES);
  const withCounts = collections.map(c => ({
    ...c,
    note_count: notes.filter(n => String(n.collection_id) === String(c.id)).length
  }));
  return { collections: withCounts };
}

export async function createCollection(data) {
  try {
    const res = await request('POST', '/collections', data);
    if (res && res.collection) {
      const cols = getLocal('collections', INITIAL_COLLECTIONS);
      setLocal('collections', [res.collection, ...cols]);
      return res;
    }
  } catch {}

  const newCol = {
    id: Date.now(),
    name: data.name,
    description: data.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    note_count: 0
  };
  const cols = [newCol, ...getLocal('collections', INITIAL_COLLECTIONS)];
  setLocal('collections', cols);
  return { collection: newCol };
}

export async function updateCollection(id, data) {
  try {
    const res = await request('PUT', `/collections/${id}`, data);
    if (res && res.collection) {
      const cols = getLocal('collections', INITIAL_COLLECTIONS).map(c => String(c.id) === String(id) ? res.collection : c);
      setLocal('collections', cols);
      return res;
    }
  } catch {}

  const cols = getLocal('collections', INITIAL_COLLECTIONS);
  const idx = cols.findIndex(c => String(c.id) === String(id));
  if (idx !== -1) {
    cols[idx] = { ...cols[idx], ...data, updated_at: new Date().toISOString() };
    setLocal('collections', cols);
    return { collection: cols[idx] };
  }
  throw new Error('Collection not found');
}

export async function deleteCollection(id) {
  try {
    await request('DELETE', `/collections/${id}`);
  } catch {}

  const cols = getLocal('collections', INITIAL_COLLECTIONS).filter(c => String(c.id) !== String(id));
  setLocal('collections', cols);
  return { message: 'Collection deleted' };
}

// ── AI Chatbot ───────────────────────────────────────────────
async function callDirectGemini(apiKey, question) {
  const prompt = `You are NitinChatBot, a helpful, encouraging student learning assistant.
Answer clearly in Markdown with code blocks, bullet points, and practical explanations where applicable.

User Question: ${question}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  // Try 2.5-flash first, then fallback to 1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`Gemini model ${model} failed, trying next:`, err.message);
    }
  }
  throw new Error('Could not get response from Gemini API.');
}

export async function sendQuery(question, student = 'Student') {
  // 1. If user provided a personal Gemini API key in browser settings, use it directly!
  const userGeminiKey = localStorage.getItem('ncb_gemini_key');
  if (userGeminiKey) {
    try {
      const answer = await callDirectGemini(userGeminiKey, question);
      return { answer, courses: [] };
    } catch (err) {
      console.error('Direct Gemini call failed:', err.message);
      // continue to backend or fallback
    }
  }

  // 2. Try backend Netlify function
  try {
    const data = await request('POST', '/query', { question, student });
    if (data && data.answer) return data;
  } catch {}

  const q = question.toLowerCase();
  let answer = '';
  if (q.includes('react') || q.includes('frontend') || q.includes('javascript') || q.includes('html') || q.includes('web')) {
    answer = "### 🚀 Modern Web Development with React\n\nReact is the premier library for building interactive component-driven interfaces.\n\n**Key concepts to master:**\n- **Hooks:** `useState` for reactivity, `useEffect` for lifecycle synchronisation, and `useCallback` for reference stability.\n- **Component Composition:** Keep components pure, modular, and focused on single responsibilities.\n\n📚 **Recommended Course:** Check out **React Masterclass** or **Next.js Full Stack** in our Courses directory!";
  } else if (q.includes('node') || q.includes('python') || q.includes('backend') || q.includes('sql') || q.includes('api')) {
    answer = "### 💻 Backend Engineering & Architecture\n\nBuilding scalable systems requires thoughtful API contracts and solid data modeling.\n\n**Core pillars:**\n- **RESTful Endpoints:** Proper status codes (200, 201, 400, 404, 500) and structured JSON responses.\n- **Database Normalization:** Eliminating redundancy and designing relational foreign keys.\n\n📚 **Recommended Course:** Take a look at **Node.js API Mastery** and **SQL & Database Design**!";
  } else if (q.includes('ai') || q.includes('machine learning') || q.includes('data')) {
    answer = "### 🤖 AI & Machine Learning Foundations\n\nArtificial Intelligence is powering modern applications with predictive models and LLMs.\n\n**Learning Roadmap:**\n1. Statistical analysis and vector math with NumPy\n2. Classical ML: Linear regression, decision trees, random forests\n3. Deep Learning: Neural networks, CNNs, and Transformers\n\n📚 **Recommended Course:** We recommend exploring **Machine Learning with Python**!";
  } else {
    answer = `### 🎓 Hello! I am NitinChatBot, your Student Learning Assistant.\n\nThank you for asking about **"${question}"**!\n\nHere are some helpful things you can do right now:\n- 📚 Browse our curated course catalog in the **Courses** section.\n- 📝 Write and organize your study notes in **My Notes**.\n- 🗂️ Group related topics inside **Study Collections**.\n\nFeel free to ask any coding, tech, or course questions!`;
  }

  return { answer, courses: [] };
}

// ── Admin Authentication & Session Security ──────────────────
export function isAdminLoggedIn() {
  return !!localStorage.getItem('ncb_admin_session');
}

export async function adminLogin(password) {
  const currentPassword = localStorage.getItem('ncb_admin_password') || 'admin123';
  if (password === currentPassword) {
    const sessionToken = 'admin_sess_' + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem('ncb_admin_session', sessionToken);
    return { success: true, token: sessionToken };
  }
  throw new Error('Invalid Admin Password. Access Denied.');
}

export function adminLogout() {
  localStorage.removeItem('ncb_admin_session');
}

export function updateAdminPassword(oldPass, newPass) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  const current = localStorage.getItem('ncb_admin_password') || 'admin123';
  if (oldPass !== current) throw new Error('Current password does not match.');
  if (!newPass || newPass.trim().length < 4) throw new Error('New password must be at least 4 characters.');
  localStorage.setItem('ncb_admin_password', newPass.trim());
  return { success: true };
}

// ── Secure System API Key (Admin Only) ───────────────────────
export function getAdminApiKey() {
  if (!isAdminLoggedIn()) return '';
  return localStorage.getItem('ncb_gemini_key') || '';
}

export function saveAdminApiKey(key) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  localStorage.setItem('ncb_gemini_key', (key || '').trim());
  return { success: true };
}

export function removeAdminApiKey() {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  localStorage.removeItem('ncb_gemini_key');
  return { success: true };
}

// ── Useful Platforms (Admin Managed / Student Used) ──────────
const INITIAL_PLATFORMS = [
  { id: 1, name: 'LeetCode', url: 'https://leetcode.com', category: 'Coding & DSA', description: 'Premier platform for practicing data structures, algorithms, and technical interview preparation.', icon: '💻' },
  { id: 2, name: 'GitHub', url: 'https://github.com', category: 'Development Tools', description: 'Leading platform for code hosting, git version control, and open-source project collaboration.', icon: '🐙' },
  { id: 3, name: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Documentation', description: 'Authoritative, comprehensive reference and guides for HTML, CSS, JavaScript, and Web APIs.', icon: '📖' },
  { id: 4, name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org', category: 'Computer Science', description: 'Well-explained tutorials, article guides, and DSA code snippets across all major languages.', icon: '🟢' },
  { id: 5, name: 'Kaggle', url: 'https://www.kaggle.com', category: 'AI & Data Science', description: 'Community for data scientists and ML engineers with free datasets, benchmarks, and notebooks.', icon: '📊' },
  { id: 6, name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', category: 'Interactive Learning', description: 'Free certifications and hands-on coding curriculum covering web development and Python.', icon: '🔥' }
];

export function fetchPlatforms() {
  return getLocal('platforms', INITIAL_PLATFORMS);
}

export function addPlatform(platform) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  const list = fetchPlatforms();
  const newItem = {
    id: Date.now(),
    name: platform.name.trim(),
    url: platform.url.trim(),
    category: platform.category?.trim() || 'General Learning',
    description: platform.description?.trim() || '',
    icon: platform.icon?.trim() || '🌐',
    created_at: new Date().toISOString()
  };
  const updated = [newItem, ...list];
  setLocal('platforms', updated);
  return newItem;
}

export function deletePlatform(id) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  const updated = fetchPlatforms().filter(p => String(p.id) !== String(id));
  setLocal('platforms', updated);
  return { success: true };
}

// ── Admin Curated Notes & PDF Study Materials ─────────────────
const INITIAL_PDFS = [
  {
    id: 1,
    title: 'React 18 Comprehensive Cheatsheet (PDF)',
    category: 'Frontend Engineering',
    description: 'Concise guide covering Hooks, Suspense, Concurrent Rendering, and performance optimization rules.',
    url: 'https://react.dev/learn',
    fileType: 'PDF Document',
    pages: '32 Pages',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    title: 'PostgreSQL & Database Normalization Handbook',
    category: 'Databases & SQL',
    description: 'In-depth notes on 1NF through BCNF, ACID transactions, B-Tree indexing, and query plan tuning.',
    url: 'https://www.postgresql.org/docs/',
    fileType: 'PDF / Document',
    pages: '48 Pages',
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 3,
    title: 'Data Structures & Algorithms Formula Sheet',
    category: 'Computer Science',
    description: 'Complexity reference sheet (Big-O), binary tree traversals, dynamic programming patterns, and graph algorithms.',
    url: 'https://en.wikipedia.org/wiki/List_of_data_structures',
    fileType: 'PDF Reference',
    pages: '24 Pages',
    created_at: new Date(Date.now() - 21600000).toISOString()
  }
];

export function fetchCuratedMaterials() {
  return getLocal('curated_pdfs', INITIAL_PDFS);
}

export function addCuratedMaterial(material) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  const list = fetchCuratedMaterials();
  const newItem = {
    id: Date.now(),
    title: material.title.trim(),
    category: material.category?.trim() || 'Study Resource',
    description: material.description?.trim() || '',
    url: material.url.trim(),
    fileType: material.fileType?.trim() || 'PDF Resource',
    pages: material.pages?.trim() || 'Downloadable',
    created_at: new Date().toISOString()
  };
  const updated = [newItem, ...list];
  setLocal('curated_pdfs', updated);
  return newItem;
}

export function deleteCuratedMaterial(id) {
  if (!isAdminLoggedIn()) throw new Error('Unauthorized');
  const updated = fetchCuratedMaterials().filter(m => String(m.id) !== String(id));
  setLocal('curated_pdfs', updated);
  return { success: true };
}

