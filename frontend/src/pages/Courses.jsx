import { useEffect, useState } from 'react';
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

export default function Courses() {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('All');

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
          <h1>📚 Courses</h1>
          <p>Browse all available learning courses</p>
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
          <p>Courses will appear here once an admin adds them.</p>
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
              <div key={course.id} className="card course-card">
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
                <h3>{course.name}</h3>
                <p>{course.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Filtered empty */}
      {!loading && !error && courses.length > 0 && visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No courses in this category</h3>
          <button className="btn btn-secondary" onClick={() => setFilter('All')}>Show All</button>
        </div>
      )}
    </>
  );
}
