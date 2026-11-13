import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCollections, createCollection, updateCollection, deleteCollection, fetchNotes
} from '../api';

/* ── CollectionNotesModal ───────────────────────────────────── */
function CollectionNotesModal({ collection, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes(collection.id)
      .then(d => setNotes(d.notes || []))
      .finally(() => setLoading(false));
  }, [collection.id]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <span className="badge" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>Collection</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#f8fafc' }}>{collection.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            {collection.description || 'No description provided.'}
          </p>

          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Notes in this Collection ({notes.length})
          </h4>

          {loading ? (
            <div className="loading-wrap" style={{ padding: '2rem' }}>
              <div className="spinner spinner-sm" />
              <span>Loading notes…</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">📝</div>
              <h4>No notes in this collection yet</h4>
              <p>Create a note and assign it to "{collection.name}".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notes.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 8,
                  }}
                >
                  <strong style={{ fontSize: '0.92rem', color: '#f8fafc', display: 'block' }}>{n.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { onClose(); navigate('/notes'); }}
          >
            ✍️ Add Note to Collection
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── CollectionModal (Create / Edit) ────────────────────────── */
function CollectionModal({ mode, initial, onSave, onClose }) {
  const [name,        setName]        = useState(initial?.name        || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState('');

  function validate() {
    const e = {};
    if (!name.trim())                  e.name        = 'Name is required';
    else if (name.trim().length > 100) e.name        = 'Max 100 characters';
    if (description.trim().length > 500) e.description = 'Max 500 characters';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError('');
    try {
      const payload = { name: name.trim(), description: description.trim() };
      const result = mode === 'create'
        ? await createCollection(payload)
        : await updateCollection(initial.id, payload);
      onSave(result.collection);
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
          <h2>{mode === 'create' ? '🗂️ New Collection' : '✏️ Edit Collection'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
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
              <label>Name *</label>
              <input
                className={`form-control${errors.name ? ' error' : ''}`}
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                placeholder="e.g. React Fundamentals"
                maxLength={100}
              />
              {errors.name && <div className="field-error">{errors.name}</div>}
              <div className="char-count">{name.length}/100</div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Description (optional)</label>
              <textarea
                className={`form-control${errors.description ? ' error' : ''}`}
                value={description}
                onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })); }}
                placeholder="What does this collection cover?"
                rows={3}
                maxLength={500}
              />
              {errors.description && <div className="field-error">{errors.description}</div>}
              <div className="char-count">{description.length}/500</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner spinner-sm" style={{ marginRight: 6 }} />Saving…</>
                : mode === 'create' ? 'Create Collection' : 'Save Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Collections Page ───────────────────────────────────────── */
export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [modal,       setModal]       = useState(null);
  const [viewCol,     setViewCol]     = useState(null); // null | collection
  const [deletingId,  setDeletingId]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCollections()
      .then(d => setCollections(d.collections || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function handleSaved(col) {
    setCollections(prev => {
      const idx = prev.findIndex(c => c.id === col.id);
      return idx >= 0
        ? prev.map(c => c.id === col.id ? col : c)
        : [col, ...prev];
    });
    setModal(null);
  }

  async function handleDelete(id, name, e) {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete collection "${name}"? Notes inside will become uncategorised.`)) return;
    setDeletingId(id);
    try {
      await deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
      if (viewCol && viewCol.id === id) setViewCol(null);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>🗂️ Study Collections</h1>
          <p>Group your notes by topic for organised and structured learning</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + New Collection
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading collections…</span>
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
      {!loading && !error && collections.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <h3>No collections yet</h3>
          <p>Create a collection to organise your notes by topic or subject.</p>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
            Create First Collection
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && collections.length > 0 && (
        <div className="collections-grid">
          {collections.map(col => (
            <div
              key={col.id}
              className="card collection-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setViewCol(col)}
            >
              <div>
                <h3 style={{ marginBottom: '0.4rem' }}>{col.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {col.description || <em style={{ opacity: 0.5 }}>No description</em>}
                </p>
              </div>
              <div className="note-count-badge">
                📝 <span>{col.note_count ?? 0} note{col.note_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="collection-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setViewCol(col)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  👁️ View Notes
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setModal({ mode: 'edit', collection: col })}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-danger btn-icon"
                  onClick={e => handleDelete(col.id, col.name, e)}
                  disabled={deletingId === col.id}
                  title="Delete"
                >
                  {deletingId === col.id ? <span className="spinner spinner-sm" /> : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Notes Modal */}
      {viewCol && (
        <CollectionNotesModal
          collection={viewCol}
          onClose={() => setViewCol(null)}
        />
      )}

      {/* Edit / Create Modal */}
      {modal && (
        <CollectionModal
          mode={modal.mode}
          initial={modal.collection}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
