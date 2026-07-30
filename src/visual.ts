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

function mapPreset(preset?: string): string | undefined {
  switch ((preset || '').toLowerCase()) {
    case 'segoe':  return 'Segoe UI, SegoeUI, Arial, sans-serif';
    case 'roboto': return 'Roboto, Segoe UI, Arial, sans-serif';
    case 'arial':  return 'Arial, Helvetica, sans-serif';
    default:       return undefined;
  }
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

    // Extract date restrictions
    const minDate = this.formattingSettings.restrictionsCard.minDate.value;
    const maxDate = this.formattingSettings.restrictionsCard.maxDate.value;
    const min = minDate ? new Date(minDate + "T00:00:00") : undefined;
    const max = maxDate ? new Date(maxDate + "T00:00:00") : undefined;

    // Extract column target from dataView metadata
    let target: { table: string; column: string } | undefined;
    try {
      const metaCols: any[] = (dv && dv.metadata && dv.metadata.columns) || [];
      const roleCol: any = metaCols.find((col: any) => col.roles && (col.roles as any).date);
      let qn: string | undefined = roleCol && roleCol.queryName;
      if (!qn) {
        const cat = dv && dv.categorical && dv.categorical.categories && dv.categorical.categories[0];
        const src: any = cat && cat.source;
        qn = src && src.queryName;
      }
      if (qn) {
        const parts = qn.split('.');
        if (parts.length >= 2) target = { table: parts[0], column: parts[1] };
      }
    } catch {}

    const category = dv && dv.categorical && dv.categorical.categories && dv.categorical.categories[0];
    
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
        mode: "filter",
        category: category as any,
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
