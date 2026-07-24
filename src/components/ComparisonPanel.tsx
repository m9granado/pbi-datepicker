import * as React from "react";
import { ComparisonId } from "../core/presets";

export interface ComparisonPanelProps {
  activeComparisonId?: ComparisonId;
  showMTDvsPMTD?: boolean;
  showYoY?: boolean;
  showYTDvsYTD?: boolean;
  disabled?: boolean;
  onComparisonClick: (comparisonId: ComparisonId) => void;
}

interface ComparisonConfig {
  id: ComparisonId;
  label: string;
  title: string;
  description: string;
}

const comparisonConfig: ComparisonConfig[] = [
  { 
    id: "mtdVsPmtd", 
    label: "MTD vs PMTD",
    title: "Mes Actual vs Mes Anterior",
    description: "Compara el mes actual (hasta hoy) con el mismo período del mes anterior"
  },
  { 
    id: "yoy", 
    label: "YoY",
    title: "Año vs Año",
    description: "Compara el mes completo actual (o anterior si no está completo) con el mismo mes del año pasado"
  },
  { 
    id: "ytdVsYtd", 
    label: "YTD vs YTD",
    title: "Año a la Fecha",
    description: "Compara el período desde enero hasta hoy con el mismo período del año anterior"
  },
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
    border: '1px solid #E0C550',
    borderRadius: '12px',
    background: '#FFFBEA',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: '0.8em',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative' as const
  },
  buttonActive: {
    background: '#F9E692',
    color: '#000000',
    borderColor: '#E0C550',
    boxShadow: '0 0 0 2px rgba(224, 197, 80, 0.4)'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  activeIndicator: {
    position: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    backgroundColor: '#FF9500',
    borderRadius: '50%',
    border: '2px solid white'
  }
};

export const ComparisonPanel: React.FC<ComparisonPanelProps> = React.memo(({
  activeComparisonId,
  showMTDvsPMTD,
  showYoY,
  showYTDvsYTD,
  disabled = false,
  onComparisonClick
}) => {
  const visibleMap: Record<ComparisonId, boolean | undefined> = {
    mtdVsPmtd: showMTDvsPMTD,
    yoy: showYoY,
    ytdVsYtd: showYTDvsYTD
  };

  const visibleButtons = comparisonConfig.filter(
    comp => visibleMap[comp.id]
  );

  if (visibleButtons.length === 0) return null;

  return (
    <div style={styles.container} role="group" aria-label="Comparaciones de períodos">
      {visibleButtons.map(comp => {
        const isActive = activeComparisonId === comp.id;
        let buttonStyle = { ...styles.button };
        
        if (isActive) {
          buttonStyle = { ...buttonStyle, ...styles.buttonActive };
        }
        
        if (disabled) {
          buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
        }

        return (
          <button
            key={comp.id}
            type="button"
            onClick={() => onComparisonClick(comp.id)}
            style={buttonStyle}
            disabled={disabled}
            aria-pressed={isActive}
            title={`${comp.title}: ${comp.description}`}
            aria-label={`${comp.label}: ${comp.description}`}
          >
            {isActive && <span style={styles.activeIndicator} aria-hidden="true" />}
            {comp.label}
          </button>
        );
      })}
    </div>
  );
});

ComparisonPanel.displayName = 'ComparisonPanel';
