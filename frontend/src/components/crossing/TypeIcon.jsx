import Icon from '../UI/Icon';
import { typeInfo } from '../../lib/trainTypes';

export default function TypeIcon({ type, size = 40 }) {
  const t = typeInfo(type);
  return (
    <span className={`type-icon ${t.cls}`} style={{ width: size, height: size }} title={t.label}>
      <Icon name={t.icon} size={Math.round(size * 0.5)} />
      <span className="sr-only">{t.label}</span>
    </span>
  );
}
