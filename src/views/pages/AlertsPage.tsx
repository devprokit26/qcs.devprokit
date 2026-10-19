import React, { useState } from 'react';
import { useShipmentsController } from '@/controllers/useShipmentsController';
import { useAlertsController, OverdueAlertItem } from '@/controllers/useAlertsController';
import { useLedgerController } from '@/controllers/useLedgerController';
import { Shipment, Customer } from '@/models/types';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { ShipmentModal } from '../components/shipments/ShipmentModal';
import { PaymentModal } from '../components/ledger/PaymentModal';
import { LedgerDetailModal } from '../components/ledger/LedgerDetailModal';
import { formatPKR, formatDate } from '@/utils/formatters';
import {
  MessageCircle,
  Mail,
  CreditCard,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    unfinalShipments,
    filter,
    setFilter,
    loading,
    refresh: refreshAlerts,
  } = useAlertsController();
  const {
    customers,
    getCustomerComputed,
    receiveCustomerPayment,
    sendWhatsAppReminder,
    sendEmailReminder,
    refresh: refreshLedger,
  } = useLedgerController();
  const { vendors, updateShipment, refresh: refreshShipments } = useShipmentsController();

  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [finalizeTarget, setFinalizeTarget] = useState<Shipment | null>(null);
  const [detailCustomerId, setDetailCustomerId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleOpenPayment = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setPaymentCustomer(customer);
      setPaymentModalOpen(true);
    }
  };

  const handleOpenFinalize = (shipment: Shipment) => {
    setFinalizeTarget({ ...shipment, status: 'Pending' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Alerts</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Overdue customer invoices and shipments awaiting final amounts
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
            className="text-xs py-2"
            data-testid="alerts-filter-select"
          >
            <option value="all">All Overdue</option>
            <option value="1_30">1–30 Days Overdue</option>
            <option value="31_60">31–60 Days Overdue</option>
            <option value="60plus">60+ Days Overdue</option>
          </Select>
        </div>
      </div>

      <section className="space-y-3.5">
        {loading && alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-card border border-slate-200">
            Loading alerts…
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert: OverdueAlertItem, idx) => (
            <div
              key={`${alert.customerId}_${alert.date}_${idx}`}
              data-testid={`alert-item-${alert.customerId}`}
              className={`bg-white rounded-card p-5 border border-slate-200/80 border-l-4 ${alert.severity.borderClass} shadow-card hover:shadow-cardHover transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black tracking-tight border ${alert.severity.badgeClass}`}>
                    {alert.daysOverdue} day(s) overdue · {alert.severity.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Terms: {alert.creditDays}d</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 truncate">{alert.customerName}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {alert.description} · Invoiced {formatDate(alert.date)}
                </p>
                <div className={`mono text-base font-black mt-2 ${alert.severity.textClass}`}>
                  {formatPKR(alert.amount)} unpaid
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {alert.phone && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendWhatsAppReminder(alert.customerId)}
                    icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    WhatsApp
                  </Button>
                )}
                {alert.email && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendEmailReminder(alert.customerId)}
                    icon={<Mail className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    Email
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenPayment(alert.customerId)}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  data-testid={`alert-record-payment-${alert.customerId}`}
                >
                  Record Payment
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDetailCustomerId(alert.customerId);
                    setDetailModalOpen(true);
                  }}
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                >
                  View Ledger
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-card border border-slate-200">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No overdue payment alerts</h3>
            <p className="text-xs text-slate-400 mt-1">Every customer invoice is settled or still within agreed payment terms.</p>
          </div>
        )}
      </section>

      <section className="pt-6 border-t border-slate-200">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Unfinal Shipments</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            No revenue or cost has been posted. Finalize each shipment to create its ledger and payable entries.
          </p>
        </div>
        {unfinalShipments.length > 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Date', 'AWB', 'Customer', 'Courier', 'Origin → Dest', 'Pieces', 'Weight', 'Notes', ''].map(title => (
                    <th key={title} className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unfinalShipments.map(shipment => (
                  <tr key={shipment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">{formatDate(shipment.date)}</td>
                    <td className="py-3 px-4 text-xs font-black text-slate-900 whitespace-nowrap">{shipment.awb}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">{shipment.customerName}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">{shipment.courier}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="py-3 px-4 text-xs text-center font-black text-slate-700">{shipment.pieces}</td>
                    <td className="py-3 px-4 text-xs text-right font-bold text-slate-600 whitespace-nowrap">{shipment.weight} KG</td>
                    <td className="py-3 px-4 text-xs text-slate-600 min-w-[150px]">{shipment.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="gold" size="sm" className="py-1 px-3" onClick={() => handleOpenFinalize(shipment)}>
                        Finalize
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-card border border-dashed border-slate-200 p-8 text-center">
            <p className="text-xs text-slate-400 font-bold">No unfinal shipments pending.</p>
          </div>
        )}
      </section>

      <ShipmentModal
        isOpen={!!finalizeTarget}
        onClose={() => setFinalizeTarget(null)}
        shipmentToEdit={finalizeTarget}
        customers={customers}
        vendors={vendors}
        onSave={async (data, overrideCredit) => {
          if (!finalizeTarget) return null;
          const updated = await updateShipment(finalizeTarget.id, data, overrideCredit);
          if (updated) {
            setFinalizeTarget(null);
            await Promise.all([refreshAlerts(), refreshLedger(), refreshShipments()]);
          }
          return updated;
        }}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customer={paymentCustomer}
        currentBalance={paymentCustomer ? getCustomerComputed(paymentCustomer.id).balance : 0}
        onSave={async (customerId, data) => {
          await receiveCustomerPayment(customerId, data);
          await Promise.all([refreshAlerts(), refreshLedger()]);
        }}
      />

      {detailCustomerId !== null && (
        <LedgerDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          customer={getCustomerComputed(detailCustomerId).customer || null}
          transactions={getCustomerComputed(detailCustomerId).txns}
          balance={getCustomerComputed(detailCustomerId).balance}
          aging={getCustomerComputed(detailCustomerId).aging}
          shipmentCount={getCustomerComputed(detailCustomerId).shipmentCount}
          onOpenPayment={() => handleOpenPayment(detailCustomerId)}
          onOpenDebit={() => {}}
        />
      )}
    </div>
  );
};
