import { useState, useEffect } from 'react';

export default function Header() {
  const [updateTime, setUpdateTime] = useState('just now');

  useEffect(() => {
    const updateTimestamp = () => {
      setUpdateTime('just now');
    };
    
    updateTimestamp();
    const interval = setInterval(updateTimestamp, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{ 
      padding: '1.5rem 2rem', 
      backgroundColor: '#1e293b', 
      borderBottom: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '2rem' }}>🚂</span>
        <div>
          <h1 style={{ color: '#60a5fa', margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>Phatak Radar</h1>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.125rem' }}>Real-time Railway Crossing Monitor</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#86efac', fontSize: '0.875rem' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: '#86efac', borderRadius: '50%', display: 'inline-block' }}></span>
        Updated {updateTime}
      </div>
    </header>
  );
}
