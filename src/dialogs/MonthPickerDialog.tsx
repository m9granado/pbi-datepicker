/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonthGrid, buildMonthItems } from "../components/MonthGrid";

// Implements the month-picker as a native Power BI host dialog (see
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box)
// instead of an in-visual popover. Custom visuals run in a sandboxed iframe
// that content can never escape (no CSS/portal trick gets around this) -
// a host dialog is rendered by Power BI itself, above the whole report, with
// the background grayed out, which is the only supported way to get a true
// "modal over everything" for a custom visual.

interface MonthPickerInitialState {
  selectedMonths?: string[];
  monthsBack?: number;
  monthsForward?: number;
  singleSelect?: boolean;
}

const MonthPickerContent: React.FC<{
  initialState: MonthPickerInitialState;
  onChange: (selectedMonths: string[]) => void;
}> = ({ initialState, onChange }) => {
  const [selected, setSelected] = React.useState<string[]>(initialState.selectedMonths || []);
  const isSingle = initialState.singleSelect ?? false;

  const months = React.useMemo(
    () => buildMonthItems(initialState.monthsBack ?? 36, initialState.monthsForward ?? 6),
    [initialState.monthsBack, initialState.monthsForward]
  );

  const toggle = (value: string) => {
    setSelected(prev => {
      let next: string[];
      if (isSingle) {
        next = prev.includes(value) ? [] : [value];
      } else {
        next = prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value].sort();
      }
      onChange(next);
      return next;
    });
  };

  const toggleYear = (yearValues: string[]) => {
    if (isSingle) return; // Disallow multi-year selection in single selection mode
    setSelected(prev => {
      const allSelected = yearValues.every(v => prev.includes(v));
      const next = allSelected
        ? prev.filter(v => !yearValues.includes(v))
        : Array.from(new Set([...prev, ...yearValues])).sort();
      onChange(next);
      return next;
    });
  };

  const clear = () => {
    setSelected([]);
    onChange([]);
  };

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
        <strong>
          {selected.length > 0
            ? `${selected.length} mes${selected.length > 1 ? 'es' : ''} seleccionado${selected.length > 1 ? 's' : ''}`
            : 'Selecciona uno o más meses'}
        </strong>
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
        <MonthGrid months={months} selected={selected} onToggle={toggle} onToggleYear={toggleYear} />
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

    // Seed the result immediately so pressing the host's OK button before
    // touching anything just re-applies the incoming selection unchanged.
    host.setResult({ selectedMonths: state.selectedMonths || [] });

    ReactDOM.render(
      React.createElement(MonthPickerContent, {
        initialState: state,
        onChange: (selectedMonths: string[]) => host.setResult({ selectedMonths })
      }),
      options.element
    );
  }
}

// Required dialog registration boilerplate - see:
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box
(globalThis as any).dialogRegistry = (globalThis as any).dialogRegistry || {};
(globalThis as any).dialogRegistry[MonthPickerDialog.id] = MonthPickerDialog;
