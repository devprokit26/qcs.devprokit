import React from 'react';
import { useReportsController } from '@/controllers/useReportsController';
import { formatPKR } from '@/utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Shipped: '#3B82F6',
  Delivered: '#10B981',
  Returned: '#EF4444',
};

const SERVICE_COLORS = ['#3B82F6', '#14B8A6', '#00A6BD', '#F59E0B'];

export const ReportsPage: React.FC = () => {
  const {
    revenueTrend,
    statusDistribution,
    serviceDistribution,
    courierReport,
    destinationReport,
    customerReport,
  } = useReportsController();

  const statusPieData = Object.entries(statusDistribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const serviceData = Object.entries(serviceDistribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const maxService = Math.max(...serviceData.map(s => s.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics &amp; Reports</h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          In-depth financial breakdowns across couriers, destinations, services and accounts
        </p>
      </div>

      {/* 7-Day Revenue vs Cost Chart */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Revenue vs Cost — Last 7 Days
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Daily comparison of revenue earned from customers vs. carrier cost paid out
          </p>
        </div>

        <div className="h-64 w-full">
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
                contentStyle={{
                  backgroundColor: '#292929',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                  border: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Cost" fill="#00A6BD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Donut + Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut */}
        <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Shipment Status Breakdown
            </h3>
            <p className="text-xs text-slate-400 font-semibold mb-4">
              Current operational distribution of parcels
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map(entry => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={STATUS_COLORS[entry.name] || '#94A3B8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number, name: string) => [`${val} shipments`, name]}
                  contentStyle={{
                    backgroundColor: '#292929',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Type Breakdown */}
        <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Service Type Breakdown
            </h3>
            <p className="text-xs text-slate-400 font-semibold mb-4">
              Volume split between Express, Economy, Standard and Overnight
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {serviceData.map((s, idx) => {
              const pct = ((s.value / maxService) * 100).toFixed(0);
              const color = SERVICE_COLORS[idx % SERVICE_COLORS.length];
              return (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{s.name}</span>
                    <span className="mono text-slate-600">{s.value} shipments</span>
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
      </div>

      {/* Courier-Wise Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Courier-Wise Breakdown
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Profitability and market share analysis per carrier vendor
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider">Courier</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Shipments</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Total Revenue</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Total Cost</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Profit</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Margin %</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Share %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courierReport.map(c => (
                <tr key={c.courier} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-extrabold text-slate-900">{c.courier}</td>
                  <td className="py-3 px-4 text-right mono font-semibold">{c.count}</td>
                  <td className="py-3 px-4 text-right mono font-bold text-emerald-600">
                    {formatPKR(c.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right mono font-bold text-red-600">
                    {formatPKR(c.cost)}
                  </td>
                  <td className="py-3 px-4 text-right mono font-black text-slate-900">
                    {formatPKR(c.profit)}
                  </td>
                  <td className="py-3 px-4 text-right mono font-extrabold text-blue-700">
                    {c.marginPercent}%
                  </td>
                  <td className="py-3 px-4 text-right mono text-slate-500 font-bold">
                    {c.sharePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Destination-Wise Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Destination-Wise Breakdown
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Tonnage, volumes and average revenue per destination country
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider">Destination</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Shipments</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Total Weight (KG)</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Total Revenue</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Avg. Revenue / Shipment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {destinationReport.map(d => (
                <tr key={d.destination} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-extrabold text-slate-900">{d.destination}</td>
                  <td className="py-3 px-4 text-right mono font-semibold">{d.count}</td>
                  <td className="py-3 px-4 text-right mono font-bold text-slate-700">
                    {d.totalWeight.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right mono font-bold text-emerald-600">
                    {formatPKR(d.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right mono font-extrabold text-slate-900">
                    {formatPKR(d.avgRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer-Wise Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Customer-Wise Report
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Lifetime shipment booking count, cumulative paid revenue and current balance
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Shipments</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Total Booked</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Current Balance</th>
                <th className="py-3 px-4 font-bold text-slate-600 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerReport.map(c => (
                <tr key={c.customerId} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-extrabold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-right mono font-semibold">{c.shipments}</td>
                  <td className="py-3 px-4 text-right mono font-bold text-emerald-600">
                    {formatPKR(c.totalPaid)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right mono font-black ${
                      c.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatPKR(Math.abs(c.outstanding))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${
                        c.status === 'Owes'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
