import { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import MapView from '../components/Map/MapView';
import StatusPanel from '../components/Panels/StatusPanel';
import LiveFeed from '../components/Panels/LiveFeed';
import TrainSchedule from '../components/Panels/TrainSchedule';
import { getAllPhataks } from '../api/phatak.api';
import { getAllTrains, getTrainRoute } from '../api/train.api';

export default function Home() {
  const [phataks, setPhataks] = useState([]);
  const [trains, setTrains] = useState([]);
  const [selectedPhatak, setSelectedPhatak] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds to match backend simulation
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
    setSelectedPhatak(null); // Deselect phatak
    
    if (selectedTrain?._id === train._id) {
      setSelectedTrain(null); // Deselect if clicking the same train
    } else {
      try {
        // Fetch full train data with route
        const fullTrainData = await getTrainRoute(train.trainNumber);
        setSelectedTrain({ ...train, route: fullTrainData.route });
      } catch (error) {
        console.error('Failed to fetch train route:', error);
        setSelectedTrain(train);
      }
    }
  };

  const handlePhatakClick = (phatak) => {
    setSelectedTrain(null); // Deselect train
    
    if (selectedPhatak?._id === phatak._id) {
      setSelectedPhatak(null); // Deselect if clicking the same phatak
    } else {
      setSelectedPhatak(phatak);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#0f172a'
    }}>
      <Header />
      
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem', 
        padding: '1.5rem',
        overflow: 'hidden',
        backgroundColor: '#0f172a'
      }}>
        {/* Top Section - Main Grid */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: '320px 1fr 380px', 
          gap: '1.5rem',
          flex: 1,
          minHeight: 0
        }}>
          {/* Left Panel - Status Overview */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem', 
            overflow: 'auto',
            padding: '0.5rem'
          }}>
            <StatusPanel phataks={phataks} trains={trains} />
          </div>

          {/* Center - Map */}
          <div style={{ 
            borderRadius: '12px', 
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#1e293b',
            border: '1px solid #334155'
          }}>
            <MapView 
              phataks={phataks} 
              trains={trains}
              onPhatakClick={handlePhatakClick}
              onTrainClick={handleTrainClick}
              selectedPhatak={selectedPhatak}
              selectedTrain={selectedTrain}
            />
          
            {/* Status Legend */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#94a3b8', 
                      borderRadius: '50%',
                      border: '2px solid #0f172a'
                    }}></span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.8125rem' }}>Unknown - No data</span>
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

          {/* Right Panel - Live Feed */}
          <div style={{ 
            overflow: 'hidden',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <LiveFeed phataks={phataks} trains={trains} />
          </div>
        </div>

        {/* Bottom Section - Train Schedule */}
        <TrainSchedule 
          trains={trains} 
          onTrainSelect={handleTrainClick}
        />
      </div>
    </div>
  );
}
