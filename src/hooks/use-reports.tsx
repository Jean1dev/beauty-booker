import { useQuery } from "@tanstack/react-query";
import {
  getReportData,
  computeMetrics,
  computeServiceBreakdown,
  computeTopClients,
  computeTimeSeries,
  computeStatusDistribution,
  pickGranularity,
  ReportPeriod,
} from "@/services/reports";
import { Service } from "@/services/user-services";

interface UseReportsProps {
  userId: string | null;
  period: ReportPeriod;
  services: Service[];
}

export const useReports = ({ userId, period, services }: UseReportsProps) => {
  const query = useQuery({
    queryKey: ["reports", userId, period.start.getTime(), period.end.getTime()],
    enabled: !!userId,
    queryFn: async () => {
      const { current, previous } = await getReportData(userId!, period);
      const granularity = pickGranularity(period);

      return {
        appointments: current,
        metrics: computeMetrics(current),
        previousMetrics: computeMetrics(previous),
        serviceBreakdown: computeServiceBreakdown(current, services),
        topClients: computeTopClients(current),
        timeSeries: computeTimeSeries(current, granularity),
        statusDistribution: computeStatusDistribution(current),
      };
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
