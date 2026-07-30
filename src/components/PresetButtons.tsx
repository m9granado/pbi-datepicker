import * as React from "react";
import { PresetId } from "../core/presets";

export interface PresetButtonsProps {
  activePresetId?: PresetId;
  contrastColor?: string;
  visiblePresets: {
    thisPeriod?: boolean;
    prevPeriod?: boolean;
  };
  onPresetClick: (presetId: PresetId) => void;
}

interface PresetConfig {
  id: PresetId;
  label: string;
  tooltip: string;
}

const presetConfig: PresetConfig[] = [
  { id: "thisPeriod", label: "Este Período", tooltip: "Filtrar el período actual según la granularidad activa (Año/Mes/Día)" },
  { id: "prevPeriod", label: "Período Anterior", tooltip: "Filtrar el período anterior según la granularidad activa (Año/Mes/Día)" },
];

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: '0.25em',
    flexWrap: 'wrap',
    marginBottom: '0.5em'
  },
  button: {
    padding: '0.35em 0.75em',
    border: '1px solid #D1D1D6',
    borderRadius: '12px',
    background: '#FFFFFF',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: '0.8em',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative' as const
  },
  buttonActive: {
    background: '#007AFF',
    color: '#FFFFFF',
    borderColor: '#007AFF'
  },
  activeIndicator: {
    position: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    backgroundColor: '#34C759',
    borderRadius: '50%',
    border: '2px solid white'
  }
};

export const PresetButtons: React.FC<PresetButtonsProps> = React.memo(({
  activePresetId,
  contrastColor,
  visiblePresets,
  onPresetClick
}) => {
  const visibleButtons = presetConfig.filter(
    preset => visiblePresets[preset.id]
  );

  if (visibleButtons.length === 0) return null;

  const accent = contrastColor || "#2563EB";

  return (
    <div style={styles.container} role="group" aria-label="Filtros rápidos de fecha">
      {visibleButtons.map(preset => {
        const isActive = activePresetId === preset.id;
        const isPeriodPreset = preset.id === "thisPeriod" || preset.id === "prevPeriod";

        let buttonStyle: React.CSSProperties = { ...styles.button };
        if (isPeriodPreset) {
          buttonStyle = {
            ...buttonStyle,
            borderColor: accent,
            color: isActive ? "#FFFFFF" : accent,
            backgroundColor: isActive ? accent : `${accent}15`,
            fontWeight: 600
          };
        } else if (isActive) {
          buttonStyle = { ...buttonStyle, ...styles.buttonActive };
        }

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetClick(preset.id)}
            style={buttonStyle}
            aria-pressed={isActive}
            title={preset.tooltip}
            aria-label={`${preset.label}: ${preset.tooltip}`}
          >
            {isActive && <span style={styles.activeIndicator} aria-hidden="true" />}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
});

PresetButtons.displayName = 'PresetButtons';
