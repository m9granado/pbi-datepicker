import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { formatMonthYear, isRangeMatch } from "../utils/dateHelpers";
import { GranularitySelector, GranularityMode } from "./GranularitySelector";
import { MonthPickerDialog, PeriodPickerResult } from "../dialogs/MonthPickerDialog";
import { PresetId, getRange } from "../core/presets";

export interface MonthSelectorProps {
  host: powerbi.extensibility.visual.IVisualHost;
  navMonth?: Date;
  from?: Date;
  to?: Date;
  selectedMonths?: string[];
  showSelectionBadge?: boolean;
  disabled?: boolean;
  granularity?: GranularityMode;
  showGranularityYear?: boolean;
  showGranularityMonth?: boolean;
  showGranularityDay?: boolean;
  activePresetId?: PresetId;
  showThisPeriod?: boolean;
  showPrevPeriod?: boolean;
  periodContrastColor?: string;
  onPresetClick?: (presetId: PresetId) => void;
  onGranularityChange?: (mode: GranularityMode) => void;
  onNavigatePeriod?: (direction: 1 | -1) => void;
  onNavigateYear?: (direction: 1 | -1) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthsSelected: (months: string[]) => void;
  onPeriodResultSelected?: (result: PeriodPickerResult) => void;
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
  singleRowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4em',
    flexWrap: 'wrap',
    width: '100%',
    margin: '0.25em 0'
  },
  quickPeriodContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: '6px',
    padding: '2px',
    gap: '2px',
    border: '1px solid #E5E5EA',
    userSelect: 'none'
  },
  quickPeriodButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    height: '19px',
    borderRadius: '4px',
    border: '1px solid transparent',
    fontSize: '0.65rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    outline: 'none'
  },
  periodNavigationBlock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25em',
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap'
  },
  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.8em',
    height: '1.8em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#F8F8F8',
    color: '#555555',
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
    height: '1.8em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#FAFAFA',
    color: '#777777',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.85em'
  },
  monthDisplay: {
    padding: '0.3em 0.6em',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#FAFAFA',
    color: '#333333',
    fontFamily: 'inherit',
    fontSize: '0.88em',
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
  from,
  to,
  selectedMonths = [],
  showSelectionBadge = false,
  disabled = false,
  granularity = "M",
  showGranularityYear = true,
  showGranularityMonth = true,
  showGranularityDay = true,
  activePresetId,
  showThisPeriod = true,
  showPrevPeriod = true,
  periodContrastColor,
  onPresetClick,
  onGranularityChange,
  onNavigatePeriod,
  onNavigateYear,
  onPrevMonth,
  onNextMonth,
  onMonthsSelected,
  onPeriodResultSelected,
  monthsBack = 36,
  monthsForward = 6
}) => {
  const dialogSupported = host.hostCapabilities?.allowModalDialog !== false;
  const accentColor = periodContrastColor || "#2563EB";

  const currentGranularity = granularity || "M";
  const thisRange = getRange("thisPeriod", currentGranularity);
  const prevRange = getRange("prevPeriod", currentGranularity);

  const activeFrom = from || navMonth;
  const activeTo = to || navMonth;

  const isThisPeriodActive = activePresetId === "thisPeriod" || isRangeMatch(activeFrom, activeTo, thisRange.from, thisRange.to);
  const isPrevPeriodActive = activePresetId === "prevPeriod" || isRangeMatch(activeFrom, activeTo, prevRange.from, prevRange.to);

  const getDisplayText = (): string => {
    if (selectedMonths.length > 1) {
      return `${selectedMonths.length} meses`;
    }
    if (selectedMonths.length === 1) {
      const [year, month] = selectedMonths[0].split('-').map(Number);
      const targetDate = new Date(year, month - 1, 1);
      return formatMonthYear(targetDate, 'es-CL');
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

  const handlePrevYear = () => {
    if (onNavigateYear) {
      onNavigateYear(-1);
    } else {
      for (let i = 0; i < 12; i++) onPrevMonth();
    }
  };

  const handleNextYear = () => {
    if (onNavigateYear) {
      onNavigateYear(1);
    } else {
      for (let i = 0; i < 12; i++) onNextMonth();
    }
  };

  const handleOpenMonthPicker = () => {
    if (!dialogSupported) return;

    const dialogTitle = granularity === "Y"
      ? "Seleccionar Año"
      : (granularity === "D" ? "Seleccionar Día" : "Seleccionar Mes");

    const dialogHeight = granularity === "D" ? 380 : (granularity === "Y" ? 340 : 420);

    const currentDateStr = (from || navMonth || new Date()).toISOString();

    host.openModalDialog(
      MonthPickerDialog.id,
      {
        title: dialogTitle,
        size: { width: 320, height: dialogHeight },
        position: { type: powerbi.VisualDialogPositionType.RelativeToVisual, left: 0, top: 30 },
        actionButtons: [powerbi.DialogAction.OK, powerbi.DialogAction.Cancel]
      },
      {
        selectedMonths,
        monthsBack,
        monthsForward,
        singleSelect: granularity === "M" || granularity === "Y" || granularity === "D",
        granularity,
        currentDate: currentDateStr
      }
    ).then((result: powerbi.extensibility.visual.ModalDialogResult) => {
      if (result.actionId === powerbi.DialogAction.OK) {
        const resultState = result.resultState as PeriodPickerResult | undefined;
        if (onPeriodResultSelected && resultState) {
          onPeriodResultSelected(resultState);
        } else if (resultState?.selectedMonths) {
          onMonthsSelected(resultState.selectedMonths);
        }
      }
    }).catch(() => {
    });
  };

  return (
    <div style={styles.singleRowContainer}>
      {/* CP / PP Quick Period Selector */}
      {(showThisPeriod || showPrevPeriod) && onPresetClick && (
        <div style={styles.quickPeriodContainer} role="group" aria-label="Selección rápida de período">
          {showThisPeriod && (
            <button
              type="button"
              onClick={() => onPresetClick("thisPeriod")}
              style={{
                ...styles.quickPeriodButton,
                ...(isThisPeriodActive ? {
                  backgroundColor: accentColor,
                  color: '#FFFFFF',
                  borderColor: accentColor
                } : {
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                  borderColor: `${accentColor}40`
                }),
                ...(disabled ? styles.navButtonDisabled : {})
              }}
              disabled={disabled}
              title="Este Período (CP) - según granularidad (Año/Mes/Día)"
              aria-label="Este Período (CP)"
            >
              CP
            </button>
          )}
          {showPrevPeriod && (
            <button
              type="button"
              onClick={() => onPresetClick("prevPeriod")}
              style={{
                ...styles.quickPeriodButton,
                ...(isPrevPeriodActive ? {
                  backgroundColor: accentColor,
                  color: '#FFFFFF',
                  borderColor: accentColor
                } : {
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                  borderColor: `${accentColor}40`
                }),
                ...(disabled ? styles.navButtonDisabled : {})
              }}
              disabled={disabled}
              title="Período Anterior (PP) - según granularidad (Año/Mes/Día)"
              aria-label="Período Anterior (PP)"
            >
              PP
            </button>
          )}
        </div>
      )}

      {/* Granularity Selector (Y / M / D) */}
      {onGranularityChange && (
        <GranularitySelector
          activeMode={granularity}
          onModeChange={onGranularityChange}
          disabled={disabled}
          showYear={showGranularityYear}
          showMonth={showGranularityMonth}
          showDay={showGranularityDay}
        />
      )}

      {/* Unbreakable Period Navigation Block: << < [ Month ] > >> */}
      <div style={styles.periodNavigationBlock}>
        {/* Year navigation - previous year / 5-year step (<<) */}
        <button
          title={granularity === "Y" ? "5 años atrás" : "Año anterior"}
          type="button"
          onClick={handlePrevYear}
          style={disabled ? { ...styles.yearNavButton, ...styles.navButtonDisabled } : styles.yearNavButton}
          disabled={disabled}
          aria-label="Ir al año anterior"
        >
          <DoubleChevronLeft />
        </button>

        {/* Period navigation - previous period (<) */}
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

        {/* Period display button */}
        <div style={styles.dropdownContainer}>
          <button
            type="button"
            onClick={handleOpenMonthPicker}
            style={styles.monthDisplay}
            title={dialogSupported ? "Click para seleccionar período" : "Selección de período no disponible"}
            aria-label="Selector de período"
            disabled={disabled || !dialogSupported}
          >
            {getDisplayText()}
            {showSelectionBadge && selectedMonths.length > 1 && (
              <span style={styles.selectionBadge}>{selectedMonths.length}</span>
            )}
          </button>
        </div>

        {/* Period navigation - next period (>) */}
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

        {/* Year navigation - next year / 5-year step (>>) */}
        <button
          title={granularity === "Y" ? "5 años adelante" : "Año siguiente"}
          type="button"
          onClick={handleNextYear}
          style={disabled ? { ...styles.yearNavButton, ...styles.navButtonDisabled } : styles.yearNavButton}
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
