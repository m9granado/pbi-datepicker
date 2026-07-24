/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

// General Settings Card
class GeneralSettingsCard extends formattingSettings.SimpleCard {
  name: string = "general";
  displayName: string = "General";
  
  buttonText = new formattingSettings.TextInput({
    name: "buttonText",
    displayName: "Button Text",
    value: "DateX",
    placeholder: "Enter button text"
  });

  displayMode = new formattingSettings.ItemDropdown({
    name: "displayMode",
    displayName: "Display Mode",
    value: { value: "canvas", displayName: "Canvas (siempre visible)" },
    items: [
      { value: "canvas", displayName: "Canvas (siempre visible)" },
      { value: "popup", displayName: "Popup (botón + diálogo)" }
    ]
  });

  showLog = new formattingSettings.ToggleSwitch({
    name: "showLog",
    displayName: "Show Activity Log",
    value: false
  });

  showButtonLabels = new formattingSettings.ToggleSwitch({
    name: "showButtonLabels",
    displayName: "Show Button Labels",
    value: true
  });

  showSelectedPeriodBadge = new formattingSettings.ToggleSwitch({
    name: "showSelectedPeriodBadge",
    displayName: "Show Selected Period Badge",
    value: true
  });

  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize",
    displayName: "Font Size",
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

  fontFamily = new formattingSettings.TextInput({
    name: "fontFamily",
    displayName: "Font Family",
    value: "",
    placeholder: "e.g., Segoe UI, Arial"
  });

  fontPreset = new formattingSettings.ItemDropdown({
    name: "fontPreset",
    displayName: "Font Preset",
    value: { value: "", displayName: "Custom" },
    items: [
      { value: "", displayName: "Custom" },
      { value: "segoe", displayName: "Segoe UI" },
      { value: "roboto", displayName: "Roboto" },
      { value: "arial", displayName: "Arial" }
    ]
  });

  // Grouped for readability in the format pane: mode/text first, then
  // display toggles, then typography, with the diagnostic log toggle last.
  slices: formattingSettings.Slice[] = [
    this.displayMode,
    this.buttonText,
    this.showSelectedPeriodBadge,
    this.showButtonLabels,
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
    value: true
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

  // Grouped for readability: core toggles first, then the Y/M/D granularity
  // options together (so it's clear they're a related set), badge last.
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

  showToday = new formattingSettings.ToggleSwitch({
    name: "showToday",
    displayName: "Show 'Today'",
    value: false
  });

  showYesterday = new formattingSettings.ToggleSwitch({
    name: "showYesterday",
    displayName: "Show 'Yesterday'",
    value: false
  });

  showThisWeek = new formattingSettings.ToggleSwitch({
    name: "showThisWeek",
    displayName: "Show 'This Week'",
    value: false
  });

  showLastWeek = new formattingSettings.ToggleSwitch({
    name: "showLastWeek",
    displayName: "Show 'Last Week'",
    value: false
  });

  showLast7 = new formattingSettings.ToggleSwitch({
    name: "showLast7",
    displayName: "Show 'Last 7 Days'",
    value: false
  });

  showLast30 = new formattingSettings.ToggleSwitch({
    name: "showLast30",
    displayName: "Show 'Last 30 Days'",
    value: false
  });

  showLast90 = new formattingSettings.ToggleSwitch({
    name: "showLast90",
    displayName: "Show 'Last 90 Days'",
    value: false
  });

  showThisMonth = new formattingSettings.ToggleSwitch({
    name: "showThisMonth",
    displayName: "Show 'This Month'",
    value: true
  });

  showPrevMonth = new formattingSettings.ToggleSwitch({
    name: "showPrevMonth",
    displayName: "Show 'Previous Month'",
    value: true
  });

  showThisYear = new formattingSettings.ToggleSwitch({
    name: "showThisYear",
    displayName: "Show 'This Year'",
    value: false
  });

  slices: formattingSettings.Slice[] = [
    this.showToday,
    this.showYesterday,
    this.showThisWeek,
    this.showLastWeek,
    this.showLast7,
    this.showLast30,
    this.showLast90,
    this.showThisMonth,
    this.showPrevMonth,
    this.showThisYear
  ];
}

// Comparisons Settings Card
class ComparisonsSettingsCard extends formattingSettings.SimpleCard {
  name: string = "comparisons";
  displayName: string = "Comparisons";

  enableVersus = new formattingSettings.ToggleSwitch({
    name: "enableVersus",
    displayName: "Enable Comparison Mode",
    value: false
  });

  showMTDvsPMTD = new formattingSettings.ToggleSwitch({
    name: "showMTDvsPMTD",
    displayName: "Show MTD vs PMTD",
    value: true
  });

  showYoY = new formattingSettings.ToggleSwitch({
    name: "showYoY",
    displayName: "Show Year over Year",
    value: false
  });

  showYTDvsYTD = new formattingSettings.ToggleSwitch({
    name: "showYTDvsYTD",
    displayName: "Show YTD vs YTD",
    value: false
  });

  slices: formattingSettings.Slice[] = [
    this.enableVersus,
    this.showMTDvsPMTD,
    this.showYoY,
    this.showYTDvsYTD
  ];
}

// Restrictions Settings Card
class RestrictionsSettingsCard extends formattingSettings.SimpleCard {
  name: string = "restrictions";
  displayName: string = "Date Restrictions";

  minDate = new formattingSettings.TextInput({
    name: "minDate",
    displayName: "Minimum Date",
    value: "",
    placeholder: "YYYY-MM-DD"
  });

  maxDate = new formattingSettings.TextInput({
    name: "maxDate",
    displayName: "Maximum Date",
    value: "",
    placeholder: "YYYY-MM-DD"
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
  comparisonsCard = new ComparisonsSettingsCard();
  restrictionsCard = new RestrictionsSettingsCard();

  cards: formattingSettings.SimpleCard[] = [
    this.generalCard,
    this.navigationCard,
    this.presetsCard,
    this.comparisonsCard,
    this.restrictionsCard
  ];
}
