import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../UI/Logo';
import Icon from '../UI/Icon';
import { P } from '../../styles/palette';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  const navItems = [
    {
      path: '/',
      icon: 'dashboard',
      label: 'Dashboard',
      description: 'System Overview'
    },
    {
      path: '/trains',
      icon: 'train',
      label: 'Trains',
      description: 'Schedule & Status'
    },
    {
      path: '/analytics',
      icon: 'chart',
      label: 'Analytics',
      description: 'Reports & Insights'
    }
  ];

  return (
    <aside 
      style={{
        width: isExpanded ? '280px' : '80px',
        backgroundColor: P.sidebar,
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
        padding: '1.25rem 1rem',
        borderBottom: `1px solid ${theme.subtle}`,
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: P.sidebar
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
                color: P.muted,
                fontWeight: '500',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
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
                padding: '0.75rem 0.875rem',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background-color 0.2s, border-color 0.2s',
                backgroundColor: isActive ? P.goldBg : 'transparent',
                border: `1px solid ${isActive ? P.goldBorder : 'transparent'}`,
                boxShadow: isActive ? `inset 2px 0 0 ${P.gold}` : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              })}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = P.cardHover;
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    minWidth: '32px',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <Icon name={item.icon} size={20} color={isActive ? P.gold : P.text2} />
                  </div>
                  <div style={{ 
                    flex: 1,
                    opacity: isExpanded ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: isActive ? P.text : P.text2,
                      marginBottom: '0.125rem'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: P.muted
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
          backgroundColor: P.bg,
          borderRadius: '6px',
          border: `1px solid ${P.border}`
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: P.success,
            borderRadius: '50%',
            boxShadow: `0 0 0 3px ${P.successBg}`,
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
              fontWeight: '500',
              color: P.text
            }}>
              System Online
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: P.muted,
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
