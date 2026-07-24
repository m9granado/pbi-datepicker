import * as React from "react";
import powerbi from "powerbi-visuals-api";
import { applyDateBetween, clearDateFilter, applyMultipleDateRanges, ColumnTarget } from "../core/filters";
import { getRange, PresetId, ComparisonId, getComparisonRanges, DateRange } from "../core/presets";
import { formatDateDMY, ensureValidDateRange } from "../utils/dateHelpers";

import { GranularityMode } from "../components/GranularitySelector";
import { DatePickerDialogResult } from "../dialogs/DatePickerDialog";

export type FilterMode = "range" | "preset" | "comparison" | "navigation" | "multimonth";

export interface FilterState {
  mode: FilterMode;
  from?: Date;
  to?: Date;
  presetId?: PresetId;
  comparisonId?: ComparisonId;
  navMonth?: Date;
  granularity?: GranularityMode;
  selectedMonths?: string[];
}

export interface UseDateFilterProps {
  host: powerbi.extensibility.visual.IVisualHost;
  target: ColumnTarget | undefined;
  showLog?: boolean;
}

export interface UseDateFilterReturn {
  state: FilterState;
  logs: string[];

  // Actions
  setDateRange: (from?: Date, to?: Date) => void;
  applyPreset: (presetId: PresetId) => void;
  applyComparison: (comparisonId: ComparisonId) => void;
  clearFilter: () => void;
  navigateMonth: (direction: 1 | -1) => void;
  navigatePeriod: (direction: 1 | -1) => void;
  setGranularityMode: (mode: GranularityMode) => void;
  applyMonthsFromDialog: (months: string[]) => void;
  applyDialogResult: (result: DatePickerDialogResult) => void;
  toggleVsPrevious: (enabled: boolean) => void;
  disableComparisonMode: () => void;

  // Helpers
  addLog: (msg: string) => void;
}

