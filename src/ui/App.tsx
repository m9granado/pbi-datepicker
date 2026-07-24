import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { ColumnTarget } from "../core/filters";
import { useDateFilter } from "../hooks/useDateFilter";
import { PresetId, ComparisonId } from "../core/presets";
import {
  DateInputs,
  PresetButtons,
  ComparisonPanel,
  MonthSelector,
  ActivityLog,
  FilterBadge,
  ComparisonBanner,
  GranularityMode
} from "../components";
import { getDisplayToDate, toISOInput } from "../utils/dateHelpers";
import { DatePickerDialog, DatePickerDialogResult } from "../dialogs/DatePickerDialog";

export interface AppProps {
  host: powerbi.extensibility.visual.IVisualHost;
  buttonText: string;
  displayMode?: "canvas" | "popup";
  minDate?: Date;
  maxDate?: Date;
  target: ColumnTarget | undefined;
  mode: "filter" | "highlight";
  category?: powerbi.DataViewCategoryColumn;
  showLog?: boolean;
  showButtonLabels?: boolean;
  showSelectedPeriodBadge?: boolean;
  fontSize?: number;
  fontFamily?: string;
  viewportHeight?: number;
  viewportWidth?: number;
  showToday?: boolean;
  showYesterday?: boolean;
  showThisWeek?: boolean;
  showLastWeek?: boolean;
  showLast7?: boolean;
  showLast30?: boolean;
  showLast90?: boolean;
  showThisMonth?: boolean;
  showPrevMonth?: boolean;
  showThisYear?: boolean;
  enableVersus?: boolean;
  showMTDvsPMTD?: boolean;
  showYoY?: boolean;
  showYTDvsYTD?: boolean;
  enableDateInputs?: boolean;
  enableMonthNavigation?: boolean;
  showGranularityYear?: boolean;
  showGranularityMonth?: boolean;
  showGranularityDay?: boolean;
  showMonthSelectionBadge?: boolean;
}

// Picks a sensible active granularity when the current one has been hidden
// via the format pane (e.g. user turns off "M" but state still says "M").
// Prefers Month, then Year, then Day, since Month is the most common default.
const resolveGranularity = (
  current: GranularityMode | undefined,
  showYear: boolean,
  showMonth: boolean,
  showDay: boolean
): GranularityMode => {
  const visible = { Y: showYear, M: showMonth, D: showDay };
  if (current && visible[current]) return current;
  if (showMonth) return "M";
  if (showYear) return "Y";
  if (showDay) return "D";
  return "M";
};

// Map preset IDs to display labels
const presetLabels: Record<PresetId, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  thisWeek: "Esta Semana",
  lastWeek: "Semana Pasada",
  last7: "Últimos 7 Días",
  last30: "Últimos 30 Días",
  last90: "Últimos 90 Días",
  thisMonth: "Este Mes",
  prevMonth: "Mes Pasado",
  thisYear: "Este Año"
};

// Map comparison IDs to display labels
const comparisonLabels: Record<ComparisonId, string> = {
  mtdVsPmtd: "MTD vs PMTD",
  yoy: "YoY",
  ytdVsYtd: "YTD vs YTD",
  vsPrevious: "vs. Período Anterior"
};

// Compact label for the quick "vs previous period" toggle, matching the
// currently active Y/M/D granularity.
const vsPreviousLabelFor = (granularity: GranularityMode): string => {
  if (granularity === "Y") return "YoY";
  if (granularity === "D") return "DoD";
  return "MoM";
};

