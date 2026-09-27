import Icon from '../UI/Icon';

/** "How is this worked out?" — plain-language provenance for the status. */
export default function SourcesCard({ data }) {
  const tt = data.timetable || {};
  const c = data.crossing || {};
  const live = data.sources?.liveDelays;

  return (
    <details className="card">
      <summary className="card-head" style={{ cursor: 'pointer', listStyle: 'none' }}>
        <span className="row card-title"><Icon name="info" size={16} /> How is this worked out?</span>
        <Icon name="chevronDown" size={16} color="var(--muted)" />
      </summary>
      <div className="card-pad stack small text-2">
        <div>
          <strong style={{ color: 'var(--text)' }}>Trains: </strong>
          {tt.available
            ? <>{tt.source}{tt.verifiedAt ? `, checked ${tt.verifiedAt}` : ''}. {tt.note || ''}</>
            : <>{tt.reason || 'No timetable for this crossing yet.'}</>}
          {tt.stations && <> Stations used: {tt.stations.map((s) => `${s.name} (${s.code}, ${s.km} km)`).join(' and ')}.</>}
        </div>
        {tt.sources && (
          <ul style={{ paddingLeft: 18 }}>
            {tt.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}
          </ul>
        )}
        <div>
          <strong style={{ color: 'var(--text)' }}>Gate timing: </strong>
          the gate is assumed closed from about 6 min before the train reaches the crossing until 3 min after.
          Real closures vary with the gateman and signals.
        </div>
        <div>
          <strong style={{ color: 'var(--text)' }}>Live delays: </strong>
          {live === 'ok' ? 'applied from RailRadar (refreshed at most every 2 hours).'
            : live === 'disabled' ? 'not configured — times assume trains run on schedule.'
              : live === 'unavailable' ? 'temporarily unavailable — times assume trains run on schedule.'
                : live === 'not-applicable' ? 'not available for this crossing.' : 'not fetched yet.'}
        </div>
        <div>
          <strong style={{ color: 'var(--text)' }}>Goods trains: </strong>
          no public schedule exists. They show up only when two people at the crossing report the gate closed within 10 minutes.
        </div>
        <div>
          <strong style={{ color: 'var(--text)' }}>Location: </strong>
          {c.locationSource}{c.roadNameSource ? `; road name from ${c.roadNameSource}` : ''}.
        </div>
      </div>
    </details>
  );
}
