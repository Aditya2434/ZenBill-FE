import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { InvoiceStatus } from '../types';
import { View } from '../App';
import { PlusIcon, QuotationIcon } from './icons';
import { apiListInvoices } from '../utils/api';

interface DashboardProps {
  setView: (view: View) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CurrencyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;       
  glowColor: string;      
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, sub, icon, gradient, glowColor, trend,
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient}`}
    style={{ boxShadow: `0 8px 32px -8px ${glowColor}` }}
  >
    <div
      className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
      style={{ background: 'rgba(255,255,255,0.35)', filter: 'blur(2px)' }}
    />
    <div
      className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full opacity-10"
      style={{ background: 'rgba(255,255,255,0.5)' }}
    />

    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/75 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
        {trend && (
          <div className="mt-3 inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5">
            <ArrowUpIcon className="w-3 h-3" />
            <span className="text-xs font-semibold">{trend}</span>
          </div>
        )}
      </div>
      <div className="bg-white/20 rounded-xl p-3 flex-shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const indianCurrencyFormatter = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_PIE_COLORS: Record<string, string> = {
  [InvoiceStatus.Paid]:    '#10b981',
  [InvoiceStatus.Unpaid]:  '#f59e0b',
  [InvoiceStatus.Overdue]: '#ef4444',
  [InvoiceStatus.Draft]:   '#94a3b8',
};

// Custom tooltip for area chart
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-emerald-400 font-bold">{`₹${Number(payload[0].value).toLocaleString('en-IN')}`}</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [realInvoices, setRealInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const body = await apiListInvoices();
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        if (!cancelled) setRealInvoices(list);
        try {
          localStorage.setItem("zenbill_cached_invoices", JSON.stringify(list));
        } catch (_) {}
      } catch (e) {
        console.error("Dashboard failed to fetch invoices", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalInvoices = realInvoices.length;
  
  const pendingPayments = realInvoices.filter(
    inv => (inv.status || 'Unpaid') === 'Unpaid' || inv.status === 'Overdue'
  ).length;
  
  const paidInvoices = realInvoices.filter(inv => inv.status === 'Paid').length;

  const totalRevenue = realInvoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (Number(inv.totalAmountAfterTax) || 0), 0);

  const totalPendingAmount = realInvoices
    .filter(inv => (inv.status || 'Unpaid') === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + (Number(inv.totalAmountAfterTax) || 0), 0);

  const totalMonetaryValue = totalRevenue + totalPendingAmount;

  const currentYear = new Date().getFullYear();
  const monthlyRevenue: Record<number, number> = {};
  realInvoices.forEach(inv => {
    if (!inv.invoiceDate) return;
    const date = new Date(inv.invoiceDate);
    if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
    const month = date.getMonth();
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(inv.totalAmountAfterTax) || 0);
  });

  const chartData = MONTH_NAMES.map((name, idx) => ({
    name,
    revenue: monthlyRevenue[idx] || 0,
  }));

  // Data for Invoice Status (Count)
  const statusCounts = Object.values(InvoiceStatus).map(status => ({
    name: status,
    value: realInvoices.filter(inv => (inv.status || 'Unpaid') === status).length,
    color: STATUS_PIE_COLORS[status],
  })).filter(s => s.value > 0);

  // Data for Revenue Breakdown (Amount) - Using high-contrast distinct colors
  const amountCounts = [
    { name: 'Paid', value: totalRevenue, color: '#3B82F6' },    // Vibrant Blue
    { name: 'Pending', value: totalPendingAmount, color: '#F97316' } // Bright Orange
  ].filter(s => s.value > 0);

  const recent = [...realInvoices]
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    .slice(0, 5);

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? 'Good Morning' :
    today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-400">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="ml-4 font-semibold text-lg text-gray-600">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{greeting} 👋</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-0.5">Business Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('create-quotation')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-95"
          >
            <QuotationIcon className="w-4 h-4 text-gray-500" />
            Create Quotation
          </button>
          <button
            onClick={() => setView('create-invoice')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
          >
            <PlusIcon className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue >= 100000
            ? `${(totalRevenue / 100000).toFixed(2)}L`
            : totalRevenue.toLocaleString('en-IN')}`}
          sub="From paid invoices"
          icon={<CurrencyIcon className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-violet-400 to-indigo-500"
          glowColor="rgba(139,92,246,0.35)"
          trend="This year"
        />
        <StatCard
          title="Total Invoices"
          value={String(totalInvoices)}
          sub="All time"
          icon={<FileIcon className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-sky-400 to-blue-500"
          glowColor="rgba(56,189,248,0.35)"
        />
        <StatCard
          title="Pending Payments"
          value={String(pendingPayments)}
          sub="Unpaid + Overdue"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          glowColor="rgba(251,191,36,0.35)"
        />
        <StatCard
          title="Paid Invoices"
          value={String(paidInvoices)}
          sub={totalInvoices > 0 ? `${Math.round((paidInvoices / totalInvoices) * 100)}% collection rate` : 'No invoices yet'}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          glowColor="rgba(52,211,153,0.35)"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Area Chart - Spans 2 columns on lg and md screens */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">{currentYear} — monthly breakdown (Billed)</p>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
              {currentYear}
            </span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={indianCurrencyFormatter}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<AreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie (Count) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 text-base">Invoice Volume</h3>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown by status count</p>
          </div>
          {statusCounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <FileIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [value, name]}
                      contentStyle={{ borderRadius: '10px', fontSize: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {statusCounts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600 font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">{s.value}</span>
                      <span className="text-[10px] text-gray-400">
                        ({totalInvoices > 0 ? Math.round((s.value / totalInvoices) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Revenue Pie (Amount) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 text-base">Revenue Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Paid vs Pending amounts</p>
          </div>
          {amountCounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <CurrencyIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">No revenue yet</p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={amountCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {amountCounts.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [indianCurrencyFormatter(Number(value)), name]}
                      contentStyle={{ borderRadius: '10px', fontSize: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {amountCounts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600 font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">{indianCurrencyFormatter(s.value)}</span>
                      <span className="text-[10px] text-gray-400">
                        ({totalMonetaryValue > 0 ? Math.round((s.value / totalMonetaryValue) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-base">Recent Invoices</h3>
            <button
              onClick={() => setView('invoices')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <FileIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((inv, i) => {
                const statusStyles: Record<string, string> = {
                  'Paid':    'bg-emerald-100 text-emerald-700',
                  'Unpaid':  'bg-amber-100 text-amber-700',
                  'Overdue': 'bg-red-100 text-red-700',
                  'Draft':   'bg-gray-100 text-gray-600',
                };
                const currentStatus = inv.status || 'Unpaid';
                return (
                  <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: `hsl(${(i * 60 + 200) % 360}, 70%, 55%)` }}
                      >
                        {inv.billedToName?.charAt(0)?.toUpperCase() || '#'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{inv.billedToName || '—'}</p>
                        <p className="text-xs text-gray-400">{inv.invoiceNumber} · {inv.invoiceDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">₹{(Number(inv.totalAmountAfterTax) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[currentStatus] || statusStyles['Draft']}`}>
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          <h3 className="font-bold text-gray-800 text-base">Quick Actions</h3>

          <button
            onClick={() => setView('create-invoice')}
            className="group w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Create Invoice</p>
              <p className="text-xs text-white/70">Generate a new GST invoice</p>
            </div>
          </button>

          <button
            onClick={() => setView('clients')}
            className="group w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">Manage Clients</p>
              <p className="text-xs text-gray-400">Add or edit client records</p>
            </div>
          </button>

          <button
            onClick={() => setView('products')}
            className="group w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-emerald-100 rounded-lg p-2 flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">Products</p>
              <p className="text-xs text-gray-400">Manage your product catalog</p>
            </div>
          </button>

          <button
            onClick={() => setView('settings')}
            className="group w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-violet-100 rounded-lg p-2 flex-shrink-0">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">Company Settings</p>
              <p className="text-xs text-gray-400">Update your profile & bank details</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};