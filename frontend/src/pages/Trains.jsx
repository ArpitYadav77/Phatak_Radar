import { useState, useEffect, useMemo } from 'react';
import { getAllTrains } from '../api/train.api';

export default function Trains() {
  const [trains, setTrains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, on-time, delayed
  const [sortBy, setSortBy] = useState('number'); // number, delay, speed

  useEffect(() => {
    fetchTrains();
    const interval = setInterval(fetchTrains, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrains = async () => {
    try {
      const data = await getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error('Failed to fetch trains:', error);
    }
  };

  // Filter and sort trains
  const filteredTrains = useMemo(() => {
    let result = trains;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(train =>
        train.trainNumber.toLowerCase().includes(query) ||
        train.trainName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter === 'on-time') {
      result = result.filter(train => train.delayMinutes === 0);
    } else if (statusFilter === 'delayed') {
      result = result.filter(train => train.delayMinutes > 0);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'number') {
        return a.trainNumber.localeCompare(b.trainNumber);
      } else if (sortBy === 'delay') {
        return b.delayMinutes - a.delayMinutes;
      } else if (sortBy === 'speed') {
        return b.speed - a.speed;
      }
      return 0;
    });

    return result;
  }, [trains, searchQuery, statusFilter, sortBy]);

  const getStatusColor = (delayMinutes) => {
    if (delayMinutes === 0) return '#10b981';
    if (delayMinutes <= 10) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusText = (delayMinutes) => {
    if (delayMinutes === 0) return 'On schedule';
    if (delayMinutes <= 10) return 'Minor delay';
    return 'Delayed';
  };

  const stats = {
    total: trains.length,
    onTime: trains.filter(t => t.delayMinutes === 0).length,
    delayed: trains.filter(t => t.delayMinutes > 0).length,
    avgSpeed: trains.length > 0 ? Math.round(trains.reduce((sum, t) => sum + t.speed, 0) / trains.length) : 0
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '2rem',
      overflow: 'auto',
      backgroundColor: '#0a0f1e'
    }}>
      {/* Page Header */}
      <div>
        <h1 style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: '700',
          color: '#f1f5f9',
          marginBottom: '0.5rem',
          letterSpacing: '-0.025em'
        }}>
          Train operations
        </h1>
        <p style={{
          margin: 0,
          fontSize: '0.9375rem',
          color: '#94a3b8'
        }}>
          Live train status and operational details
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #14b8a6'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#14b8a6', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            Trains in Transit
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6ee7b7', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
            {stats.onTime}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            On Schedule
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #ef4444'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fca5a5', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
            {stats.delayed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            Service Delays
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #8b5cf6'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#c084fc', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
            {stats.avgSpeed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            Average Speed (km/h)
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: '#1a2332',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by train number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              backgroundColor: '#0a0f1e',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#14b8a6'}
            onBlur={(e) => e.target.style.borderColor = '#334155'}
          />
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.125rem'
          }}>🔍</span>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'on-time', 'delayed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: statusFilter === filter ? '#14b8a620' : '#0a0f1e',
                border: `1px solid ${statusFilter === filter ? '#14b8a6' : '#334155'}`,
                borderRadius: '8px',
                color: statusFilter === filter ? '#14b8a6' : '#94a3b8',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== filter) {
                  e.target.style.backgroundColor = '#334155';
                  e.target.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== filter) {
                  e.target.style.backgroundColor = '#0a0f1e';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              {filter.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: '#0a0f1e',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="number">Sort by Number</option>
          <option value="delay">Sort by Delay</option>
          <option value="speed">Sort by Speed</option>
        </select>
      </div>

      {/* Trains List */}
      <div style={{
        backgroundColor: '#1a2332',
        border: '1px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr 100px 100px 130px 130px 140px',
          gap: '1rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#0a0f1e',
          borderBottom: '1px solid #334155',
          fontSize: '0.6875rem',
          fontWeight: '700',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div>Train No.</div>
          <div>Train Name</div>
          <div>Schedule</div>
          <div>Speed</div>
          <div>Delay</div>
          <div>Phataks</div>
          <div>Status</div>
        </div>

        {/* Table Body */}
        <div style={{
          maxHeight: 'calc(100vh - 480px)',
          overflowY: 'auto'
        }}>
          {filteredTrains.length === 0 ? (
            <div style={{
              padding: '4rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <div style={{ fontSize: '0.9375rem' }}>
                {searchQuery ? 'No trains found matching your search' : 'No active trains at this time'}
              </div>
            </div>
          ) : (
            filteredTrains.map((train, index) => (
              <div
                key={train._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 100px 100px 130px 130px 140px',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  borderBottom: index < filteredTrains.length - 1 ? '1px solid #334155' : 'none',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  borderLeft: train.delayMinutes > 10 ? '3px solid #ef4444' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b50';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  fontWeight: '700',
                  color: '#14b8a6',
                  fontSize: '0.9375rem',
                  fontFamily: 'monospace'
                }}>
                  #{train.trainNumber}
                </div>

                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#f1f5f9',
                    fontSize: '0.9375rem',
                    marginBottom: '0.25rem'
                  }}>
                    {train.trainName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    {train.schedule?.origin && train.schedule?.destination 
                      ? `${train.schedule.origin} → ${train.schedule.destination}`
                      : 'Route information unavailable'
                    }
                  </div>
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem'
                }}>
                  {train.schedule?.departureTime && (
                    <>
                      <div style={{ fontWeight: '600', color: '#14b8a6' }}>
                        🕐 {train.schedule.departureTime}
                      </div>
                      <div style={{ fontSize: '0.6875rem' }}>
                        {train.schedule.frequency || 'daily'}
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  color: '#94a3b8',
                  fontSize: '0.875rem'
                }}>
                  <span>⚡</span>
                  <span style={{ fontWeight: '600' }}>{train.speed}</span>
                  <span style={{ fontSize: '0.75rem' }}>km/h</span>
                </div>

                <div style={{
                  fontWeight: '700',
                  color: train.delayMinutes > 0 ? '#fca5a5' : '#6ee7b7',
                  fontSize: '0.9375rem'
                }}>
                  {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'On time'}
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8'
                }}>
                  {train.affectedPhataks?.length > 0
                    ? `${train.affectedPhataks.length} nearby`
                    : 'None nearby'
                  }
                </div>

                <div>
                  <div style={{
                    padding: '0.375rem 0.875rem',
                    backgroundColor: getStatusColor(train.delayMinutes) + '20',
                    border: `1px solid ${getStatusColor(train.delayMinutes)}40`,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: train.delayMinutes === 0 ? '#6ee7b7' : train.delayMinutes <= 10 ? '#fbbf24' : '#fca5a5',
                    letterSpacing: '0.025em',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <span style={{ fontSize: '0.625rem' }}>
                      {train.delayMinutes === 0 ? '✓' : train.delayMinutes <= 10 ? '◷' : '⚠'}
                    </span>
                    {getStatusText(train.delayMinutes)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
