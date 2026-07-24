import * as React from "react";

export type GranularityMode = "Y" | "M" | "D";

export interface GranularitySelectorProps {
  activeMode: GranularityMode;
  onModeChange: (mode: GranularityMode) => void;
  disabled?: boolean;
  showYear?: boolean;
  showMonth?: boolean;
  showDay?: boolean;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: '6px',
    padding: '2px',
    gap: '2px',
    border: '1px solid #E5E5EA',
    userSelect: 'none'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '19px',
    height: '19px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    color: '#666666',
    fontSize: '0.65rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    outline: 'none'
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0, 122, 255, 0.3)'
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed'
  }
};

export const GranularitySelector: React.FC<GranularitySelectorProps> = React.memo(({
  activeMode,
  onModeChange,
  disabled = false,
  showYear = true,
  showMonth = true,
  showDay = true
}) => {
  const allModes: { id: GranularityMode; label: string; tooltip: string; visible: boolean }[] = [
    { id: "Y", label: "Y", tooltip: "Navegar por Años (Year)", visible: showYear },
    { id: "M", label: "M", tooltip: "Navegar por Meses (Month)", visible: showMonth },
    { id: "D", label: "D", tooltip: "Navegar por Días (Day)", visible: showDay }
  ];
  const modes = allModes.filter(m => m.visible);

  // Nothing to choose between - no point showing a single-option radio group.
  if (modes.length <= 1) return null;

  return (
    <div style={styles.container} role="radiogroup" aria-label="Granularidad de navegación">
      {modes.map(mode => {
        const isActive = activeMode === mode.id;
        const btnStyle: React.CSSProperties = {
          ...styles.button,
          ...(isActive ? styles.buttonActive : {}),
          ...(disabled ? styles.buttonDisabled : {})
        };

        return (
          <button
            key={mode.id}
            type="button"
            style={btnStyle}
            onClick={() => !disabled && onModeChange(mode.id)}
            disabled={disabled}
            title={mode.tooltip}
            aria-checked={isActive}
            role="radio"
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
});

GranularitySelector.displayName = 'GranularitySelector';
