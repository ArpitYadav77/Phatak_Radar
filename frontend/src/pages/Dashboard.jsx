import { useState, useEffect } from 'react';
import MapView from '../components/Map/MapView';
import DailySchedule from '../components/Panels/DailySchedule';
import KPICard from '../components/UI/KPICard';
import { getAllPhataks } from '../api/phatak.api';
import { getAllTrains, getTrainRoute } from '../api/train.api';

export default function Dashboard() {
  const [phataks, setPhataks] = useState([]);
  const [trains, setTrains] = useState([]);
  const [selectedPhatak, setSelectedPhatak] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
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

  const handleTrainClick = async (train) => {
    setSelectedPhatak(null);
    
    if (selectedTrain?._id === train._id) {
      setSelectedTrain(null);
    } else {
      try {
        const fullTrainData = await getTrainRoute(train.trainNumber);
        setSelectedTrain({ ...train, route: fullTrainData.route });
      } catch (error) {
        console.error('Failed to fetch train route:', error);
        setSelectedTrain(train);
      }
    }
  };

  const handlePhatakClick = (phatak) => {
    setSelectedTrain(null);
    
    if (selectedPhatak?._id === phatak._id) {
      setSelectedPhatak(null);
    } else {
      setSelectedPhatak(phatak);
    }
  };

  // Calculate KPIs
  const totalPhataks = phataks.length;
  const closedPhataks = phataks.filter(p => p.status === 'CLOSED').length;
  const activeTrains = trains.length;
  const delayedTrains = trains.filter(t => t.delayMinutes > 0).length;

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
          Phatak Operational 
        </h1>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          Real-time railway crossing intelligence • Updated just now
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        <KPICard
          icon="📍"
          label="Railway Crossings"
          value={totalPhataks}
          change={0}
          trend="neutral"
          color="#1e40af"
        />
        <KPICard
          icon="⚠️"
          label="Crossings Blocked"
          value={closedPhataks}
          change={closedPhataks > 0 ? 12 : 0}
          trend={closedPhataks > 0 ? 'up' : 'neutral'}
          color="#ef4444"
        />
        <KPICard
          icon="🚂"
          label="Trains in Transit"
          value={activeTrains}
          change={8}
          trend="up"
          color="#14b8a6"
        />
        <KPICard
          icon="⏱️"
          label="Service Delays"
          value={delayedTrains}
          change={delayedTrains > 0 ? 5 : 0}
          trend={delayedTrains > 0 ? 'down' : 'neutral'}
          color="#f59e0b"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: '1.5rem',
        flex: 1,
        minHeight: 0
      }}>
        {/* Map */}
        <div style={{
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#1a2332',
          border: '1px solid #334155',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          minHeight: '600px'
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
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            minWidth: '280px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'
          }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              MAP LEGEND 
            </div>

            {/* Phatak Legend */}
            <div>
              <div style={{ color: '#cbd5e1', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Railway Crossings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#34d399',
                    borderRadius: '50%',
                    border: '2px solid #0f172a'
                  }}></span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.8125rem' }}>Open - Safe to cross</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#f87171',
                    borderRadius: '50%',
                    border: '2px solid #0f172a'
                  }}></span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.8125rem' }}>Closed - Train nearby</span>
                </div>
              </div>
            </div>

            {/* Train Legend */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <div style={{ color: '#cbd5e1', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Live Trains
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>🚂</span>
                  <span style={{
                    padding: '0.125rem 0.4rem',
                    backgroundColor: '#34d399',
                    borderRadius: '3px',
                    fontSize: '0.65rem',
                    color: '#0f172a',
                    fontWeight: '600'
                  }}>ON TIME</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No delays</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>🚂</span>
                  <span style={{
                    padding: '0.125rem 0.4rem',
                    backgroundColor: '#fb923c',
                    borderRadius: '3px',
                    fontSize: '0.65rem',
                    color: '#0f172a',
                    fontWeight: '600'
                  }}>DELAYED</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Running late</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Schedule */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <DailySchedule 
            phatak={selectedPhatak || phataks[0]} 
            trains={trains} 
          />
        </div>
      </div>
    </div>
  );
}
