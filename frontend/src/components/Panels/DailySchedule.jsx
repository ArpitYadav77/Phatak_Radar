import { useState, useEffect, useMemo } from 'react';

export default function DailySchedule({ phatak, trains }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate daily schedule for the phatak
  const dailySchedule = useMemo(() => {
    if (!phatak || !phatak.dailySchedule) return [];

    // Use actual schedule from phatak data
    return phatak.dailySchedule.map(schedule => {
      const liveTrain = trains.find(t => t.trainNumber === schedule.trainNumber);
      const [hours, minutes] = schedule.scheduledTime.split(':');
      const scheduledTime = new Date();
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const timeDiff = Math.floor((scheduledTime - currentTime) / 1000 / 60);
      let status = 'ON TIME';
      
      if (liveTrain) {
        if (liveTrain.delayMinutes > 10) {
          status = 'DELAYED';
        } else if (timeDiff <= 5 && timeDiff >= -5) {
          status = 'DUE NOW';
        }
      } else if (timeDiff <= 5 && timeDiff >= -5) {
        status = 'DUE NOW';
      }

      return {
        trainNumber: schedule.trainNumber,
        trainName: schedule.trainName,
        direction: schedule.direction === 'UP' ? '↑ UP' : '↓ DOWN',
        baseTime: schedule.scheduledTime,
        status,
        delay: liveTrain?.delayMinutes || 0,
        timeDiff,
        isPast: timeDiff < -5
      };
    }).filter(t => !t.isPast).slice(0, 6); // Show next 6 trains
  }, [phatak, trains, currentTime]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DUE NOW':
        return { bg: '#f59e0b', text: '#0f172a' };
      case 'DELAYED':
        return { bg: '#ef4444', text: '#ffffff' };
      default:
        return { bg: '#334155', text: '#94a3b8' };
    }
  };

  if (!phatak) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
        <div>Select a phatak to view daily schedule</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #334155',
        backgroundColor: '#0f172a'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: '1.5rem',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#3b82f620',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>ℹ️</div>
          <h3 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#f1f5f9',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Daily Train Schedule
          </h3>
        </div>

        {/* Phatak Info */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1.125rem' }}>📍</span>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#f1f5f9'
            }}>
              {phatak.name}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: '#64748b'
          }}>
            <span>📌</span>
            <span>{phatak.lat?.toFixed(4)}°N, {phatak.lng?.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Direction Info */}
        <div style={{
          marginTop: '1rem',
          fontSize: '0.8125rem',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          {phatak.district && `${phatak.district} • `}
          {phatak.state}
        </div>
      </div>

      {/* Schedule List */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {dailySchedule.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚂</div>
            <div>No scheduled trains for today</div>
          </div>
        ) : (
          dailySchedule.map((train, index) => {
            const statusColors = getStatusColor(train.status);
            
            return (
              <div
                key={`${train.trainNumber}-${index}`}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: index < dailySchedule.length - 1 ? '1px solid #334155' : 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Train Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.375rem'
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#3b82f6',
                        fontFamily: 'monospace'
                      }}>
                        Train #{train.trainNumber}
                      </div>
                      {train.status && (
                        <div style={{
                          padding: '0.25rem 0.625rem',
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>
                          {train.status}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      marginBottom: '0.25rem'
                    }}>
                      {train.trainName}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      justifyContent: 'flex-end',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.875rem' }}>⏰</span>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: train.status === 'DUE NOW' ? '#f59e0b' : '#f1f5f9',
                        fontFamily: 'monospace'
                      }}>
                        {train.baseTime}
                      </div>
                    </div>
                    {train.delay > 0 && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        fontWeight: '600'
                      }}>
                        +{train.delay} min delay
                      </div>
                    )}
                  </div>
                </div>

                {/* Direction */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: '#94a3b8'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>🧭</span>
                  <span style={{ fontWeight: '500' }}>Direction</span>
                  <div style={{
                    padding: '0.25rem 0.625rem',
                    backgroundColor: '#0f172a',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontFamily: 'monospace'
                  }}>
                    {train.direction}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #334155',
        backgroundColor: '#0f172a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div>
          Showing next {dailySchedule.length} trains
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#34d399',
            borderRadius: '50%',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}></div>
          <span>Live updates</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
