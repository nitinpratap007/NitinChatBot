import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCourses, fetchNotes, fetchCollections } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ courses: 0, notes: 0, collections: 0 });
  const [recentNotes, setRecentNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchCourses(), fetchNotes(), fetchCollections()])
      .then(([c, n, col]) => {
        setStats({
          courses: c.courses?.length || 0,
          notes: n.notes?.length || 0,
          collections: col.collections?.length || 0,
        });
        setRecentNotes((n.notes || []).slice(0, 3));
        setCourses((c.courses || []).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAiSubmit(e) {
    e.preventDefault();
    if (aiQuestion.trim()) {
      navigate('/chatbot');
    }
  }

  const STAT_CARDS = [
    { icon: '📚', label: 'Enrolled Courses', value: stats.courses, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
    { icon: '📝', label: 'Study Notes', value: stats.notes, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
    { icon: '🗂️', label: 'Collections', value: stats.collections, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
    { icon: '⚡', label: 'AI Status', value: 'Active', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  ];

  const QUICK = [
    { to: '/notes', icon: '✍️', label: 'Create New Note', desc: 'Capture study concepts' },
    { to: '/courses', icon: '🔍', label: 'Explore Courses', desc: 'Browse 20+ curriculum topics' },
    { to: '/collections', icon: '📁', label: 'Manage Topics', desc: 'Organize study material' },
    { to: '/chatbot', icon: '🤖', label: 'AI Study Assistant', desc: 'Instant answers & recommendations' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero Banner ── */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 20, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>✨ NitinChatBot WA-C1</span>
            <span>•</span>
            <span>AI Student Learning Assistant</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.6rem', background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Elevate Your Learning Journey 🚀
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 650, lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Browse curated engineering courses, capture rich study notes with full CRUD capabilities, organise topics into collections, and ask our Gemini AI assistant anything.
          </p>

          {/* Quick AI Search bar */}
          <form onSubmit={handleAiSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: 600 }}>
            <input
              type="text"
              value={aiQuestion}
              onChange={e => setAiQuestion(e.target.value)}
              placeholder="Ask AI anything (e.g., 'Explain React state' or 'Best course for Python')..."
              style={{
                flex: 1,
                padding: '0.85rem 1.25rem',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem', fontWeight: 600 }}>
              Ask Bot ✨
            </button>
          </form>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {STAT_CARDS.map(s => (
          <div
            key={s.label}
            className="card stat-card"
            style={{
              padding: '1.5rem',
              background: s.bg,
              border: `1px solid ${s.border}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            </div>
            {loading ? (
              <div className="spinner spinner-sm" style={{ marginTop: '0.5rem' }} />
            ) : (
              <div className="stat-value" style={{ color: s.color, marginTop: '0.4rem', fontSize: '2.2rem' }}>
                {s.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick Actions Grid ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚡</span> Quick Navigation
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {QUICK.map(q => (
            <Link
              key={q.to}
              to={q.to}
              className="card"
              style={{
                padding: '1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid var(--card-border)',
              }}
            >
              <div style={{ fontSize: '1.8rem', padding: '0.75rem', borderRadius: 10, background: 'rgba(255, 255, 255, 0.05)' }}>
                {q.icon}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#f8fafc', marginBottom: 2 }}>
                  {q.label}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {q.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Dual Columns: Recent Notes & Featured Courses ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Notes */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📝</span> Recent Notes
            </h3>
            <Link to="/notes" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentNotes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No notes captured yet. Click '+ New Note' to start!</p>
            ) : (
              recentNotes.map(n => (
                <Link
                  key={n.id}
                  to="/notes"
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem', color: '#f8fafc', display: 'block' }}>{n.title}</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.content}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Featured Courses */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📚</span> Popular Courses
            </h3>
            <Link to="/courses" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              Browse catalog →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {courses.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{c.name}</strong>
                  <span className="badge" style={{ fontSize: '0.68rem' }}>{c.category}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
