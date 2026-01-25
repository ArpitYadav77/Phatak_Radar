import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllPhataks } from '../api/phatak.api';
import { getAllTrains } from '../api/train.api';

export default function Analytics() {
  const [phataks, setPhataks] = useState([]);
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [phatakData, trainData] = await Promise.all([
        getAllPhataks(),
        getAllTrains()
      ]);
      setPhataks(phatakData);
      setTrains(trainData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  // Delay distribution data
  const delayData = [
    { name: 'On schedule', value: trains.filter(t => t.delayMinutes === 0).length, color: '#10b981' },
    { name: 'Minor delays', value: trains.filter(t => t.delayMinutes > 0 && t.delayMinutes <= 10).length, color: '#f59e0b' },
    { name: 'Significant delays', value: trains.filter(t => t.delayMinutes > 10).length, color: '#ef4444' }
  ];

  // Speed distribution
  const speedRanges = [
    { range: '0-40', count: trains.filter(t => t.speed < 40).length },
    { range: '40-60', count: trains.filter(t => t.speed >= 40 && t.speed < 60).length },
    { range: '60-80', count: trains.filter(t => t.speed >= 60 && t.speed < 80).length },
    { range: '80+', count: trains.filter(t => t.speed >= 80).length }
  ];

  // Phatak status distribution
  const phatakStatus = [
    { status: 'Open', count: phataks.filter(p => p.status === 'OPEN').length, color: '#10b981' },
    { status: 'Closed', count: phataks.filter(p => p.status === 'CLOSED').length, color: '#ef4444' }
  ];

  // Simulated hourly traffic (mock data for demonstration)
  const hourlyData = [
    { hour: '00:00', trains: 2, closures: 1 },
    { hour: '04:00', trains: 1, closures: 0 },
    { hour: '08:00', trains: 8, closures: 3 },
    { hour: '12:00', trains: 6, closures: 2 },
    { hour: '16:00', trains: 9, closures: 4 },
    { hour: '20:00', trains: 5, closures: 2 }
  ];

  // Top affected phataks
  const topPhataks = phataks
    .filter(p => p.status === 'CLOSED')
    .slice(0, 5)
    .map(p => ({
      name: p.name?.substring(0, 20) || 'Unknown',
      closures: Math.floor(Math.random() * 10) + 1 // Mock data
    }));

  const COLORS = ['#14b8a6', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

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
          Phatak Analytics
        </h1>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          Operational insights and performance trends
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #14b8a6'
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em', fontWeight: '700' }}>
            Total Data Points
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#14b8a6', letterSpacing: '-0.025em' }}>
            {trains.length + phataks.length}
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em', fontWeight: '700' }}>
            Average Operational Delay
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fbbf24', letterSpacing: '-0.025em' }}>
            {trains.length > 0 ? Math.round(trains.reduce((sum, t) => sum + t.delayMinutes, 0) / trains.length) : 0} min
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em', fontWeight: '700' }}>
            Crossings Currently Blocked
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fca5a5', letterSpacing: '-0.025em' }}>
            {phataks.filter(p => p.status === 'CLOSED').length}
          </div>
        </div>
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em', fontWeight: '700' }}>
            On-Time Performance Rate
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#6ee7b7', letterSpacing: '-0.025em' }}>
            {trains.length > 0 ? Math.round((trains.filter(t => t.delayMinutes === 0).length / trains.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Delay Distribution Pie Chart */}
        <div style={{
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            fontWeight: '700',
            color: '#f1f5f9',
            letterSpacing: '-0.025em'
          }}>
            Service delay analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={delayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {delayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Speed Distribution */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f1f5f9'
          }}>
            Speed Distribution (km/h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speedRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Traffic */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f1f5f9'
          }}>
            Hourly Traffic Pattern
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Line type="monotone" dataKey="trains" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="closures" stroke="#f87171" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Affected Phataks */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f1f5f9'
          }}>
            Most Affected Crossings
          </h3>
          {topPhataks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPhataks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={150} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="closures" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '0.9375rem'
            }}>
              No closed crossings currently
            </div>
          )}
        </div>
      </div>

      {/* Status Summary Table */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#f1f5f9'
        }}>
          System Status Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {phatakStatus.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Phataks {item.status}
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: item.color }}>
                  {item.count}
                </div>
                {item.status === 'Closed' && item.count > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {phataks.filter(p => p.status === 'CLOSED').map((phatak, idx) => (
                      <div
                        key={phatak._id || idx}
                        style={{
                          fontSize: '0.75rem',
                          color: '#e2e8f0',
                          backgroundColor: '#f8717140',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '4px',
                          marginBottom: '0.375rem',
                          borderLeft: '3px solid #f87171'
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.125rem' }}>
                          {phatak.phatakId || 'N/A'}
                        </div>
                        <div style={{ color: '#cbd5e1' }}>
                          {phatak.name || 'Unknown Location'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0
              }}>
                {item.status === 'Open' ? '✅' : '🚫'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
