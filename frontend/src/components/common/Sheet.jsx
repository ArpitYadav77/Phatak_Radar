import { useEffect, useRef } from 'react';
import Icon from '../UI/Icon';

/** Bottom sheet on phones, centred dialog from 768px. Closes on Esc / backdrop tap. */
export default function Sheet({ title, onClose, children, labelledBy = 'sheet-title' }) {
  const ref = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input, button:not([data-close])')?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2 className="sheet-title" id={labelledBy}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" data-close>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
