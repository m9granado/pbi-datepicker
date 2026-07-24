import * as React from "react";
import { FilterMode } from "../hooks/useDateFilter";
import { formatDateDMY } from "../utils/dateHelpers";

export interface FilterBadgeProps {
  mode: FilterMode;
  from?: Date;
  to?: Date;
  presetLabel?: string;
  comparisonLabel?: string;
  selectedMonthsCount?: number;
  onClear: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
    padding: '0.4em 0.75em',
    background: '#E8F4FD',
    border: '1px solid #007AFF',
    borderRadius: '16px',
    marginBottom: '0.5em',
    fontSize: '0.8em'
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4em',
    color: '#007AFF',
    fontWeight: 500
  },
  icon: {
    width: '14px',
    height: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
  },
  clearButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    border: 'none',
    background: 'transparent',
    color: '#007AFF',
    cursor: 'pointer',
    borderRadius: '50%',
    transition: 'all 0.15s ease',
    fontSize: '14px',
    lineHeight: 1
  }
};

const FilterIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const ComparisonIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10M12 20V4M6 20v-6"></path>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export const FilterBadge: React.FC<FilterBadgeProps> = React.memo(({
  mode,
  from,
  to,
  presetLabel,
  comparisonLabel,
  selectedMonthsCount,
  onClear
}) => {
  // Don't show badge if no filter is active
  if (mode === 'range' && !from && !to) return null;

  let icon = <FilterIcon />;
  let label = "";

  switch (mode) {
    case 'preset':
      icon = <FilterIcon />;
      label = presetLabel || "Filtro preset";
      break;
    case 'comparison':
      icon = <ComparisonIcon />;
      label = comparisonLabel || "Comparación activa";
      break;
    case 'navigation':
      icon = <CalendarIcon />;
      label = from && to 
        ? `${formatDateDMY(from)} - ${formatDateDMY(to)}`
        : "Navegando mes";
      break;
    case 'multimonth':
      icon = <CalendarIcon />;
      label = selectedMonthsCount 
        ? `${selectedMonthsCount} mes${selectedMonthsCount > 1 ? 'es' : ''} seleccionado${selectedMonthsCount > 1 ? 's' : ''}`
        : "Meses seleccionados";
      break;
    case 'range':
    default:
      icon = <FilterIcon />;
      if (from && to) {
        label = `${formatDateDMY(from)} - ${formatDateDMY(to)}`;
      } else if (from) {
        label = `Desde ${formatDateDMY(from)}`;
      } else if (to) {
        label = `Hasta ${formatDateDMY(to)}`;
      }
      break;
  }

  if (!label) return null;

  return (
    <div style={styles.container} role="status" aria-live="polite">
      <div style={styles.badge}>
        <span style={styles.icon}>{icon}</span>
        <span style={styles.text} title={label}>{label}</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        style={styles.clearButton}
        title="Limpiar filtro"
        aria-label="Limpiar filtro actual"
      >
        ×
      </button>
    </div>
  );
});

FilterBadge.displayName = 'FilterBadge';
