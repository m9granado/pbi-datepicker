import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { formatMonthYear } from "../utils/dateHelpers";
import { GranularitySelector, GranularityMode } from "./GranularitySelector";
import { MonthPickerDialog } from "../dialogs/MonthPickerDialog";

export interface MonthSelectorProps {
  host: powerbi.extensibility.visual.IVisualHost;
  navMonth?: Date;
  selectedMonths?: string[];
  showSelectionBadge?: boolean;
  disabled?: boolean;
  granularity?: GranularityMode;
  showGranularityYear?: boolean;
  showGranularityMonth?: boolean;
  showGranularityDay?: boolean;
  onGranularityChange?: (mode: GranularityMode) => void;
  onNavigatePeriod?: (direction: 1 | -1) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthsSelected: (months: string[]) => void;
  // New year navigation props
  monthsBack?: number;
  monthsForward?: number;
}

const ChevronLeft: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleChevronLeft: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M9 2L5 6L9 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 2L1 6L5 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleChevronRight: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M3 2L7 6L3 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 2L11 6L7 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const styles: { [key: string]: React.CSSProperties } = {
  granularityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25em',
    flexWrap: 'nowrap',
    marginBottom: '0.35em',
    justifyContent: 'center'
  },
  navigationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25em',
    flexWrap: 'nowrap',
    marginBottom: '0.5em',
    justifyContent: 'center'
  },
  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#F8F8F8',
    color: '#666666',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed'
  },
  yearNavButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.8em',
    height: '2em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#FAFAFA',
    color: '#888888',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.9em'
  },
  monthDisplay: {
    padding: '0.35em 0.7em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#FAFAFA',
    color: '#555555',
    fontFamily: 'inherit',
    fontSize: '0.9em',
    fontWeight: 600,
    minWidth: '4.5em',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative' as const,
    userSelect: 'none' as const
  },
  selectionBadge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: '0.65em',
    fontWeight: 'bold',
    padding: '1px 4px',
    borderRadius: '8px',
    minWidth: '14px'
  },
  dropdownContainer: {
    position: 'relative' as const
  }
};

export const MonthSelector: React.FC<MonthSelectorProps> = React.memo(({
  host,
  navMonth,
  selectedMonths = [],
  showSelectionBadge = false,
  disabled = false,
  granularity = "M",
  showGranularityYear = true,
  showGranularityMonth = true,
  showGranularityDay = true,
  onGranularityChange,
  onNavigatePeriod,
  onPrevMonth,
  onNextMonth,
  onMonthsSelected,
  monthsBack = 36,
  monthsForward = 6
}) => {
  const dialogSupported = host.hostCapabilities?.allowModalDialog !== false;

  const getDisplayText = (): string => {
    if (selectedMonths.length > 0) {
      return `${selectedMonths.length} mes${selectedMonths.length > 1 ? 'es' : ''}`;
    }
    const targetDate = navMonth || new Date();
    if (granularity === "Y") {
      return targetDate.getFullYear().toString();
    }
    if (granularity === "D") {
      return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(targetDate);
    }
    return formatMonthYear(targetDate, 'es-CL');
  };

  const prevButtonStyle = disabled
    ? { ...styles.navButton, ...styles.navButtonDisabled }
    : styles.navButton;

  const handlePrev = () => {
    if (onNavigatePeriod) {
      onNavigatePeriod(-1);
    } else {
      onPrevMonth();
    }
  };

  const handleNext = () => {
    if (onNavigatePeriod) {
      onNavigatePeriod(1);
    } else {
      onNextMonth();
    }
  };

  // Opens the month picker as a true Power BI host dialog (grays the whole
  // report and renders above everything), instead of an in-visual popover
  // that would be clipped by the visual's own sandboxed bounding box.
  const handleOpenMonthPicker = () => {
    if (!dialogSupported) return;

    host.openModalDialog(
      MonthPickerDialog.id,
      {
        title: "Seleccionar Meses",
        size: { width: 320, height: 420 },
        position: { type: powerbi.VisualDialogPositionType.RelativeToVisual, left: 0, top: 30 },
        actionButtons: [powerbi.DialogAction.OK, powerbi.DialogAction.Cancel]
      },
      { selectedMonths, monthsBack, monthsForward }
    ).then((result: powerbi.extensibility.visual.ModalDialogResult) => {
      // OK applies the latest selection; Cancel discards and leaves the
      // current selection untouched.
      if (result.actionId === powerbi.DialogAction.OK) {
        const resultState = result.resultState as { selectedMonths?: string[] } | undefined;
        onMonthsSelected(resultState?.selectedMonths || []);
      }
    }).catch(() => {
      // Dialog unavailable in this host environment (e.g. Embed/Dashboards) - no-op.
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Row 1: Granularity mode selector (Y / M / D) */}
      {onGranularityChange && (
        <div style={styles.granularityRow}>
          <GranularitySelector
            activeMode={granularity}
            onModeChange={onGranularityChange}
            disabled={disabled}
            showYear={showGranularityYear}
            showMonth={showGranularityMonth}
            showDay={showGranularityDay}
          />
        </div>
      )}

      {/* Row 2: period navigation - < month > */}
      <div style={styles.navigationRow}>
        {/* Year navigation - previous year */}
        <button
          title="Año anterior"
          type="button"
          onClick={() => {
            if (onNavigatePeriod && granularity === "Y") {
              onNavigatePeriod(-1);
            } else {
              for (let i = 0; i < 12; i++) onPrevMonth();
            }
          }}
          style={styles.yearNavButton}
          disabled={disabled}
          aria-label="Ir al año anterior"
        >
          <DoubleChevronLeft />
        </button>

        {/* Navigation - previous period */}
        <button
          title={`Período anterior (${granularity})`}
          type="button"
          onClick={handlePrev}
          style={prevButtonStyle}
          disabled={disabled}
          aria-label="Período anterior"
        >
          <ChevronLeft />
        </button>

        {/* Month selector - opens the native Power BI host dialog */}
        <div style={styles.dropdownContainer}>
          <button
            type="button"
            onClick={handleOpenMonthPicker}
            style={styles.monthDisplay}
            title={dialogSupported ? "Click para seleccionar múltiples meses" : "Selección de múltiples meses no disponible en este entorno"}
            aria-label="Selector de período"
            disabled={disabled || !dialogSupported}
          >
            {getDisplayText()}
            {showSelectionBadge && selectedMonths.length > 0 && (
              <span style={styles.selectionBadge}>{selectedMonths.length}</span>
            )}
          </button>
        </div>

        {/* Navigation - next period */}
        <button
          title={`Período siguiente (${granularity})`}
          type="button"
          onClick={handleNext}
          style={prevButtonStyle}
          disabled={disabled}
          aria-label="Período siguiente"
        >
          <ChevronRight />
        </button>

        {/* Year navigation - next year */}
        <button
          title="Año siguiente"
          type="button"
          onClick={() => {
            if (onNavigatePeriod && granularity === "Y") {
              onNavigatePeriod(1);
            } else {
              for (let i = 0; i < 12; i++) onNextMonth();
            }
          }}
          style={styles.yearNavButton}
          disabled={disabled}
          aria-label="Ir al año siguiente"
        >
          <DoubleChevronRight />
        </button>
      </div>
    </div>
  );
});

MonthSelector.displayName = 'MonthSelector';
