import { useState, useEffect } from 'react';
import { fetchPlatforms, fetchCuratedMaterials } from '../api';

export default function Platforms() {
  const [platforms, setPlatforms] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setPlatforms(fetchPlatforms());
    setMaterials(fetchCuratedMaterials());
  }, []);

  const categories = ['All', ...Array.from(new Set(platforms.map(p => p.category)))];
  const visiblePlatforms = filter === 'All' ? platforms : platforms.filter(p => p.category === filter);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>🌐 Useful Learning Platforms & Resources</h1>
          <p>Curated engineering tools, coding practice websites, and official PDF study guides</p>
        </div>
      </div>

      {/* ── Section 1: Curated PDF Study Materials ── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📑</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Official Notes & PDF Study Guides</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Curated by course instructors and administrators
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {materials.map(item => (
            <div key={item.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(30, 41, 59, 0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  📄 {item.pages || 'PDF'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#f8fafc' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                {item.description}
              </p>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {item.fileType || 'Study Guide'}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  📥 Open / Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: External Learning Platforms ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🚀</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Top Student Platforms</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Industry platforms for DSA problem solving, version control, and documentation
            </p>
          </div>
        </div>

        {/* Filter Pills */}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {visiblePlatforms.map(p => (
            <div key={p.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'transform 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  {p.icon || '🌐'}
                </span>
                <span className="badge">{p.category}</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#f8fafc' }}>{p.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                {p.description}
              </p>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--card-border)', marginTop: '0.5rem' }}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                >
                  Launch Platform ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
