# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Power BI custom visual called "DateX" - a date range picker with preset options for filtering data. The visual is built with React and TypeScript, using the Power BI Visuals API.

## Development Commands

- **Build the visual**: `pbiviz package` - Creates the .pbiviz file for Power BI
- **Start development server**: `pbiviz start` - Launches development server with hot reload
- **Install dependencies**: `npm install`

## Version Management

**IMPORTANT**: Always update the version number in `pbiviz.json` before building for production:
- Update `visual.version` field (e.g., "2.0.0.0" → "2.0.1.0")
- This ensures Power BI recognizes the update and allows reinstallation
- Version format: "major.minor.patch.build" (all four numbers required)

## Architecture

### Core Structure
- `src/visual.ts` - Main Power BI visual class that implements IVisual interface
- `src/ui/App.tsx` - React component containing the date picker UI
- `src/core/filters.ts` - Power BI filter application logic
- `src/core/presets.ts` - Date range preset calculations (this month, last 7 days, etc.)

### Key Concepts
- **FilterCtx**: Interface for applying Power BI filters with host and target column
- **ColumnTarget**: Identifies table.column for filter application
- **RangeState**: Component state tracking selected date range and preset mode
- **FormattingSettings**: Power BI formatting panel configuration

### Power BI Integration
- Uses `host.applyJsonFilter()` to apply advanced JSON filters for optimal performance
- Automatically detects bound date column from dataView metadata
- Supports filtering and comparison modes (MTD vs PMTD)
- Optimized for large datasets with sample-based data reduction (30,000 rows)
- Configurable via Power BI formatting panel (general/restrictions/presets objects)

### UI Components
- Date inputs with min/max restrictions
- Preset buttons (Este mes, Mes pasado, Últimos 7 días)
- Optional activity log showing filter operations
- SVG icons using CSS mask for theme compatibility

### Styling
- Uses LESS for styling (`style/visual.less`)
- Power BI theme variables for colors (--pbi-fg, --pbi-muted, etc.)
- Responsive card-based layout

## Configuration Files
- `pbiviz.json` - Power BI visual manifest and metadata
- `capabilities.json` - Defines data roles, objects, and properties for Power BI
- `tsconfig.json` - TypeScript configuration with React JSX support