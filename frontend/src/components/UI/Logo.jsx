export default function Logo({ size = 48, showText = true }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: showText ? '0.75rem' : 0
    }}>
      {/* Logo Icon - Stylized "P" with railway tracks */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        style={{ flexShrink: 0 }}
      >
        {/* Background circle for "P" */}
        <circle cx="60" cy="35" r="25" fill="none" stroke="#dc2626" strokeWidth="8"/>
        
        {/* Vertical stem of "P" */}
        <rect x="32" y="10" width="8" height="80" fill="#dc2626" rx="2"/>
        
        {/* Railway tracks (left side) */}
        <g>
          {/* Track ties */}
          <rect x="8" y="18" width="4" height="12" fill="#dc2626" rx="1"/>
          <rect x="8" y="35" width="4" height="12" fill="#dc2626" rx="1"/>
          <rect x="8" y="52" width="4" height="12" fill="#dc2626" rx="1"/>
          <rect x="8" y="69" width="4" height="12" fill="#dc2626" rx="1"/>
          
          {/* Track rails */}
          <rect x="5" y="15" width="2" height="70" fill="#dc2626"/>
          <rect x="13" y="15" width="2" height="70" fill="#dc2626"/>
        </g>
        
        {/* Signal dot (green indicator) */}
        <circle cx="70" cy="28" r="8" fill="#22c55e"/>
      </svg>

      {/* Text */}
      {showText && (
        <div>
          <div style={{
            fontSize: size > 40 ? '1.5rem' : '1.125rem',
            fontWeight: '700',
            lineHeight: 1.2
          }}>
            <span style={{ color: '#dc2626' }}>Phatak</span>
            <span style={{ color: '#f1f5f9' }}> Radar</span>
          </div>
        </div>
      )}
    </div>
  );
}
