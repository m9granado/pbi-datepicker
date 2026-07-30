import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { ColumnTarget } from "../core/filters";
import { useDateFilter } from "../hooks/useDateFilter";
import { PresetId } from "../core/presets";
import {
  DateInputs,
  PresetButtons,
  MonthSelector,
  ActivityLog,
  GranularityMode
} from "../components";
import { getDisplayToDate } from "../utils/dateHelpers";

export interface AppProps {
  host: powerbi.extensibility.visual.IVisualHost;
  minDate?: Date;
  maxDate?: Date;
  target: ColumnTarget | undefined;
  mode: "filter" | "highlight";
  category?: powerbi.DataViewCategoryColumn;
  showLog?: boolean;
  fontSize?: number;
  fontFamily?: string;
  viewportHeight?: number;
  viewportWidth?: number;
  showThisPeriod?: boolean;
  showPrevPeriod?: boolean;
  periodContrastColor?: string;
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

export const App: React.FC<AppProps> = (props) => {
  const {
    target,
    minDate,
    maxDate,
    showLog,
    fontSize, 
    fontFamily,
    enableDateInputs,
    enableMonthNavigation,
    showGranularityYear = true,
    showGranularityMonth = true,
    showGranularityDay = true,
    showMonthSelectionBadge,
    showThisPeriod = true,
    showPrevPeriod = true,
    periodContrastColor
  } = props;

  const {
    state,
    logs,
    setDateRange,
    applyPreset,
    clearFilter,
    navigateMonth,
    navigatePeriod,
    navigateYear,
    setGranularityMode,
    applyMonthsFromDialog,
    applyPeriodResultFromDialog
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

  const effectiveGranularity = resolveGranularity(state.granularity, showGranularityYear, showGranularityMonth, showGranularityDay);

  // Container styles: transparent background so Power BI background shines through
  const containerStyle: React.CSSProperties = {
    fontSize: fontSize && fontSize > 0 ? `${fontSize}px` : '12px',
    fontFamily: fontFamily || 'Segoe UI, sans-serif',
    background: 'transparent',
    color: 'inherit',
    width: '100%',
    boxSizing: 'border-box'
  };

  if (!target) {
    return (
      <div
        className="pbi-datepicker card"
        style={{
          ...containerStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1em',
          border: '1px dashed #CCCCCC',
          borderRadius: '6px',
          textAlign: 'center',
          color: 'inherit'
        }}
      >
        <div style={{ fontSize: '1.4em', marginBottom: '0.3em' }}>📅</div>
        <div style={{ fontWeight: 600, fontSize: '0.9em', marginBottom: '0.2em' }}>DateX Date Picker</div>
        <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
          Arrastra un campo de fecha al rol <strong>Date</strong> para activar el filtrado.
        </div>
      </div>
    );
  }

  return (
    <div className="pbi-datepicker card" style={containerStyle}>

      {/* Date Range Inputs */}
      {enableDateInputs && (
        <DateInputs
          from={state.from}
          to={displayToDate}
          minDate={minDate}
          maxDate={maxDate}
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
          from={state.from}
          to={state.to}
          minDate={minDate}
          maxDate={maxDate}
          granularity={effectiveGranularity}
          showGranularityYear={showGranularityYear}
          showGranularityMonth={showGranularityMonth}
          showGranularityDay={showGranularityDay}
          activePresetId={state.presetId}
          showThisPeriod={showThisPeriod}
          showPrevPeriod={showPrevPeriod}
          periodContrastColor={periodContrastColor}
          onPresetClick={(presetId) => applyPreset(presetId, effectiveGranularity)}
          onGranularityChange={setGranularityMode}
          onNavigatePeriod={(dir) => navigatePeriod(dir, effectiveGranularity)}
          onNavigateYear={(dir) => navigateYear(dir, effectiveGranularity)}
          selectedMonths={state.selectedMonths}
          showSelectionBadge={showMonthSelectionBadge}
          disabled={!target}
          onPrevMonth={() => navigateMonth(-1)}
          onNextMonth={() => navigateMonth(1)}
          onMonthsSelected={applyMonthsFromDialog}
          onPeriodResultSelected={applyPeriodResultFromDialog}
          monthsBack={36}
          monthsForward={6}
        />
      )}

      {/* Activity Log */}
      {showLog && <ActivityLog logs={logs} />}

    </div>
  );
};
