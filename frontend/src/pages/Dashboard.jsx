import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, formatINR } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { Wallet, Sparkles, ArrowUpRight, ArrowDownRight, Database, ShieldCheck, AlertCircle, Upload } from "lucide-react";

const COLORS = ["#1C3F8E", "#7A2C8E", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6"];

const Metric = ({ icon: Icon, label, value, sub, tone = "primary", testId }) => {
  const tones = {
    primary: "bg-[#1C3F8E]/10 text-[#1C3F8E]",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-red-50 text-red-600",
    accent: "bg-[#7A2C8E]/10 text-[#7A2C8E]",
  };
  return (
    <div data-testid={testId} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-up">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon size={20} strokeWidth={1.75}/></div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      </div>
      <div className="money text-3xl font-semibold text-[#0A1128] mt-4">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [cats, setCats] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const meRes = await api.get("/auth/me");
      setStatus(meRes.data.data_status);
      if (!meRes.data.data_status?.has_data) { setSummary({ empty: true }); return; }
      const [s, t, c] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/analytics/savings-trend"),
        api.get("/analytics/category-breakdown"),
      ]);
      setSummary(s.data);
      setTrend(t.data);
      setCats(c.data.slice(0, 6));
    })();
  }, []);

  if (!summary) return <div className="text-slate-500 p-8">Loading dashboard…</div>;

  if (summary.empty) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Welcome</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">No financial data connected</h1>
          <p className="text-slate-500 mt-1">To see insights, please load a dataset or upload your statement.</p>
        </div>
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <Database size={48} className="text-slate-300 mx-auto mb-4"/>
            <div className="font-heading text-xl font-semibold text-[#0A1128]">No data available</div>
            <p className="text-slate-500 mt-2">Choose a data source to get personalized AI insights.</p>
            <div className="mt-6">
              <Link to="/onboarding"><Button data-testid="empty-state-cta" className="bg-[#1C3F8E] hover:bg-[#15306B] h-11 px-6"><Upload size={16}/> Connect data</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreColor = summary.health_score >= 70 ? "#10B981" : summary.health_score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {status && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-5 py-3" data-testid="status-banner">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2"><Database size={14} className="text-[#1C3F8E]"/><span className="text-xs uppercase tracking-wider text-slate-500">Source:</span><span className="text-sm font-semibold text-[#1C3F8E] uppercase">{status.data_source}</span></div>
            <div className="flex items-center gap-2"><ShieldCheck size={14} className={status.kyc_status === "verified" ? "text-emerald-600" : "text-amber-600"}/><span className="text-xs uppercase tracking-wider text-slate-500">KYC:</span><span className={`text-sm font-semibold uppercase ${status.kyc_status === "verified" ? "text-emerald-600" : "text-amber-600"}`}>{status.kyc_status}</span></div>
            <div className="flex items-center gap-2"><Sparkles size={14} className="text-[#7A2C8E]"/><span className="text-xs uppercase tracking-wider text-slate-500">AI:</span><span className="text-sm font-semibold text-emerald-600 uppercase">Operational</span></div>
            <div className="text-xs text-slate-400">{status.transaction_count} txns</div>
          </div>
          {status.data_source === "demo" && (
            <Link to="/onboarding"><Button variant="outline" size="sm" data-testid="switch-to-personal">Switch to personal data</Button></Link>
          )}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Overview</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Dashboard</h1>
        <p className="text-slate-500 mt-1">Your financial snapshot for the last 30 days.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Metric testId="metric-balance" icon={Wallet} label="Balance" value={formatINR(summary.balance)} tone="primary" sub="Available + 6-month buffer"/>
        <Metric testId="metric-income" icon={ArrowUpRight} label="Income" value={formatINR(summary.monthly_income)} tone="success" sub="Last 30 days"/>
        <Metric testId="metric-expenses" icon={ArrowDownRight} label="Expenses" value={formatINR(summary.monthly_expenses)} tone="danger" sub="Last 30 days"/>
        <Metric testId="metric-savings" icon={Sparkles} label="Potential Savings" value={formatINR(summary.potential_savings)} tone="accent" sub="If optimized"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Savings Trend</div>
                <div className="font-heading text-xl font-semibold mt-1">Income vs Expenses</div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.4}/><stop offset="100%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} stroke="#CBD5E1"/>
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} stroke="#CBD5E1" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #E2E8F0", borderRadius: 8 }} formatter={(v) => formatINR(v)}/>
                  <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#gi)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#ge)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Financial Health</div>
            <div className="font-heading text-xl font-semibold mt-1">Your Score</div>
            <div className="h-44 mt-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "score", value: summary.health_score, fill: scoreColor }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#E2E8F0" }}/>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="money text-4xl font-bold" style={{ color: scoreColor }} data-testid="health-score-value">{summary.health_score}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">out of 100</div>
              </div>
            </div>
            <div className="text-sm text-center text-slate-600 mt-2">
              {summary.health_score >= 70 ? "Excellent" : summary.health_score >= 50 ? "Good — room to grow" : "Needs attention"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Where your money goes</div>
              <div className="font-heading text-xl font-semibold mt-1">Top Spending Categories</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cats} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {cats.map((c) => <Cell key={c.category} fill={COLORS[cats.indexOf(c) % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #E2E8F0", borderRadius: 8 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {cats.map((c, i) => (
                <div key={c.category} data-testid={`category-${c.category}`} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/>
                    <span className="font-medium text-[#0A1128]">{c.category}</span>
                  </div>
                  <div className="money text-slate-700">{formatINR(c.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
