import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAllPhataks } from '../api/phatak.api';
import { getAllTrains } from '../api/train.api';
import { getAlerts } from '../api/alert.api';

const POLL_INTERVAL = 30_000; // 30 seconds
const ANALYTICS_KEY = 'phatak_radar_analytics';
const MAX_SNAPSHOTS = 200;

// ─── Context
const RailwayContext = createContext(null);

export function useRailway() {
  const ctx = useContext(RailwayContext);
  if (!ctx) throw new Error('useRailway must be used inside <RailwayProvider>');
  return ctx;
}

// ─── Notification helper ───────────────────────────────────────────────────────
function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// ─── Analytics snapshot persistence ──────────────────────────────────────────
function saveAnalyticsSnapshot(trains, phataks) {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const snapshots = raw ? JSON.parse(raw) : [];
    snapshots.push({ timestamp: Date.now(), trains, phataks });
    // Keep only last MAX_SNAPSHOTS
    const trimmed = snapshots.slice(-MAX_SNAPSHOTS);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (_) { /* quota exceeded or unavailable */ }
}

export function getAnalyticsSnapshots() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function RailwayProvider({ children }) {
  const [trains, setTrains] = useState([]);
  const [phataks, setPhataks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);

  // Track previous phatak statuses for notifications
  const prevPhatakStatus = useRef({});

  // ─── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [phatakData, trainData, alertData] = await Promise.all([
        getAllPhataks(),
        getAllTrains(),
        getAlerts(),
      ]);

      // Notifications for status changes
      for (const phatak of phatakData) {
        const prev = prevPhatakStatus.current[phatak.phatakId];
        const curr = phatak.liveStatus?.gateStatus || phatak.status;
        if (prev && prev !== curr) {
          const mins = phatak.liveStatus?.minutesToCrossing;
          const trainLabel = phatak.liveStatus?.scheduledTrain
            ? `${phatak.liveStatus.scheduledTrain.trainName} (${phatak.liveStatus.scheduledTrain.scheduledTime})`
            : phatak.trainInfo || 'Train';
          if (curr === 'CLOSED') {
            sendNotification(
              `🚨 ${phatak.name} — CLOSE GATE NOW`,
              `${trainLabel}${mins != null ? ` · ${Math.abs(Math.round(mins))} min ${mins > 0 ? 'to arrival' : 'ago'}` : ''}`
            );
          } else if (curr === 'WARNING') {
            sendNotification(
              `⚠️ ${phatak.name} — Prepare to close gate`,
              `${trainLabel}${mins != null ? ` — ${Math.round(mins)} min away` : ''}`
            );
          } else if (curr === 'OPEN' && (prev === 'CLOSED' || prev === 'WARNING')) {
            sendNotification(`✅ ${phatak.name} — Gate Clear`, 'Train has cleared the crossing');
          }
        }
        prevPhatakStatus.current[phatak.phatakId] = curr;
      }

      setPhataks(phatakData);
      setTrains(trainData);
      setAlerts(alertData);
      setLastUpdated(new Date());
      setIsLoading(false);
      setCountdown(POLL_INTERVAL / 1000);

      // Save analytics snapshot (lightweight version)
      saveAnalyticsSnapshot(
        trainData.map((t) => ({
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          speed: t.speed,
          delayMinutes: t.delayMinutes,
          approachStatus: t.approachStatus,
          distToPhatak23: t.distToPhatak23,
        })),
        phatakData.map((p) => ({
          phatakId: p.phatakId,
          name: p.name,
          status: p.liveStatus?.gateStatus || p.status,
        }))
      );
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setIsLoading(false);
    }
  }, []);

  // ─── Initial fetch + polling ─────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : POLL_INTERVAL / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Request notification permission ─────────────────────────────────────────
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const value = {
    trains,
    phataks,
    alerts,
    isLoading,
    error,
    lastUpdated,
    countdown,
    refresh: fetchData,
    requestNotificationPermission,
    // Derived stats
    criticalPhataks: phataks.filter(
      (p) => (p.liveStatus?.gateStatus || p.status) === 'CLOSED'
    ),
    approachingTrains: trains.filter(
      (t) => t.approachStatus === 'APPROACHING' || t.approachStatus === 'CRITICAL'
    ),
  };

  return (
    <RailwayContext.Provider value={value}>
      {children}
    </RailwayContext.Provider>
  );
}

export default RailwayContext;
