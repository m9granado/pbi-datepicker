/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { DateXFormattingSettingsModel } from "./settings";
import { App, AppProps } from "./ui/App";
import { parseISODateInput, toEndOfDay, addDays, ensureValidDateRange } from "./utils/dateHelpers";

interface SyncedDateRange {
  from: Date;
  to: Date;
  key: string;
}

function mapPreset(preset?: string): string | undefined {
  switch ((preset || '').toLowerCase()) {
    case 'segoe':  return 'Segoe UI, SegoeUI, Arial, sans-serif';
    case 'roboto': return 'Roboto, Segoe UI, Arial, sans-serif';
    case 'arial':  return 'Arial, Helvetica, sans-serif';
    default:       return undefined;
  }
}

function parseColumnTarget(queryName?: string): { table: string; column: string } | undefined {
  if (!queryName) return undefined;

  // DAX-style names such as 'Calendar Table'[Date] or Calendar[Date].
  const bracketMatch = queryName.match(/^(?:'((?:[^']|'')+)'|([^\[]+))\[([^\]]+)\]$/);
  if (bracketMatch) {
    const table = (bracketMatch[1] || bracketMatch[2] || "").replace(/''/g, "'").trim();
    const column = bracketMatch[3].trim();
    if (table && column) return { table, column };
  }

  // Metadata normally supplies Entity.Property. Split at the last separator
  // so entity names containing dots remain intact.
  const separator = queryName.lastIndexOf(".");
  if (separator > 0 && separator < queryName.length - 1) {
    const table = queryName.slice(0, separator).trim();
    const column = queryName.slice(separator + 1).trim();
    if (table && column) return { table, column };
  }

  return undefined;
}

function parseFilterDate(value: unknown, endOfDay: boolean): Date | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return undefined;
  return endOfDay ? toEndOfDay(date) : date;
}

