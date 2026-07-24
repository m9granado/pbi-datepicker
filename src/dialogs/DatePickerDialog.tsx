/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PresetId, ComparisonId, getRange } from "../core/presets";
import { FilterMode } from "../hooks/useDateFilter";
import { DateInputs, PresetButtons, ComparisonPanel, FilterBadge } from "../components";
import { MonthGrid, buildMonthItems } from "../components/MonthGrid";
import { getDisplayToDate } from "../utils/dateHelpers";

// Popup-mode content: the entire picker UI (range inputs, presets, months,
// comparisons), rendered as a native Power BI host dialog instead of inline
// in the visual's own (sandboxed, size-limited) canvas. See
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box
// This is what solves "el selector no se despliega": the dialog is painted
// by the Power BI host itself, above the whole report, not by the visual.

export interface DatePickerDialogInitialState {
  from?: string; // ISO date
  to?: string; // ISO date
  presetId?: PresetId;
  comparisonId?: ComparisonId;
  selectedMonths?: string[];
  minDate?: string;
  maxDate?: string;
  enableDateInputs?: boolean;
  enableMonthNavigation?: boolean;
  enableVersus?: boolean;
  monthsBack?: number;
  monthsForward?: number;
  visiblePresets?: {
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
  showMTDvsPMTD?: boolean;
  showYoY?: boolean;
  showYTDvsYTD?: boolean;
}

export interface DatePickerDialogResult {
  mode: "range" | "preset" | "comparison" | "months" | "clear";
  from?: string;
  to?: string;
  presetId?: PresetId;
  comparisonId?: ComparisonId;
  selectedMonths?: string[];
}

const parseISODate = (iso?: string): Date | undefined => (iso ? new Date(iso + "T00:00:00") : undefined);
const toISO = (d?: Date): string | undefined => (d ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}` : undefined);

interface LocalState {
  mode: FilterMode;
  from?: Date;
  to?: Date;
  presetId?: PresetId;
  comparisonId?: ComparisonId;
  selectedMonths?: string[];
}

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

const comparisonLabels: Record<ComparisonId, string> = {
  mtdVsPmtd: "MTD vs PMTD",
  yoy: "YoY",
  ytdVsYtd: "YTD vs YTD",
  vsPrevious: "vs. Período Anterior"
};

const DatePickerDialogContent: React.FC<{
  initialState: DatePickerDialogInitialState;
  onChange: (result: DatePickerDialogResult) => void;
}> = ({ initialState, onChange }) => {
  const [state, setState] = React.useState<LocalState>({
    mode: initialState.selectedMonths?.length ? "multimonth" : (initialState.presetId ? "preset" : (initialState.comparisonId ? "comparison" : "range")),
    from: parseISODate(initialState.from),
    to: parseISODate(initialState.to),
    presetId: initialState.presetId,
    comparisonId: initialState.comparisonId,
    selectedMonths: initialState.selectedMonths || []
  });

  const months = React.useMemo(
    () => buildMonthItems(initialState.monthsBack ?? 36, initialState.monthsForward ?? 6),
    [initialState.monthsBack, initialState.monthsForward]
  );

  const handleRangeChange = (from?: Date, to?: Date) => {
    setState({ mode: "range", from, to, presetId: undefined, comparisonId: undefined, selectedMonths: [] });
    onChange({ mode: "range", from: toISO(from), to: toISO(to) });
  };

  const handlePresetClick = (presetId: PresetId) => {
    const range = getRange(presetId);
    setState({ mode: "preset", from: range.from, to: range.to, presetId, comparisonId: undefined, selectedMonths: [] });
    onChange({ mode: "preset", presetId });
  };

  const handleComparisonClick = (comparisonId: ComparisonId) => {
    setState({ mode: "comparison", from: undefined, to: undefined, presetId: undefined, comparisonId, selectedMonths: [] });
    onChange({ mode: "comparison", comparisonId });
  };

  const handleMonthToggle = (value: string) => {
    setState(prev => {
      const current = prev.selectedMonths || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value].sort();
      onChange({ mode: "months", selectedMonths: next });
      return { ...prev, mode: "multimonth", selectedMonths: next, presetId: undefined, comparisonId: undefined };
    });
  };

  const handleYearToggle = (yearValues: string[]) => {
    setState(prev => {
      const current = prev.selectedMonths || [];
      const allSelected = yearValues.every(v => current.includes(v));
      const next = allSelected
        ? current.filter(v => !yearValues.includes(v))
        : Array.from(new Set([...current, ...yearValues])).sort();
      onChange({ mode: "months", selectedMonths: next });
      return { ...prev, mode: "multimonth", selectedMonths: next, presetId: undefined, comparisonId: undefined };
    });
  };

  const handleClear = () => {
    setState({ mode: "range", from: undefined, to: undefined, presetId: undefined, comparisonId: undefined, selectedMonths: [] });
    onChange({ mode: "clear" });
  };

  const displayToDate = getDisplayToDate(state.to, state.presetId);
  const activePresetLabel = state.presetId ? presetLabels[state.presetId] : undefined;
  const activeComparisonLabel = state.comparisonId ? comparisonLabels[state.comparisonId] : undefined;

  return (
    <div style={{
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '13px',
      color: '#1D1D1F',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box',
      padding: '12px 14px',
      overflowY: 'auto'
    }}>
      <FilterBadge
        mode={state.mode}
        from={state.from}
        to={displayToDate}
        presetLabel={activePresetLabel}
        comparisonLabel={activeComparisonLabel}
        selectedMonthsCount={state.selectedMonths?.length}
        onClear={handleClear}
      />

      {initialState.enableDateInputs && (
        <DateInputs
          from={state.from}
          to={displayToDate}
          minDate={parseISODate(initialState.minDate)}
          maxDate={parseISODate(initialState.maxDate)}
          disabled={state.comparisonId !== undefined}
          onFromChange={(d) => handleRangeChange(d, state.to)}
          onToChange={(d) => handleRangeChange(state.from, d)}
          onClear={handleClear}
        />
      )}

      <PresetButtons
        activePresetId={state.presetId}
        visiblePresets={initialState.visiblePresets || {}}
        onPresetClick={handlePresetClick}
      />

      {initialState.enableMonthNavigation && (
        <div style={{ marginBottom: '0.5em' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666666', marginBottom: 6 }}>Meses</div>
          <MonthGrid months={months} selected={state.selectedMonths || []} onToggle={handleMonthToggle} onToggleYear={handleYearToggle} columns={5} />
        </div>
      )}

      {initialState.enableVersus && (
        <ComparisonPanel
          activeComparisonId={state.comparisonId}
          showMTDvsPMTD={initialState.showMTDvsPMTD}
          showYoY={initialState.showYoY}
          showYTDvsYTD={initialState.showYTDvsYTD}
          onComparisonClick={handleComparisonClick}
        />
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: 11, color: '#999999' }}>
        Confirma con OK o descarta con Cancel.
      </div>
    </div>
  );
};

export class DatePickerDialog {
  static id = "DatePickerDialog";

  constructor(options: DialogConstructorOptions, initialState: object) {
    const host = options.host;
    const state = (initialState || {}) as DatePickerDialogInitialState;

    // Seed the result immediately so pressing OK before touching anything
    // is a no-op that re-applies whatever was already selected.
    if (state.selectedMonths?.length) {
      host.setResult({ mode: "months", selectedMonths: state.selectedMonths });
    } else if (state.presetId) {
      host.setResult({ mode: "preset", presetId: state.presetId });
    } else if (state.comparisonId) {
      host.setResult({ mode: "comparison", comparisonId: state.comparisonId });
    } else {
      host.setResult({ mode: "range", from: state.from, to: state.to });
    }

    ReactDOM.render(
      React.createElement(DatePickerDialogContent, {
        initialState: state,
        onChange: (result: DatePickerDialogResult) => host.setResult(result)
      }),
      options.element
    );
  }
}

// Required dialog registration boilerplate - see:
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box
(globalThis as any).dialogRegistry = (globalThis as any).dialogRegistry || {};
(globalThis as any).dialogRegistry[DatePickerDialog.id] = DatePickerDialog;
