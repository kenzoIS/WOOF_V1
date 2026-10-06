import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Activity, CalendarDays, CloudRain, Package, Tag, Store, Layers3, BarChart3, RefreshCw, Search, ChevronLeft, ChevronRight, X, ArrowUpDown } from "lucide-react";
import { getRootCauseAnalysis } from "../lib/api";
import { Button } from "../components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Period = "30d" | "90d" | "ytd" | "custom";
type Sector = "all" | "cafe" | "services" | "retail";
type Analysis = any;
type ChartMode = "daily" | "cumulative";
const money = (value?: number | null) => value == null || !Number.isFinite(Number(value)) ? "—" : `₱${Number(value).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
const pct = (value?: number | null) => value == null || !Number.isFinite(Number(value)) ? "—" : `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)}%`;
const number = (value?: number | null) => value == null ? "—" : Number(value).toLocaleString("en-PH", { maximumFractionDigits: 0 });
const periods: { id: Period; label: string }[] = [{ id: "30d", label: "30 days" }, { id: "90d", label: "90 days" }, { id: "ytd", label: "Year to date" }, { id: "custom", label: "Custom" }];
const sectors: { id: Sector; label: string }[] = [{ id: "all", label: "All sectors" }, { id: "cafe", label: "Cafe" }, { id: "services", label: "Services" }, { id: "retail", label: "Retail" }];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const manilaDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const shiftDate = (date: string, days: number) => { const value = new Date(`${date}T12:00:00.000Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };

