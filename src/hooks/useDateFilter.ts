import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { applyDateBetween, clearDateFilter, applyMultipleDateRanges, ColumnTarget } from "../core/filters";
import { getRange, PresetId, DateRange } from "../core/presets";
import { formatDateDMY, ensureValidDateRange } from "../utils/dateHelpers";

import { GranularityMode } from "../components/GranularitySelector";
import { DatePickerDialogResult } from "../dialogs/DatePickerDialog";
import { PeriodPickerResult } from "../dialogs/MonthPickerDialog";

export type FilterMode = "range" | "preset" | "navigation" | "multimonth";

export interface FilterState {
  mode: FilterMode;
  from?: Date;
  to?: Date;
  presetId?: PresetId;
  navMonth?: Date;
  granularity?: GranularityMode;
  selectedMonths?: string[];
}

export interface UseDateFilterProps {
  host: powerbi.extensibility.visual.IVisualHost;
  target: ColumnTarget | undefined;
  minDate?: Date;
  maxDate?: Date;
  showLog?: boolean;
}

export interface UseDateFilterReturn {
  state: FilterState;
  logs: string[];

  // Actions
  setDateRange: (from?: Date, to?: Date) => void;
  applyPreset: (presetId: PresetId, overrideGranularity?: GranularityMode) => void;
  clearFilter: () => void;
  navigateMonth: (direction: 1 | -1) => void;
  navigatePeriod: (direction: 1 | -1, overrideGranularity?: GranularityMode) => void;
  navigateYear: (direction: 1 | -1, overrideGranularity?: GranularityMode) => void;
  setGranularityMode: (mode: GranularityMode) => void;
  applyMonthsFromDialog: (months: string[]) => void;
  applyPeriodResultFromDialog: (result: PeriodPickerResult) => void;
  applyDialogResult: (result: DatePickerDialogResult) => void;

  // Helpers
  addLog: (msg: string) => void;
}

