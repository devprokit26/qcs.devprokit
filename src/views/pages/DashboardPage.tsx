import React, { useState } from 'react';
import { useDashboardController } from '@/controllers/useDashboardController';
import { useShipmentsController } from '@/controllers/useShipmentsController';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { ShipmentModal } from '../components/shipments/ShipmentModal';
import { formatPKR } from '@/utils/formatters';
import { COURIER_THEME_COLORS } from '@/utils/constants';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  CreditCard,
  DollarSign,
  Plus,
  AlertTriangle,
  Award,
  Users,
  Building,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { summary, revenueTrend, courierBreakdown, creditWarnings, loading, error, refresh: refreshDashboard } =
    useDashboardController();
  const { customers, vendors, createShipment } = useShipmentsController();
  const [newShipmentModalOpen, setNewShipmentModalOpen] = useState(false);

  const totalCouriers = Object.values(courierBreakdown).reduce((a, b) => a + b, 0) || 1;
  const sortedCouriers = Object.entries(courierBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div
          data-testid="dashboard-error-banner"
          className="p-4 rounded-card bg-red-50 border border-red-200 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm text-red-800">
            <strong className="font-extrabold">Could not load dashboard data:</strong>{' '}
            {error}
          </div>
          <button
            data-testid="dashboard-retry-btn"
            onClick={refreshDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Snapshot of operations, daily freight volumes, margins &amp; credit exposures
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={() => setNewShipmentModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            data-testid="new-shipment-quick-btn"
          >
            New Shipment
          </Button>
        </div>
      </div>

      {(summary?.unfinalAwbs.length ?? 0) > 0 && (
        <div
          data-testid="unfinal-warning-banner"
          className="p-4 rounded-card bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs text-amber-900">
            <strong className="font-extrabold">
              {summary!.unfinalAwbs.length} shipment{summary!.unfinalAwbs.length === 1 ? '' : 's'} awaiting finalization:
            </strong>{' '}
            <span className="font-semibold">{summary!.unfinalAwbs.join(', ')}</span>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-amber-700 text-white text-xs font-extrabold hover:bg-amber-800 transition-colors whitespace-nowrap"
          >
            View in Alerts
          </Link>
        </div>
      )}

      {/* Credit Warnings Banner (Over limit or Past credit days) */}
      {(creditWarnings.overLimit.length > 0 || creditWarnings.lockedLate.length > 0) && (
        <div
          data-testid="credit-warning-banner"
          className="p-4 rounded-card bg-amber-50/90 border border-amber-200/90 shadow-xs flex items-start gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs text-amber-900 space-y-1.5 flex-1">
            {creditWarnings.overLimit.length > 0 && (
              <div>
                <strong className="font-extrabold">
                  {creditWarnings.overLimit.length} customer(s) over credit limit:
                </strong>
                <ul className="list-disc list-inside mt-0.5 text-amber-800 space-y-0.5">
                  {creditWarnings.overLimit.map(item => (
                    <li key={item.customer.id}>
                      <span className="font-bold">{item.customer.name}</span> — Limit: {formatPKR(item.limit)}, Exceeded by: <span className="font-extrabold text-red-700">{formatPKR(item.exceedBy)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {creditWarnings.lockedLate.length > 0 && (
              <div className="pt-1">
                <strong className="font-extrabold">
                  {creditWarnings.lockedLate.length} customer(s) with invoices past payment terms:
                </strong>
                <ul className="list-disc list-inside mt-0.5 text-amber-800 space-y-0.5">
                  {creditWarnings.lockedLate.map(item => (
                    <li key={item.customer.id}>
                      <span className="font-bold">{item.customer.name}</span> — {item.daysOverdue} day(s) past {item.creditDays}d terms (Account locked unless overridden)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Shipments"
          value={summary?.todayShipments || 0}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 border border-blue-200"
          trend={{ positive: true, text: 'Recorded today' }}
          dataTestId="stat-today-shipments"
        />

        <StatCard
          label="Total Revenue"
          value={formatPKR(summary?.totalRevenue || 0).replace('PKR ', '')}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-200"
          trend={{ positive: true, text: 'Money IN from customers' }}
          dataTestId="stat-total-revenue"
        />

        <StatCard
          label="Total Cost"
          value={formatPKR(summary?.totalCost || 0).replace('PKR ', '')}
          icon={<CreditCard className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50 border border-red-200"
          subtext="Money OUT to couriers"
          dataTestId="stat-total-cost"
        />

        <StatCard
          label="Net Profit"
          value={formatPKR(summary?.netProfit || 0).replace('PKR ', '')}
          icon={<DollarSign className="w-5 h-5 text-[#C81320]" />}
          iconBg="bg-[#FEF3C7] border border-[#FDE68A]"
          trend={{
            positive: (summary?.netProfit || 0) >= 0,
            text: `${summary?.profitMarginPercent || 0}% Net Margin`,
          }}
          dataTestId="stat-net-profit"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courier Performance Bar Breakdown */}
        <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Courier Performance
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Shipment distribution across courier vendors
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {summary?.totalShipments || 0} Total
            </span>
          </div>

          <div className="space-y-3.5">
            {sortedCouriers.map(([courier, count]) => {
              const pct = ((count / totalCouriers) * 100).toFixed(0);
              const color = COURIER_THEME_COLORS[courier] || '#3B82F6';
              return (
                <div key={courier} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{courier}</span>
                    <span className="mono text-slate-500">
                      {count} <span className="text-[10.5px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Revenue vs Cost Trend Chart */}
        <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Revenue vs Cost Trend
              </h3>
              <p className="text-xs text-slate-400 font-semibold">Daily performance over the last 7 days</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickFormatter={val => `${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => [`PKR ${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#292929', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#00A6BD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mini Stat Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Top Courier
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summary?.topCourier?.name || '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              {summary?.topCourier ? `${summary.topCourier.count} shipments` : 'No data'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Top Customer
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-1 truncate max-w-[150px]">
              {summary?.topCustomer?.name || '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              {summary?.topCustomer ? `${summary.topCustomer.count} bookings` : 'No data'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Outstanding Receivable
            </span>
            <div className="mono text-lg font-black text-red-600 mt-1">
              {formatPKR(summary?.outstandingReceivable || 0)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Across all customer accounts
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Accounts
            </span>
            <div className="mono text-lg font-black text-slate-900 mt-1">
              {summary?.totalCustomers || 0} Clients
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              {summary?.totalVendors || 0} Registered Vendors
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Shipment Modal for Quick Action */}
      <ShipmentModal
        isOpen={newShipmentModalOpen}
        onClose={() => setNewShipmentModalOpen(false)}
        customers={customers}
        vendors={vendors}
        onSave={async (data, overrideCredit) => {
          await createShipment(data, overrideCredit);
          refreshDashboard();
        }}
      />
    </div>
  );
};
