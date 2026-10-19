import { useState, useEffect, useCallback } from 'react';
import {
  reportService,
  CourierReportRow,
  DestinationReportRow,
  CustomerReportRow,
} from '@/services';

export function useReportsController() {
  const [revenueTrend, setRevenueTrend] = useState<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [serviceDistribution, setServiceDistribution] = useState<Record<string, number>>({});
  const [courierReport, setCourierReport] = useState<CourierReportRow[]>([]);
  const [destinationReport, setDestinationReport] = useState<DestinationReportRow[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const [trend, status, service, courier, dest, customer] = await Promise.all([
        reportService.getRevenueCostTrend(7),
        reportService.getStatusDistribution(),
        reportService.getServiceDistribution(),
        reportService.getCourierReport(),
        reportService.getDestinationReport(),
        reportService.getCustomerReport(),
      ]);

      setRevenueTrend(trend);
      setStatusDistribution(status);
      setServiceDistribution(service);
      setCourierReport(courier);
      setDestinationReport(dest);
      setCustomerReport(customer);
    } catch (_err) {
      // reports failed to load — silently degrade
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    revenueTrend,
    statusDistribution,
    serviceDistribution,
    courierReport,
    destinationReport,
    customerReport,
    loading,
    refresh: loadReports,
  };
}
