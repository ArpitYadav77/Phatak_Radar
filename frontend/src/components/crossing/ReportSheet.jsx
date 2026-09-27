import { useState } from 'react';
import Icon from '../UI/Icon';
import Sheet from '../common/Sheet';
import { api } from '../../lib/api';

const TRAIN_CHOICES = [
  { key: 'GOODS', label: 'Goods (maalgaadi)' },
  { key: 'PASSENGER', label: 'Passenger' },
  { key: 'EXPRESS', label: 'Express' },
  { key: 'VANDE_BHARAT', label: 'Vande Bharat' },
  { key: 'PARCEL', label: 'Parcel / luggage' },
  { key: 'UNKNOWN', label: "Don't know" },
];

export default function ReportSheet({ crossing, onClose, onReported }) {
  const [status, setStatus] = useState(null);
  const [trainType, setTrainType] = useState(null);
  const [state, setState] = useState({ sending: false, error: null, done: false });

  const submit = async () => {
    setState({ sending: true, error: null, done: false });
    try {
      const r = await api.report(crossing.id, { status, trainType: status === 'CLOSED' ? trainType : null });
      setState({ sending: false, error: null, done: true });
      onReported?.(r.status);
    } catch (err) {
      setState({ sending: false, error: err.message, done: false });
    }
  };

  return (
    <Sheet title="Report gate status" onClose={onClose}>
      {state.done ? (
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
          <Icon name="check" size={36} color="var(--success-text)" />
          <p style={{ fontWeight: 600 }}>Thanks — report shared.</p>
          <p className="small text-2">When two people report the same thing within 10 minutes, the crossing updates for everyone. Reports expire after 20 minutes.</p>
          <button className="btn btn-block" onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="stack">
          <p className="small text-2">
            You are at <strong style={{ color: 'var(--text)' }}>{crossing.name || crossing.label}</strong>. What do you see right now?
          </p>
          <div className="choice-grid" role="radiogroup" aria-label="Gate status">
            <button className={`choice ${status === 'CLOSED' ? 'sel-closed' : ''}`} role="radio" aria-checked={status === 'CLOSED'} onClick={() => setStatus('CLOSED')}>
              <Icon name="gateClosed" size={26} /> Gate closed
            </button>
            <button className={`choice ${status === 'OPEN' ? 'sel-open' : ''}`} role="radio" aria-checked={status === 'OPEN'} onClick={() => setStatus('OPEN')}>
              <Icon name="gateOpen" size={26} /> Gate open
            </button>
          </div>

          {status === 'CLOSED' && (
            <div>
              <div className="small text-2" style={{ marginBottom: 8 }}>What is passing? (optional)</div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {TRAIN_CHOICES.map((c) => (
                  <button key={c.key} className={`chip ${trainType === c.key ? 'on' : ''}`} onClick={() => setTrainType(trainType === c.key ? null : c.key)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.error && <div className="banner danger"><Icon name="alert" size={16} /> {state.error}</div>}

          <button className="btn btn-gold btn-block" disabled={!status || state.sending} onClick={submit}>
            {state.sending ? 'Sending…' : 'Send report'}
          </button>
          <p className="tiny muted">Anonymous. Only report what you can see at the crossing — false reports mislead other people.</p>
        </div>
      )}
    </Sheet>
  );
}
