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

const CurrencyIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendUpIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const indianCurrencyFormatter = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000)   return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000)     return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_PIE_COLORS: Record<string, string> = {
  [InvoiceStatus.Paid]:    '#10b981',
  [InvoiceStatus.Unpaid]:  '#f59e0b',
  [InvoiceStatus.Overdue]: '#f43f5e',
  [InvoiceStatus.Draft]:   '#94a3b8',
};

// ─── Premium Tooltip ──────────────────────────────────────────────────────────

const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
      color: "white",
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
      border: "1px solid rgba(99,102,241,0.4)",
      fontSize: 12,
    }}>
      <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, color: "#a5f3fc", fontWeight: 800, fontSize: 14 }}>
        {`₹${Number(payload[0].value).toLocaleString('en-IN')}`}
      </p>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  accentColor: string;
  trend?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, sub, icon, gradient, glowColor, accentColor, trend, delay = 0,
}) => (
  <div
    className="fade-in-up"
    style={{
      position: "relative",
      overflow: "hidden",
      borderRadius: 20,
      padding: "22px 22px 20px",
      background: gradient,
      boxShadow: "0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
      animationDelay: `${delay}ms`,
      cursor: "default",
      transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)";
    }}
  >
    {/* Decorative blobs — no animation */}
    <div style={{
      position: "absolute",
      top: -30, right: -30,
      width: 120, height: 120,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.10)",
    }} />
    <div style={{
      position: "absolute",
      bottom: -20, left: -15,
      width: 80, height: 80,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.07)",
    }} />

    {/* Content */}
    <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 10px",
        }}>{title}</p>
        <p className="font-display" style={{
          fontSize: value.length > 12 ? 19 : 28,
          fontWeight: 800,
          color: "white",
          margin: "0 0 6px",
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
          textShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>{value}</p>
        {sub && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0 }}>{sub}</p>
        )}
        {trend && (
          <div style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,255,255,0.18)",
            borderRadius: 99,
            padding: "4px 10px",
            backdropFilter: "blur(4px)",
          }}>
            <TrendUpIcon style={{ width: 11, height: 11, color: "white" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{trend}</span>
          </div>
        )}
      </div>
      {/* Icon box */}
      <div style={{
        width: 46, height: 46,
        borderRadius: 14,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
      }}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div
    className={`card-lift ${className || ''}`}
    style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid rgba(99,102,241,0.08)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(99,102,241,0.06)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [realInvoices, setRealInvoices] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("zenbill_cached_invoices");
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem("zenbill_cached_invoices");
      return !cached || JSON.parse(cached).length === 0;
    } catch (_) {
      return true;
    }
  });

  useEffect(() => {
    let cancelled = false;

    // Check cache freshness — only re-fetch if data is older than 60 seconds
    const STALE_MS = 60_000;
    const cachedAt = (() => {
      try { return Number(localStorage.getItem("zenbill_cached_invoices_at") || 0); } catch { return 0; }
    })();
    const isStale = Date.now() - cachedAt > STALE_MS;

    if (!isStale && realInvoices.length > 0) {
      // Data is fresh — don't show spinner, just use cache
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(realInvoices.length === 0); // only show spinner if we have NO data
        const body = await apiListInvoices();
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        if (!cancelled) {
          setRealInvoices(list);
          try {
            localStorage.setItem("zenbill_cached_invoices", JSON.stringify(list));
            localStorage.setItem("zenbill_cached_invoices_at", String(Date.now()));
          } catch {}
        }
      } catch (e) {
        console.error("Dashboard failed to fetch invoices", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalInvoices    = realInvoices.length;
  const pendingPayments  = realInvoices.filter(inv => { const s = (inv.status || 'Unpaid').trim().toLowerCase(); return s === 'unpaid' || s === 'overdue'; }).length;
  const paidInvoices     = realInvoices.filter(inv => inv.status?.trim().toLowerCase() === 'paid').length;
  const totalPaidAmount  = realInvoices.filter(inv => inv.status?.trim().toLowerCase() === 'paid').reduce((s, i) => s + (Number(i.totalAmountAfterTax) || 0), 0);
  const totalPendingAmount = realInvoices.filter(inv => { const s = (inv.status || 'Unpaid').trim().toLowerCase(); return s === 'unpaid' || s === 'overdue'; }).reduce((s, i) => s + (Number(i.totalAmountAfterTax) || 0), 0);
  const totalRevenue     = totalPaidAmount + totalPendingAmount;

  const currentYear = new Date().getFullYear();
  const monthlyRevenue: Record<number, number> = {};
  realInvoices.forEach(inv => {
    if (!inv.invoiceDate) return;
    const date = new Date(inv.invoiceDate);
    if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
    const month = date.getMonth();
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(inv.totalAmountAfterTax) || 0);
  });

  const chartData = MONTH_NAMES.map((name, idx) => ({ name, revenue: monthlyRevenue[idx] || 0 }));

  const statusCounts = Object.values(InvoiceStatus).map(status => ({
    name: status,
    value: realInvoices.filter(inv => (inv.status || 'Unpaid') === status).length,
    color: STATUS_PIE_COLORS[status],
  })).filter(s => s.value > 0);

  const amountCounts = [
    { name: 'Paid',    value: totalPaidAmount,    color: '#6366f1' },
    { name: 'Pending', value: totalPendingAmount, color: '#f59e0b' },
  ].filter(s => s.value > 0);

  const recent = [...realInvoices]
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    .slice(0, 5);

  const today    = new Date();
  const greeting = today.getHours() < 12 ? 'Good Morning 🌤️' : today.getHours() < 17 ? 'Good Afternoon ☀️' : 'Good Evening 🌙';

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "70vh",
        gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(99,102,241,0.15)",
          borderTopColor: "#6366f1",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: 0 }}>Loading Dashboard...</p>
      </div>
    );
  }

  const statusBadgeStyle: Record<string, React.CSSProperties> = {
    'Paid':    { background: "rgba(16,185,129,0.1)",  color: "#059669", border: "1px solid rgba(16,185,129,0.2)" },
    'Unpaid':  { background: "rgba(245,158,11,0.1)",  color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" },
    'Overdue': { background: "rgba(244,63,94,0.1)",   color: "#e11d48", border: "1px solid rgba(244,63,94,0.2)" },
    'Draft':   { background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid rgba(148,163,184,0.2)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#94a3b8",
            margin: "0 0 4px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 99,
              padding: "3px 10px",
              fontSize: 12,
              color: "#6366f1",
              fontWeight: 600,
            }}>
              {greeting}
            </span>
          </p>
          <h2 className="font-display" style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            Business{" "}
            <span className="gradient-text">Dashboard</span>
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setView('create-quotation')}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              background: "white",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 1px 4px rgba(99,102,241,0.08)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(99,102,241,0.05)";
              el.style.borderColor = "rgba(99,102,241,0.4)";
              el.style.color = "#6366f1";
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "white";
              el.style.borderColor = "rgba(99,102,241,0.2)";
              el.style.color = "#475569";
              el.style.transform = "translateY(0)";
            }}
          >
            <QuotationIcon style={{ width: 15, height: 15 }} />
            Create Quotation
          </button>
          <button
            onClick={() => setView('create-invoice')}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-2px) scale(1.02)";
              el.style.boxShadow = "0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0) scale(1)";
              el.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
            }}
          >
            <PlusIcon style={{ width: 15, height: 15 }} />
            New Invoice
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Total billed revenue"
          icon={<CurrencyIcon style={{ width: 22, height: 22, color: "white" }} />}
          gradient="linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)"
          glowColor="rgba(99,102,241,0.45)"
          accentColor="#6366f1"
          trend="This year"
          delay={0}
        />
        <StatCard
          title="Total Invoices"
          value={String(totalInvoices)}
          sub="All time"
          icon={<FileIcon style={{ width: 22, height: 22, color: "white" }} />}
          gradient="linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #06b6d4 100%)"
          glowColor="rgba(14,165,233,0.45)"
          accentColor="#0ea5e9"
          delay={80}
        />
        <StatCard
          title="Pending Payments"
          value={String(pendingPayments)}
          sub="Unpaid + Overdue"
          icon={<ClockIcon style={{ width: 22, height: 22, color: "white" }} />}
          gradient="linear-gradient(135deg, #f59e0b 0%, #fb923c 50%, #f97316 100%)"
          glowColor="rgba(245,158,11,0.45)"
          accentColor="#f59e0b"
          delay={160}
        />
        <StatCard
          title="Paid Invoices"
          value={String(paidInvoices)}
          sub={totalInvoices > 0 ? `${Math.round((paidInvoices / totalInvoices) * 100)}% collection rate` : 'No invoices yet'}
          icon={<CheckCircleIcon style={{ width: 22, height: 22, color: "white" }} />}
          gradient="linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%)"
          glowColor="rgba(16,185,129,0.45)"
          accentColor="#10b981"
          delay={240}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 18 }}>

        {/* Area Chart */}
        <SectionCard style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Revenue Overview</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0", fontWeight: 400 }}>
                {currentYear} — monthly breakdown
              </p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.2)",
              padding: "4px 12px",
              borderRadius: 99,
              letterSpacing: "0.02em",
            }}>
              {currentYear}
            </span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
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
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 3.5, stroke: 'white' }}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Status Pie */}
        <SectionCard style={{ padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 14 }}>
            <h3 className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Invoice Volume</h3>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>Breakdown by status</p>
          </div>
          {statusCounts.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8" }}>
              <FileIcon style={{ width: 36, height: 36, opacity: 0.3 }} />
              <p style={{ fontSize: 12, margin: 0 }}>No invoices yet</p>
            </div>
          ) : (
            <>
              <div style={{ position: "relative", width: "100%", height: 150 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      cx="50%" cy="50%"
                      innerRadius={44} outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [value, name]}
                      contentStyle={{
                        borderRadius: 12, fontSize: 12,
                        border: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        background: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}>
                  <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>{totalInvoices}</p>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</p>
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {statusCounts.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: s.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{s.value}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: "white",
                        background: s.color,
                        padding: "1px 6px",
                        borderRadius: 99,
                      }}>
                        {totalInvoices > 0 ? Math.round((s.value / totalInvoices) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Revenue Pie */}
        <SectionCard style={{ padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 14 }}>
            <h3 className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Revenue Split</h3>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>Paid vs Pending</p>
          </div>
          {amountCounts.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8" }}>
              <CurrencyIcon style={{ width: 36, height: 36, opacity: 0.3 }} />
              <p style={{ fontSize: 12, margin: 0 }}>No revenue yet</p>
            </div>
          ) : (
            <>
              <div style={{ position: "relative", width: "100%", height: 150 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={amountCounts}
                      cx="50%" cy="50%"
                      innerRadius={44} outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {amountCounts.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [indianCurrencyFormatter(Number(value)), name]}
                      contentStyle={{
                        borderRadius: 12, fontSize: 12,
                        border: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        background: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}>
                  <p className="font-display" style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>
                    {indianCurrencyFormatter(totalRevenue)}
                  </p>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</p>
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {amountCounts.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: s.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{indianCurrencyFormatter(s.value)}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: "white",
                        background: s.color,
                        padding: "1px 6px",
                        borderRadius: 99,
                      }}>
                        {totalRevenue > 0 ? Math.round((s.value / totalRevenue) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

        {/* Recent Invoices */}
        <SectionCard style={{ overflow: "hidden" }}>
          <div style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(99,102,241,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Invoices</h3>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Latest billing activity</p>
            </div>
            <button
              onClick={() => setView('invoices')}
              style={{
                fontSize: 12, fontWeight: 700,
                color: "#6366f1",
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 99,
                padding: "5px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#6366f1";
                el.style.color = "white";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(99,102,241,0.08)";
                el.style.color = "#6366f1";
              }}
            >
              View all →
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "48px 0", gap: 10, color: "#94a3b8",
            }}>
              <FileIcon style={{ width: 36, height: 36, opacity: 0.25 }} />
              <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>No invoices yet</p>
            </div>
          ) : (
            <div>
              {recent.map((inv, i) => {
                const currentStatus = inv.status || 'Unpaid';
                const bStyle = statusBadgeStyle[currentStatus] || statusBadgeStyle['Draft'];
                const avatarColors = [
                  "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
                  "linear-gradient(135deg,#f59e0b,#f97316)",
                  "linear-gradient(135deg,#10b981,#059669)",
                  "linear-gradient(135deg,#f43f5e,#e11d48)",
                ];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 22px",
                      borderBottom: i < recent.length - 1 ? "1px solid rgba(99,102,241,0.05)" : "none",
                      transition: "all 0.18s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38,
                        borderRadius: 12,
                        background: avatarColors[i % avatarColors.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "white",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        letterSpacing: "-0.5px",
                      }}>
                        {inv.billedToName?.charAt(0)?.toUpperCase() || '#'}
                      </div>
                      <div>
                        <p style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#1e293b",
                          margin: 0,
                          lineHeight: 1.3,
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>{inv.billedToName || '—'}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", fontWeight: 400 }}>
                          {inv.invoiceNumber} · {inv.invoiceDate}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 5px",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        ₹{(Number(inv.totalAmountAfterTax) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <span className="status-badge" style={{ ...bStyle }}>
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ marginBottom: 4 }}>
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Quick Actions</h3>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>Shortcuts to common tasks</p>
          </div>

          {/* Create Invoice — primary CTA */}
          <button
            onClick={() => setView('create-invoice')}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "1px solid rgba(99,102,241,0.3)",
              cursor: "pointer",
              color: "white",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-2px) scale(1.01)";
              el.style.boxShadow = "0 8px 30px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0) scale(1)";
              el.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)";
            }}
          >
            <div style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.25)",
            }}>
              <PlusIcon style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Create Invoice</p>
              <p style={{ fontSize: 11, margin: 0, color: "rgba(255,255,255,0.65)" }}>Generate a new GST invoice</p>
            </div>
          </button>

          {/* Manage Clients */}
          {[
            {
              label: "Manage Clients", sub: "Add or edit client records",
              view: "clients" as View,
              bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)",
              iconBg: "rgba(14,165,233,0.12)", iconColor: "#0ea5e9",
              hoverBg: "rgba(14,165,233,0.12)", hoverBorder: "rgba(14,165,233,0.35)",
              icon: (
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              label: "Products", sub: "Manage your product catalog",
              view: "products" as View,
              bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)",
              iconBg: "rgba(16,185,129,0.12)", iconColor: "#10b981",
              hoverBg: "rgba(16,185,129,0.12)", hoverBorder: "rgba(16,185,129,0.35)",
              icon: (
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
            },
            {
              label: "Company Settings", sub: "Update your profile & bank details",
              view: "settings" as View,
              bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)",
              iconBg: "rgba(139,92,246,0.12)", iconColor: "#8b5cf6",
              hoverBg: "rgba(139,92,246,0.12)", hoverBorder: "rgba(139,92,246,0.35)",
              icon: (
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 12,
                background: item.bg,
                border: `1px solid ${item.border}`,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = item.hoverBg;
                el.style.borderColor = item.hoverBorder;
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = `0 4px 16px ${item.border}`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = item.bg;
                el.style.borderColor = item.border;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 34, height: 34,
                borderRadius: 10,
                background: item.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                color: item.iconColor,
              }}>
                {item.icon}
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>{item.sub}</p>
              </div>
            </button>
          ))}
        </SectionCard>
      </div>
    </div>
  );
};