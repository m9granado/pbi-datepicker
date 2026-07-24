import * as React from "react";
import { ComparisonId } from "../core/presets";

export interface ComparisonBannerProps {
  comparisonId: ComparisonId;
  onDisable: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5em',
    padding: '0.75em',
    backgroundColor: '#FFFBEA',
    border: '1px solid #E0C550',
    borderRadius: '8px',
    marginBottom: '0.75em'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em'
  },
  warningIcon: {
    fontSize: '1.2em',
    color: '#E0C550'
  },
  title: {
    fontWeight: 600,
    fontSize: '0.9em',
    color: '#8B7355'
  },
  description: {
    fontSize: '0.8em',
    color: '#666666',
    lineHeight: 1.4,
    marginLeft: '1.7em'
  },
  actions: {
    display: 'flex',
    gap: '0.5em',
    marginLeft: '1.7em',
    marginTop: '0.25em'
  },
  disableButton: {
    padding: '0.35em 0.75em',
    border: '1px solid #E0C550',
    borderRadius: '4px',
    background: '#F9E692',
    color: '#8B7355',
    fontSize: '0.8em',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  helpLink: {
    padding: '0.35em 0.75em',
    border: 'none',
    background: 'transparent',
    color: '#007AFF',
    fontSize: '0.8em',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

const WarningIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0C550" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const comparisonDescriptions: Record<ComparisonId, { title: string; description: string }> = {
  mtdVsPmtd: {
    title: "MTD vs PMTD (Mes Actual vs Mes Anterior)",
    description: "Compara el mes actual (hasta hoy) con el mismo período del mes anterior. Para usar este modo, necesitas crear medidas DAX que separen los períodos en tu visual."
  },
  yoy: {
    title: "YoY (Año vs Año)",
    description: "Compara el mes completo actual con el mismo mes del año pasado. Requiere medidas DAX específicas para separar los datos de cada año."
  },
  ytdVsYtd: {
    title: "YTD vs YTD (Año a la Fecha)",
    description: "Compara el período desde enero hasta hoy con el mismo período del año anterior. Necesitarás implementar lógica DAX para filtrar correctamente cada período."
  }
};

export const ComparisonBanner: React.FC<ComparisonBannerProps> = React.memo(({
  comparisonId,
  onDisable
}) => {
  const info = comparisonDescriptions[comparisonId];

  const handleHelpClick = () => {
    // Open documentation in new tab
    window.open('https://github.com/your-repo/datex/docs/comparisons.md', '_blank');
  };

  return (
    <div 
      style={styles.container} 
      role="alert"
      aria-live="polite"
    >
      <div style={styles.header}>
        <span style={styles.warningIcon}>
          <WarningIcon />
        </span>
        <span style={styles.title}>{info.title}</span>
      </div>
      
      <div style={styles.description}>
        {info.description}
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          onClick={onDisable}
          style={styles.disableButton}
          title="Desactivar modo comparación y volver a filtros normales"
          aria-label="Desactivar modo comparación"
        >
          Desactivar modo comparación
        </button>
        <button
          type="button"
          onClick={handleHelpClick}
          style={styles.helpLink}
          title="Abrir documentación de implementación"
        >
          Ver guía de implementación →
        </button>
      </div>
    </div>
  );
});

ComparisonBanner.displayName = 'ComparisonBanner';
