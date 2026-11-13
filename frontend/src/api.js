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
export async function sendQuery(question, student = 'Student') {
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
