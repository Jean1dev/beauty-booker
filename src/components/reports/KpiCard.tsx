import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Variação relativa vs. período anterior (null quando não há base). */
  deltaPct?: number | null;
  /** Quando true, uma queda é considerada positiva (ex.: cancelamentos). */
  lowerIsBetter?: boolean;
  hint?: string;
}

export const KpiCard = ({ label, value, icon: Icon, deltaPct, lowerIsBetter, hint }: KpiCardProps) => {
  const hasDelta = deltaPct !== undefined && deltaPct !== null && Number.isFinite(deltaPct);
  const isUp = hasDelta && (deltaPct as number) > 0;
  const isDown = hasDelta && (deltaPct as number) < 0;
  const isGood = (isUp && !lowerIsBetter) || (isDown && lowerIsBetter);
  const isBad = (isUp && lowerIsBetter) || (isDown && !lowerIsBetter);

  return (
    <div className="bg-card rounded-[20px] border border-border shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        {hasDelta && (deltaPct as number) !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isGood && "text-green-600",
              isBad && "text-destructive",
              !isGood && !isBad && "text-muted-foreground"
            )}
          >
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs((deltaPct as number) * 100).toFixed(0)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-display font-light text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
};
