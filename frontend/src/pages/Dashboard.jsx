import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses, fetchNotes, fetchCollections } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ courses: '—', notes: '—', collections: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchCourses(), fetchNotes(), fetchCollections()])
      .then(([c, n, col]) => {
        setStats({
          courses:     c.status === 'fulfilled' ? c.value.courses?.length     ?? 0 : 'Err',
          notes:       n.status === 'fulfilled' ? n.value.notes?.length       ?? 0 : 'Err',
          collections: col.status === 'fulfilled' ? col.value.collections?.length ?? 0 : 'Err',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { icon: '📚', label: 'Total Courses',     value: stats.courses,     color: '#3b82f6' },
    { icon: '📝', label: 'Your Notes',         value: stats.notes,       color: '#8b5cf6' },
    { icon: '🗂️', label: 'Collections',       value: stats.collections, color: '#10b981' },
  ];

  const QUICK = [
    { to: '/chatbot',     icon: '🤖', label: 'Ask AI'          },
    { to: '/notes',       icon: '📝', label: 'Write a Note'    },
    { to: '/courses',     icon: '📚', label: 'Browse Courses'  },
    { to: '/collections', icon: '🗂️', label: 'My Collections'  },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome to Learning Hub 👋</h1>
          <p>Your personalised AI-powered study companion</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-icon">{s.icon}</div>
            {loading
              ? <div className="spinner" style={{ width: 28, height: 28 }} />
              : <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            }
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quick Actions
      </h2>
      <div className="quick-actions">
        {QUICK.map(q => (
          <Link key={q.to} to={q.to} className="quick-action-card">
            <span className="qa-icon">{q.icon}</span>
            <span>{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Info banner */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.5rem' }}>💡</span>
        <div>
          <strong>Tip:</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '0.4rem' }}>
            Organise your notes into <Link to="/collections" style={{ color: 'var(--primary)' }}>Collections</Link> by topic,
            then ask the <Link to="/chatbot" style={{ color: 'var(--primary)' }}>AI Chatbot</Link> anything — it knows all available courses.
          </span>
        </div>
      </div>
    </>
  );
}
