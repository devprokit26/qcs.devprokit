import { IReportService, AnalyticsSummary, CourierReportRow, DestinationReportRow, CustomerReportRow, DashboardCreditWarning } from '../api/interfaces';
import { apiFetch } from './apiClient';

export class ReportRestService implements IReportService {
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return apiFetch<AnalyticsSummary>('/reports/analytics');
  }

  async getRevenueCostTrend(days: number = 30): Promise<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>> {
    return apiFetch<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>>(`/reports/trend?days=${days}`);
  }

  async getStatusDistribution(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>('/reports/status-distribution');
  }

  async getServiceDistribution(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>('/reports/service-distribution');
  }

  async getCourierReport(): Promise<CourierReportRow[]> {
    return apiFetch<CourierReportRow[]>('/reports/couriers');
  }

  async getDestinationReport(): Promise<DestinationReportRow[]> {
    return apiFetch<DestinationReportRow[]>('/reports/destinations');
  }

  async getCustomerReport(): Promise<CustomerReportRow[]> {
    return apiFetch<CustomerReportRow[]>('/reports/customers');
  }

  async getCreditWarnings(): Promise<DashboardCreditWarning> {
    return apiFetch<DashboardCreditWarning>('/reports/credit-warnings');
  }
}

export const reportService = new ReportRestService();

