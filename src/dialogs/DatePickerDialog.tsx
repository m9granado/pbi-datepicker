/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PresetId, getRange } from "../core/presets";
import { FilterMode } from "../hooks/useDateFilter";
import { DateInputs, PresetButtons, FilterBadge } from "../components";
import { MonthGrid, buildMonthItems } from "../components/MonthGrid";
import { getDisplayToDate } from "../utils/dateHelpers";

export interface DatePickerDialogInitialState {
  from?: string; // ISO date
  to?: string; // ISO date
  presetId?: PresetId;
  selectedMonths?: string[];
  minDate?: string;
  maxDate?: string;
  enableDateInputs?: boolean;
  enableMonthNavigation?: boolean;
  monthsBack?: number;
  monthsForward?: number;
  visiblePresets?: {
    thisPeriod?: boolean;
    prevPeriod?: boolean;
  };
}

export interface DatePickerDialogResult {
  mode: "range" | "preset" | "months" | "clear";
  from?: string;
  to?: string;
  presetId?: PresetId;
  selectedMonths?: string[];
}

const parseISODate = (iso?: string): Date | undefined => (iso ? new Date(iso + "T00:00:00") : undefined);
const toISO = (d?: Date): string | undefined => (d ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}` : undefined);

interface LocalState {
  mode: FilterMode;
  from?: Date;
  to?: Date;
  presetId?: PresetId;
  selectedMonths?: string[];
}

const presetLabels: Record<PresetId, string> = {
  thisPeriod: "Este Período",
  prevPeriod: "Período Anterior"
};

const DatePickerDialogContent: React.FC<{
  initialState: DatePickerDialogInitialState;
  onChange: (result: DatePickerDialogResult) => void;
}> = ({ initialState, onChange }) => {
  const [state, setState] = React.useState<LocalState>({
    mode: initialState.selectedMonths?.length ? "multimonth" : (initialState.presetId ? "preset" : "range"),
    from: parseISODate(initialState.from),
    to: parseISODate(initialState.to),
    presetId: initialState.presetId,
    selectedMonths: initialState.selectedMonths || []
  });

  const months = React.useMemo(
    () => buildMonthItems(initialState.monthsBack ?? 36, initialState.monthsForward ?? 6),
    [initialState.monthsBack, initialState.monthsForward]
  );

  const handleRangeChange = (from?: Date, to?: Date) => {
    setState({ mode: "range", from, to, presetId: undefined, selectedMonths: [] });
    onChange({ mode: "range", from: toISO(from), to: toISO(to) });
  };

  const handlePresetClick = (presetId: PresetId) => {
    const range = getRange(presetId);
    setState({ mode: "preset", from: range.from, to: range.to, presetId, selectedMonths: [] });
    onChange({ mode: "preset", presetId });
  };

  const handleMonthToggle = (value: string) => {
    setState(prev => {
      const current = prev.selectedMonths || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value].sort();
      onChange({ mode: "months", selectedMonths: next });
      return { ...prev, mode: "multimonth", selectedMonths: next, presetId: undefined };
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
      return { ...prev, mode: "multimonth", selectedMonths: next, presetId: undefined };
    });
  };

  const handleClear = () => {
    setState({ mode: "range", from: undefined, to: undefined, presetId: undefined, selectedMonths: [] });
    onChange({ mode: "clear" });
  };

  const displayToDate = getDisplayToDate(state.to, state.presetId);
  const activePresetLabel = state.presetId ? presetLabels[state.presetId] : undefined;

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
        selectedMonthsCount={state.selectedMonths?.length}
        onClear={handleClear}
      />

      {initialState.enableDateInputs && (
        <DateInputs
          from={state.from}
          to={displayToDate}
          minDate={parseISODate(initialState.minDate)}
          maxDate={parseISODate(initialState.maxDate)}
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

    if (state.selectedMonths?.length) {
      host.setResult({ mode: "months", selectedMonths: state.selectedMonths });
    } else if (state.presetId) {
      host.setResult({ mode: "preset", presetId: state.presetId });
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