export const useDateFilter = (props: UseDateFilterProps): UseDateFilterReturn => {
  const { host, target, showLog } = props;

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
    // Validate and auto-swap if needed
    const validRange = ensureValidDateRange(from, to);

    if (validRange.wasSwapped) {
      addLog(`🔄 Fechas auto-ajustadas: from > to`);
    }

    setState(prev => ({
      ...prev,
      mode: 'range',
      from: validRange.from,
      to: validRange.to,
      presetId: undefined,
      comparisonId: undefined
    }));

    if (validRange.from && validRange.to && target) {
      applyDateBetween({ host, target }, validRange.from, validRange.to);
      addLog(`Manual filter: ${formatDateDMY(validRange.from)} - ${formatDateDMY(validRange.to)}`);
    }
  }, [host, target, addLog]);

  const applyPreset = React.useCallback((presetId: PresetId) => {
    const range = getRange(presetId);

    if (target) {
      applyDateBetween({ host, target }, range.from, range.to);
      addLog(`Preset filter: ${presetId}`);
    }

    setState({
      mode: "preset",
      from: range.from,
      to: range.to,
      presetId
    });
  }, [host, target, addLog]);

  const applyComparison = React.useCallback((comparisonId: ComparisonId) => {
    if (!target) return;

    const ranges = getComparisonRanges(comparisonId);
    if (ranges.length === 0) return;

    applyMultipleDateRanges({ host, target }, ranges);

    // Format comparison badge
    const rangeTexts = ranges.map(r => `${formatDateDMY(r.from)} - ${formatDateDMY(r.to)}`);
    let badgeText = "";
    switch (comparisonId) {
      case "mtdVsPmtd":
        badgeText = `MTD vs PMTD: ${rangeTexts.join(" | ")}`;
        break;
      case "yoy":
        badgeText = `YoY: ${rangeTexts.join(" | ")}`;
        break;
      case "ytdVsYtd":
        badgeText = `YTD vs YTD: ${rangeTexts.join(" | ")}`;
        break;
    }

    addLog(`🔄 Comparison Mode: ${badgeText}`);
    addLog(`💡 Use measures to separate the periods in your visual`);

    setState({
      mode: "comparison",
      from: undefined,
      to: undefined,
      presetId: undefined,
      comparisonId
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
      comparisonId: undefined,
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
      comparisonId: undefined,
      navMonth: newMonth
    }));
  }, [host, target, state.navMonth, addLog]);

  const setGranularityMode = React.useCallback((mode: GranularityMode) => {
    setState(prev => {
      const refDate = prev.navMonth || prev.from || new Date();

      // If the "vs previous period" toggle is active, changing granularity
      // just recomputes that comparison for the new Y/M/D scope instead of
      // switching back to a plain single-range filter.
      if (prev.mode === "comparison" && prev.comparisonId === "vsPrevious" && target) {
        const ranges = getComparisonRanges("vsPrevious", refDate, mode);
        applyMultipleDateRanges({ host, target }, ranges);
        addLog(`🔢 Comparación vs. período anterior (${mode})`);
        return { ...prev, granularity: mode, navMonth: refDate };
      }

      let from: Date;
      let to: Date;

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

      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`🔢 Granularidad cambiada a '${mode}': ${formatDateDMY(from)} - ${formatDateDMY(to)}`);
      }

      return {
        ...prev,
        granularity: mode,
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        comparisonId: undefined,
        navMonth: from
      };
    });
  }, [host, target, addLog]);

  const navigatePeriod = React.useCallback((direction: 1 | -1) => {
    setState(prev => {
      // 1. Comparison Mode Navigation (YoY, MTD vs PMTD, YTD, vs. Previous Period)
      if (prev.mode === "comparison" && prev.comparisonId && target) {
        const refDate = prev.navMonth || prev.from || new Date();
        let newRefDate: Date;

        if (prev.comparisonId === "vsPrevious") {
          const granularity = prev.granularity || "M";
          if (granularity === "Y") {
            newRefDate = new Date(refDate.getFullYear() + direction, refDate.getMonth(), refDate.getDate());
          } else if (granularity === "D") {
            newRefDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + direction);
          } else {
            newRefDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, 1);
          }

          const ranges = getComparisonRanges("vsPrevious", newRefDate, granularity);
          applyMultipleDateRanges({ host, target }, ranges);
          addLog(`🔄 Comparación (${granularity}) navegada vs. período anterior: ${ranges.map(r => `${formatDateDMY(r.from)} - ${formatDateDMY(r.to)}`).join(" | ")}`);

          return { ...prev, navMonth: newRefDate };
        }

        if (prev.comparisonId === "yoy" || prev.comparisonId === "ytdVsYtd") {
          newRefDate = new Date(refDate.getFullYear() + direction, refDate.getMonth(), refDate.getDate());
        } else {
          // mtdVsPmtd
          newRefDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, 1);
        }

        const ranges = getComparisonRanges(prev.comparisonId, newRefDate);
        applyMultipleDateRanges({ host, target }, ranges);
        addLog(`🔄 Comparación navegada (${prev.comparisonId}): ${ranges.map(r => `${formatDateDMY(r.from)} - ${formatDateDMY(r.to)}`).join(" | ")}`);

        return {
          ...prev,
          navMonth: newRefDate
        };
      }

      // 2. Standard Granularity Navigation (Y / M / D)
      const granularity = prev.granularity || "M";
      const refDate = prev.from || prev.navMonth || new Date();
      let from: Date;
      let to: Date;

      if (granularity === "Y") {
        const newYear = refDate.getFullYear() + direction;
        from = new Date(newYear, 0, 1);
        to = new Date(newYear, 11, 31, 23, 59, 59, 999);
      } else if (granularity === "D") {
        const newDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + direction);
        from = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0);
        to = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999);
      } else {
        // Month (M)
        const newMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, 1);
        const lastDay = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth() + 1, 0).getDate();
        from = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), 1);
        to = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), lastDay, 23, 59, 59, 999);
      }

      if (target) {
        applyDateBetween({ host, target }, from, to);
        addLog(`📅 Navegando período (${granularity}): ${formatDateDMY(from)} - ${formatDateDMY(to)}`);
      }

      return {
        ...prev,
        mode: "navigation",
        from,
        to,
        presetId: undefined,
        navMonth: from
      };
    });
  }, [host, target, addLog]);

  // Applies (or clears) the final month selection returned by the native
  // Power BI host dialog (see src/dialogs/MonthPickerDialog.tsx) - the dialog
  // itself only tracks local selection state and hands back the finished
  // array once the user confirms/cancels via the host's own dialog chrome.
  const applyMonthsFromDialog = React.useCallback((months: string[]) => {
    if (months.length === 0) {
      if (target) {
        clearDateFilter({ host, target });
        addLog("Selección de meses limpiada");
      }
      setState(prev => ({ ...prev, selectedMonths: [], mode: "range" }));
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

  // Dispatches the normalized result returned by the popup-mode Power BI
  // host dialog (see src/dialogs/DatePickerDialog.tsx) to whichever apply
  // function matches the mode the user ended up in inside that dialog.
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
      case "comparison":
        if (result.comparisonId) applyComparison(result.comparisonId);
        break;
      case "months":
        applyMonthsFromDialog(result.selectedMonths || []);
        break;
      case "clear":
        clearFilter();
        break;
    }
  }, [setDateRange, applyPreset, applyComparison, applyMonthsFromDialog, clearFilter]);

  // Quick switch next to the Y/M/D selector: on = compare the current
  // Year/Month/Day (whichever granularity is active) against the previous
  // equivalent period; off = drop back to plain navigation at the same spot.
  const toggleVsPrevious = React.useCallback((enabled: boolean) => {
    if (!target) return;

    if (!enabled) {
      clearDateFilter({ host, target });
      addLog("Comparación vs. período anterior desactivada");
      setState(prev => ({ ...prev, mode: "range", comparisonId: undefined, from: undefined, to: undefined }));
      return;
    }

    setState(prev => {
      const granularity = prev.granularity || "M";
      const refDate = prev.navMonth || prev.from || new Date();
      const ranges = getComparisonRanges("vsPrevious", refDate, granularity);
      applyMultipleDateRanges({ host, target }, ranges);
      addLog(`🔄 Comparación activada (${granularity}) vs. período anterior`);

      return {
        ...prev,
        mode: "comparison",
        comparisonId: "vsPrevious",
        from: undefined,
        to: undefined,
        navMonth: refDate
      };
    });
  }, [host, target, addLog]);

  const disableComparisonMode = React.useCallback(() => {
    if (target) {
      clearDateFilter({ host, target });
      addLog("Modo comparación desactivado");
    }

    setState(prev => ({
      ...prev,
      mode: "range",
      comparisonId: undefined,
      from: undefined,
      to: undefined
    }));
  }, [host, target, addLog]);

  return {
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
    disableComparisonMode,
    addLog
  };
};
