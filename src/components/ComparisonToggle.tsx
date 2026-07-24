import * as React from "react";

export interface ComparisonToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const styles: { [key: string]: React.CSSProperties } = {
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35em',
    userSelect: 'none' as const
  },
  track: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '26px',
    height: '15px',
    borderRadius: '8px',
    transition: 'background-color 0.15s ease-in-out',
    flexShrink: 0
  },
  thumb: {
    position: 'absolute' as const,
    top: '2px',
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    transition: 'left 0.15s ease-in-out'
  },
  text: {
    fontSize: '0.65rem',
    fontWeight: 600
  }
};

// Small iOS-style switch used to quickly turn on/off a "vs previous period"
// comparison anchored to whatever Y/M/D granularity is currently active.
export const ComparisonToggle: React.FC<ComparisonToggleProps> = React.memo(({
  checked,
  label,
  onChange,
  disabled = false
}) => {
  const trackStyle: React.CSSProperties = {
    ...styles.track,
    backgroundColor: checked ? '#FF9500' : '#D1D1D6',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  const thumbStyle: React.CSSProperties = {
    ...styles.thumb,
    left: checked ? '13px' : '2px'
  };

  const textStyle: React.CSSProperties = {
    ...styles.text,
    color: checked ? '#FF9500' : '#666666',
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  return (
    <label style={{ ...styles.label, cursor: disabled ? 'not-allowed' : 'pointer' }} title={`Comparar ${label} con el período anterior`}>
      <span
        role="switch"
        aria-checked={checked}
        aria-label={`Comparar con período anterior (${label})`}
        onClick={() => !disabled && onChange(!checked)}
        style={trackStyle}
      >
        <span style={thumbStyle} />
      </span>
      <span style={textStyle} onClick={() => !disabled && onChange(!checked)}>{label}</span>
    </label>
  );
});

ComparisonToggle.displayName = 'ComparisonToggle';
