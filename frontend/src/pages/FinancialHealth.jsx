import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

const factors = [
  { key: "savings_rate", label: "Savings Rate", max: 30, desc: "What % of income you keep each month." },
  { key: "expense_stability", label: "Expense Stability", max: 20, desc: "How consistent your category spending is." },
  { key: "emergency_fund", label: "Emergency Fund", max: 25, desc: "Buffer relative to 6 months of expenses." },
  { key: "investment_activity", label: "Investment Activity", max: 15, desc: "% of income going to investments." },
  { key: "debt_ratio", label: "Debt Ratio", max: 10, desc: "Lower debt = higher score." },
];

export default function FinancialHealth() {
  const [data, setData] = useState(null);

  useEffect(() => { (async () => { const r = await api.get("/financial-health"); setData(r.data); })(); }, []);

  if (!data) return <div className="text-slate-500 p-8">Loading health score…</div>;

  const tone = data.score >= 70 ? "#10B981" : data.score >= 50 ? "#F59E0B" : "#EF4444";
  const status = data.score >= 70 ? "Excellent" : data.score >= 50 ? "Good" : "Needs Work";

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Health</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Financial Health Score</h1>
        <p className="text-slate-500 mt-1">A holistic view of your money habits across 5 dimensions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 lg:col-span-1">
          <CardContent className="p-6">
            <div className="h-72 relative">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: data.score, fill: tone }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#E2E8F0" }}/>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="money text-6xl font-bold" style={{ color: tone }} data-testid="health-score">{data.score}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">out of 100</div>
                <div className="mt-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ background: `${tone}20`, color: tone }}>{status}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardContent className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Breakdown</div>
            <div className="font-heading text-xl font-semibold mt-1 mb-4">How your score is calculated</div>
            <div className="space-y-5">
              {factors.map(f => {
                const val = data.breakdown[f.key] || 0;
                const pct = (val / f.max) * 100;
                return (
                  <div key={f.key} data-testid={`factor-${f.key}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#0A1128]">{f.label}</div>
                        <div className="text-xs text-slate-500">{f.desc}</div>
                      </div>
                      <div className="money text-sm font-semibold text-[#1C3F8E]">{val} / {f.max}</div>
                    </div>
                    <Progress value={pct} className="mt-2 h-2 [&>div]:bg-[#1C3F8E]"/>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
