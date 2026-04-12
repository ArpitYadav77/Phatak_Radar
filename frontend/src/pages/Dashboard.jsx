import { useState } from 'react';
import MapView from '../components/Map/MapView';
import DailySchedule from '../components/Panels/DailySchedule';
import KPICard from '../components/UI/KPICard';
import AlertBanner from '../components/AlertBanner';
import { useRailway } from '../context/RailwayContext';
import { getAllTrains } from '../api/train.api';
import { getTrainRoute } from '../api/train.api';

export default function Dashboard() {
  const { trains, phataks, isLoading, lastUpdated, countdown, criticalPhataks, approachingTrains } = useRailway();
  const [selectedPhatak, setSelectedPhatak] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);

  const handleTrainClick = async (train) => {
    setSelectedPhatak(null);
    if (selectedTrain?.trainNumber === train.trainNumber) {
      setSelectedTrain(null);
    } else {
      try {
        const fullData = await getTrainRoute(train.trainNumber);
        setSelectedTrain({ ...train, route: fullData.route });
      } catch {
        setSelectedTrain(train);
      }
    }
  };

  const handlePhatakClick = (phatak) => {
    setSelectedTrain(null);
    if (selectedPhatak?.phatakId === phatak.phatakId) {
      setSelectedPhatak(null);
    } else {
      setSelectedPhatak(phatak);
    }
  };

  // KPI values
  const totalPhataks = phataks.length;
  const closedPhataks = criticalPhataks.length;
  const activeTrains = trains.length;
  const delayedTrains = trains.filter((t) => (t.delayMinutes || 0) > 0).length;

  const focusPhatak = selectedPhatak || phataks.find((p) => p.phatakId === 'LDH-PK-23') || phataks[0];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      overflow: 'hidden',
      backgroundColor: '#0a0f1e',
    }}>
      {/* Alert Banner */}
      <AlertBanner />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
              Phatak Operational
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
              Real-time railway crossing intelligence · Patiala (Rajpura–Patiala–Dhuri Line)
            </p>
          </div>

          {/* Refresh countdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#1a2332',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '0.625rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLoading ? '#f59e0b' : '#10b981',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </div>
            <div style={{
              backgroundColor: '#14b8a620',
              border: '1px solid #14b8a640',
              borderRadius: '6px',
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              color: '#14b8a6',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}>
              ↻ {countdown}s
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <KPICard icon="📍" label="Railway Crossings" value={totalPhataks} change={0} trend="neutral" color="#1e40af" />
          <KPICard icon="🚨" label="Gates Closed" value={closedPhataks} change={closedPhataks > 0 ? 1 : 0} trend={closedPhataks > 0 ? 'up' : 'neutral'} color="#ef4444" />
          <KPICard icon="🚂" label="Active Trains" value={activeTrains} change={approachingTrains.length} trend="up" color="#14b8a6" />
          <KPICard icon="⏱️" label="Service Delays" value={delayedTrains} change={delayedTrains > 0 ? 5 : 0} trend={delayedTrains > 0 ? 'down' : 'neutral'} color="#f59e0b" />
        </div>

        {/* Main Content: Map + Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          {/* Map */}
          <div style={{
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#1a2332',
            border: '1px solid #334155',
            minHeight: '500px',
          }}>
            <MapView
              phataks={phataks}
              trains={trains}
              onPhatakClick={handlePhatakClick}
              onTrainClick={handleTrainClick}
              selectedPhatak={selectedPhatak}
              selectedTrain={selectedTrain}
            />

            {/* Map Legend */}
            <div style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1e293bdd',
              padding: '0.875rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #334155',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minWidth: '260px',
              fontSize: '0.75rem',
            }}>
              <div style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>MAP LEGEND</div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { color: '#10b981', label: 'Gate Open' },
                  { color: '#f59e0b', label: 'Train Approaching' },
                  { color: '#ef4444', label: 'Gate Closed' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                    <span style={{ color: '#e2e8f0' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
                <div style={{ width: 20, height: 1, borderTop: '2px dashed #f59e0b', alignSelf: 'center' }} />
                <span style={{ color: '#94a3b8' }}>15 km approach zone</span>
              </div>
            </div>
          </div>

          {/* Daily Schedule panel */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
            <DailySchedule phatak={focusPhatak} trains={trains} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
