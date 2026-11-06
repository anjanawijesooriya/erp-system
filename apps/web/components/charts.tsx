"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS_STYLE = { fontSize: 12, fill: "#64748b" };
const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
  labelStyle: { color: "#334155", fontWeight: 600 },
};

function formatMoney(value: number) {
  return `LKR ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalesTrendChart({ data }: { data: { day: string; totalSales: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v))} />
        <Bar dataKey="totalSales" name="Sales" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueExpenseChart({ data }: { data: { month: string; revenue: number; expenses: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: MONTH_LABELS[Number(d.month.slice(5, 7)) - 1] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v))} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { productName: string; totalRevenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis dataKey="productName" type="category" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={110} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v))} />
        <Bar dataKey="totalRevenue" name="Revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
