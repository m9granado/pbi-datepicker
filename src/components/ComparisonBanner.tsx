import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { ComparisonId } from "../core/presets";
import { ComparisonInfoDialog } from "../dialogs/ComparisonInfoDialog";

export interface ComparisonBannerProps {
  host: powerbi.extensibility.visual.IVisualHost;
  comparisonId: ComparisonId;
  granularityLabel?: string;
  onDisable: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4em',
    padding: '0.35em 0.6em',
    backgroundColor: '#FFFBEA',
    border: '1px solid #E0C550',
    borderRadius: '14px',
    marginBottom: '0.5em',
    fontSize: '0.8em'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35em',
    color: '#8B7355',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    border: 'none',
    background: 'transparent',
    color: '#8B7355',
    cursor: 'pointer',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0
  },
  closeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    border: 'none',
    background: 'transparent',
    color: '#8B7355',
    cursor: 'pointer',
    borderRadius: '50%',
    fontSize: '14px',
    lineHeight: 1,
    flexShrink: 0
  }
};

const comparisonInfo: Record<ComparisonId, { title: string; description: string }> = {
  mtdVsPmtd: {
    title: "MTD vs PMTD",
    description: "Compara el mes actual (hasta hoy) con el mismo período del mes anterior."
  },
  yoy: {
    title: "YoY",
    description: "Compara el mes completo actual con el mismo mes del año pasado."
  },
  ytdVsYtd: {
    title: "YTD vs YTD",
    description: "Compara el período desde enero hasta hoy con el mismo período del año anterior."
  },
  vsPrevious: {
    title: "vs. Período Anterior",
    description: "Compara el período actual (según la granularidad Y/M/D activa) con el equivalente inmediatamente anterior."
  }
};

// Compact single-line chip - replaces the old always-expanded warning box
// that ate most of the visual's limited canvas space. Full explanation now
// lives in a host dialog (see ComparisonInfoDialog), opened on demand via
// the "ⓘ" button, so it doesn't cost any canvas space until asked for.
export const ComparisonBanner: React.FC<ComparisonBannerProps> = React.memo(({
  host,
  comparisonId,
  granularityLabel,
  onDisable
}) => {
  const info = comparisonInfo[comparisonId];
  const title = comparisonId === "vsPrevious" && granularityLabel ? granularityLabel : info.title;

  const handleInfoClick = () => {
    host.openModalDialog(
      ComparisonInfoDialog.id,
      {
        title: "Modo Comparación",
        size: { width: 320, height: 260 },
        position: { type: powerbi.VisualDialogPositionType.Center },
        actionButtons: [powerbi.DialogAction.OK]
      },
      { title, description: info.description }
    ).catch(() => {
      // Dialog unavailable in this host environment (e.g. Embed/Dashboards) - no-op.
    });
  };

  return (
    <div style={styles.container} role="status" aria-live="polite">
      <span style={styles.label} title={info.description}>
        🔄 {title} activo
      </span>
      <button
        type="button"
        onClick={handleInfoClick}
        style={styles.iconButton}
        title="Qué significa este modo"
        aria-label="Ver información del modo comparación"
      >
        ⓘ
      </button>
      <button
        type="button"
        onClick={onDisable}
        style={styles.closeButton}
        title="Desactivar modo comparación"
        aria-label="Desactivar modo comparación"
      >
        ×
      </button>
    </div>
  );
});

ComparisonBanner.displayName = 'ComparisonBanner';