export const App: React.FC<AppProps> = (props) => {
  const {
    target,
    buttonText,
    displayMode = "canvas",
    minDate,
    maxDate,
    showLog,
    showButtonLabels,
    showSelectedPeriodBadge = true,
    fontSize, 
    fontFamily,
    viewportHeight = 300,
    enableDateInputs,
    enableMonthNavigation,
    showGranularityYear = true,
    showGranularityMonth = true,
    showGranularityDay = true,
    showMonthSelectionBadge,
    enableVersus,
    showToday,
    showYesterday,
    showThisWeek,
    showLastWeek,
    showLast7,
    showLast30,
    showLast90,
    showThisMonth,
    showPrevMonth,
    showThisYear,
    showMTDvsPMTD,
    showYoY,
    showYTDvsYTD
  } = props;

  const {
    state,
    logs,
    setDateRange,
    applyPreset,
    applyComparison,
    clearFilter,
    navigateMonth,
    navigatePeriod,
    setGranularityMode,
    applyMonthsFromDialog,
    applyDialogResult,
    toggleVsPrevious,
    disableComparisonMode
  } = useDateFilter({
    host: props.host,
    target,
    showLog
  });

  // Handle date input changes with auto-swap support
  const handleFromChange = (date?: Date) => {
    setDateRange(date, state.to);
  };

  const handleToChange = (date?: Date) => {
    setDateRange(state.from, date);
  };

  // Get display date for "to" field (handles "today" logic)
  const displayToDate = getDisplayToDate(state.to, state.presetId);

  // Get label for active preset
  const activePresetLabel = state.presetId ? presetLabels[state.presetId] : undefined;
  
  // Get label for active comparison
  const activeComparisonLabel = state.comparisonId ? comparisonLabels[state.comparisonId] : undefined;

  const dialogSupported = props.host.hostCapabilities?.allowModalDialog !== false;

  const effectiveGranularity = resolveGranularity(state.granularity, showGranularityYear, showGranularityMonth, showGranularityDay);

  // Popup mode: instead of rendering the full picker inline (clipped by the
  // visual's own sandboxed bounding box), open the entire UI as a native
  // Power BI host dialog - painted by the host above the whole report.
  const handleOpenPopup = () => {
    if (!dialogSupported) return;

    props.host.openModalDialog(
      DatePickerDialog.id,
      {
        title: buttonText || "DateX",
        size: { width: 340, height: 480 },
        position: { type: 0 /* Center */ },
        actionButtons: [1 /* DialogAction.OK */, 2 /* DialogAction.Cancel */]
      },
      {
        from: toISOInput(state.from) || undefined,
        to: toISOInput(displayToDate) || undefined,
        presetId: state.presetId,
        comparisonId: state.comparisonId,
        selectedMonths: state.selectedMonths,
        minDate: toISOInput(minDate) || undefined,
        maxDate: toISOInput(maxDate) || undefined,
        enableDateInputs,
        enableMonthNavigation,
        enableVersus,
        monthsBack: 36,
        monthsForward: 6,
        visiblePresets: {
          today: showToday,
          yesterday: showYesterday,
          thisWeek: showThisWeek,
          lastWeek: showLastWeek,
          last7: showLast7,
          last30: showLast30,
          last90: showLast90,
          thisMonth: showThisMonth,
          prevMonth: showPrevMonth,
          thisYear: showThisYear
        },
        showMTDvsPMTD,
        showYoY,
        showYTDvsYTD
      }
    ).then((result: powerbi.extensibility.visual.ModalDialogResult) => {
      if (result.actionId === 1 /* OK */) {
        applyDialogResult(result.resultState as DatePickerDialogResult);
      }
    }).catch(() => {
      // Dialog unavailable in this host environment (e.g. Embed/Dashboards) - no-op.
    });
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    fontSize: fontSize && fontSize > 0 ? `${fontSize}px` : '12px',
    fontFamily: fontFamily || 'Segoe UI, sans-serif',
    background: '#FFFFFF',
    padding: '6px',
    color: '#1D1D1F',
    minHeight: '80px'
  };

  // Popup mode: render just a compact trigger + current-selection badge;
  // the actual picker only exists inside the host dialog opened above.
  if (displayMode === "popup") {
    return (
      <div className="pbi-datepicker card" style={{ ...containerStyle, minHeight: 'auto' }}>
        <button
          type="button"
          onClick={handleOpenPopup}
          disabled={!dialogSupported}
          title={dialogSupported ? "Click para abrir el selector de fechas" : "No disponible en este entorno (Embed/Dashboards)"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            width: '100%',
            padding: '0.5em 0.75em',
            border: '1px solid #D1D1D6',
            borderRadius: '6px',
            background: '#FFFFFF',
            color: '#1D1D1F',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            cursor: dialogSupported ? 'pointer' : 'not-allowed',
            opacity: dialogSupported ? 1 : 0.5
          }}
        >
          📅 {buttonText || "DateX"}
        </button>
        {showSelectedPeriodBadge && !state.comparisonId && (
          <FilterBadge
            mode={state.mode}
            from={state.from}
            to={displayToDate}
            presetLabel={activePresetLabel}
            comparisonLabel={activeComparisonLabel}
            selectedMonthsCount={state.selectedMonths?.length}
            onClear={clearFilter}
          />
        )}
        {state.comparisonId && (
          <ComparisonBanner host={props.host} comparisonId={state.comparisonId} granularityLabel={vsPreviousLabelFor(effectiveGranularity)} onDisable={disableComparisonMode} />
        )}
      </div>
    );
  }

  return (
    <div className="pbi-datepicker card" style={containerStyle}>

      {/* Comparison Mode Banner - Shows when in comparison mode */}
      {state.comparisonId && (
        <ComparisonBanner
          host={props.host}
          comparisonId={state.comparisonId}
          granularityLabel={vsPreviousLabelFor(effectiveGranularity)}
          onDisable={disableComparisonMode}
        />
      )}
      
      {/* Active Filter Badge - Controlled by showSelectedPeriodBadge */}
      {showSelectedPeriodBadge && !state.comparisonId && (
        <FilterBadge
          mode={state.mode}
          from={state.from}
          to={displayToDate}
          presetLabel={activePresetLabel}
          comparisonLabel={activeComparisonLabel}
          selectedMonthsCount={state.selectedMonths?.length}
          onClear={clearFilter}
        />
      )}

      {/* Date Range Inputs */}
      {enableDateInputs && (
        <DateInputs
          from={state.from}
          to={displayToDate}
          minDate={minDate}
          maxDate={maxDate}
          disabled={state.comparisonId !== undefined}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          onClear={clearFilter}
        />
      )}

      {/* Month Navigation & Multi-Month Selector with Y/M/D Granularity */}
      {enableMonthNavigation && (
        <MonthSelector
          host={props.host}
          navMonth={state.navMonth}
          granularity={effectiveGranularity}
          showGranularityYear={showGranularityYear}
          showGranularityMonth={showGranularityMonth}
          showGranularityDay={showGranularityDay}
          onGranularityChange={setGranularityMode}
          onNavigatePeriod={navigatePeriod}
          selectedMonths={state.selectedMonths}
          showSelectionBadge={showMonthSelectionBadge}
          disabled={!target}
          onPrevMonth={() => navigateMonth(-1)}
          onNextMonth={() => navigateMonth(1)}
          onMonthsSelected={applyMonthsFromDialog}
          showComparisonToggle={enableVersus}
          comparePrevious={state.comparisonId === "vsPrevious"}
          onToggleComparePrevious={toggleVsPrevious}
          monthsBack={36}
          monthsForward={6}
        />
      )}

      {/* Preset Buttons */}
      <PresetButtons
        activePresetId={state.presetId}
        visiblePresets={{
          today: showToday,
          yesterday: showYesterday,
          thisWeek: showThisWeek,
          lastWeek: showLastWeek,
          last7: showLast7,
          last30: showLast30,
          last90: showLast90,
          thisMonth: showThisMonth,
          prevMonth: showPrevMonth,
          thisYear: showThisYear
        }}
        onPresetClick={applyPreset}
      />

      {/* Comparison Panel */}
      {enableVersus && (
        <ComparisonPanel
          activeComparisonId={state.comparisonId}
          showMTDvsPMTD={showMTDvsPMTD}
          showYoY={showYoY}
          showYTDvsYTD={showYTDvsYTD}
          disabled={!target}
          onComparisonClick={applyComparison}
        />
      )}

      {/* Activity Log */}
      {showLog && <ActivityLog logs={logs} />}

    </div>
  );
};