export const useDateFilter = (props: UseDateFilterProps): UseDateFilterReturn => {
  const { host, target, minDate, maxDate, showLog } = props;

  const [state, setState] = React.useState<FilterState>({ mode: "range" });
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = React.useCallback((msg: string) => {
    if (!showLog) return;
    const stamp = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date());
    setLogs(prev => [...prev.slice(-99), `[${stamp}] ${msg}`]);
  }, [showLog]);

  const setDateRange = React.useCallback((from?: Date, to?: Date) => {
    const validRange = ensureValidDateRange(from, to);

    if (validRange.wasSwapped) {
      addLog(`🔄 Fechas auto-ajustadas: from > to`);
    }

    setState(prev => ({
      ...prev,
      mode: 'range',
      from: validRange.from,
      to: validRange.to,
      presetId: undefined
    }));

    if (validRange.from && validRange.to && target) {
      applyDateBetween({ host, target }, validRange.from, validRange.to);
      addLog(`Manual filter: ${formatDateDMY(validRange.from)} - ${formatDateDMY(validRange.to)}`);
    }
  }, [host, target, addLog]);

  const applyPreset = React.useCallback((presetId: PresetId, overrideGranularity?: GranularityMode) => {
    setState(prev => {
      const currentGranularity = overrideGranularity || prev.granularity || "M";
      const range = getRange(presetId, currentGranularity);

      if (minDate && range.from < minDate) {
        range.from = new Date(minDate.getTime());
      }
      if (maxDate && range.to > maxDate) {
        range.to = new Date(maxDate.getTime());
      }

      if (target) {
        applyDateBetween({ host, target }, range.from, range.to);
        addLog(`Preset filter: ${presetId} (${currentGranularity})`);
      }

      return {
        ...prev,
        granularity: currentGranularity,
        mode: "preset",
        from: range.from,
        to: range.to,
        presetId,
        navMonth: range.from,
        selectedMonths: []
      };
    });
  }, [host, target, addLog]);

  const clearFilter = React.useCallback(() => {
    if (target) {
      clearDateFilter({ host, target });
      addLog("Filter cleared");
    }

    setState({
      mode: "range",
      from: undefined,
      to: undefined,
      presetId: undefined,
      navMonth: undefined,
      selectedMonths: []
    });
  }, [host, target, addLog]);

  const navigateMonth = React.useCallback((direction: 1 | -1) => {
    const currentNavMonth = state.navMonth || new Date();
    const newMonth = new Date(
      currentNavMonth.getFullYear(),
      currentNavMonth.getMonth() + direction,
      1
    );
    const lastDay = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate();
    const from = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    const to = new Date(newMonth.getFullYear(), newMonth.getMonth(), lastDay, 23, 59, 59, 999);

    if (target) {
      applyDateBetween({ host, target }, from, to);
      const monthName = new Intl.DateTimeFormat('es-CL', {
        month: 'long',
        year: 'numeric'
      }).format(newMonth);
      addLog(`📅 Navegando a: ${monthName}`);
    }

    setState(prev => ({
      ...prev,
      mode: "navigation",
      from,
      to,
      presetId: undefined,
      navMonth: newMonth
    }));
  }, [host, target, state.navMonth, addLog]);

  const setGranularityMode = React.useCallback((mode: GranularityMode) => {
    setState(prev => {
      let from: Date;
      let to: Date;
      let activePresetId = prev.presetId;

      if (activePresetId === "thisPeriod" || activePresetId === "prevPeriod") {
        const range = getRange(activePresetId, mode);
        from = range.from;
        to = range.to;
      } else {
        const refDate = prev.navMonth || prev.from || new Date();
        if (mode === "Y") {
          const year = refDate.getFullYear();
          from = new Date(year, 0, 1);
          to = new Date(year, 11, 31, 23, 59, 59, 999);
        } else if (mode === "D") {
          from = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
          to = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
        } else {
          // Month (M)
          const year = refDate.getFullYear();
          const month = refDate.getMonth();
          const lastDay = new Date(year, month + 1, 0).getDate();
          from = new Date(year, month, 1);
          to = new Date(year, month, lastDay, 23, 59, 59, 999);
        }
        activePresetId = undefined;
      }

      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`🔢 Granularidad cambiada a '${mode}': ${formatDateDMY(from)} - ${formatDateDMY(to)}`);
      }

      return {
        ...prev,
        granularity: mode,
        mode: activePresetId ? "preset" : "navigation",
        from,
        to,
        presetId: activePresetId,
        navMonth: from
      };
    });
  }, [host, target, addLog]);

  const navigatePeriod = React.useCallback((direction: 1 | -1, overrideGranularity?: GranularityMode) => {
    setState(prev => {
      const granularity = overrideGranularity || prev.granularity || "M";
      const refDate = prev.from || prev.navMonth || new Date();
      let from: Date;
      let to: Date;

      if (granularity === "Y") {
        const newYear = refDate.getFullYear() + direction;
        from = new Date(newYear, 0, 1, 0, 0, 0, 0);
        to = new Date(newYear, 11, 31, 23, 59, 59, 999);
      } else if (granularity === "D") {
        const newDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + direction);
        from = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0);
        to = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999);
      } else {
        // Month (M)
        const newMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, 1);
        const lastDay = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth() + 1, 0).getDate();
        from = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), 1, 0, 0, 0, 0);
        to = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), lastDay, 23, 59, 59, 999);
      }

      if (minDate && from < minDate) {
        if (to < minDate) return prev;
        from = new Date(minDate.getTime());
      }
      if (maxDate && to > maxDate) {
        if (from > maxDate) return prev;
        to = new Date(maxDate.getTime());
      }

      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`📅 Navegando período (${granularity}): ${formatDateDMY(from)} - ${formatDateDMY(to)}`);
      }

      return {
        ...prev,
        granularity,
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        navMonth: from
      };
    });
  }, [host, target, minDate, maxDate, addLog]);

  const navigateYear = React.useCallback((direction: 1 | -1, overrideGranularity?: GranularityMode) => {
    setState(prev => {
      const granularity = overrideGranularity || prev.granularity || "M";
      const refDate = prev.from || prev.navMonth || new Date();
      let from: Date;
      let to: Date;

      if (granularity === "Y") {
        const newYear = refDate.getFullYear() + (direction * 5);
        from = new Date(newYear, 0, 1, 0, 0, 0, 0);
        to = new Date(newYear, 11, 31, 23, 59, 59, 999);
      } else if (granularity === "D") {
        const newMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, refDate.getDate());
        from = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), newMonthDate.getDate(), 0, 0, 0, 0);
        to = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), newMonthDate.getDate(), 23, 59, 59, 999);
      } else {
        // Month (M): Jump 1 year staying on same month index (e.g. July 2025 -> July 2026)
        const newYear = refDate.getFullYear() + direction;
        const month = refDate.getMonth();
        const lastDay = new Date(newYear, month + 1, 0).getDate();
        from = new Date(newYear, month, 1, 0, 0, 0, 0);
        to = new Date(newYear, month, lastDay, 23, 59, 59, 999);
      }

      if (minDate && from < minDate) {
        if (to < minDate) return prev;
        from = new Date(minDate.getTime());
      }
      if (maxDate && to > maxDate) {
        if (from > maxDate) return prev;
        to = new Date(maxDate.getTime());
      }

      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`📅 Navegando año (${granularity}): ${formatDateDMY(from)} - ${formatDateDMY(to)}`);
      }

      return {
        ...prev,
        granularity,
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        navMonth: from
      };
    });
  }, [host, target, minDate, maxDate, addLog]);

  const applyMonthsFromDialog = React.useCallback((months: string[]) => {
    if (months.length === 0) {
      if (target) {
        clearDateFilter({ host, target });
        addLog("Selección de meses limpiada");
      }
      setState(prev => ({ ...prev, selectedMonths: [], mode: "range" }));
      return;
    }

    if (months.length === 1) {
      const [year, month] = months[0].split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
      if (target) {
        applyDateBetween({ host, target }, firstDay, lastDay);
        addLog(`🗓️ Mes seleccionado: ${months[0]}`);
      }
      setState(prev => ({
        ...prev,
        selectedMonths: months,
        mode: "navigation",
        granularity: "M",
        from: firstDay,
        to: lastDay,
        navMonth: firstDay,
        presetId: undefined
      }));
      return;
    }

    const ranges: DateRange[] = months.map(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
      return { from: firstDay, to: lastDay };
    });

    if (target) {
      applyMultipleDateRanges({ host, target }, ranges);
      addLog(`🗓️ Meses seleccionados: ${months.length}`);
    }

    setState(prev => ({ ...prev, selectedMonths: months, mode: "multimonth" }));
  }, [host, target, addLog]);

  const applyPeriodResultFromDialog = React.useCallback((result: PeriodPickerResult) => {
    if (result.granularity === "Y" && result.selectedYear !== undefined) {
      const year = result.selectedYear;
      const from = new Date(year, 0, 1, 0, 0, 0, 0);
      const to = new Date(year, 11, 31, 23, 59, 59, 999);
      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`📅 Año seleccionado desde modal: ${year}`);
      }
      setState(prev => ({
        ...prev,
        granularity: "Y",
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        navMonth: from,
        selectedMonths: []
      }));
    } else if (result.granularity === "D" && result.selectedDate !== undefined) {
      const d = new Date(result.selectedDate + "T00:00:00");
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`📅 Día seleccionado desde modal: ${formatDateDMY(from)}`);
      }
      setState(prev => ({
        ...prev,
        granularity: "D",
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        navMonth: from,
        selectedMonths: []
      }));
    } else {
      applyMonthsFromDialog(result.selectedMonths || []);
    }
  }, [host, target, addLog, applyMonthsFromDialog]);

  const applyDialogResult = React.useCallback((result: DatePickerDialogResult) => {
    switch (result.mode) {
      case "range":
        setDateRange(
          result.from ? new Date(result.from + "T00:00:00") : undefined,
          result.to ? new Date(result.to + "T00:00:00") : undefined
        );
        break;
      case "preset":
        if (result.presetId) applyPreset(result.presetId);
        break;
      case "months":
        applyMonthsFromDialog(result.selectedMonths || []);
        break;
      case "clear":
        clearFilter();
        break;
    }
  }, [setDateRange, applyPreset, applyMonthsFromDialog, clearFilter]);

  return {
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
    applyPeriodResultFromDialog,
    applyDialogResult,
    addLog
  };
};
