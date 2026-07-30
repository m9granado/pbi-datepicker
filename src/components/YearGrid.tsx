import * as React from "react";

export interface YearGridProps {
  years: number[];
  selectedYears: number[];
  onSelectYear: (year: number) => void;
  currentYear?: number;
}

export const YearGrid: React.FC<YearGridProps> = ({
  years,
  selectedYears,
  onSelectYear,
  currentYear = new Date().getFullYear()
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
      {years.map(year => {
        const isSelected = selectedYears.includes(year);
        const isCurrent = year === currentYear;

        return (
          <button
            key={year}
            type="button"
            onClick={() => onSelectYear(year)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 6px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isSelected || isCurrent ? 600 : 400,
              border: isSelected ? '1px solid #007AFF' : (isCurrent ? '1px solid #007AFF' : '1px solid #E0E0E0'),
              backgroundColor: isSelected ? '#007AFF' : '#FAFAFA',
              color: isSelected ? '#FFFFFF' : '#333333',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
};
