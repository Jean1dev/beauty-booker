import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  subDays,
  subMonths,
  format,
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportPeriod } from "@/services/reports";

export type PeriodPreset = "7d" | "30d" | "this_month" | "last_month" | "this_year" | "custom";

export const buildPeriod = (preset: PeriodPreset, now: Date = new Date()): ReportPeriod => {
  switch (preset) {
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "30d":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "this_month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case "this_year":
      return { start: startOfYear(now), end: endOfDay(now) };
    default:
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
  }
};

const PRESET_LABELS: Record<PeriodPreset, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Mês passado",
  this_year: "Este ano",
  custom: "Personalizado",
};

interface PeriodSelectorProps {
  preset: PeriodPreset;
  period: ReportPeriod;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomChange: (period: ReportPeriod) => void;
}

export const PeriodSelector = ({
  preset,
  period,
  onPresetChange,
  onCustomChange,
}: PeriodSelectorProps) => {
  const startValue = useMemo(() => format(period.start, "yyyy-MM-dd"), [period.start]);
  const endValue = useMemo(() => format(period.end, "yyyy-MM-dd"), [period.end]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as PeriodPreset)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PRESET_LABELS) as PeriodPreset[]).map((key) => (
            <SelectItem key={key} value={key}>
              {PRESET_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startValue}
            max={endValue}
            onChange={(e) =>
              onCustomChange({ ...period, start: startOfDay(new Date(e.target.value + "T00:00:00")) })
            }
            className="px-3 py-2 bg-secondary rounded-xl border border-border text-sm text-foreground focus:outline-none"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <input
            type="date"
            value={endValue}
            min={startValue}
            onChange={(e) =>
              onCustomChange({ ...period, end: endOfDay(new Date(e.target.value + "T00:00:00")) })
            }
            className="px-3 py-2 bg-secondary rounded-xl border border-border text-sm text-foreground focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