function getSyncedDateRange(dataView: any, target?: { table: string; column: string }): SyncedDateRange | undefined {
  const stored = dataView?.metadata?.objects?.general?.filter;
  const filter = Array.isArray(stored) ? stored[0] : stored;
  if (!filter || filter.$schema !== "https://powerbi.com/product/schema#advanced") return undefined;
  if (target && (filter.target?.table !== target.table || filter.target?.column !== target.column)) return undefined;

  const from = parseFilterDate(filter.conditions?.find((c: any) => c.operator === "GreaterThanOrEqual")?.value, false);
  const to = parseFilterDate(filter.conditions?.find((c: any) => c.operator === "LessThanOrEqual")?.value, true);
  if (!from || !to) return undefined;
  const key = `${from.getFullYear()}-${from.getMonth()}-${from.getDate()}|${to.getFullYear()}-${to.getMonth()}-${to.getDate()}`;
  return { from, to, key };
}

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private container: HTMLElement;
  private root: Root;
  private formattingSettingsService: FormattingSettingsService;
  private formattingSettings: DateXFormattingSettingsModel;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = document.createElement("div");
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    options.element.appendChild(this.container);

    // Support Power BI native right-click context menu
    this.container.addEventListener("contextmenu", (event: MouseEvent) => {
      const selectionId = this.host.createSelectionIdBuilder().createSelectionId();
      if ((this.host as any).showContextMenu) {
        (this.host as any).showContextMenu(selectionId, { x: event.clientX, y: event.clientY });
      }
      event.preventDefault();
    });

    // Initialize React 18 root
    this.root = createRoot(this.container);

    // Initialize formatting settings service
    this.formattingSettingsService = new FormattingSettingsService();

    // Initialize formatting settings with defaults
    this.formattingSettings = new DateXFormattingSettingsModel();
  }

  public update(options: VisualUpdateOptions) {
    // Populate formatting settings from dataView
    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      DateXFormattingSettingsModel,
      options.dataViews && options.dataViews[0] ? options.dataViews[0] : ({} as any)
    );

    const dv = options.dataViews && options.dataViews[0];

    // Extract column target from dataView metadata
    let target: { table: string; column: string } | undefined;
    let targetDiagnostic: string | undefined;
    try {
      const categories: any[] = (dv && dv.categorical && dv.categorical.categories) || [];
      const dateCategory: any = categories.find((category: any) => category.source?.roles?.date) || categories[0];
      const metaCols: any[] = (dv && dv.metadata && dv.metadata.columns) || [];
      const roleCol: any = metaCols.find((col: any) => col.roles?.date);
      const queryName = dateCategory?.source?.queryName || roleCol?.queryName;

      target = parseColumnTarget(queryName);
      if (!target) {
        targetDiagnostic = queryName
          ? `No se pudo interpretar la columna de fecha vinculada: ${queryName}.`
          : "No se encontró una columna vinculada al rol Date.";
      }
    } catch (error) {
      targetDiagnostic = "No se pudo leer la columna vinculada al rol Date.";
      console.warn("[DateX] Error resolving Date role target", error);
    }
    const syncedRange = getSyncedDateRange(dv, target);

    // Date restrictions: manual only (format pane), no auto-detection from
    // table data — that path was unreliable and hard to reason about.
    // minDate is inclusive (the typed day is the first valid day). maxDate
    // is EXCLUSIVE (the typed day is the first day NOT allowed, so the last
    // valid day is maxDate - 1) — e.g. typing 2030-01-01 allows data through
    // 2029-12-31. This lets users type round calendar boundaries instead of
    // having to compute "last day of the year/month" by hand.
    // If the user swaps them by mistake, ensureValidDateRange corrects it
    // instead of silently locking the visual.
    const manualMinDate = parseISODateInput(this.formattingSettings.restrictionsCard.minDate.value);
    const manualMaxDay = parseISODateInput(this.formattingSettings.restrictionsCard.maxDate.value);
    const manualMaxDate = manualMaxDay ? toEndOfDay(addDays(manualMaxDay, -1)) : undefined;
    const { from: min, to: max } = ensureValidDateRange(manualMinDate, manualMaxDate);

    // Resolve font family
    const fontPresetValue = (this.formattingSettings.generalCard.fontPreset.value?.value as string) || "";
    const customFontFamily = this.formattingSettings.generalCard.fontFamily.value;
    const resolvedFamily = customFontFamily || mapPreset(fontPresetValue);

    this.root.render(
      React.createElement(App, {
        host: this.host,
        minDate: min,
        maxDate: max,
        target: target,
        targetDiagnostic,
        syncedRange,
        mode: "filter",
        showLog: this.formattingSettings.generalCard.showLog.value,
        fontSize: this.formattingSettings.generalCard.fontSize.value,
        fontFamily: resolvedFamily,
        viewportHeight: options.viewport ? options.viewport.height : 300,
        viewportWidth: options.viewport ? options.viewport.width : 400,
        // Pass all preset visibility props
        showThisPeriod: this.formattingSettings.presetsCard.showThisPeriod.value,
        showPrevPeriod: this.formattingSettings.presetsCard.showPrevPeriod.value,
        periodContrastColor: this.formattingSettings.presetsCard.periodContrastColor.value?.value,
        // Pass navigation props
        enableDateInputs: this.formattingSettings.navigationCard.enableDateInputs.value,
        enableMonthNavigation: this.formattingSettings.navigationCard.enableMonthNavigation.value,
        showGranularityYear: this.formattingSettings.navigationCard.showGranularityYear.value,
        showGranularityMonth: this.formattingSettings.navigationCard.showGranularityMonth.value,
        showGranularityDay: this.formattingSettings.navigationCard.showGranularityDay.value,
        showMonthSelectionBadge: this.formattingSettings.navigationCard.showMonthSelectionBadge.value,
      } as AppProps)
    );
  }

  /**
   * Returns formatting model for the new Format Pane (API 5.1+)
   * This replaces the deprecated enumerateObjectInstances method
   */
  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }

  public destroy() {
    this.root.unmount();
  }
}
