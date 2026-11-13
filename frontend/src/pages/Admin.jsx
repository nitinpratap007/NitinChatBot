import { useState, useEffect } from 'react';
import {
  isAdminLoggedIn,
  adminLogin,
  adminLogout,
  updateAdminPassword,
  getAdminApiKey,
  saveAdminApiKey,
  removeAdminApiKey,
  fetchPlatforms,
  addPlatform,
  deletePlatform,
  fetchCuratedMaterials,
  addCuratedMaterial,
  deleteCuratedMaterial,
  fetchCourses
} from '../api';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('api-key'); // 'api-key' | 'pdfs' | 'platforms' | 'courses' | 'security'

  // Admin states
  const [apiKey, setApiKey] = useState('');
  const [keySavedMsg, setKeySavedMsg] = useState('');

  // Platforms state
  const [platforms, setPlatforms] = useState([]);
  const [newPlatform, setNewPlatform] = useState({ name: '', url: '', category: 'Coding & Practice', description: '', icon: '💻' });

  // Curated PDFs state
  const [pdfs, setPdfs] = useState([]);
  const [newPdf, setNewPdf] = useState({ title: '', category: 'Frontend', description: '', url: '', pages: '20 Pages', fileType: 'PDF Document' });

  // Courses state
  const [courses, setCourses] = useState([]);

  // Password change state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState({ error: '', success: '' });

  useEffect(() => {
    if (loggedIn) {
      setApiKey(getAdminApiKey());
      setPlatforms(fetchPlatforms());
      setPdfs(fetchCuratedMaterials());
      fetchCourses().then(d => setCourses(d.courses || []));
    }
  }, [loggedIn]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      await adminLogin(passwordInput);
      setLoggedIn(true);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function handleLogout() {
    adminLogout();
    setLoggedIn(false);
  }

  function handleSaveKey(e) {
    e.preventDefault();
    saveAdminApiKey(apiKey);
    setKeySavedMsg('✅ Gemini API Key saved securely! Only administrators can view this.');
    setTimeout(() => setKeySavedMsg(''), 4000);
  }

  function handleRemoveKey() {
    if (window.confirm('Remove system Gemini API key?')) {
      removeAdminApiKey();
      setApiKey('');
      setKeySavedMsg('Key removed.');
      setTimeout(() => setKeySavedMsg(''), 3000);
    }
  }

  function handleAddPlatform(e) {
    e.preventDefault();
    if (!newPlatform.name || !newPlatform.url) return;
    addPlatform(newPlatform);
    setPlatforms(fetchPlatforms());
    setNewPlatform({ name: '', url: '', category: 'Coding & Practice', description: '', icon: '💻' });
    alert('Platform added successfully!');
  }

  function handleDeletePlatform(id) {
    if (window.confirm('Delete this platform link?')) {
      deletePlatform(id);
      setPlatforms(fetchPlatforms());
    }
  }

  function handleAddPdf(e) {
    e.preventDefault();
    if (!newPdf.title || !newPdf.url) return;
    addCuratedMaterial(newPdf);
    setPdfs(fetchCuratedMaterials());
    setNewPdf({ title: '', category: 'Frontend', description: '', url: '', pages: '20 Pages', fileType: 'PDF Document' });
    alert('Study Material/PDF added successfully!');
  }

  function handleDeletePdf(id) {
    if (window.confirm('Delete this study material?')) {
      deleteCuratedMaterial(id);
      setPdfs(fetchCuratedMaterials());
    }
  }

  function handlePasswordChange(e) {
    e.preventDefault();
    setPassMsg({ error: '', success: '' });
    try {
      updateAdminPassword(oldPass, newPass);
      setPassMsg({ error: '', success: '✅ Admin Password updated successfully!' });
      setOldPass('');
      setNewPass('');
    } catch (err) {
      setPassMsg({ error: err.message, success: '' });
    }
  }

  // ── Render: Locked Admin Login ──
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 440, margin: '4rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>Admin Authentication</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
            Protected area. Please enter your administrator credentials to manage API keys, courses, and resources.
          </p>

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            {loginError && (
              <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
                <span className="error-icon">⚠️</span>
                <span className="error-msg">{loginError}</span>
              </div>
            )}

            <div className="form-group">
              <label>Administrator Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password (default: admin123)"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 600 }}>
              Verify & Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Authenticated Admin Dashboard ──
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '0.5rem', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>🔒 Session Active</span>
            <span>•</span>
            <span>Administrator Access</span>
          </div>
          <h1>Admin Control Center</h1>
          <p>Manage system configuration, AI keys, study materials, and student platforms</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'api-key', icon: '🔑', label: 'Gemini AI Key' },
          { id: 'pdfs', icon: '📑', label: 'Notes & PDFs' },
          { id: 'platforms', icon: '🌐', label: 'Useful Platforms' },
          { id: 'courses', icon: '📚', label: 'Course Catalog' },
          { id: 'security', icon: '🛡️', label: 'Security & Password' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn btn-sm"
            style={tab === t.id
              ? { background: 'var(--primary)', color: '#fff' }
              : { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }
            }
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Gemini AI Key Configuration ── */}
      {tab === 'api-key' && (
        <div className="card" style={{ padding: '2rem', maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🔑</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System Gemini API Key</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                This key is private and visible ONLY to authenticated administrators. Students cannot see it.
              </p>
            </div>
          </div>

          {keySavedMsg && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, color: '#6ee7b7', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {keySavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveKey}>
            <div className="form-group">
              <label>Gemini API Key (Google AI Studio)</label>
              <input
                type="password"
                className="form-control"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.35rem' }}>
                Used automatically by the Chatbot for all students.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                💾 Save API Key
              </button>
              {apiKey && (
                <button type="button" className="btn btn-secondary" onClick={handleRemoveKey}>
                  Remove Key
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Notes & PDFs Manager ── */}
      {tab === 'pdfs' && (
        <div>
          {/* Add PDF Form */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>➕</span> Add Curated Study Material / PDF Link
            </h3>
            <form onSubmit={handleAddPdf}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Document Title *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. React 18 Architecture Cheatsheet"
                    value={newPdf.title}
                    onChange={e => setNewPdf({ ...newPdf, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PDF / Resource URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/notes.pdf"
                    value={newPdf.url}
                    onChange={e => setNewPdf({ ...newPdf, url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Frontend, Databases, DSA"
                    value={newPdf.category}
                    onChange={e => setNewPdf({ ...newPdf, category: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Summary of what this study guide contains…"
                  value={newPdf.description}
                  onChange={e => setNewPdf({ ...newPdf, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                Publish Study Material for Students
              </button>
            </form>
          </div>

          {/* Current Materials List */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Published Study Materials ({pdfs.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pdfs.map(item => (
              <div key={item.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{item.title}</strong>
                    <span className="badge" style={{ fontSize: '0.68rem' }}>{item.category}</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                    View URL
                  </a>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeletePdf(item.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Platforms Manager ── */}
      {tab === 'platforms' && (
        <div>
          {/* Add Platform Form */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>➕</span> Add External Learning Platform Link
            </h3>
            <form onSubmit={handleAddPlatform}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Platform Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. LeetCode, Codecademy"
                    value={newPlatform.name}
                    onChange={e => setNewPlatform({ ...newPlatform, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Website URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    value={newPlatform.url}
                    onChange={e => setNewPlatform({ ...newPlatform, url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Coding & DSA"
                    value={newPlatform.category}
                    onChange={e => setNewPlatform({ ...newPlatform, category: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Icon Emoji</label>
                  <input
                    className="form-control"
                    placeholder="💻, 🐙, 📖"
                    value={newPlatform.icon}
                    onChange={e => setNewPlatform({ ...newPlatform, icon: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                <input
                  className="form-control"
                  placeholder="How students can use this platform…"
                  value={newPlatform.description}
                  onChange={e => setNewPlatform({ ...newPlatform, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                Add Platform Link for Students
              </button>
            </form>
          </div>

          {/* Platforms List */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Platforms ({platforms.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {platforms.map(p => (
              <div key={p.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{p.icon || '🌐'}</span>
                    <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                  </div>
                  <span className="badge" style={{ fontSize: '0.68rem' }}>{p.category}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--card-border)' }}>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>
                    Visit Website ↗
                  </a>
                  <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeletePlatform(p.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Courses Overview ── */}
      {tab === 'courses' && (
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Current Course Directory ({courses.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {courses.map(c => (
              <div key={c.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#f8fafc' }}>{c.name}</strong>
                    <span className="badge">{c.category}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: Security & Password ── */}
      {tab === 'security' && (
        <div className="card" style={{ padding: '2rem', maxWidth: 540 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🛡️ Administrator Security</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Change your admin password to keep your dashboard and API keys secure.
          </p>

          {passMsg.error && (
            <div className="error-banner" style={{ marginBottom: '1rem' }}>
              <span className="error-icon">⚠️</span>
              <span className="error-msg">{passMsg.error}</span>
            </div>
          )}
          {passMsg.success && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, color: '#6ee7b7', fontSize: '0.88rem', marginBottom: '1rem' }}>
              {passMsg.success}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Admin Password</label>
              <input
                type="password"
                className="form-control"
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Admin Password (min 4 characters)</label>
              <input
                type="password"
                className="form-control"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Update Admin Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
