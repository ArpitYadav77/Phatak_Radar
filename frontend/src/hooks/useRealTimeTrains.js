import { useRailway } from '../context/RailwayContext';

/** Hook to get real-time trains and phataks from global context */
export function useRealTimeTrains() {
  const { trains, phataks, isLoading, error, lastUpdated, countdown, refresh } =
    useRailway();
  return { trains, phataks, isLoading, error, lastUpdated, countdown, refresh };
}
