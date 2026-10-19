import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Shipment, Customer, Vendor, ShipmentStatus, CourierServiceType, CartonUsedLine } from '@/models/types';
import { SERVICE_OPTIONS, STATUS_OPTIONS } from '@/utils/constants';
import { formatPKR } from '@/utils/formatters';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useCartonsController } from '@/controllers/useCartonsController';
import { todayLocal } from '@/utils/dates';
import { shipmentService } from '@/services';
import toast from 'react-hot-toast';
import { checkDate, checkInteger, checkNonNegative, checkOptionalAmount, checkText, firstError } from '@/utils/validation';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentToEdit?: Shipment | null;
  customers: Customer[];
  vendors: Vendor[];
  onSave: (data: Omit<Shipment, 'id'>, overrideCredit: boolean) => Promise<unknown>;
  onCheckCredit?: (customerId: number, additionalAmount: number) => Promise<unknown>;
  onOpenAddVendor?: () => void;
}

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  isOpen,
  onClose,
  shipmentToEdit,
  customers,
  vendors,
  onSave,
  onOpenAddVendor,
}) => {
  const isEditing = !!shipmentToEdit;
  const { cartonTypes: allCartonTypes, getStock } = useCartonsController();
  // Inactive box types are hidden for new lines, but kept if this shipment already uses them
  const cartonTypes = allCartonTypes.filter(
    t => t.isActive || (shipmentToEdit?.cartonsUsed || []).some(l => l.cartonTypeId === t.id)
  );

  const [consignee, setConsignee] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [courier, setCourier] = useState('');
  const [service, setService] = useState<CourierServiceType>('Express');
  const [awb, setAwb] = useState('');
  const [shipInv, setShipInv] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [origin, setOrigin] = useState('SKT');
  const [destination, setDestination] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [productName, setProductName] = useState('');
  const [pieces, setPieces] = useState<number | string>('');
  const [weight, setWeight] = useState<number | string>('');
  const [revenue, setRevenue] = useState<number | string>('');
  const [cost, setCost] = useState<number | string>('');
  const [status, setStatus] = useState<ShipmentStatus>('Pending');
  const [notes, setNotes] = useState('');
  const [cartonsUsed, setCartonsUsed] = useState<CartonUsedLine[]>([]);

  const [overrideCredit, setOverrideCredit] = useState(false);
  const [creditAlert, setCreditAlert] = useState<{
    exceed: boolean;
    daysLate: boolean;
    message: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // AWB numbers of every OTHER shipment (the page list may be date-filtered)
  const [existingAwbs, setExistingAwbs] = useState<string[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    shipmentService
      .getShipments()
      .then(list => {
        if (alive) setExistingAwbs(list.filter(x => x.id !== shipmentToEdit?.id).map(x => x.awb || ''));
      })
      .catch(() => { /* offline — skip the duplicate check */ });
    return () => { alive = false; };
  }, [isOpen, shipmentToEdit?.id]);

  // Initialize or reset form
  useEffect(() => {
    if (shipmentToEdit) {
      setIsWalkIn(!!shipmentToEdit.isWalkIn);
      setConsignee(shipmentToEdit.consignee || '');
      setWalkInName(shipmentToEdit.walkInName || '');
      setCustomerId(shipmentToEdit.customerId || '');
      setDate(shipmentToEdit.date);
      setCourier(shipmentToEdit.courier);
      setService(shipmentToEdit.service);
      setAwb(shipmentToEdit.awb);
      setShipInv(shipmentToEdit.shipInv || '');
      setJobNo(shipmentToEdit.jobNo || '');
      setOrigin(shipmentToEdit.origin || 'SKT');
      setDestination(shipmentToEdit.destination);
      setDestinationAddress(shipmentToEdit.destinationAddress || '');
      setProductName(shipmentToEdit.productName || '');
      setPieces(shipmentToEdit.pieces || '');
      setWeight(shipmentToEdit.weight || '');
      setRevenue(shipmentToEdit.revenue || '');
      setCost(shipmentToEdit.cost || '');
      setStatus(shipmentToEdit.status || 'Pending');
      setNotes(shipmentToEdit.notes || '');
      setCartonsUsed(shipmentToEdit.cartonsUsed || []);
      setOverrideCredit(false);
      setCreditAlert(null);
    } else {
      const today = todayLocal();
      const randomSeed = Math.floor(1000 + Math.random() * 9000);
      setIsWalkIn(false);
      setConsignee('');
      setWalkInName('');
      setCustomerId('');
      setDate(today);
      setCourier('');
      setService('Express');
      setAwb('');
      setShipInv(`SJI-${randomSeed}`);
      setJobNo(`JOB-${randomSeed}`);
      setOrigin('');
      setDestination('');
      setDestinationAddress('');
      setProductName('');
      setPieces('');
      setWeight('');
      setRevenue('');
      setCost('');
      setStatus('Pending');
      setNotes('');
      setCartonsUsed([]);
      setOverrideCredit(false);
      setCreditAlert(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentToEdit, isOpen]);

  // Live credit check
  useEffect(() => {
    if (isWalkIn || !customerId || Number(revenue) <= 0) {
      setCreditAlert(null);
      return;
    }

    const selectedCust = customers.find(c => c.id === Number(customerId));
    if (!selectedCust) return;

    // Check basic threshold against creditLimit
    const willExceed = Number(revenue) > selectedCust.creditLimit;
    const isOldDue = selectedCust.openingBalance > 0 && selectedCust.creditDays < 25; // heuristic indicator

    if (willExceed || isOldDue) {
      setCreditAlert({
        exceed: willExceed,
        daysLate: isOldDue,
        message: willExceed
          ? `${selectedCust.name} credit limit is ${formatPKR(selectedCust.creditLimit)}. Adding this booking may exceed limits.`
          : `${selectedCust.name} has invoices pending beyond their ${selectedCust.creditDays}-day terms. Account requires approval or override.`,
      });
    } else {
      setCreditAlert(null);
    }
  }, [customerId, revenue, isWalkIn, customers]);

  const validate = () => {
    const isUnfinal = status === 'Unfinal';
    const cartonLines = cartonsUsed;

    // Double-click / double-Enter guard
    if (submittingRef.current) return 'Submitting...';
    // Stock check per carton type (lines for the same type are added together)
    const neededByType = new Map<number, number>();
    cartonLines.forEach(l => {
      neededByType.set(Number(l.cartonTypeId), (neededByType.get(Number(l.cartonTypeId)) || 0) + (Number(l.quantity) || 0));
    });
    const alreadyUsed = new Map<number, number>();
    (shipmentToEdit?.cartonsUsed || []).forEach(l => {
      alreadyUsed.set(l.cartonTypeId, (alreadyUsed.get(l.cartonTypeId) || 0) + (Number(l.quantity) || 0));
    });
    let cartonError: string | null = null;
    for (const line of cartonLines) {
      if (!line.cartonTypeId || !allCartonTypes.some(t => t.id === Number(line.cartonTypeId))) {
        cartonError = 'Select a carton type for every carton line (or remove the empty line)';
        break;
      }
      const q = Number(line.quantity);
      if (!Number.isInteger(q) || q <= 0) {
        cartonError = 'Carton quantity must be a whole number greater than 0';
        break;
      }
    }
    if (!cartonError) {
      for (const [typeId, needed] of neededByType) {
        const available = getStock(typeId) + (alreadyUsed.get(typeId) || 0);
        if (needed > available) {
          const name = allCartonTypes.find(t => t.id === typeId)?.name || 'carton';
          cartonError = `Not enough "${name}" in stock — ${available} available, ${needed} needed`;
          break;
        }
      }
    }

    const err = firstError(
      !isWalkIn && !customerId ? 'Please select a customer or tick Walk-in' : null,
      isWalkIn ? checkText(walkInName, 'Walk-in customer name', { required: false, max: 80 }) : null,
      checkDate(date, 'Booking date'),
      !courier ? 'Please select a courier vendor' : null,
      checkText(awb, 'AWB number', { max: 40 }),
      awb.trim() && !/^[A-Za-z0-9\-\s/]+$/.test(awb.trim()) ? 'AWB number can only contain letters, digits, spaces, - and /' : null,
      awb.trim() && existingAwbs.some(a => a.toLowerCase() === awb.trim().toLowerCase())
        ? `AWB "${awb.trim()}" is already used by another shipment`
        : null,
      checkText(destination, 'Destination country', { max: 60 }),
      checkText(destinationAddress, 'Destination address', { required: false, max: 300 }),
      checkText(consignee, 'Consignee name', { max: 120 }),
      pieces !== '' ? checkInteger(pieces, 'Pieces', { min: 0, max: 10000 }) : null,
      checkNonNegative(weight, 'Weight', true) || (Number(weight) <= 0 ? 'Weight must be greater than 0' : null),
      Number(weight) > 10000 ? 'Weight looks too large — please check (max 10,000 KG)' : null,
      !isUnfinal && checkOptionalAmount(revenue, 'Revenue (charged to customer)'),
      !isUnfinal && checkOptionalAmount(cost, 'Cost (courier charge)'),
      !isUnfinal && !isWalkIn && !(Number(revenue) > 0) ? 'Revenue is required for account customers (it is billed to their ledger)' : null,
      checkText(notes, 'Notes', { required: false, max: 500 }),
      cartonError,
    );
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      if (err !== 'Submitting...') toast.error(err);
      return;
    }
    const isUnfinal = status === 'Unfinal';
    const finalRevenue = isUnfinal ? 0 : Number(revenue);
    const finalCost = isUnfinal ? 0 : Number(cost);

    if (finalCost > finalRevenue && finalRevenue > 0) {
      toast(`Cost is higher than revenue — this shipment will show a loss of ${formatPKR(finalCost - finalRevenue)}`, { icon: '⚠️' });
    }

    const selectedCust = customers.find(c => c.id === Number(customerId));
    const customerName = isWalkIn
      ? (walkInName.trim() || 'Walk-in Customer')
      : (selectedCust?.name || 'Customer');

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await onSave(
        {
          date,
          customerId: isWalkIn ? null : Number(customerId),
          customerName,
          isWalkIn,
          walkInName: isWalkIn ? walkInName : undefined,
          courier,
          service,
          awb: awb.trim(),
          origin,
          destination: destination.trim(),
          destinationAddress: destinationAddress.trim() || undefined,
          productName: productName.trim() || undefined,
          consignee: consignee.trim(),
          pieces: Number(pieces) || 0,
          weight: Number(weight) || 0,
          shipInv,
          jobNo,
          revenue: finalRevenue,
          cost: finalCost,
          status,
          notes,
          cartonsUsed: cartonsUsed.map(c => ({ cartonTypeId: Number(c.cartonTypeId), quantity: Number(c.quantity) || 1 })),
        },
        overrideCredit
      );
      // Only close if save was successful (not null/false)
      if (result !== null && result !== false) {
        onClose();
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const addCartonLine = () => {
    if (cartonTypes.length === 0) {
      toast.error('No active carton types — add one on the Cartons page first');
      return;
    }
    setCartonsUsed(prev => [...prev, { cartonTypeId: cartonTypes[0].id, quantity: 1 }]);
  };

  const removeCartonLine = (index: number) => {
    setCartonsUsed(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartonLine = (index: number, field: keyof CartonUsedLine, value: number | string) => {
    setCartonsUsed(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value as any };
      return copy;
    });
  };

  const selectedVendorObj = vendors.find(v => v.name === courier);
  const availableServices = selectedVendorObj && selectedVendorObj.services && selectedVendorObj.services.length > 0
    ? selectedVendorObj.services
    : SERVICE_OPTIONS;

  // Reset service if selected courier's services don't include current service
  const handleCourierChange = (val: string) => {
    if (val === '__ADD_NEW_VENDOR__') {
      onOpenAddVendor?.();
      return;
    }
    setCourier(val);
    const targetVend = vendors.find(v => v.name === val);
    if (targetVend && targetVend.services && targetVend.services.length > 0) {
      if (!targetVend.services.includes(service)) {
        setService(targetVend.services[0] as CourierServiceType);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Shipment' : 'New Shipment Entry'}
      subtitle={
        isEditing
          ? `Update details for AWB #${shipmentToEdit?.awb}`
          : 'Record a new shipment from customer to courier'
      }
      size="lg"
      dataTestId="shipment-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleSubmit}
            loading={submitting}
            data-testid="save-shipment-submit-btn"
          >
            {isEditing ? 'Update Shipment' : 'Save Shipment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Walk-in Customer Toggle */}
        <label
          htmlFor="shipment-walkin-check"
          className="flex items-start gap-3 p-3.5 rounded-xl border border-dashed border-[#F21624] bg-[#FEF3C7]/40 cursor-pointer hover:bg-[#FEF3C7]/60 transition-colors"
        >
          <input
            type="checkbox"
            id="shipment-walkin-check"
            checked={isWalkIn}
            onChange={e => setIsWalkIn(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-[#292929] focus:ring-[#292929]"
            data-testid="shipment-walkin-toggle"
          />
          <div>
            <div className="text-xs font-bold text-[#C81320]">
              Walk-in Customer (Cash Sale)
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              No ledger entry, no credit limit check. Paid on the spot — counted in revenue &amp; reports.
            </div>
          </div>
        </label>

        {/* Credit Alert Banner & Override Checkbox */}
        {creditAlert && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-amber-800 leading-snug">
                {creditAlert.message}
              </div>
            </div>
            <label className="flex items-center gap-2 mt-1 pt-2 border-t border-amber-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideCredit}
                onChange={e => setOverrideCredit(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                data-testid="shipment-override-check"
              />
              <span className="text-xs font-bold text-amber-900">
                Owner override — allow booking despite credit warning/block
              </span>
            </label>
          </div>
        )}

        {/* Customer & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isWalkIn ? (
            <Input
              label="Walk-in Customer Name"
              placeholder="e.g. Tariq Textiles (Cash)"
              value={walkInName}
              onChange={e => setWalkInName(e.target.value)}
              data-testid="shipment-walkin-name-input"
            />
          ) : (
            <Select
              label="Account Customer"
              required
              value={customerId}
              onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : '')}
              data-testid="shipment-customer-select"
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Shipment Date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            data-testid="shipment-date-input"
          />
        </div>

        {/* Courier & Service Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Courier Vendor"
            required
            value={courier}
            onChange={e => handleCourierChange(e.target.value)}
            data-testid="shipment-courier-select"
          >
            <option value="">Select courier...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.name}>
                {v.name} ({v.category})
              </option>
            ))}
            <option value="__ADD_NEW_VENDOR__">+ Add new vendor</option>
          </Select>

          <Select
            label="Service Type"
            required
            value={service}
            onChange={e => setService(e.target.value as CourierServiceType)}
            data-testid="shipment-service-select"
          >
            {availableServices.length > 0 ? (
              availableServices.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))
            ) : (
              <option value="">No services</option>
            )}
          </Select>
        </div>

        {/* AWB & Ship Inv # */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="AWB Number (Tracking ID)"
            required
            placeholder="e.g. FHL001234"
            value={awb}
            onChange={e => setAwb(e.target.value)}
            data-testid="shipment-awb-input"
          />
          <Input
            label="Ship. Invoice #"
            placeholder="e.g. SJI-0012"
            value={shipInv}
            onChange={e => setShipInv(e.target.value)}
            hint="Auto-suggested, editable"
          />
        </div>

        {/* Product */}
        <Input
          label="Product Name"
          placeholder="e.g. Footballs, Garments, Surgical Instruments"
          value={productName}
          onChange={e => setProductName(e.target.value)}
          data-testid="shipment-product-input"
        />

        <Input
  label="Consignee Name"
  required
  placeholder="Receiver name at destination"
  value={consignee}
  onChange={e => setConsignee(e.target.value)}
  data-testid="shipment-consignee-input"
/>

        {/* Origin, Destination, Job No */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Origin City"
            required
            placeholder="e.g. SKT"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
          />
          <Input
            label="Destination Country"
            required
            placeholder="e.g. USA, UK, Germany"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            data-testid="shipment-destination-input"
          />
          <Input
            label="Job No."
            placeholder="e.g. JOB-0012"
            value={jobNo}
            onChange={e => setJobNo(e.target.value)}
            hint="Auto-suggested, editable"
          />
        </div>

        {/* Destination Address */}
        <div className="w-full flex flex-col gap-1.5">
          <label htmlFor="shipment-destination-address" className="text-xs font-bold text-slate-800 tracking-tight select-none">
            Destination Address
          </label>
          <textarea
            id="shipment-destination-address"
            rows={2}
            placeholder="Street, city, state / postcode"
            value={destinationAddress}
            onChange={e => setDestinationAddress(e.target.value)}
            data-testid="shipment-destination-address-input"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#292929]/20 focus:border-[#292929] transition-colors resize-y"
          />
        </div>

        {/* Pieces, Weight, Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Pieces (Pcs)"
            type="number"
            min={0}
            step={1}
            // required
            placeholder="e.g. 1"
            value={pieces}
            onChange={e => setPieces(e.target.value)}
          />
          <Input
            label="Weight (KG)"
            type="number"
            min={0.1}
            step={0.1}
            required
            placeholder="e.g. 0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <Select
            label="Status"
            required
            value={status}
            onChange={e => {
              const nextStatus = e.target.value as ShipmentStatus;
              setStatus(nextStatus);
              if (nextStatus === 'Unfinal') {
                setRevenue('');
                setCost('');
              }
            }}
            data-testid="shipment-status-select"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {/* Revenue & Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Revenue from Customer (PKR)"
            type="number"
            min={0}
            required={status !== 'Unfinal'}
            disabled={status === 'Unfinal'}
            placeholder={status === 'Unfinal' ? 'Unavailable while unfinal' : 'e.g. 5000'}
            value={status === 'Unfinal' ? '' : revenue}
            onChange={e => setRevenue(e.target.value)}
            data-testid="shipment-revenue-input"
          />
          <Input
            label="Cost to Courier (PKR)"
            type="number"
            min={0}
            required={status !== 'Unfinal'}
            disabled={status === 'Unfinal'}
            placeholder={status === 'Unfinal' ? 'Unavailable while unfinal' : 'e.g. 3500'}
            value={status === 'Unfinal' ? '' : cost}
            onChange={e => setCost(e.target.value)}
            data-testid="shipment-cost-input"
          />
        </div>
        {status === 'Unfinal' && (
          <div className="text-[11px] text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-200">
            Unfinal status clears revenue/cost and skips ledger/payable entries.
          </div>
        )}

        {/* Notes */}
        <Input
          label="Notes / Special Instructions"
          placeholder="Any special customs notes or packing instructions..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Cartons Used */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-800 tracking-tight">Cartons / Boxes Used</label>
            <Button variant="secondary" size="sm" onClick={addCartonLine} icon={<Plus className="w-3 h-3" />} type="button">
              Add Carton
            </Button>
          </div>
          {cartonsUsed.length > 0 ? (
            <div className="space-y-2">
              {cartonsUsed.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    label=""
                    value={line.cartonTypeId}
                    onChange={e => updateCartonLine(idx, 'cartonTypeId', Number(e.target.value))}
                  >
                    {cartonTypes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({getStock(c.id)} in stock){c.isActive ? "" : " — inactive"}</option>
                    ))}
                  </Select>
                  <Input
                    label=""
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={e => updateCartonLine(idx, 'quantity', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCartonLine(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic">No cartons recorded for this shipment.</div>
          )}
        </div>
      </form>
    </Modal>
  );
};
