import { useState, useEffect, useMemo } from 'react';

const getEventIcon = (eventType) => {
  const icons = {
    'gate_closed': '🚂',
    'gate_opened': '✅',
    'delay_updated': '⏱️',
    'train_approaching': '🚂',
    'status_unknown': '⚠️',
    'train_delayed': '⏱️',
    'train_ontime': '✅'
  };
  return icons[eventType] || '📍';
};

const getEventColor = (eventType) => {
  const colors = {
    'gate_closed': '#f87171',
    'gate_opened': '#34d399',
    'delay_updated': '#a78bfa',
    'train_approaching': '#f87171',
    'status_unknown': '#fb923c',
    'train_delayed': '#fb923c',
    'train_ontime': '#34d399'
  };
  return colors[eventType] || '#60a5fa';
};

const getEventTitle = (eventType) => {
  const titles = {
    'gate_closed': 'Gate Closed',
    'gate_opened': 'Gate Opened',
    'delay_updated': 'Delay Updated',
    'train_approaching': 'Train Approaching',
    'status_unknown': 'Status Unknown',
    'train_delayed': 'Train Delayed',
    'train_ontime': 'On Schedule'
  };
  return titles[eventType] || 'Update';
};

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function LiveFeed({ phataks, trains }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const allEvents = [];

    // Generate events from phatak data
    if (phataks && phataks.length > 0) {
      phataks.forEach((phatak, index) => {
        const baseTime = new Date();
        
        if (phatak.status?.toLowerCase() === 'closed') {
          allEvents.push({
            id: `${phatak._id}-closed`,
            type: 'gate_closed',
            entityName: phatak.name,
            entityId: phatak.phatakId || `#${index + 1}`,
            description: phatak.trainInfo || phatak.reason || 'Train approaching, gate closed',
            timestamp: phatak.lastUpdated || new Date(baseTime - 2 * 60000),
            category: 'phatak'
          });
        } else if (phatak.status?.toLowerCase() === 'open') {
          // Check if it was recently closed (from events)
          if (phatak.events && phatak.events.length > 0) {
            const recentGateOpened = phatak.events
              .filter(e => e.type === 'gate_opened')
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            if (recentGateOpened) {
              allEvents.push({
                id: `${phatak._id}-opened`,
                type: 'gate_opened',
                entityName: phatak.name,
                entityId: phatak.phatakId || `#${index + 1}`,
                description: recentGateOpened.description || phatak.reason || 'Train passed, gates reopened for traffic',
                timestamp: recentGateOpened.timestamp || phatak.lastUpdated || new Date(baseTime - 5 * 60000),
                category: 'phatak'
              });
            }
          }
        }

        // Add train approaching events
        if (phatak.events && phatak.events.length > 0) {
          phatak.events
            .filter(e => e.type === 'train_approaching')
            .slice(0, 1)
            .forEach(event => {
              allEvents.push({
                id: `${phatak._id}-${event.timestamp}`,
                type: 'train_approaching',
                entityName: phatak.name,
                entityId: phatak.phatakId || `#${index + 1}`,
                description: event.description,
                timestamp: event.timestamp,
                category: 'phatak'
              });
            });
        }
      });
    }

    // Generate events from train data
    if (trains && trains.length > 0) {
      trains.forEach(train => {
        const baseTime = new Date();
        
        // Train delay events
        if (train.delayMinutes > 0) {
          allEvents.push({
            id: `${train._id}-delay`,
            type: 'train_delayed',
            entityName: train.trainName,
            entityId: train.trainNumber,
            description: `Running ${train.delayMinutes} minutes behind schedule`,
            timestamp: train.lastUpdated || baseTime,
            category: 'train'
          });
        }

        // Train approaching phatak events
        if (train.affectedPhataks && train.affectedPhataks.length > 0) {
          train.affectedPhataks.slice(0, 2).forEach((affected, idx) => {
            allEvents.push({
              id: `${train._id}-approaching-${idx}`,
              type: 'train_approaching',
              entityName: train.trainName,
              entityId: train.trainNumber,
              description: `Approaching crossing - ETA ${affected.eta} minutes`,
              timestamp: train.lastUpdated || baseTime,
              category: 'train'
            });
          });
        }
      });
    }

    // Sort by timestamp and take the most recent
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setEvents(allEvents.slice(0, 15));
  }, [phataks, trains]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%'
    }}>
      <h3 style={{ 
        color: '#94a3b8', 
        marginTop: 0,
        marginBottom: 0,
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>LIVE UPDATES</h3>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        overflowY: 'auto',
        flex: 1,
        paddingRight: '0.5rem'
      }}>
        {events.length === 0 ? (
          <div style={{ 
            color: '#64748b', 
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '2rem 1rem',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
            No recent updates in this area
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              style={{
                backgroundColor: '#1e293b',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: `3px solid ${getEventColor(event.type)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{getEventIcon(event.type)}</span>
                  <strong style={{ color: '#f8fafc', fontSize: '0.9375rem' }}>
                    {getEventTitle(event.type)}
                  </strong>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {getTimeAgo(event.timestamp)}
                </span>
              </div>
              
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>{event.entityId}</strong> {event.entityName && `- ${event.entityName}`}
              </div>
              
              <div style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                {event.description}
              </div>

              <div style={{ 
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: '0.125rem 0.5rem',
                backgroundColor: event.category === 'train' ? '#3b82f6' : '#8b5cf6',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                marginTop: '0.25rem'
              }}>
                {event.category === 'train' ? '🚂 Train' : '🚧 Crossing'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
