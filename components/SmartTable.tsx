import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SmartTableRow {
  id: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface SmartTableData {
  rows: SmartTableRow[];
  gstPercent: number;
}

interface SmartTableProps {
  /** Initial data — if provided the table starts with these rows */
  initialData?: SmartTableData;
  /** Called on every change so the parent can persist */
  onChange?: (data: SmartTableData) => void;
  /** If true the table renders in a compact print-friendly mode */
  printMode?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const UNIT_OPTIONS = ['Nos', 'Pcs', 'Kg', 'Ltr', 'Mtr', 'Sq.ft', 'Box', 'Set', 'Hr', 'Day', 'Lot'];

const createRow = (): SmartTableRow => ({
  id: uid(),
  item: '',
  description: '',
  quantity: 0,
  unit: 'Nos',
  rate: 0,
});

// ─── Single Row Component ─────────────────────────────────────────────────────
const TableRow: React.FC<{
  row: SmartTableRow;
  index: number;
  total: number;
  focusedCell: string | null;
  onFocus: (cellId: string) => void;
  onBlur: () => void;
  onUpdate: (id: string, field: keyof SmartTableRow, value: string | number) => void;
  onDelete: (id: string) => void;
  printMode?: boolean;
}> = React.memo(({ row, index, total, focusedCell, onFocus, onBlur, onUpdate, onDelete, printMode }) => {
  const amount = row.quantity * row.rate;
  const cellBase = printMode
    ? 'px-2 py-1.5 text-[11px]'
    : 'px-3 py-2.5 text-[13px]';

  if (printMode) {
    return (
      <tr className="border-b border-gray-200">
        <td className={`${cellBase} text-center text-gray-500 w-10`}>{index + 1}</td>
        <td className={`${cellBase} font-medium text-gray-800`}>{row.item || '—'}</td>
        <td className={`${cellBase} text-gray-500`}>{row.description || '—'}</td>
        <td className={`${cellBase} text-center`}>{row.quantity}</td>
        <td className={`${cellBase} text-center text-gray-500`}>{row.unit}</td>
        <td className={`${cellBase} text-right`}>₹{fmt(row.rate)}</td>
        <td className={`${cellBase} text-right font-semibold`}>₹{fmt(amount)}</td>
      </tr>
    );
  }

  return (
    <tr className="group border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
      {/* S.No — auto, locked */}
      <td className={`${cellBase} text-center text-gray-400 font-medium w-12 select-none`}>
        {index + 1}
      </td>

      {/* Item Name */}
      <td className={`${cellBase} min-w-[140px]`}>
        <input
          type="text"
          value={row.item}
          placeholder="Item name"
          onFocus={() => onFocus(`${row.id}-item`)}
          onBlur={onBlur}
          onChange={e => onUpdate(row.id, 'item', e.target.value)}
          className={`w-full bg-transparent outline-none text-gray-800 placeholder-gray-300 font-medium
            ${focusedCell === `${row.id}-item` ? 'border-b-2 border-indigo-400 pb-0.5' : 'border-b border-transparent'}`}
        />
      </td>

      {/* Description */}
      <td className={`${cellBase} min-w-[120px]`}>
        <input
          type="text"
          value={row.description}
          placeholder="Description"
          onFocus={() => onFocus(`${row.id}-desc`)}
          onBlur={onBlur}
          onChange={e => onUpdate(row.id, 'description', e.target.value)}
          className={`w-full bg-transparent outline-none text-gray-600 placeholder-gray-300 text-[12px]
            ${focusedCell === `${row.id}-desc` ? 'border-b-2 border-indigo-400 pb-0.5' : 'border-b border-transparent'}`}
        />
      </td>

      {/* Quantity */}
      <td className={`${cellBase} w-20`}>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={row.quantity || ''}
          placeholder="0"
          onFocus={() => onFocus(`${row.id}-qty`)}
          onBlur={onBlur}
          onChange={e => onUpdate(row.id, 'quantity', parseFloat(e.target.value) || 0)}
          className={`w-full bg-transparent outline-none text-center text-gray-800
            ${focusedCell === `${row.id}-qty` ? 'border-b-2 border-indigo-400 pb-0.5' : 'border-b border-transparent'}
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
      </td>

      {/* Unit */}
      <td className={`${cellBase} w-20`}>
        <select
          value={row.unit}
          onChange={e => onUpdate(row.id, 'unit', e.target.value)}
          className="w-full bg-transparent outline-none text-center text-gray-600 cursor-pointer text-[12px] border-none"
        >
          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>

      {/* Rate */}
      <td className={`${cellBase} w-24`}>
        <div className="flex items-center justify-end">
          <span className="text-gray-400 text-[11px] mr-0.5 select-none">₹</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={row.rate || ''}
            placeholder="0.00"
            onFocus={() => onFocus(`${row.id}-rate`)}
            onBlur={onBlur}
            onChange={e => onUpdate(row.id, 'rate', parseFloat(e.target.value) || 0)}
            className={`w-full bg-transparent outline-none text-right text-gray-800
              ${focusedCell === `${row.id}-rate` ? 'border-b-2 border-indigo-400 pb-0.5' : 'border-b border-transparent'}
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          />
        </div>
      </td>

      {/* Amount — locked/auto-calculated */}
      <td className={`${cellBase} w-28 text-right select-none`}>
        <div className="flex flex-col items-end">
          <span className={`font-semibold ${amount > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
            ₹{fmt(amount)}
          </span>
          {amount > 0 && (
            <span className="text-[10px] text-indigo-400 font-normal mt-0.5">
              {row.quantity} × ₹{fmt(row.rate)}
            </span>
          )}
        </div>
      </td>

      {/* Delete */}
      <td className="w-10 text-center">
        {total > 1 && (
          <button
            type="button"
            onClick={() => onDelete(row.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
            title="Remove row"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
});

// ─── Main SmartTable ──────────────────────────────────────────────────────────
const SmartTable: React.FC<SmartTableProps> = ({ initialData, onChange, printMode }) => {
  const [rows, setRows] = useState<SmartTableRow[]>(
    () => initialData?.rows?.length ? initialData.rows : [createRow()]
  );
  const [gstPercent, setGstPercent] = useState(initialData?.gstPercent ?? 18);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const tableEndRef = useRef<HTMLDivElement>(null);
  const prevRowCount = useRef(rows.length);

  // Notify parent of changes
  useEffect(() => {
    onChange?.({ rows, gstPercent });
  }, [rows, gstPercent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when a new row is added
  useEffect(() => {
    if (rows.length > prevRowCount.current) {
      tableEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevRowCount.current = rows.length;
  }, [rows.length]);

  // ── Computed totals ──
  const { subtotal, gstAmount, grandTotal } = useMemo(() => {
    const sub = rows.reduce((acc, r) => acc + r.quantity * r.rate, 0);
    const gst = sub * (gstPercent / 100);
    return { subtotal: sub, gstAmount: gst, grandTotal: sub + gst };
  }, [rows, gstPercent]);

  // ── Row CRUD ──
  const updateRow = useCallback((id: string, field: keyof SmartTableRow, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, createRow()]);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
    setDeleteConfirm(null);
  }, []);

  const handleCellFocus = useCallback((cellId: string) => setFocusedCell(cellId), []);
  const handleCellBlur = useCallback(() => setFocusedCell(null), []);

  // ── Print-only view (for PDF / print) ──
  if (printMode) {
    return (
      <div className="smart-table-print" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-center w-10">S.No</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-left">Item</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-left">Description</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-center">Qty</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-center">Unit</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-right">Rate</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase border-b-2 border-gray-300 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <TableRow key={r.id} row={r} index={i} total={rows.length}
                focusedCell={null} onFocus={() => {}} onBlur={() => {}}
                onUpdate={() => {}} onDelete={() => {}} printMode />
            ))}
          </tbody>
        </table>
        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <div style={{ width: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', color: '#6b7280' }}>
              <span>Subtotal</span><span>₹{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', color: '#6b7280' }}>
              <span>GST ({gstPercent}%)</span><span>₹{fmt(gstAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', fontWeight: 700, borderTop: '2px solid #111827', marginTop: '4px' }}>
              <span>Grand Total</span><span>₹{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Interactive view ──
  return (
    <div className="smart-table-root select-none" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

      {/* ── Delete confirmation toast ── */}
      {deleteConfirm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-sm animate-in">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Delete this row?</span>
          <button
            onClick={() => deleteRow(deleteConfirm)}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-xs transition-colors"
          >Delete</button>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-xs transition-colors"
          >Cancel</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center w-12 border-b-2 border-gray-200">
                S.No
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left border-b-2 border-gray-200 min-w-[140px]">
                Item Name
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left border-b-2 border-gray-200 min-w-[120px]">
                Description
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-b-2 border-gray-200 w-20">
                Qty
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-b-2 border-gray-200 w-20">
                Unit
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right border-b-2 border-gray-200 w-24">
                Rate (₹)
              </th>
              <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right border-b-2 border-gray-200 w-28">
                <div className="flex items-center justify-end gap-1">
                  Amount (₹)
                  <span title="Auto-calculated" className="inline-flex">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                </div>
              </th>
              <th className="w-10 border-b-2 border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <TableRow
                key={row.id}
                row={row}
                index={i}
                total={rows.length}
                focusedCell={focusedCell}
                onFocus={handleCellFocus}
                onBlur={handleCellBlur}
                onUpdate={updateRow}
                onDelete={id => setDeleteConfirm(id)}
              />
            ))}
          </tbody>
        </table>

        {/* ── Add Row ── */}
        <div className="border-t border-dashed border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* ── Totals Section ── */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Subtotal */}
          <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">₹{fmt(subtotal)}</span>
          </div>

          {/* GST row with editable % */}
          <div className="flex items-center justify-between px-4 py-2.5 text-[13px] border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">GST</span>
              <div className="flex items-center bg-gray-100 rounded-lg px-1.5 py-0.5">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  value={gstPercent}
                  onChange={e => setGstPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-10 bg-transparent text-center text-[12px] font-semibold text-indigo-600 outline-none
                    [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-[11px] text-gray-400 ml-0.5">%</span>
              </div>
            </div>
            <span className="font-medium text-gray-700">₹{fmt(gstAmount)}</span>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between px-4 py-3 text-[14px] bg-gradient-to-r from-indigo-50 to-violet-50 border-t-2 border-indigo-200">
            <span className="font-bold text-gray-800">Grand Total</span>
            <span className="font-bold text-indigo-700 text-base">₹{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div ref={tableEndRef} />
    </div>
  );
};

export default SmartTable;

/**
 * Serializes table data into static HTML for embedding in documents.
 * Used by print / export features.
 */
export function serializeSmartTableToHTML(data: SmartTableData): string {
  const { rows, gstPercent } = data;
  const subtotal = rows.reduce((acc, r) => acc + r.quantity * r.rate, 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  const fmtNum = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const headerStyle = 'padding:10px 12px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #d1d5db;background:#f8fafc;';
  const cellStyle = 'padding:8px 12px;font-size:12px;border-bottom:1px solid #e5e7eb;';

  let html = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin:16px 0;">
<thead><tr>
  <th style="${headerStyle}text-align:center;width:40px;">S.No</th>
  <th style="${headerStyle}text-align:left;">Item</th>
  <th style="${headerStyle}text-align:left;">Description</th>
  <th style="${headerStyle}text-align:center;width:60px;">Qty</th>
  <th style="${headerStyle}text-align:center;width:60px;">Unit</th>
  <th style="${headerStyle}text-align:right;width:80px;">Rate (₹)</th>
  <th style="${headerStyle}text-align:right;width:100px;">Amount (₹)</th>
</tr></thead><tbody>`;

  rows.forEach((r, i) => {
    const amt = r.quantity * r.rate;
    html += `<tr>
  <td style="${cellStyle}text-align:center;color:#9ca3af;">${i + 1}</td>
  <td style="${cellStyle}font-weight:500;color:#1f2937;">${r.item || '—'}</td>
  <td style="${cellStyle}color:#6b7280;">${r.description || '—'}</td>
  <td style="${cellStyle}text-align:center;">${r.quantity}</td>
  <td style="${cellStyle}text-align:center;color:#6b7280;">${r.unit}</td>
  <td style="${cellStyle}text-align:right;">₹${fmtNum(r.rate)}</td>
  <td style="${cellStyle}text-align:right;font-weight:600;">₹${fmtNum(amt)}</td>
</tr>`;
  });

  html += `</tbody></table>
<div style="display:flex;justify-content:flex-end;margin-top:8px;font-family:Arial,sans-serif;">
  <div style="width:260px;">
    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#6b7280;">
      <span>Subtotal</span><span>₹${fmtNum(subtotal)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#6b7280;">
      <span>GST (${gstPercent}%)</span><span>₹${fmtNum(gstAmount)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:2px solid #111827;margin-top:4px;color:#111827;">
      <span>Grand Total</span><span>₹${fmtNum(grandTotal)}</span>
    </div>
  </div>
</div>`;

  return html;
}
