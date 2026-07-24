/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;

// Lightweight, plain-DOM "info" dialog explaining what a comparison mode does
// and the DAX-measures caveat. Opened on demand from the small "ⓘ" button on
// the compact comparison chip, instead of an always-visible banner that used
// to eat most of the visual's limited canvas space.

interface ComparisonInfoInitialState {
  title?: string;
  description?: string;
}

export class ComparisonInfoDialog {
  static id = "ComparisonInfoDialog";

  constructor(options: DialogConstructorOptions, initialState: object) {
    const host = options.host;
    const state = (initialState || {}) as ComparisonInfoInitialState;

    const el = options.element;
    el.style.padding = "18px";
    el.style.fontFamily = "Segoe UI, Arial, sans-serif";
    el.style.fontSize = "13px";
    el.style.color = "#1D1D1F";
    el.style.boxSizing = "border-box";
    el.innerHTML = `
      <h3 style="margin-top:0;">${state.title || "Modo comparación"}</h3>
      <p style="line-height:1.5;">${state.description || ""}</p>
      <p style="font-size:12px;color:#888888;line-height:1.4;">
        Power BI no permite filtrar dos rangos de fechas discontinuos a la vez,
        así que necesitas medidas DAX que separen ambos períodos para que la
        comparación tenga sentido en tus visuales.
      </p>
    `;

    host.setResult({ acknowledged: true });
  }
}

// Required dialog registration boilerplate - see:
// https://learn.microsoft.com/power-bi/developer/visuals/create-display-dialog-box
(globalThis as any).dialogRegistry = (globalThis as any).dialogRegistry || {};
(globalThis as any).dialogRegistry[ComparisonInfoDialog.id] = ComparisonInfoDialog;
