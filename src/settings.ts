/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

// General Settings Card
class GeneralSettingsCard extends formattingSettings.SimpleCard {
  name: string = "general";
  displayName: string = "General";

  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize",
    displayName: "Tamaño de Fuente",
    value: 12,
    options: {
      minValue: {
        type: powerbi.visuals.ValidatorType.Min,
        value: 8
      },
      maxValue: {
        type: powerbi.visuals.ValidatorType.Max,
        value: 24
      }
    }
  });

  fontPreset = new formattingSettings.ItemDropdown({
    name: "fontPreset",
    displayName: "Fuente Predeterminada",
    value: { value: "", displayName: "Custom" },
    items: [
      { value: "", displayName: "Custom" },
      { value: "segoe", displayName: "Segoe UI" },
      { value: "roboto", displayName: "Roboto" },
      { value: "arial", displayName: "Arial" }
    ]
  });

  fontFamily = new formattingSettings.TextInput({
    name: "fontFamily",
    displayName: "Fuente Personalizada",
    value: "",
    placeholder: "ej: Segoe UI, Arial"
  });

  showLog = new formattingSettings.ToggleSwitch({
    name: "showLog",
    displayName: "Mostrar Registro de Actividad",
    value: false
  });

  slices: formattingSettings.Slice[] = [
    this.fontPreset,
    this.fontFamily,
    this.fontSize,
    this.showLog
  ];
}

// Navigation Settings Card
class NavigationSettingsCard extends formattingSettings.SimpleCard {
  name: string = "navigation";
  displayName: string = "Navigation Options";

  enableDateInputs = new formattingSettings.ToggleSwitch({
    name: "enableDateInputs",
    displayName: "Enable Date Input Fields",
    value: false
  });

  enableMonthNavigation = new formattingSettings.ToggleSwitch({
    name: "enableMonthNavigation",
    displayName: "Enable Month Navigation",
    value: true
  });

  showGranularityYear = new formattingSettings.ToggleSwitch({
    name: "showGranularityYear",
    displayName: "Show 'Y' (Year) Option",
    value: true
  });

  showGranularityMonth = new formattingSettings.ToggleSwitch({
    name: "showGranularityMonth",
    displayName: "Show 'M' (Month) Option",
    value: true
  });

  showGranularityDay = new formattingSettings.ToggleSwitch({
    name: "showGranularityDay",
    displayName: "Show 'D' (Day) Option",
    value: true
  });

  showMonthSelectionBadge = new formattingSettings.ToggleSwitch({
    name: "showMonthSelectionBadge",
    displayName: "Show Month Selection Count Badge",
    value: false
  });

  slices: formattingSettings.Slice[] = [
    this.enableDateInputs,
    this.enableMonthNavigation,
    this.showGranularityYear,
    this.showGranularityMonth,
    this.showGranularityDay,
    this.showMonthSelectionBadge
  ];
}

// Presets Settings Card
class PresetsSettingsCard extends formattingSettings.SimpleCard {
  name: string = "presets";
  displayName: string = "Preset Filters";

  showThisPeriod = new formattingSettings.ToggleSwitch({
    name: "showThisPeriod",
    displayName: "Show 'This Period' (CP)",
    value: true
  });

  showPrevPeriod = new formattingSettings.ToggleSwitch({
    name: "showPrevPeriod",
    displayName: "Show 'Previous Period' (PP)",
    value: true
  });

  periodContrastColor = new formattingSettings.ColorPicker({
    name: "periodContrastColor",
    displayName: "Color de Botones CP/PP",
    value: { value: "#2563EB" }
  });

  slices: formattingSettings.Slice[] = [
    this.showThisPeriod,
    this.showPrevPeriod,
    this.periodContrastColor
  ];
}

// Restrictions Settings Card
class RestrictionsSettingsCard extends formattingSettings.SimpleCard {
  name: string = "restrictions";
  displayName: string = "Date Restrictions";

  minDate = new formattingSettings.TextInput({
    name: "minDate",
    displayName: "Minimum Date",
    description: "Format must be exactly YYYY-MM-DD (e.g. 2026-01-31). Leave empty for no minimum.",
    value: "",
    placeholder: "YYYY-MM-DD"
  });

  maxDate = new formattingSettings.TextInput({
    name: "maxDate",
    displayName: "Maximum Date",
    description: "Exclusive: enter the day AFTER the last day you want to allow (e.g. 2030-01-01 allows data through 2029-12-31). Format YYYY-MM-DD. Leave empty for no maximum.",
    value: "",
    placeholder: "YYYY-MM-DD (exclusivo)"
  });

  slices: formattingSettings.Slice[] = [
    this.minDate,
    this.maxDate
  ];
}

// Main Formatting Settings Model
export class DateXFormattingSettingsModel extends formattingSettings.Model {
  generalCard = new GeneralSettingsCard();
  navigationCard = new NavigationSettingsCard();
  presetsCard = new PresetsSettingsCard();
  restrictionsCard = new RestrictionsSettingsCard();

  cards: formattingSettings.SimpleCard[] = [
    this.generalCard,
    this.navigationCard,
    this.presetsCard,
    this.restrictionsCard
  ];
}
