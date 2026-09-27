import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/UI/Icon';
import CrossingPicker from '../components/crossing/CrossingPicker';
import StatusHero from '../components/crossing/StatusHero';
import UpcomingTrains from '../components/crossing/UpcomingTrains';
import ReportSheet from '../components/crossing/ReportSheet';
import SourcesCard from '../components/crossing/SourcesCard';
import CrossingMap from '../components/map/CrossingMap';
import { useApp } from '../context/AppContext';
import { useCrossingStatus } from '../hooks/useCrossingStatus';
import { useMediaQuery } from '../hooks/useMediaQuery';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function StatusPage() {
  const { selected, selectCrossing } = useApp();
  const q = useCrossingStatus(selected.id);
  const [reporting, setReporting] = useState(false);
  const data = q.data;
  const skew = data?.computedAt && q.updatedAt ? data.computedAt - q.updatedAt : 0;
  const notFound = q.error?.status === 404;
  // The side map only exists on wide screens; phones use the Map tab.
  const wide = useMediaQuery('(min-width: 1100px)');

  return (
    <div className="status-layout">
      <div className="stack">
        <div>
          <div className="eyebrow">Is the phatak open?</div>
          <h1 className="sr-only">Crossing status</h1>
        </div>

        <CrossingPicker crossing={data?.crossing} fallbackLabel={selected.label} />

        {notFound && (
          <div className="banner info"><Icon name="info" size={16} /> This crossing is no longer in the data — please choose another one.</div>
        )}
        {q.error && !notFound && !data && (
          <div className="banner danger">
            <Icon name="alert" size={16} />
            <div className="grow">Can’t reach the server. The free backend may be waking up (up to a minute).</div>
            <button className="btn btn-sm" onClick={q.refresh}>Retry</button>
          </div>
        )}
        {q.error && data && (
          <div className="banner"><Icon name="alert" size={16} /> Refresh failed — showing the last known status.</div>
        )}
        {data?.sources?.liveDelays === 'unavailable' && (
          <div className="banner"><Icon name="info" size={16} /> Live delay data unavailable — times are timetable estimates.</div>
        )}

        {data ? (
          <StatusHero data={data} updatedAt={q.updatedAt} onReport={() => setReporting(true)} />
        ) : !notFound && !q.error ? (
          <div className="skeleton" style={{ height: 240 }} aria-label="Loading status" />
        ) : null}

        {data && data.status !== 'UNKNOWN' && <UpcomingTrains trains={data.nextTrains} skew={skew} />}

        {data && (
          <Link to="/map" className="btn btn-block map-link-mobile">
            <Icon name="map" size={18} /> See it on the map
          </Link>
        )}

        {data && <SourcesCard data={data} />}
      </div>

      {wide && (
        <div className="status-map">
          <ErrorBoundary title="Map unavailable">
            <CrossingMap
              center={data?.crossing ? [data.crossing.lat, data.crossing.lng] : null}
              selectedId={selected.id}
              onSelect={selectCrossing}
            />
          </ErrorBoundary>
        </div>
      )}

      {reporting && data && (
        <ReportSheet crossing={data.crossing} onClose={() => setReporting(false)} onReported={() => q.refresh()} />
      )}
    </div>
  );
}
