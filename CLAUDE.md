# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Power BI custom visual called "DateX" (`pbi-datepicker`) — a date range picker with presets, month navigation, multi-month selection, and period-comparison modes (MTD vs PMTD, YoY, YTD vs YTD). Built with React 18 + TypeScript on the Power BI Visuals API (`apiVersion` 5.1.0).

## Guiding Principles

- Prefer Power BI native elements/APIs over custom-built equivalents where possible, for better integration, performance, and ecosystem alignment.

## Development Commands

- **Install dependencies**: `npm install`
- **Start dev server**: `npm start` (runs `pbiviz start`) — hot-reloads into Power BI Desktop/Service via the developer visual.
- **Build/package**: `npm run build` (runs `pbiviz package`) — outputs the `.pbiviz` file to `dist/`.
- There is no test suite or linter configured in this repo.

### Adding a new source file

`tsconfig.json` uses an explicit `"files"` array rather than an `include` glob — any new `.ts`/`.tsx` file **must be added to that list** or it will silently be excluded from compilation.

## Version Management

**Always bump the version before packaging for production**, in `pbiviz.json`:
- `visual.version`, format `major.minor.patch.build` (all four segments required), e.g. `"2.2.0.0"` → `"2.2.1.0"`.
- Power BI uses this to detect updates and allow reinstall of the same visual.

## Architecture

### Data flow
`visual.ts` (`Visual.update`) reads the `dataView`, resolves the bound date column (`table.column`) from `dataView.metadata.columns` or the first categorical category, populates `DateXFormattingSettingsModel` from the format pane, and renders `<App />` via `ReactDOM.render` into a persistent container div. All Power BI-specific plumbing (host, target column, formatting settings) lives in `visual.ts`; everything under `App` is plain React state driven by props + the `useDateFilter` hook.

### Core structure
- `src/visual.ts` — `IVisual` implementation; entry point, dataView/metadata parsing, formatting-model wiring, mounts/unmounts React.
- `src/settings.ts` — `DateXFormattingSettingsModel` (via `powerbi-visuals-utils-formattingmodel`): defines the format-pane cards (`general`, `navigation`, `presets`, `comparisons`, `restrictions`) whose property names must match `capabilities.json`.
- `src/ui/App.tsx` — top-level React component; wires `useDateFilter` state into the visual UI components based on which features are enabled via props.
- `src/hooks/useDateFilter.ts` — owns all filter state (`FilterState`) and every mutation (preset apply, comparison apply, month navigation, multi-month selection, granularity switching); calls into `core/filters.ts` to push filters to Power BI and appends to the activity log.
- `src/hooks/useClickOutside.ts` — generic outside-click dismissal, used by the month picker popup.
- `src/core/filters.ts` — builds and applies Power BI advanced JSON filters via `host.applyJsonFilter()`.
- `src/core/presets.ts` — pure date-range math for presets (today, last 7/30/90 days, this/prev month, this year, etc.) and comparison range pairs.
- `src/utils/dateHelpers.ts` — formatting (`formatDateDMY`) and range validation/auto-swap (`ensureValidDateRange`), plus "today" display logic (`getDisplayToDate`).
- `src/components/` — presentational components: `DateInputs`, `PresetButtons`, `ComparisonPanel`, `ComparisonBanner`, `MonthSelector` (+ `GranularitySelector` for Y/M/D switching), `FilterBadge`, `ActivityLog`.

### Key concepts
- **ColumnTarget** (`core/filters.ts`): `{ table, column }` identifying the bound date field.
- **FilterCtx**: `{ host, target, category? }` passed to filter-application functions.
- **FilterState** (`hooks/useDateFilter.ts`): current mode (`range | preset | comparison | navigation | multimonth`), active `from`/`to`, `presetId`, `comparisonId`, `navMonth`, `granularity`, `selectedMonths`, month-picker visibility.
- **DateXFormattingSettingsModel**: format-pane cards; property names/types must stay in sync with `capabilities.json` `objects`.

### Power BI integration notes
- Filters are applied with `host.applyJsonFilter()` using the `"general"/"filter"` object/property pair and `FilterAction.merge`/`remove`.
- **Known API limitation** (documented in `core/filters.ts`): the Advanced Filter API cannot express `(A AND B) OR (C AND D)`, so comparison mode (two discontinuous ranges) falls back to one continuous range spanning both periods, including the gap between them. A console warning and activity-log entry are emitted; the recommended workaround is for report authors to use measures to separate periods.
- Data reduction is capped at 30,000 sampled rows (`capabilities.json` → `dataReductionAlgorithm.sample.count`).
- Date column is auto-detected from the `date` data role; no manual column picker in the UI.

### Styling
- LESS source at `style/visual.less`; compiled `style/visual.css` is referenced from `pbiviz.json`.
- Uses Power BI theme CSS variables (`--pbi-fg`, `--pbi-muted`, etc.) for theme compatibility; SVG icons use CSS `mask` for the same reason.

## Configuration files
- `pbiviz.json` — visual manifest (name, GUID, version, style/capabilities/dependencies paths).
- `capabilities.json` — data roles, dataView mappings, and format-pane object/property schema (must match `settings.ts`).
- `tsconfig.json` — explicit `files` list (see note above); React JSX via classic `jsx: "react"`.
