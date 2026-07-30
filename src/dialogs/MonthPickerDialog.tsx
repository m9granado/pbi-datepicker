/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonthGrid, buildMonthItems } from "../components/MonthGrid";
import { YearGrid } from "../components/YearGrid";
import { DayPickerGrid } from "../components/DayPickerGrid";
import { GranularityMode } from "../components/GranularitySelector";
import { toISOInput } from "../utils/dateHelpers";

export interface PeriodPickerResult {
  selectedMonths?: string[];
  selectedYear?: number;
  selectedDate?: string;
  granularity?: GranularityMode;
}

export interface MonthPickerInitialState {
  selectedMonths?: string[];
  monthsBack?: number;
  monthsForward?: number;
  singleSelect?: boolean;
  granularity?: GranularityMode;
  currentDate?: string;
  minDate?: string;
  maxDate?: string;
}

const MonthPickerContent: React.FC<{
  initialState: MonthPickerInitialState;
  onChange: (result: PeriodPickerResult) => void;
}> = ({ initialState, onChange }) => {
  const granularity = initialState.granularity || "M";
  const isSingle = initialState.singleSelect ?? false;

  // Year mode state
  const initialYear = initialState.currentDate ? new Date(initialState.currentDate).getFullYear() : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState<number | undefined>(
    granularity === "Y" ? initialYear : undefined
  );

  // Month mode state
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>(initialState.selectedMonths || []);

  // Day mode state
  const initialDateObj = initialState.currentDate ? new Date(initialState.currentDate) : new Date();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    granularity === "D" ? initialDateObj : undefined
  );

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - Math.floor((initialState.monthsBack || 36) / 12);
    const endYear = currentYear + Math.ceil((initialState.monthsForward || 6) / 12);
    const yrs: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      yrs.push(y);
    }
    return yrs;
  }, [initialState.monthsBack, initialState.monthsForward]);

  const months = React.useMemo(
    () => buildMonthItems(initialState.monthsBack ?? 36, initialState.monthsForward ?? 6),
    [initialState.monthsBack, initialState.monthsForward]
  );

  // Handlers for Year mode
  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    onChange({ selectedYear: year, granularity: "Y" });
  };

  // Handlers for Month mode
  const toggleMonth = (value: string) => {
    setSelectedMonths(prev => {
      let next: string[];
      if (isSingle) {
        next = prev.includes(value) ? [] : [value];
      } else {
        next = prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value].sort();
      }
      onChange({ selectedMonths: next, granularity: "M" });
      return next;
    });
  };

  const toggleYearInMonthView = (yearValues: string[]) => {
    if (isSingle) return;
    setSelectedMonths(prev => {
      const allSelected = yearValues.every(v => prev.includes(v));
      const next = allSelected
        ? prev.filter(v => !yearValues.includes(v))
        : Array.from(new Set([...prev, ...yearValues])).sort();
      onChange({ selectedMonths: next, granularity: "M" });
      return next;
    });
  };

  // Handlers for Day mode
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    onChange({ selectedDate: toISOInput(date), granularity: "D" });
  };

  const clear = () => {
    if (granularity === "Y") {
      setSelectedYear(undefined);
      onChange({ selectedYear: undefined, granularity: "Y" });
    } else if (granularity === "D") {
      setSelectedDate(undefined);
      onChange({ selectedDate: undefined, granularity: "D" });
    } else {
      setSelectedMonths([]);
      onChange({ selectedMonths: [], granularity: "M" });
    }
  };

  const getHeaderLabel = (): string => {
    if (granularity === "Y") {
      return selectedYear ? `Año ${selectedYear} seleccionado` : 'Selecciona un año';
    }
    if (granularity === "D") {
      return selectedDate
        ? `Día ${new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate)}`
        : 'Selecciona un día';
    }
    return selectedMonths.length > 0
      ? `${selectedMonths.length} mes${selectedMonths.length > 1 ? 'es' : ''} seleccionado${selectedMonths.length > 1 ? 's' : ''}`
      : 'Selecciona uno o más meses';
  };

  const minDateObj = initialState.minDate ? new Date(initialState.minDate + "T00:00:00") : undefined;
  const maxDateObj = initialState.maxDate ? new Date(initialState.maxDate + "T23:59:59.999") : undefined;

  return (
    <div style={{
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '13px',
      color: '#1D1D1F',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid #E5E5EA',
        flexShrink: 0
      }}>
        <strong>{getHeaderLabel()}</strong>
        <button
          type="button"
          onClick={clear}
          style={{
            border: '1px solid #E0E0E0',
            borderRadius: 4,
            background: '#FFFFFF',
            color: '#666666',
            fontSize: 12,
            padding: '4px 10px',
            cursor: 'pointer'
          }}
        >
          Limpiar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {granularity === "Y" && (
          <YearGrid
            years={years}
            selectedYears={selectedYear !== undefined ? [selectedYear] : []}
            onSelectYear={handleSelectYear}
            currentYear={new Date().getFullYear()}
            minDate={minDateObj}
            maxDate={maxDateObj}
          />
        )}

        {granularity === "M" && (
          <MonthGrid
            months={months}
            selected={selectedMonths}
            onToggle={toggleMonth}
            onToggleYear={toggleYearInMonthView}
            minDate={minDateObj}
            maxDate={maxDateObj}
          />
        )}

        {granularity === "D" && (
          <DayPickerGrid
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            initialDate={initialDateObj}
            minDate={minDateObj}
            maxDate={maxDateObj}
          />
        )}
      </div>

      <div style={{
        padding: '8px 14px',
        fontSize: 11,
        color: '#999999',
        borderTop: '1px solid #E5E5EA',
        flexShrink: 0
      }}>
        Confirma con OK o descarta con Cancel.
      </div>
    </div>
  );
};

export class MonthPickerDialog {
  static id = "MonthPickerDialog";

  constructor(options: DialogConstructorOptions, initialState: object) {
    const host = options.host;
    const state = (initialState || {}) as MonthPickerInitialState;

    const initialGranularity = state.granularity || "M";
    let initialResult: PeriodPickerResult = { granularity: initialGranularity };

    if (initialGranularity === "Y") {
      const initialYear = state.currentDate ? new Date(state.currentDate).getFullYear() : new Date().getFullYear();
      initialResult.selectedYear = initialYear;
    } else if (initialGranularity === "D") {
      const initialDateStr = state.currentDate ? state.currentDate.split('T')[0] : toISOInput(new Date());
      initialResult.selectedDate = initialDateStr;
    } else {
      initialResult.selectedMonths = state.selectedMonths || [];
    }

    host.setResult(initialResult);

    ReactDOM.render(
      React.createElement(MonthPickerContent, {
        initialState: state,
        onChange: (result: PeriodPickerResult) => host.setResult(result)
      }),
      options.element
    );
  }
}

// Required dialog registration boilerplate - see:
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box
(globalThis as any).dialogRegistry = (globalThis as any).dialogRegistry || {};
(globalThis as any).dialogRegistry[MonthPickerDialog.id] = MonthPickerDialog;
