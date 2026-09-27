import { api } from '../lib/api';
import { usePolling } from './usePolling';

/** Full status for one crossing, refreshed every 15 s while the tab is visible. */
export function useCrossingStatus(id) {
  return usePolling((signal) => (id ? api.crossing(id, { signal }) : Promise.resolve(null)), 15000, [id]);
}
