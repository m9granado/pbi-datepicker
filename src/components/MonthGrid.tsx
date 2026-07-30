import * as React from "react";

export interface MonthGridItem {
  value: string;
  label: string;
  year: number;
  month: number;
}

export const buildMonthItems = (monthsBack: number, monthsForward: number): MonthGridItem[] => {
  const months: MonthGridItem[] = [];
  const today = new Date();

  for (let i = 0; i >= -monthsBack; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(date);
    months.push({ value, label, year: date.getFullYear(), month: date.getMonth() });
  }

  for (let i = 1; i <= monthsForward; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(date);
    months.push({ value, label, year: date.getFullYear(), month: date.getMonth() });
  }

  // Most recent year first, but months within a year run January -> December.
  return months.sort((a, b) => (a.year !== b.year ? b.year - a.year : a.month - b.month));
};

export const getTodayMonthValue = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export interface MonthGridProps {
  months: MonthGridItem[];
  selected: string[];
  onToggle: (value: string) => void;
  onToggleYear?: (yearValues: string[]) => void;
  columns?: number;
  minDate?: Date;
  maxDate?: Date;
}

const isMonthDisabled = (m: MonthGridItem, minDate?: Date, maxDate?: Date): boolean => {
  const lastDay = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);
  const firstDay = new Date(m.year, m.month, 1, 0, 0, 0, 0);
  return (!!minDate && lastDay < minDate) || (!!maxDate && firstDay > maxDate);
};

// Reusable "checkbox grid of months grouped by year" - shared by the
// per-month Power BI host dialog and the full popup-mode host dialog, so
// both stay visually/behaviorally consistent without duplicating the markup.
export const MonthGrid: React.FC<MonthGridProps> = ({ months, selected, onToggle, onToggleYear, columns = 4, minDate, maxDate }) => {
  const todayValue = getTodayMonthValue();

  const grouped = React.useMemo(() => {
    const groups: { [year: number]: MonthGridItem[] } = {};
    months.forEach(m => {
      if (!groups[m.year]) groups[m.year] = [];
      groups[m.year].push(m);
    });
    return groups;
  }, [months]);

  return (
    <div>
      {Object.entries(grouped).map(([year, ms]) => {
        const selectableValues = ms.filter(m => !isMonthDisabled(m, minDate, maxDate)).map(m => m.value);
        const allSelected = selectableValues.length > 0 && selectableValues.every(v => selected.includes(v));
        const yearToggleDisabled = selectableValues.length === 0;
        return (
        <div key={year} style={{ marginBottom: 12 }}>
          <div
            onClick={onToggleYear && !yearToggleDisabled ? () => onToggleYear(selectableValues) : undefined}
            role={onToggleYear ? "checkbox" : undefined}
            aria-checked={onToggleYear ? allSelected : undefined}
            aria-disabled={yearToggleDisabled}
            title={onToggleYear ? (yearToggleDisabled ? `${year} fuera de rango` : `Click para seleccionar/deseleccionar todo ${year}`) : undefined}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: allSelected ? '#FFFFFF' : '#666666',
              background: allSelected ? '#007AFF' : '#F5F5F5',
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 6,
              cursor: onToggleYear && !yearToggleDisabled ? 'pointer' : 'default',
              opacity: yearToggleDisabled ? 0.4 : 1,
              userSelect: 'none'
            }}
          >
            <span>{year}</span>
            {onToggleYear && <span style={{ fontSize: 10, opacity: 0.8 }}>{allSelected ? '✓ año completo' : 'seleccionar año'}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
            {ms.map(m => {
              const isSelected = selected.includes(m.value);
              const isCurrent = m.value === todayValue;
              const isDisabled = isMonthDisabled(m, minDate, maxDate);
              return (
                <div
                  key={m.value}
                  onClick={() => !isDisabled && onToggle(m.value)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-disabled={isDisabled}
                  title={`${m.label} ${year}${isCurrent ? ' (actual)' : ''}${isDisabled ? ' (sin datos)' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    borderRadius: 4,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    border: isCurrent && !isSelected ? '1px solid #007AFF' : '1px solid transparent',
                    fontWeight: isCurrent && !isSelected ? 700 : 400,
                    backgroundColor: isSelected ? '#007AFF' : '#F7F7F7',
                    color: isSelected ? '#FFFFFF' : '#333333',
                    opacity: isDisabled ? 0.35 : 1,
                    transition: 'all 0.1s ease'
                  }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
};
