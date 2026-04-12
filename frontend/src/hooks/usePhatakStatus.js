import { useRailway } from '../context/RailwayContext';

/**
 * Get the current status for a specific phatak by phatakId.
 * Returns { status, gateStatus, approachingTrains, eta, trainInfo }
 */
export function usePhatakStatus(phatakId) {
  const { phataks } = useRailway();
  const phatak = phataks.find((p) => p.phatakId === phatakId);

  if (!phatak) {
    return {
      status: 'UNKNOWN',
      gateStatus: 'OPEN',
      approachingTrains: [],
      eta: null,
      trainInfo: null,
    };
  }

  return {
    status: phatak.status,
    gateStatus: phatak.liveStatus?.gateStatus || phatak.status,
    approachingTrains: phatak.liveStatus?.approachingTrains || [],
    eta: phatak.eta,
    trainInfo: phatak.trainInfo,
  };
}
