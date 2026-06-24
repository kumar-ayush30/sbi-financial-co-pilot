import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, formatINR } from "@/lib/api";
import { Sparkles, TrendingDown, AlertTriangle, BadgeCheck, RefreshCw } from "lucide-react";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/recommendations"); setData(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) return <div className="text-slate-500 p-8 flex items-center gap-2"><Sparkles className="animate-pulse"/> AI agents are analyzing your data…</div>;

  const insights = data.expense_insights || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">AI Insights</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Recommendations</h1>
          <p className="text-slate-500 mt-1">Multi-agent insights from your spending patterns.</p>
        </div>
        <Button variant="outline" onClick={load} data-testid="refresh-recos"><RefreshCw size={14}/> Regenerate</Button>
      </div>

      {/* Monthly Leaks Banner */}
      <Card className="border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-[#7A2C8E] to-[#1C3F8E] text-white p-6">
            <div className="flex items-center gap-4">
              <TrendingDown size={32}/>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-white/70 font-semibold">Detected by Expense Detective</div>
                <div className="font-heading text-2xl mt-1">You could save <span className="money font-bold">{formatINR(insights.monthly_leaks || 0)}</span> /month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overspending */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-1"><AlertTriangle size={16}/><div className="text-xs uppercase tracking-widest font-semibold">Overspending</div></div>
            <div className="font-heading text-xl font-semibold">Categories burning cash</div>
            <div className="mt-4 space-y-3">
              {(insights.overspending_categories || []).map((o, i) => (
                <div key={i} data-testid={`overspend-${i}`} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <div className="font-medium text-[#0A1128]">{o.category}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{o.reason}</div>
                  </div>
                  <div className="money font-semibold text-red-600 whitespace-nowrap">{formatINR(o.monthly_amount)}</div>
                </div>
              ))}
              {(insights.overspending_categories || []).length === 0 && <div className="text-sm text-slate-400">Nothing flagged — great control!</div>}
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-amber-600 mb-1"><RefreshCw size={16}/><div className="text-xs uppercase tracking-widest font-semibold">Subscriptions</div></div>
            <div className="font-heading text-xl font-semibold">Recurring drains</div>
            <div className="mt-4 space-y-2">
              {(insights.subscriptions || []).map((s, i) => (
                <div key={i} data-testid={`sub-${i}`} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="font-medium text-[#0A1128]">{s.service}</div>
                  <div className="money text-slate-700">{formatINR(s.monthly_cost)}/mo</div>
                </div>
              ))}
              {(insights.subscriptions || []).length === 0 && <div className="text-sm text-slate-400">No recurring subscriptions detected.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Opportunities */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-emerald-600 mb-1"><Sparkles size={16}/><div className="text-xs uppercase tracking-widest font-semibold">Cost-Cutting Agent</div></div>
          <div className="font-heading text-xl font-semibold mb-4">Savings opportunities</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.savings_opportunities || []).map((s, i) => (
              <div key={i} data-testid={`saving-${i}`} className="border border-slate-200 rounded-lg p-4 hover:border-[#1C3F8E] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-[#0A1128]">{s.title}</div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 money">+{formatINR(s.potential_saving)}/mo</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SBI Products */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-[#7A2C8E] mb-1"><BadgeCheck size={16}/><div className="text-xs uppercase tracking-widest font-semibold">SBI Recommender</div></div>
          <div className="font-heading text-xl font-semibold mb-4">Recommended SBI Products</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data.sbi_products || []).map((p, i) => (
              <div key={i} data-testid={`product-${i}`} className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-[#1C3F8E] text-[#1C3F8E] text-[10px] uppercase tracking-wider">{p.product_type}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">{p.risk_level} risk</Badge>
                </div>
                <div className="font-heading font-semibold text-[#0A1128] text-lg">{p.product_name}</div>
                <div className="money text-sm text-[#7A2C8E] font-semibold mt-1">{p.expected_return}</div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{p.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
