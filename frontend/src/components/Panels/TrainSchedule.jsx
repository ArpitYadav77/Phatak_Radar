import { useState, useMemo } from 'react';

export default function TrainSchedule({ trains, onTrainSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trains based on search query
  const filteredTrains = useMemo(() => {
    if (!searchQuery.trim()) {
      return trains;
    }

    const query = searchQuery.toLowerCase();
    return trains.filter(train => 
      train.trainNumber.toLowerCase().includes(query) ||
      train.trainName.toLowerCase().includes(query)
    );
  }, [trains, searchQuery]);

  const getStatusColor = (delayMinutes) => {
    if (delayMinutes === 0) return '#34d399'; // Green - On time
    if (delayMinutes <= 10) return '#fb923c'; // Orange - Minor delay
    return '#f87171'; // Red - Major delay
  };

  const getStatusText = (delayMinutes) => {
    if (delayMinutes === 0) return 'ON TIME';
    if (delayMinutes <= 10) return 'MINOR DELAY';
    return 'DELAYED';
  };

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #334155'
      }}>
        <div>
          <h2 style={{ 
            color: '#f1f5f9', 
            fontSize: '1.25rem',
            fontWeight: '700',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            🚂 Train Schedule
          </h2>
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '0.875rem',
            margin: 0
          }}>
            {filteredTrains.length} of {trains.length} trains
          </p>
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search by train number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 2.5rem 0.625rem 1rem',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#334155'}
          />
          <span style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            fontSize: '1rem'
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* Train List - Scrollable */}
      <div style={{
        maxHeight: '280px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        paddingRight: '0.5rem'
      }}>
        {filteredTrains.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <div style={{ fontSize: '0.875rem' }}>
              {searchQuery ? 'No trains found matching your search' : 'No trains available'}
            </div>
          </div>
        ) : (
          filteredTrains.map((train) => (
            <div
              key={train._id}
              onClick={() => onTrainSelect && onTrainSelect(train)}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Train Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>🚂</span>
                  <div>
                    <div style={{
                      color: '#f1f5f9',
                      fontWeight: '600',
                      fontSize: '0.9375rem',
                      marginBottom: '0.125rem'
                    }}>
                      {train.trainName}
                    </div>
                    <div style={{
                      color: '#94a3b8',
                      fontSize: '0.8125rem'
                    }}>
                      Train #{train.trainNumber}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span>⚡</span>
                    <span>{train.speed} km/h</span>
                  </div>
                  {train.affectedPhataks && train.affectedPhataks.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span>📍</span>
                      <span>{train.affectedPhataks.length} phatak(s) nearby</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}>
                <div style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: getStatusColor(train.delayMinutes),
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: '0.025em',
                  whiteSpace: 'nowrap'
                }}>
                  {getStatusText(train.delayMinutes)}
                </div>
                
                {train.delayMinutes > 0 && (
                  <div style={{
                    color: '#f87171',
                    fontSize: '0.8125rem',
                    fontWeight: '600'
                  }}>
                    +{train.delayMinutes} min
                  </div>
                )}

                {train.delayMinutes === 0 && (
                  <div style={{
                    color: '#34d399',
                    fontSize: '0.75rem'
                  }}>
                    No delays
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      {trains.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #334155',
          fontSize: '0.8125rem'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#34d399', fontWeight: '700', fontSize: '1.125rem' }}>
              {trains.filter(t => t.delayMinutes === 0).length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              On Time
            </div>
          </div>
          <div style={{ 
            width: '1px', 
            backgroundColor: '#334155' 
          }}></div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#fb923c', fontWeight: '700', fontSize: '1.125rem' }}>
              {trains.filter(t => t.delayMinutes > 0 && t.delayMinutes <= 10).length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              Minor Delay
            </div>
          </div>
          <div style={{ 
            width: '1px', 
            backgroundColor: '#334155' 
          }}></div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#f87171', fontWeight: '700', fontSize: '1.125rem' }}>
              {trains.filter(t => t.delayMinutes > 10).length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              Delayed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
