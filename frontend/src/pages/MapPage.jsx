import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/UI/Icon';
import CrossingMap from '../components/map/CrossingMap';
import StatusHero from '../components/crossing/StatusHero';
import ReportSheet from '../components/crossing/ReportSheet';
import { useApp } from '../context/AppContext';
import { useCrossingStatus } from '../hooks/useCrossingStatus';
import { describeCrossing } from '../lib/format';

function Peek({ id, onClose }) {
  const { selectCrossing } = useApp();
  const navigate = useNavigate();
  const q = useCrossingStatus(id);
  const [reporting, setReporting] = useState(false);
  const data = q.data;

  return (
    <section className="peek" aria-label="Selected crossing">
      <div className="spread">
        <div className="grow">
          <div className="small" style={{ fontWeight: 600 }}>{data?.crossing?.name || data?.crossing?.label || 'Loading…'}</div>
          <div className="tiny text-2 ellipsis">{describeCrossing(data?.crossing)}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close crossing details"><Icon name="close" /></button>
      </div>
      {data ? <StatusHero data={data} updatedAt={q.updatedAt} compact /> : <div className="skeleton" style={{ height: 150 }} />}
      {q.error && !data && <div className="banner danger"><Icon name="alert" size={16} /> Status unavailable right now.</div>}
      {data && (
        <div className="row">
          <button className="btn btn-gold grow" onClick={() => { selectCrossing(data.crossing); navigate('/'); }}>
            Full status <Icon name="arrowRight" size={16} />
          </button>
          <button className="btn" onClick={() => setReporting(true)}><Icon name="megaphone" size={16} /> Report</button>
        </div>
      )}
      {reporting && data && <ReportSheet crossing={data.crossing} onClose={() => setReporting(false)} onReported={() => q.refresh()} />}
    </section>
  );
}

export default function MapPage() {
  const { selected } = useApp();
  const [peekId, setPeekId] = useState(null);

  return (
    <div className="map-page">
      <h1 className="sr-only">Crossings map</h1>
      <div className="map-page-grid">
        <div className="map-col">
          <CrossingMap center={selected.lat != null ? [selected.lat, selected.lng] : null} selectedId={peekId || selected.id} onSelect={(c) => setPeekId(c.id)} />
        </div>
        {peekId && <Peek id={peekId} onClose={() => setPeekId(null)} />}
      </div>
    </div>
  );
}
