import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCourses } from '../api';

const CATEGORY_COLORS = {
  'Frontend Development': '#3b82f6',
  'Backend Development':  '#8b5cf6',
  'Databases':            '#10b981',
  'Data Science & AI':    '#f59e0b',
  'Mobile Development':   '#ec4899',
  'DevOps & Cloud':       '#06b6d4',
  'Cybersecurity':        '#ef4444',
};

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#94a3b8';
}

/* ── CourseDetailModal ───────────────────────────────────────── */
function CourseDetailModal({ course, onClose }) {
  const navigate = useNavigate();
  if (!course) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <span
              className="badge"
              style={{
                background: `${categoryColor(course.category)}22`,
                color: categoryColor(course.category),
                borderColor: `${categoryColor(course.category)}44`,
                marginBottom: '0.4rem',
                display: 'inline-block'
              }}
            >
              {course.category}
            </span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#f8fafc' }}>{course.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Course Overview
            </h4>
            <p style={{ lineHeight: 1.6, color: '#e2e8f0', fontSize: '0.95rem' }}>
              {course.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>⏱️ Duration</span>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>6 - 8 Weeks Self-Paced</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>🎯 Skill Level</span>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Beginner to Intermediate</strong>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Curriculum Highlights
            </h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
              <li>Core architectural principles and best practices</li>
              <li>Hands-on code implementations and design patterns</li>
              <li>Real-world industry project and deployment guide</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { onClose(); navigate('/chatbot'); }}
          >
            🤖 Ask AI About This
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { onClose(); navigate('/notes'); }}
            >
              ✍️ Take Study Note
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

/* ── Courses Page ───────────────────────────────────────────── */
export default function Courses() {
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState('All');
  const [selected,    setSelected]    = useState(null); // null | course

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category))).sort()];
  const visible    = filter === 'All' ? courses : courses.filter(c => c.category === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📚 Courses Directory</h1>
          <p>Explore comprehensive technical courses and syllabus modules</p>
        </div>
      </div>

      {/* Category filter */}
      {!loading && !error && courses.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="btn btn-sm"
              style={filter === cat
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.07)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading courses…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="error-icon">⚠️</span>
          <span className="error-msg">{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && courses.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No courses yet</h3>
          <p>Courses will appear here once added.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && visible.length > 0 && (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            Showing {visible.length} of {courses.length} courses
          </p>
          <div className="courses-grid">
            {visible.map(course => (
              <div
                key={course.id}
                className="card course-card"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => setSelected(course)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    className="badge"
                    style={{
                      background: `${categoryColor(course.category)}22`,
                      color: categoryColor(course.category),
                      borderColor: `${categoryColor(course.category)}44`,
                    }}
                  >
                    {course.category}
                  </span>
                </div>
                <h3 style={{ marginTop: '0.5rem', marginBottom: '0.35rem' }}>{course.name}</h3>
                <p style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {course.description}
                </p>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--card-border)' }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                    onClick={() => setSelected(course)}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Course Detail Modal */}
      {selected && (
        <CourseDetailModal
          course={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
