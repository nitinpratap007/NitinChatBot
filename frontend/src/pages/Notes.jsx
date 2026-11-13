import { useEffect, useState, useCallback } from 'react';
import { marked } from 'marked';
import { fetchNotes, createNote, updateNote, deleteNote, fetchCollections } from '../api';

/* ── NoteViewModal ─────────────────────────────────────────── */
function NoteViewModal({ note, onEdit, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(note.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const htmlContent = marked.parse(note.content || '');

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              {note.study_collections?.name && (
                <span className="badge">{note.study_collections.name}</span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(note.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              {note.title}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div
            className="note-rendered-content"
            style={{ lineHeight: 1.7, fontSize: '0.95rem', color: '#e2e8f0' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
            {copied ? '✅ Copied!' : '📋 Copy Text'}
          </button>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { onClose(); onEdit(note); }}
            >
              ✏️ Edit Note
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── NoteModal (Create / Edit) ─────────────────────────────── */
function NoteModal({ mode, initial, collections, onSave, onClose }) {
  const [title,        setTitle]        = useState(initial?.title        || '');
  const [content,      setContent]      = useState(initial?.content      || '');
  const [collectionId, setCollectionId] = useState(initial?.collection_id ?? '');
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [apiError,     setApiError]     = useState('');

  function validate() {
    const e = {};
    if (!title.trim())                  e.title   = 'Title is required';
    else if (title.trim().length > 200) e.title   = 'Max 200 characters';
    if (!content.trim())                e.content = 'Content is required';
    else if (content.trim().length > 10000) e.content = 'Max 10,000 characters';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError('');
    try {
      const payload = {
        title:         title.trim(),
        content:       content.trim(),
        collection_id: collectionId ? Number(collectionId) : null,
      };
      const result = mode === 'create'
        ? await createNote(payload)
        : await updateNote(initial.id, payload);
      onSave(result.note);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{mode === 'create' ? '📝 New Note' : '✏️ Edit Note'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {apiError && (
              <div className="error-banner" style={{ marginBottom: '1rem' }}>
                <span className="error-icon">⚠️</span>
                <span className="error-msg">{apiError}</span>
              </div>
            )}

            <div className="form-group">
              <label>Title *</label>
              <input
                className={`form-control${errors.title ? ' error' : ''}`}
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
                placeholder="Note title…"
                maxLength={200}
              />
              {errors.title && <div className="field-error">{errors.title}</div>}
              <div className="char-count">{title.length}/200</div>
            </div>

            <div className="form-group">
              <label>Content * (Markdown supported)</label>
              <textarea
                className={`form-control${errors.content ? ' error' : ''}`}
                value={content}
                onChange={e => { setContent(e.target.value); setErrors(p => ({ ...p, content: '' })); }}
                placeholder="Write your note here… supports **bold**, lists, `code`"
                rows={6}
                maxLength={10000}
              />
              {errors.content && <div className="field-error">{errors.content}</div>}
              <div className="char-count">{content.length}/10,000</div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Collection (optional)</label>
              <select
                className="form-control"
                value={collectionId}
                onChange={e => setCollectionId(e.target.value)}
              >
                <option value="">— No collection —</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner spinner-sm" style={{ marginRight: 6 }} />Saving…</>
                : mode === 'create' ? 'Create Note' : 'Save Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Notes Page ─────────────────────────────────────────────── */
export default function Notes() {
  const [notes,       setNotes]       = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filterCol,   setFilterCol]   = useState('');
  const [modal,       setModal]       = useState(null); // null | { mode, note? }
  const [viewNote,    setViewNote]    = useState(null); // null | note
  const [deletingId,  setDeletingId]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchNotes(), fetchCollections()])
      .then(([nd, cd]) => {
        setNotes(nd.notes || []);
        setCollections(cd.collections || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = filterCol
    ? notes.filter(n => String(n.collection_id) === filterCol)
    : notes;

  function handleSaved(note) {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === note.id);
      return idx >= 0
        ? prev.map(n => n.id === note.id ? note : n)
        : [note, ...prev];
    });
    setModal(null);
  }

  async function handleDelete(id, e) {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (viewNote && viewNote.id === id) setViewNote(null);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function fmt(dt) {
    return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📝 My Notes</h1>
          <p>Create, view, organize, and edit your personal study notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + New Note
        </button>
      </div>

      {/* Toolbar */}
      {!loading && !error && (
        <div className="notes-toolbar">
          <select
            className="form-control"
            value={filterCol}
            onChange={e => setFilterCol(e.target.value)}
          >
            <option value="">All collections</option>
            {collections.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {filtered.length} note{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading notes…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-msg">{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && notes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No notes yet</h3>
          <p>Start capturing your learning insights!</p>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
            Create First Note
          </button>
        </div>
      )}

      {/* Filter empty */}
      {!loading && !error && notes.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No notes in this collection</h3>
          <button className="btn btn-secondary" onClick={() => setFilterCol('')}>Show All</button>
        </div>
      )}

      {/* Notes list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="notes-list">
          {filtered.map(note => (
            <div
              key={note.id}
              className="card note-card"
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
              onClick={() => setViewNote(note)}
            >
              <div className="note-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0 }}>{note.title}</h3>
                </div>
                <p className="note-preview">{note.content}</p>
                <div className="note-meta">
                  {note.study_collections?.name && (
                    <span className="badge">{note.study_collections.name}</span>
                  )}
                  <time>{fmt(note.created_at)}</time>
                  {note.updated_at !== note.created_at && (
                    <time style={{ opacity: 0.7 }}>· edited {fmt(note.updated_at)}</time>
                  )}
                </div>
              </div>
              <div className="note-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setViewNote(note)}
                  title="View Note"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  👁️ View
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setModal({ mode: 'edit', note })}
                  title="Edit Note"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-danger btn-icon"
                  onClick={e => handleDelete(note.id, e)}
                  disabled={deletingId === note.id}
                  title="Delete"
                >
                  {deletingId === note.id ? <span className="spinner spinner-sm" /> : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note View Modal */}
      {viewNote && (
        <NoteViewModal
          note={viewNote}
          onEdit={note => setModal({ mode: 'edit', note })}
          onClose={() => setViewNote(null)}
        />
      )}

      {/* Edit / Create Modal */}
      {modal && (
        <NoteModal
          mode={modal.mode}
          initial={modal.note}
          collections={collections}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
