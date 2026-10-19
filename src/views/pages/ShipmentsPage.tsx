import React, { useState } from 'react';
import { useShipmentsController } from '@/controllers/useShipmentsController';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { ShipmentModal } from '../components/shipments/ShipmentModal';
import { ShipmentInvoiceModal } from '../components/shipments/ShipmentInvoiceModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Shipment, ShipmentStatus } from '@/models/types';
import { formatPKR, formatDate } from '@/utils/formatters';
import { STATUS_OPTIONS } from '@/utils/constants';
import {
  Plus,
  FileDown,
  Search,
  Edit2,
  Printer,
  Trash2,
  Package,
} from 'lucide-react';
import { VendorModal } from '../components/ledger/VendorModal';
import { vendorService } from '@/services';

export const ShipmentsPage: React.FC = () => {
  const {
    shipments,
    customers,
    vendors,
    loading: _loading,
    filter,
    setFilter,
    createShipment,
    updateShipment,
    updateStatus,
    deleteShipment,
    exportPDF,
    refreshVendors,
    summary,
  } = useShipmentsController();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoiceShipment, setSelectedInvoiceShipment] = useState<Shipment | null>(null);

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleOpenAdd = () => {
    setEditingShipment(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Shipment) => {
    setEditingShipment(s);
    setModalOpen(true);
  };

  const handleOpenInvoice = (s: Shipment) => {
    setSelectedInvoiceShipment(s);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Shipment Log</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Every booked shipment, live status tracking, carrier costs and profit margins
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={exportPDF}
            icon={<FileDown className="w-4 h-4" />}
            data-testid="export-shipments-pdf-btn"
          >
            Export PDF
          </Button>
          <Button
            variant="gold"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4" />}
            data-testid="add-shipment-btn"
          >
            Add Shipment
          </Button>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white rounded-card p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by Customer, Courier, AWB, Destination..."
            value={filter.search || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilter(prev => ({ ...prev, search: e.target.value }))
            }
            className="pl-9"
            data-testid="search-shipments-input"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <Select
            value={filter.status || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilter(prev => ({ ...prev, status: e.target.value }))
            }
            className="w-full sm:w-36 text-xs"
            data-testid="filter-status-select"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={filter.range || 'all'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilter(prev => ({ ...prev, range: e.target.value as any }))
            }
            className="w-full sm:w-36 text-xs"
            data-testid="filter-range-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range...</option>
          </Select>
        </div>
      </div>

      {/* Custom Date Range Bar (shown when custom is selected) */}
      {filter.range === 'custom' && (
        <div className="p-4 bg-white rounded-card border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">From:</span>
            <input
              type="date"
              value={filter.from || ''}
              onChange={e => setFilter(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-1.5 text-xs border rounded-lg bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">To:</span>
            <input
              type="date"
              value={filter.to || ''}
              onChange={e => setFilter(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-1.5 text-xs border rounded-lg bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      )}

      {/* Range Summary Chip */}
      {filter.range !== 'all' && (
        <div
          data-testid="shipments-range-summary"
          className="p-4 rounded-xl bg-[#292929] text-white flex flex-wrap items-center gap-6 shadow-md"
        >
          <div className="mono text-xs">
            <span className="text-slate-400 font-sans">PERIOD:</span>{' '}
            <strong className="text-[#F21624] uppercase">{filter.range}</strong>
          </div>
          <div className="mono text-xs">
            <span className="text-slate-400 font-sans">SHIPMENTS:</span>{' '}
            <strong className="text-white">{summary.count}</strong>
          </div>
          <div className="mono text-xs">
            <span className="text-slate-400 font-sans">REVENUE:</span>{' '}
            <strong className="text-emerald-400">{formatPKR(summary.revenue)}</strong>
          </div>
          <div className="mono text-xs">
            <span className="text-slate-400 font-sans">COST:</span>{' '}
            <strong className="text-amber-400">{formatPKR(summary.cost)}</strong>
          </div>
          <div className="mono text-xs">
            <span className="text-slate-400 font-sans">PROFIT:</span>{' '}
            <strong className="text-teal-300">{formatPKR(summary.profit)}</strong>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">AWB #</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Consignee</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Courier</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Route</th>
                {/* <th className="py-3 px-3 font-bold text-slate-500 uppercase tracking-wider text-center">Pcs</th> */}
                <th className="py-3 px-3 font-bold text-slate-500 uppercase tracking-wider text-right">Wt (KG)</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Cost</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Profit</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.length > 0 ? (
                shipments.map(s => {
                  const profit = s.revenue - s.cost;
                  return (
                    <tr
                      key={s.id}
                      data-testid={`shipment-row-${s.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(s.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700 mono whitespace-nowrap">
                        {s.awb}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{s.customerName}</div>
                        {s.isWalkIn && (
                          <Badge variant="walkin" size="sm" className="mt-0.5">
                            Walk-in
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">{s.consignee || '-'}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-800 whitespace-nowrap">
                        {s.courier}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{s.service}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                        {s.origin || '-'} &rarr; {s.destination}
                        {s.productName && (
                          <div className="text-[10.5px] text-slate-400 font-semibold truncate max-w-[180px]" title={s.productName}>
                            {s.productName}
                          </div>
                        )}
                      </td>
                      {/* <td className="py-3 px-3 text-center mono font-semibold">{s.pieces || 1}</td> */}
                      <td className="py-3 px-3 text-right mono font-semibold">{s.weight.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right mono font-bold text-slate-900 whitespace-nowrap">
                        {formatPKR(s.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right mono font-bold text-slate-600 whitespace-nowrap">
                        {formatPKR(s.cost)}
                      </td>
                      <td className="py-3 px-4 text-right mono font-black text-emerald-600 whitespace-nowrap">
                        {formatPKR(profit)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <select
                          value={s.status}
                          onChange={e => updateStatus(s.id, e.target.value as ShipmentStatus)}
                          className="px-2.5 py-1 text-xs font-bold rounded-full border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer focus:ring-1 focus:ring-[#292929]"
                          data-testid={`status-select-${s.id}`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit shipment"
                            data-testid={`edit-shipment-${s.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenInvoice(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Customer invoice"
                            data-testid={`invoice-shipment-${s.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No shipments found matching this criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Shipment Modal */}
      <ShipmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shipmentToEdit={editingShipment}
        customers={customers}
        vendors={vendors}
        onOpenAddVendor={() => setVendorModalOpen(true)}
        onSave={async (data, overrideCredit) => {
          if (editingShipment) {
            return await updateShipment(editingShipment.id, data, overrideCredit);
          } else {
            return await createShipment(data, overrideCredit);
          }
        }}
      />

      {/* Quick Vendor Creation Modal */}
      <VendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSave={async (vendorData) => {
          const newVend = await vendorService.createVendor(vendorData);
          await refreshVendors();
          return newVend;
        }}
      />

      {/* Invoice Modal */}
      <ShipmentInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        shipment={selectedInvoiceShipment}
        customer={
          selectedInvoiceShipment?.customerId
            ? customers.find(c => c.id === selectedInvoiceShipment.customerId)
            : null
        }
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) deleteShipment(deleteId);
        }}
        title="Delete Shipment"
        message="Are you sure you want to delete this shipment? This action cannot be undone."
      />
    </div>
  );
};
