/// <reference types="powerbi-visuals-api" />
import powerbi from "powerbi-visuals-api";
import { DateRange, toStartOfDay, toEndOfDay } from "./presets";

export interface ColumnTarget { table: string; column: string }

export interface FilterCtx {
  host: powerbi.extensibility.visual.IVisualHost;
  target: ColumnTarget;
  category?: powerbi.DataViewCategoryColumn;
}

export { DateRange };


// Applies a filter for a single, continuous date range using JSON filters
export function applyDateBetween(ctx: FilterCtx, from: Date, to: Date) {
  if (!ctx.target) return;
  
  // Use start of day for 'from' and end of day for 'to'
  const startOfDay = toStartOfDay(from);
  const endOfDay = toEndOfDay(to);
  
  const filter = {
    $schema: "https://powerbi.com/product/schema#advanced",
    target: {
      table: ctx.target.table,
      column: ctx.target.column
    },
    logicalOperator: "And",
    conditions: [
      {
        operator: "GreaterThanOrEqual",
        value: startOfDay.toISOString()
      },
      {
        operator: "LessThanOrEqual", 
        value: endOfDay.toISOString()
      }
    ]
  };

  ctx.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
}

// Applies a filter for multiple, non-continuous date ranges 
// 
// LIMITATION: Power BI Advanced Filter API doesn't support (A AND B) OR (C AND D) logic.
// This means we cannot create a filter like:
//   (date >= Jan1 AND date <= Jan15) OR (date >= Feb1 AND date <= Feb15)
// 
// Instead, we create a single continuous range from the earliest start to latest end,
// which includes ALL dates between both ranges (including unwanted data in the gap).
// 
// WORKAROUND: Users should use measures in their visuals to properly separate periods.
// The visual logs a warning when this happens so users are aware of the limitation.
// 
// Future enhancement: Investigate Tuple Filter API or Basic Filter with specific date values
// as alternatives. See: https://github.com/Microsoft/PowerBI-JavaScript/wiki/Filters
export function applyMultipleDateRanges(ctx: FilterCtx, ranges: DateRange[]) {
  if (!ctx.target || ranges.length === 0) return;

  if (ranges.length === 2) {
    const range1 = ranges[0];
    const range2 = ranges[1];
    
    const start1 = toStartOfDay(range1.from);
    const end1 = toEndOfDay(range1.to);
    const start2 = toStartOfDay(range2.from);
    const end2 = toEndOfDay(range2.to);

    // Use the earliest start and latest end to create one big range
    const earliestStart = start1 < start2 ? start1 : start2;
    const latestEnd = end1 > end2 ? end1 : end2;
    
    // Log warning about the limitation for debugging purposes
    console.warn(
      `[DateX] Comparison filter limitation: Cannot apply discontinuous ranges. ` +
      `Ranges: [${formatRange(range1)}] and [${formatRange(range2)}]. ` +
      `Applying continuous range: [${formatRange({from: earliestStart, to: latestEnd})}] ` +
      `(includes ${countDaysBetween(end1, start2)} days of unwanted gap data). ` +
      `Recommendation: Use measures to separate periods in your visual.`
    );
    
    // Apply as a single continuous range (will include gap data, but ensures both periods are visible)
    applyDateBetween(ctx, earliestStart, latestEnd);
  }
}

// Clears any active filter
export function clearDateFilter(ctx: FilterCtx) {
  if (!ctx.target) return;
  ctx.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
}

// Helper function to format a date range for logging
function formatRange(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt.format(range.from)} - ${fmt.format(range.to)}`;
}

// Helper function to count days between two dates
function countDaysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay));
}
