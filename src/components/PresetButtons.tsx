import * as React from "react";
import { PresetId } from "../core/presets";

export interface PresetButtonsProps {
  activePresetId?: PresetId;
  visiblePresets: {
    today?: boolean;
    yesterday?: boolean;
    thisWeek?: boolean;
    lastWeek?: boolean;
    last7?: boolean;
    last30?: boolean;
    last90?: boolean;
    thisMonth?: boolean;
    prevMonth?: boolean;
    thisYear?: boolean;
  };
  onPresetClick: (presetId: PresetId) => void;
}

interface PresetConfig {
  id: PresetId;
  label: string;
  tooltip: string;
}

const presetConfig: PresetConfig[] = [
  { id: "today", label: "Hoy", tooltip: "Filtrar solo el día de hoy" },
  { id: "yesterday", label: "Ayer", tooltip: "Filtrar solo el día de ayer" },
  { id: "thisWeek", label: "Esta Semana", tooltip: "Filtrar desde el domingo de esta semana hasta hoy" },
  { id: "lastWeek", label: "Semana Pasada", tooltip: "Filtrar la semana completa anterior (domingo a sábado)" },
  { id: "last7", label: "Últimos 7 Días", tooltip: "Filtrar los últimos 7 días incluyendo hoy" },
  { id: "last30", label: "Últimos 30 Días", tooltip: "Filtrar los últimos 30 días incluyendo hoy" },
  { id: "last90", label: "Últimos 90 Días", tooltip: "Filtrar los últimos 90 días incluyendo hoy" },
  { id: "thisMonth", label: "Este Mes", tooltip: "Filtrar desde el 1° de este mes hasta el último día" },
  { id: "prevMonth", label: "Mes Pasado", tooltip: "Filtrar el mes completo anterior" },
  { id: "thisYear", label: "Este Año", tooltip: "Filtrar desde el 1° de enero hasta el 31 de diciembre" },
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
  visiblePresets,
  onPresetClick
}) => {
  const visibleButtons = presetConfig.filter(
    preset => visiblePresets[preset.id]
  );

  if (visibleButtons.length === 0) return null;

  return (
    <div style={styles.container} role="group" aria-label="Filtros rápidos de fecha">
      {visibleButtons.map(preset => {
        const isActive = activePresetId === preset.id;
        const buttonStyle = isActive 
          ? { ...styles.button, ...styles.buttonActive }
          : styles.button;

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
