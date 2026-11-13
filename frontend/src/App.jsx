import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard    from './pages/Dashboard';
import Courses      from './pages/Courses';
import Notes        from './pages/Notes';
import Collections  from './pages/Collections';
import Platforms    from './pages/Platforms';
import Chatbot      from './pages/Chatbot';
import Admin        from './pages/Admin';

const NAV = [
  { to: '/',            icon: '🏠', label: 'Dashboard'        },
  { to: '/courses',     icon: '📚', label: 'Courses'          },
  { to: '/notes',       icon: '📝', label: 'My Notes'         },
  { to: '/collections', icon: '🗂️', label: 'Collections'      },
  { to: '/platforms',   icon: '🌐', label: 'Useful Platforms' },
  { to: '/chatbot',     icon: '🤖', label: 'AI Chatbot'       },
];

const ADMIN_NAV = [
  { to: '/admin',       icon: '🔐', label: 'Admin Portal'     },
];

export default function App() {
  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <a className="sidebar-logo" href="/">
          <span>NitinChatBot</span>
          <small>Learning Hub</small>
        </a>

        <nav className="sidebar-nav">
          <div className="nav-label">Student Menu</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}

          <div className="nav-label" style={{ marginTop: '1.25rem' }}>Management</div>
          {ADMIN_NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a className="back-link" href="/">
            ← Back to main site
          </a>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/courses"     element={<Courses />} />
          <Route path="/notes"       element={<Notes />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/platforms"   element={<Platforms />} />
          <Route path="/chatbot"     element={<Chatbot />} />
          <Route path="/admin"       element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
