export type PresetId = "thisPeriod" | "prevPeriod";

export const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
export const toEndOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Helper for start of week (assuming Sunday is the first day)
export const toStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return toStartOfDay(new Date(new Date(d).setDate(diff)));
}

export function getRange(presetId: PresetId, granularity: "Y" | "M" | "D" = "M"): { from: Date; to: Date } {
  const now = new Date();
  const today0 = toStartOfDay(now);
  switch (presetId) {
    case "thisPeriod": {
      if (granularity === "Y") {
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
      }
      if (granularity === "D") {
        return { from: today0, to: toEndOfDay(now) };
      }
      // Default M (Month)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59, 999)
      };
    }
    case "prevPeriod": {
      if (granularity === "Y") {
        return {
          from: new Date(now.getFullYear() - 1, 0, 1),
          to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        };
      }
      if (granularity === "D") {
        const y = addDays(today0, -1);
        return { from: y, to: toEndOfDay(y) };
      }
      // Default M (Month)
      const prevMonth = now.getMonth() - 1;
      const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = prevMonth < 0 ? 11 : prevMonth;
      const lastDayOfPrevMonth = new Date(prevYear, adjustedMonth + 1, 0).getDate();
      return {
        from: new Date(prevYear, adjustedMonth, 1),
        to: new Date(prevYear, adjustedMonth, lastDayOfPrevMonth, 23, 59, 59, 999)
      };
    }
    default:
      return { from: today0, to: toEndOfDay(now) };
  }
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function formatBadge(from?: Date, to?: Date, locale: string = "es-CL"): string {
  if (!from || !to) return "Sin filtro";
  const fmt = new Intl.DateTimeFormat(locale);
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}