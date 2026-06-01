import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const studentNavLinks = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'forum', label: 'My Debates', path: '/debates' },
  { icon: 'person', label: 'Profile', path: '/profile' },
];

const instructorNavLinks = [
  { icon: 'dashboard', label: 'Dashboard', path: '/instructor/dashboard' },
  { icon: 'tune', label: 'Manage Debates', path: '/instructor/dashboard#manage' },
  { icon: 'add_circle', label: 'Create Debate', path: '/instructor/create-debate' },
  { icon: 'person', label: 'Profile', path: '/profile' },
];

const adminNavLinks = [
  { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: 'group', label: 'User Management', path: '/admin/dashboard#users' },
  { icon: 'forum', label: 'All Debates', path: '/admin/dashboard#debates' },
  { icon: 'analytics', label: 'Analytics', path: '/admin/dashboard#analytics' },
  { icon: 'settings', label: 'Settings', path: '/admin/dashboard#settings' },
];

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNavLinks = () => {
    if (!user) return studentNavLinks;
    if (user.role === 'admin') return adminNavLinks;
    if (user.role === 'instructor') return instructorNavLinks;
    return studentNavLinks;
  };

  const navLinks = getNavLinks();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarVariants = {
    hidden: { x: -256, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <>
      <div className="sidebar-overlay" onClick={() => document.body.classList.remove('sidebar-open')} />
      <button
        className="mobile-menu-toggle"
        onClick={() => document.body.classList.add('sidebar-open')}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <motion.nav
        className="rhetoric-sidebar"
        variants={isMobile ? {} : sidebarVariants}
        initial={isMobile ? false : "hidden"}
        animate={isMobile ? false : "visible"}
      >
        {/* Brand */}
        <div style={{ padding: '0 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 
            className="branding-logo"
            style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 900,
              letterSpacing: '-0.02em', color: 'var(--primary)', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
            }} 
            onClick={() => {
              document.body.classList.remove('sidebar-open');
              navigate('/');
            }}
          >
            RHETORIC
          </h1>
          <button
            className="mobile-sidebar-close"
            onClick={() => document.body.classList.remove('sidebar-open')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 24px', marginBottom: 24
          }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontWeight: 700, fontSize: 16,
            fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: 14, truncate: true,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
              {user?.role === 'admin' ? 'Admin Console' :
               user?.role === 'instructor' ? 'Instructor' : 'Debater'}
            </div>
          </div>
        </motion.div>

        {/* Nav Links */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navLinks.map((link, i) => {
            const isActive = (() => {
              if (link.label === 'Manage Debates' && location.pathname.startsWith('/instructor/debate/') && location.pathname.endsWith('/manage')) {
                return true;
              }
              if (link.path.includes('#')) {
                const [linkPath, linkHash] = link.path.split('#');
                return location.pathname === linkPath && location.hash === '#' + linkHash;
              }
              return location.pathname === link.path && !location.hash;
            })();

            return (
              <motion.button
                key={link.path + link.label}
                className={`nav-link ${isActive ? 'active' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                onClick={() => {
                  document.body.classList.remove('sidebar-open');
                  navigate(link.path);
                }}
                whileHover={!isActive ? { x: 4 } : {}}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: 22,
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                }}>{link.icon}</span>
                {link.label}
              </motion.button>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 16px 0' }}>
          <motion.button
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              document.body.classList.remove('sidebar-open');
              handleLogout();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign Out
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
}
