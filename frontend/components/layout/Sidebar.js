'use client';
// components/layout/Sidebar.js
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: '⬡', label: 'Dashboard'   },
  { href: '/sessions',   icon: '▸', label: 'Sessions'    },
  { href: '/analytics',  icon: '⟁', label: 'Analytics'   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">APTS</div>
        <div className="logo-sub">Athlete Performance</div>
      </div>

      <div className="nav-section-label">Navigation</div>
      <nav>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname.startsWith(item.href) ? ' active' : ''}`}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
        <div className="nav-section-label">Account</div>
        <Link
          href="/profile"
          className={`nav-link${pathname === '/profile' ? ' active' : ''}`}
        >
          <span style={{ fontSize: '1rem' }}>◎</span>
          Profile
        </Link>
      </div>

      <div className="sidebar-bottom">
        {user && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem',
                flexShrink: 0, padding: '0.25rem',
                transition: 'color 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ⏻
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
