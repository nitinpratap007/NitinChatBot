import { useEffect, useState, useCallback } from 'react';
import {
  fetchCollections, createCollection, updateCollection, deleteCollection,
} from '../api';

/* ── CollectionModal ────────────────────────────────────────── */
function CollectionModal({ mode, initial, onSave, onClose }) {
  const [name,        setName]        = useState(initial?.name        || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState('');

  function validate() {
    const e = {};
    if (!name.trim())              e.name = 'Name is required';
    else if (name.trim().length > 100) e.name = 'Max 100 characters';
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

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete collection "${name}"? Notes inside will become uncategorised.`)) return;
    setDeletingId(id);
    try {
      await deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>🗂️ Study Collections</h1>
          <p>Group your notes by topic for organised learning</p>
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
            <div key={col.id} className="card collection-card">
              <div>
                <h3>{col.name}</h3>
                <p>{col.description || <em style={{ opacity: 0.5 }}>No description</em>}</p>
              </div>
              <div className="note-count-badge">
                📝 <span>{col.note_count ?? 0} note{col.note_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="collection-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setModal({ mode: 'edit', collection: col })}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(col.id, col.name)}
                  disabled={deletingId === col.id}
                >
                  {deletingId === col.id
                    ? <span className="spinner spinner-sm" />
                    : '🗑️ Delete'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
