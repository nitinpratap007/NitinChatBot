/* ── Centralised API layer ─────────────────────────────────────
   All fetch calls go through this file.
   BASE auto-detects: Vite dev-server (proxied) vs production.
──────────────────────────────────────────────────────────────── */

const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ── Courses ──────────────────────────────────────────────────
export const fetchCourses   = ()           => request('GET',    '/courses');

// ── Learning Notes ───────────────────────────────────────────
export const fetchNotes     = (collId)     =>
  request('GET', collId ? `/notes?collection_id=${collId}` : '/notes');
export const fetchNote      = (id)         => request('GET',    `/notes/${id}`);
export const createNote     = (data)       => request('POST',   '/notes',   data);
export const updateNote     = (id, data)   => request('PUT',    `/notes/${id}`, data);
export const deleteNote     = (id)         => request('DELETE', `/notes/${id}`);

// ── Study Collections ────────────────────────────────────────
export const fetchCollections   = ()           => request('GET',    '/collections');
export const createCollection   = (data)       => request('POST',   '/collections',      data);
export const updateCollection   = (id, data)   => request('PUT',    `/collections/${id}`, data);
export const deleteCollection   = (id)         => request('DELETE', `/collections/${id}`);

// ── AI Chatbot ───────────────────────────────────────────────
export const sendQuery = (question, student = 'Student') =>
  request('POST', '/query', { question, student });
