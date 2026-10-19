import { useState, useEffect, useCallback } from 'react';
import { AnalyticsSummary, DashboardCreditWarning, reportService } from '@/services';

export type { DashboardCreditWarning };

export function useDashboardController() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>>([]);
  const [courierBreakdown, setCourierBreakdown] = useState<Record<string, number>>({});
  const [creditWarnings, setCreditWarnings] = useState<DashboardCreditWarning>({ overLimit: [], lockedLate: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sum, trend, couriers, warnings] = await Promise.all([
        reportService.getAnalyticsSummary(),
        reportService.getRevenueCostTrend(7),
        reportService.getCourierReport(),
        reportService.getCreditWarnings(),
      ]);

      setSummary(sum);
      setRevenueTrend(trend);

      const courierMap: Record<string, number> = {};
      couriers.forEach(c => {
        courierMap[c.courier] = c.count;
      });
      setCourierBreakdown(courierMap);
      setCreditWarnings(warnings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(msg);
      // Keep whatever was last loaded
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    summary,
    revenueTrend,
    courierBreakdown,
    creditWarnings,
    loading,
    error,
    refresh: loadData,
  };
}