function Card({ title, icon: Icon, children, className = "" }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-pink-100 bg-white p-5 shadow-sm ${className}`}><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><Icon size={19} className="text-cyan-600" />{title}</h2>{children}</section>;
}
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">{children}</div>; }
function ComparisonTable({ rows, firstLabel }: { rows: any[]; firstLabel: string }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "current" | "previous" | "variance" | "pctChange">("variance");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const pageSize = 8;
  const filtered = useMemo(() => {
    const matched = (rows || []).filter((row) => String(row.name).toLowerCase().includes(query.trim().toLowerCase()));
    return [...matched].sort((a, b) => {
      let comparison: number;
      if (sortKey === "name") comparison = String(a.name).toLowerCase().localeCompare(String(b.name).toLowerCase());
      else {
        const aValue = Number(a[sortKey]);
        const bValue = Number(b[sortKey]);
        comparison = (Number.isFinite(aValue) ? aValue : -Infinity) - (Number.isFinite(bValue) ? bValue : -Infinity);
      }
      return comparison * (ascending ? 1 : -1);
    });
  }, [rows, query, sortKey, ascending]);
  const pageCount = Math.ceil(filtered.length / pageSize);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const sortButton = (label: string, key: typeof sortKey) => <button type="button" onClick={() => { if (sortKey === key) setAscending((value) => !value); else { setSortKey(key); setAscending(key === "name"); } }} className="inline-flex items-center gap-1 hover:text-cyan-700">{label}<ArrowUpDown size={12} className={sortKey === key ? "text-cyan-700" : "opacity-40"} /></button>;
  if (!rows?.length) return <Empty>No transaction rows were found for these periods.</Empty>;
  return <div>
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={`Search ${firstLabel.toLowerCase()}…`} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></label><span className="text-xs text-slate-500">{filtered.length.toLocaleString()} results · sorted by {sortKey === "variance" ? "largest change" : sortKey}</span></div>
    {visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">{sortButton(firstLabel, "name")}</th><th>{sortButton("Current", "current")}</th><th>{sortButton("Previous", "previous")}</th><th>{sortButton("Change", "variance")}</th><th>{sortButton("Change %", "pctChange")}</th></tr></thead><tbody>{visible.map((row, i) => <tr key={`${row.name}-${i}`} className={`border-t border-slate-100 transition-colors hover:bg-pink-50/50 ${selected?.name === row.name ? "bg-cyan-50/60" : ""}`}><td className="py-3 pr-3"><button onClick={() => setSelected(selected?.name === row.name ? null : row)} className="font-medium text-slate-700 hover:text-cyan-700 hover:underline">{row.name}</button></td><td>{money(row.current)}</td><td>{money(row.previous)}</td><td className={row.variance < 0 ? "text-rose-600" : "text-emerald-700"}>{money(row.variance)}</td><td>{pct(row.pctChange)}</td></tr>)}</tbody></table><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">Showing {filtered.length ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}</span><div className="flex gap-2"><Button size="sm" variant="outline" aria-label="Previous table page" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}><ChevronLeft size={15} /></Button><Button size="sm" variant="outline" aria-label="Next table page" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1}><ChevronRight size={15} /></Button></div></div></div> : <Empty>No matches for “{query}”. Try another search.</Empty>}
    {selected && <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4"><div><p className="font-semibold text-slate-800">{selected.name}</p><p className="mt-1 text-sm text-slate-600">Revenue changed by <b>{money(selected.variance)}</b> ({pct(selected.pctChange)}) between the selected periods.</p><p className="mt-1 text-xs text-slate-500">Recorded quantity change: {number(selected.quantityVariance)} units. This is an observed comparison, not a causal attribution.</p></div><button onClick={() => setSelected(null)} aria-label="Close row details" className="rounded-lg p-1 text-slate-500 hover:bg-white"><X size={16} /></button></div>}
  </div>;
}

export function RootCauseExplorer() {
  const [period, setPeriod] = useState<Period>("30d");
  const [sector, setSector] = useState<Sector>("all");
  const today = useMemo(manilaDate, []);
  const [dateStart, setDateStart] = useState(shiftDate(today, -29));
  const [dateEnd, setDateEnd] = useState(today);
  const [appliedRange, setAppliedRange] = useState({ start: shiftDate(today, -29), end: today });
  const [rangeError, setRangeError] = useState("");
  const [chartMode, setChartMode] = useState<ChartMode>("daily");
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [selectedHeatCell, setSelectedHeatCell] = useState<any>(null);
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data: initialData, error: fetchError } = useSWR(
    ["rootCause", period, sector, refresh, appliedRange],
    () => getRootCauseAnalysis(period, sector, refresh > 0, period === "custom" ? appliedRange.start : undefined, period === "custom" ? appliedRange.end : undefined)
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      setError("");
    }
  }, [initialData]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError?.message || "Could not load Root Cause Explorer data.");
      setLoading(false);
    }
  }, [fetchError]);

  const chartData = useMemo(() => {
    const rows = data?.daily || [];
    const currentRows = rows.filter((row: any) => row.period === "current");
    const previousRows = rows.filter((row: any) => row.period === "previous");
    const maxOffset = Math.max(-1, ...currentRows.map((row: any) => Number(row.dayOffset)));
    let currentSum = 0;
    let previousSum = 0;
    return Array.from({ length: maxOffset + 1 }, (_, dayOffset) => {
      const current = currentRows.find((row: any) => Number(row.dayOffset) === dayOffset);
      const previous = previousRows.find((row: any) => Number(row.dayOffset) === dayOffset);
      if (current?.revenue != null) currentSum += Number(current.revenue);
      if (previous?.revenue != null) previousSum += Number(previous.revenue);
      return { dayOffset, label: "Day " + (dayOffset + 1), currentDate: current?.date, previousDate: previous?.date,
        currentDaily: current?.revenue == null ? null : Number(current.revenue), previousDaily: previous?.revenue == null ? null : Number(previous.revenue),
        current: current?.revenue == null ? null : (chartMode === "daily" ? Number(current.revenue) : currentSum),
        previous: previous?.revenue == null ? null : (chartMode === "daily" ? Number(previous.revenue) : previousSum) };
    });
  }, [data, chartMode]);
  const heatmap = data?.heatmap || [];
  const maxCell = Math.max(0, ...heatmap.map((cell: any) => Number(cell.revenue) || 0));
  const startEnd = data?.window ? `${data.window.currentStart} – ${data.window.currentEnd} (Manila)` : "";
  const total = data?.totals?.current;
  const prior = data?.totals?.previous;
  const tabs = [
    { title: "Channels", icon: Store, content: <ComparisonTable rows={data?.channels || []} firstLabel="Channel" /> },
    { title: "Categories", icon: Layers3, content: <ComparisonTable rows={data?.categories || []} firstLabel="Category" /> },
    { title: "Products / SKU", icon: Package, content: <ComparisonTable rows={data?.products || []} firstLabel="Product / SKU" /> },
  ];
  const [tab, setTab] = useState(0);
  const handleRangeApply = () => {
    if (!dateStart || !dateEnd || dateStart > dateEnd) { setRangeError("Choose a valid start and end date."); return; }
    if (dateEnd > today) { setRangeError("End date cannot be later than today (Manila)."); return; }
    setRangeError(""); setAppliedRange({ start: dateStart, end: dateEnd });
  };
  const selectedHeat = selectedHeatCell && heatmap.find((cell: any) => Number(cell.weekday) === selectedHeatCell.weekday && Number(cell.hour) === selectedHeatCell.hour);

  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-1 flex items-center gap-2 text-sm font-semibold text-cyan-700"><Activity size={16} /> Transaction-based analysis</div><h1 className="text-3xl font-bold text-slate-900">Root Cause Explorer</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">Shows observed changes in recorded sales. These comparisons describe what changed; they do not claim that a factor caused the change.</p></div><Button variant="outline" onClick={() => setRefresh((n) => n + 1)} disabled={loading} className="gap-2"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh data</Button></header>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2"><CalendarDays size={17} className="text-slate-500" />{periods.map((item) => <button type="button" aria-pressed={period === item.id} key={item.id} onClick={() => setPeriod(item.id)} className={`rounded-full px-3 py-1.5 text-sm ${period === item.id ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item.label}</button>)}</div>
      {period === "custom" && <div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">From <input aria-label="Start date" type="date" value={dateStart} max={dateEnd || today} onChange={(event) => setDateStart(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700" /></label><label className="text-xs text-slate-500">To <input aria-label="End date" type="date" value={dateEnd} min={dateStart} max={today} onChange={(event) => setDateEnd(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700" /></label><Button size="sm" onClick={handleRangeApply} disabled={loading}>Apply</Button>{rangeError && <span role="alert" className="text-xs text-rose-600">{rangeError}</span>}</div>}
      <div className="ml-auto flex flex-wrap gap-2">{sectors.map((item) => <button type="button" aria-pressed={sector === item.id} key={item.id} onClick={() => setSector(item.id)} className={`rounded-full px-3 py-1.5 text-sm ${sector === item.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>{item.label}</button>)}</div>
    </div>
    {error ? <Empty>{error}</Empty> : loading && !data ? <Empty>Loading transaction records…</Empty> : data ? <>
      <p className="text-xs text-slate-500">Current window: {startEnd}. Previous window is the immediately preceding matched period. Revenue uses recorded net sales.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Revenue", money(total?.revenue), `Previous: ${money(prior?.revenue)}`, pct(data.totals?.pctChange)], ["Orders", number(total?.orders), `Previous: ${number(prior?.orders)}`, "Distinct transaction IDs"], ["Units", number(total?.quantity), `Previous: ${number(prior?.quantity)}`, "Recorded quantity"], ["Recorded discounts", money(data.discounts?.discounts), `Gross sales: ${money(data.discounts?.grossSales)}`, data.discounts?.rate == null ? "Rate unavailable" : `${Number(data.discounts.rate).toFixed(1)}% of gross sales`]].map(([label, value, detail, change]) => <div key={label} className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p><p className="mt-1 text-xs font-semibold text-cyan-700">{change}</p></div>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Daily recorded net sales" icon={BarChart3} className="xl:col-span-2"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Observed daily totals compared with the previous matched period.</p><div className="flex rounded-lg bg-slate-100 p-1"><button type="button" aria-pressed={chartMode === "daily"} onClick={() => { setChartMode("daily"); setSelectedDay(null); }} className={`rounded-md px-3 py-1 text-xs ${chartMode === "daily" ? "bg-white font-semibold text-cyan-700 shadow-sm" : "text-slate-600"}`}>Daily</button><button type="button" aria-pressed={chartMode === "cumulative"} onClick={() => { setChartMode("cumulative"); setSelectedDay(null); }} className={`rounded-md px-3 py-1 text-xs ${chartMode === "cumulative" ? "bg-white font-semibold text-cyan-700 shadow-sm" : "text-slate-600"}`}>Cumulative</button></div></div>{chartData.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} onClick={(event: any) => { if (event?.activePayload?.[0]?.payload) setSelectedDay(event.activePayload[0].payload); }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} /><YAxis tickFormatter={(v) => "₱" + Math.round(v / 1000) + "k"} /><Tooltip labelFormatter={(_: any, payload: any[]) => { const row = payload?.[0]?.payload; return row ? row.label + ": " + (row.currentDate || "—") + " vs " + (row.previousDate || "—") : ""; }} formatter={(v: any, name: any) => [money(v == null ? null : Number(v)), name]} /><Line type="monotone" dataKey="current" name="Current period" stroke="#0891b2" strokeWidth={2.5} dot={false} connectNulls={false} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="previous" name="Previous period" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <Empty>No recorded sales in this current window.</Empty>}{selectedDay && <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-cyan-50 p-3 text-sm"><span className="font-semibold">{selectedDay.label}</span><span>Current ({selectedDay.currentDate || "no date"}): <b>{money(selectedDay.currentDaily)}</b></span><span>Previous ({selectedDay.previousDate || "no date"}): <b>{money(selectedDay.previousDaily)}</b></span></div>}</Card>
        <Card title="Period totals" icon={Activity}><div className="space-y-4"><div><p className="text-xs uppercase text-slate-500">Revenue change</p><p className="text-2xl font-bold">{money(data.totals?.variance)}</p><p className="text-sm text-slate-500">{pct(data.totals?.pctChange)} vs previous period</p></div><div><p className="text-xs uppercase text-slate-500">Current transaction rows</p><p className="text-xl font-semibold">{number(data.dataStatus?.currentTransactionRows)}</p><p className="text-sm text-slate-500">Discount details are shown once below.</p></div></div></Card>
      </div>
      <Card title="Observed revenue change by business dimension" icon={Layers3}>
        <div role="tablist" aria-label="Business dimension" className="mb-4 flex flex-wrap gap-2">{tabs.map((item, index) => <button type="button" role="tab" aria-selected={tab === index} key={item.title} onClick={() => setTab(index)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${tab === index ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-cyan-50"}`}><item.icon size={15} />{item.title}</button>)}</div>
        <div role="tabpanel">{tabs[tab].content}</div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Observed transaction intensity by weekday and hour" icon={CalendarDays}>
          <p className="mb-3 text-xs text-slate-500">Color intensity is relative to the busiest cell in this period. Select a cell to inspect its recorded totals.</p>
          {heatmap.length ? <>
            <div className="overflow-x-auto"><div className="grid min-w-[600px] grid-cols-[44px_repeat(24,minmax(18px,1fr))] gap-1 text-[10px]"><div />{Array.from({ length: 24 }, (_, h) => <div key={h} className="text-center text-slate-400">{String(h).padStart(2, "0")}</div>)}{weekdays.map((day, i) => <React.Fragment key={day}><div className="flex items-center text-slate-500">{day}</div>{Array.from({ length: 24 }, (_, hour) => { const cell = heatmap.find((x: any) => Number(x.weekday) === (i + 1) && Number(x.hour) === hour); const value = Number(cell?.revenue) || 0; const alpha = maxCell ? 0.08 + (value / maxCell) * 0.82 : 0; const selected = selectedHeatCell?.weekday === i + 1 && selectedHeatCell?.hour === hour; return <button type="button" key={`${day}-${hour}`} aria-label={`${day} ${String(hour).padStart(2, "0")}:00, revenue ${money(value)}, orders ${number(cell?.orders)}`} aria-pressed={selected} onClick={() => setSelectedHeatCell({ weekday: i + 1, hour })} title={`${day} ${String(hour).padStart(2, "0")}:00`} className={`h-5 rounded-sm outline-none transition-transform hover:z-10 hover:scale-125 focus:ring-2 focus:ring-cyan-700 ${selected ? "ring-2 ring-slate-800" : ""}`} style={{ backgroundColor: value ? `rgba(8,145,178,${alpha})` : "#f1f5f9" }} />; })}</React.Fragment>)}</div></div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span>Lower</span><span className="h-3 w-20 rounded bg-gradient-to-r from-cyan-50 to-cyan-700" /><span>Higher revenue</span></div>
            {selectedHeatCell && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-cyan-50 p-3 text-sm"><b>{weekdays[selectedHeatCell.weekday - 1]} at {String(selectedHeatCell.hour).padStart(2, "0")}:00</b><span>Recorded revenue: <b>{money(selectedHeat?.revenue || 0)}</b></span><span>Distinct orders: <b>{number(selectedHeat?.orders || 0)}</b></span></div>}
          </> : <Empty>No timestamped transactions available for the heatmap.</Empty>}
        </Card>
        <Card title="Weather and observed sales" icon={CloudRain}><p className="mb-3 text-xs text-slate-500">Weather is shown only when non-synthetic cached observations exist. Association is descriptive, not causal.</p>{data.weather?.available ? <><div className="mb-3 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Rainy-day average sales</p><p className="font-semibold">{money(data.weather.rainyAverageRevenue)}</p><p className="text-xs text-slate-500">{number(data.weather.rainyDays)} days (≥1 mm)</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Dry-day average sales</p><p className="font-semibold">{money(data.weather.dryAverageRevenue)}</p><p className="text-xs text-slate-500">{number(data.weather.dryDays)} days (&lt;1 mm)</p></div></div><div className="max-h-52 overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500"><th className="py-2">Date</th><th>Rain mm</th><th>Temp °C</th><th>Net sales</th></tr></thead><tbody>{data.weather.rows.map((row: any) => <tr key={row.date} className="border-t"><td className="py-2">{row.date}</td><td>{row.rainfallMm}</td><td>{row.tempCelsius}</td><td>{money(row.revenue)}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-amber-700">Footfall data is not available, so no footfall effect is reported.</p></> : <Empty>{data.weather?.caveat || "No observed weather cache for the selected period."}</Empty>}</Card>
      </div>
      <Card title="Recorded discount details" icon={Tag}><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><p>Gross sales: <b>{money(data.discounts?.grossSales)}</b></p><p>Discount amount: <b>{money(data.discounts?.discounts)}</b></p><p>Net sales: <b>{money(data.discounts?.netSales)}</b></p><p>Discount / gross sales: <b>{pct(data.discounts?.rate)}</b></p></div><p className="mt-3 text-xs text-slate-500">These are transaction fields as recorded; they do not estimate what sales would have been without a discount.</p></Card>
      <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer list-none font-semibold text-slate-700">Why some analyses are not shown <span className="float-right text-cyan-700 transition-transform group-open:rotate-180">⌄</span></summary><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-white p-3"><p className="font-semibold text-slate-700">Stockout impact</p><p className="mt-1 text-slate-500">{data.stockouts?.reason || "No verified inventory data."}</p></div><div className="rounded-xl bg-white p-3"><p className="font-semibold text-slate-700">Promotion lift</p><p className="mt-1 text-slate-500">{data.promotions?.reason || "No campaign experiment data."}</p></div><div className="rounded-xl bg-white p-3"><p className="font-semibold text-slate-700">Footfall and causal attribution</p><p className="mt-1 text-slate-500">These need measured footfall plus a comparison design. Correlation in this view cannot establish cause.</p></div><div className="rounded-xl bg-white p-3"><p className="font-semibold text-slate-700">Data coverage</p><p className="mt-1 text-slate-500">{number(data.dataStatus?.currentTransactionRows)} current and {number(data.dataStatus?.previousTransactionRows)} previous transaction rows; {number(data.dataStatus?.weatherRows)} observed weather days.</p></div></div></details>
    </> : null}
  </main>;
}
