import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../UI/Logo';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  const navItems = [
    {
      path: '/',
      icon: '📊',
      label: 'Dashboard',
      description: 'System Overview'
    },
    {
      path: '/trains',
      icon: '🚂',
      label: 'Trains',
      description: 'Schedule & Status'
    },
    {
      path: '/analytics',
      icon: '📈',
      label: 'Analytics',
      description: 'Reports & Insights'
    }
  ];

  return (
    <aside 
      style={{
        width: isExpanded ? '280px' : '80px',
        backgroundColor: theme.container,
        borderRight: `1px solid ${theme.subtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Brand */}
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: `1px solid ${theme.subtle}`,
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.brand.indigo + '10'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          overflow: 'hidden'
        }}>
          {!isExpanded ? (
            <Logo size={48} showText={false} />
          ) : (
            <div style={{
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              whiteSpace: 'nowrap',
              width: '100%'
            }}>
              <Logo size={48} showText={true} />
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.6875rem',
                color: '#14b8a6',
                fontWeight: '600',
                letterSpacing: '0.025em'
              }}>
                Railway Crossing Monitor
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '1.5rem 1rem',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive ? '#14b8a620' : 'transparent',
                borderLeft: isActive ? '3px solid #14b8a6' : '3px solid transparent',
                border: isActive ? '1px solid #14b8a630' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              })}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderLeftColor = '#14b8a650';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    opacity: isActive ? 1 : 0.7,
                    minWidth: '32px',
                    textAlign: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ 
                    flex: 1,
                    opacity: isExpanded ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}>
                    <div style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: isActive ? '#ffffff' : '#e2e8f0',
                      marginBottom: '0.125rem'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isActive ? '#bfdbfe' : '#64748b'
                    }}>
                      {item.description}
                    </div>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Status Indicator */}
      <div style={{
        padding: '1.5rem',
        borderTop: `1px solid ${theme.subtle}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#34d399',
            borderRadius: '50%',
            boxShadow: '0 0 0 3px rgba(52, 211, 153, 0.2)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            minWidth: '8px'
          }}></div>
          <div style={{
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#f1f5f9'
            }}>
              System Online
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '0.125rem'
            }}>
              Updated just now
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </aside>
  );
}
