import { useState } from 'react';
import MapView from '../components/Map/MapView';
import DailySchedule from '../components/Panels/DailySchedule';
import KPICard from '../components/UI/KPICard';
import AlertBanner from '../components/AlertBanner';
import { useRailway } from '../context/RailwayContext';
import { getAllTrains } from '../api/train.api';
import { getTrainRoute } from '../api/train.api';
import { P, FONT_MONO } from '../styles/palette';

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
      backgroundColor: P.bg,
    }}>
      {/* Alert Banner */}
      <AlertBanner />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: P.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Operations Overview
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: P.text, marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
              Phatak Operational
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: P.text2 }}>
              Real-time railway crossing intelligence · Patiala (Rajpura–Patiala–Dhuri Line)
            </p>
          </div>

          {/* Refresh countdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: P.card,
            border: `1px solid ${P.border}`,
            borderRadius: '6px',
            padding: '0.5rem 0.875rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLoading ? P.warning : P.success,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '0.6875rem', color: P.text, fontWeight: 500, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: P.muted, fontVariantNumeric: 'tabular-nums' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </div>
            <div style={{
              borderLeft: `1px solid ${P.border}`,
              paddingLeft: '0.75rem',
              fontSize: '0.75rem',
              color: P.gold,
              fontWeight: 500,
              fontFamily: FONT_MONO,
            }}>
              ↻ {countdown}s
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <KPICard icon="crossing" label="Railway Crossings" value={totalPhataks} change={0} trend="neutral" color={P.gold} />
          <KPICard icon="gate" label="Gates Closed" value={closedPhataks} change={closedPhataks > 0 ? 1 : 0} trend={closedPhataks > 0 ? 'up' : 'neutral'} color={closedPhataks > 0 ? P.danger : P.text2} />
          <KPICard icon="train" label="Active Trains" value={activeTrains} change={approachingTrains.length} trend="up" color={P.info} />
          <KPICard icon="clock" label="Service Delays" value={delayedTrains} change={delayedTrains > 0 ? 5 : 0} trend={delayedTrains > 0 ? 'down' : 'neutral'} color={delayedTrains > 0 ? P.warning : P.text2} />
        </div>

        {/* Main Content: Map + Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          {/* Map */}
          <div style={{
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: P.card,
            border: `1px solid ${P.border}`,
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
              backgroundColor: P.card,
              padding: '0.75rem 1.125rem',
              borderRadius: '6px',
              border: `1px solid ${P.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minWidth: '260px',
              fontSize: '0.75rem',
            }}>
              <div style={{ color: P.gold, fontWeight: 500, fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.125rem' }}>Map Legend</div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { color: P.success, label: 'Gate Open' },
                  { color: P.warning, label: 'Train Approaching' },
                  { color: P.danger, label: 'Gate Closed' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                    <span style={{ color: P.text2 }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
                <div style={{ width: 20, height: 1, borderTop: `1px dashed ${P.warning}`, alignSelf: 'center' }} />
                <span style={{ color: P.muted }}>15 km approach zone</span>
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
