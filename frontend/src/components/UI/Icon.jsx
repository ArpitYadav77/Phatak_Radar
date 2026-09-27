// Understated 1.5px line icons (replacing emoji in the live UI).
const PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  train: <><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M9 21l-2-4M15 21l2-4" /><circle cx="9" cy="14" r="0.6" fill="currentColor" /><circle cx="15" cy="14" r="0.6" fill="currentColor" /></>,
  chart: <><path d="M3 21h18" /><path d="M6 17V11M11 17V6M16 17v-4M21 17V8" /></>,
  crossing: <><path d="M12 21v-7" /><path d="M4 7l16 6M4 13l16-6" /><circle cx="12" cy="10" r="1.2" /></>,
  gate: <><path d="M4 21V9M20 21V9" /><path d="M4 12h16" /><path d="M7 12l-3 3M11 12l-3 3M15 12l-3 3M19 12l-3 3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>,
  gauge: <><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.5, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block', ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}
