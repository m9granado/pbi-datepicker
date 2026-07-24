# DateX — Power BI Date Range Picker

A custom Power BI visual: a date range picker with quick presets, month/year multi-selection, and period-over-period comparisons (MTD vs PMTD, YoY, YTD vs YTD).

📥 **[Download the latest compiled `.pbiviz`](../../releases/latest)** — import it directly into Power BI Desktop or Service.

## Features

- **Manual date range** — from/to inputs with auto-swap if the user picks them backwards.
- **Quick presets** — Today, Yesterday, This Week, Last Week, Last 7/30/90 Days, This Month, Previous Month, This Year (each individually togglable).
- **Month/year navigation** — Y/M/D granularity switch (each option individually togglable) plus prev/next controls.
- **Multi-month selection** — pick several months (or a whole year at once) through a native Power BI host dialog, so the picker isn't clipped by the visual's own bounding box.
- **Period comparisons** — MTD vs PMTD, Year over Year, YTD vs YTD.
- **Two display modes** — **Canvas** (always-expanded card, default) or **Popup** (a compact button that opens the full picker as a host dialog — useful when space on the report is tight).
- **Configurable via the format pane** — fonts, date restrictions, which presets/comparisons/granularity options are visible, activity log, etc.

## Installation

1. Grab the latest `.pbiviz` from [Releases](../../releases/latest).
2. In Power BI Desktop: **Visualizations pane → ... → Import a visual from a file** and select the downloaded `.pbiviz`.
3. Drag the **DateX** visual onto the canvas and bind a date column to the **Date** field.

## Development

```bash
npm install       # install dependencies
npm start         # pbiviz start — dev server with hot reload (Power BI Desktop's developer visual)
npm run build     # pbiviz package — builds dist/*.pbiviz
```

Before packaging a new build for distribution, bump `visual.version` in `pbiviz.json` (format `major.minor.patch.build`) — Power BI uses it to detect updates.

## Architecture

- `src/visual.ts` — `IVisual` entry point: reads the dataView, resolves the bound date column, wires up the format-pane settings, and mounts the React app.
- `src/settings.ts` — format-pane schema (`powerbi-visuals-utils-formattingmodel`), must stay in sync with `capabilities.json`.
- `src/ui/App.tsx` — top-level React component; switches between Canvas and Popup rendering.
- `src/hooks/useDateFilter.ts` — owns all filter state and applies Power BI filters via `src/core/filters.ts`.
- `src/core/presets.ts` — pure date-range math for presets and comparisons.
- `src/dialogs/` — native Power BI host dialogs (`host.openModalDialog`) used for the month picker and the full popup-mode picker, so their UI isn't constrained by the visual's own sandboxed bounding box.
- `src/components/` — presentational UI pieces (date inputs, preset buttons, month grid, comparison panel, etc).

See `CLAUDE.md` for a more detailed architecture guide aimed at AI coding assistants working in this repo.

## License

Private/internal visual — not published to AppSource.
