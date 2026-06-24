import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { api, formatINR } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function WealthSimulator() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [returnRate, setReturnRate] = useState(12);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/wealth-simulator", {
        monthly_investment: monthly, years, expected_return: returnRate,
      });
      setResult(data);
    } catch (e) { toast.error("Simulation failed"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Project</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Wealth Simulator</h1>
        <p className="text-slate-500 mt-1">See how compound interest grows your SIP over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between"><Label>Monthly Investment</Label><div className="money font-semibold text-[#1C3F8E]" data-testid="monthly-value">{formatINR(monthly)}</div></div>
              <Slider data-testid="monthly-slider" value={[monthly]} onValueChange={([v])=>setMonthly(v)} min={500} max={100000} step={500} className="mt-3"/>
              <Input type="number" value={monthly} onChange={e=>setMonthly(parseFloat(e.target.value)||0)} className="mt-2"/>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label>Duration</Label><div className="money font-semibold text-[#1C3F8E]">{years} years</div></div>
              <Slider data-testid="years-slider" value={[years]} onValueChange={([v])=>setYears(v)} min={1} max={30} step={1} className="mt-3"/>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label>Expected Return (p.a.)</Label><div className="money font-semibold text-[#1C3F8E]">{returnRate}%</div></div>
              <Slider data-testid="return-slider" value={[returnRate]} onValueChange={([v])=>setReturnRate(v)} min={4} max={20} step={0.5} className="mt-3"/>
            </div>
            <Button onClick={simulate} disabled={loading} data-testid="simulate-button" className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">
              <Sparkles size={16}/> {loading ? "Calculating..." : "Project My Wealth"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardContent className="p-6">
            {!result ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                <TrendingUp size={48} strokeWidth={1}/>
                <div className="mt-4 font-heading text-lg">Set your parameters and hit simulate</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#1C3F8E]/5 rounded-lg p-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total Invested</div>
                    <div className="money text-xl font-semibold text-[#0A1128] mt-1" data-testid="result-invested">{formatINR(result.total_invested)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">Gain</div>
                    <div className="money text-xl font-semibold text-emerald-700 mt-1" data-testid="result-gain">{formatINR(result.total_gain)}</div>
                  </div>
                  <div className="bg-[#7A2C8E]/10 rounded-lg p-4">
                    <div className="text-[10px] uppercase tracking-widest text-[#7A2C8E] font-semibold">Future Value</div>
                    <div className="money text-xl font-semibold text-[#7A2C8E] mt-1" data-testid="result-future-value">{formatINR(result.projected_value)}</div>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearly_breakdown}>
                      <defs>
                        <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1C3F8E" stopOpacity={0.5}/><stop offset="100%" stopColor="#1C3F8E" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gi2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7A2C8E" stopOpacity={0.3}/><stop offset="100%" stopColor="#7A2C8E" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748B" }} stroke="#CBD5E1" label={{ value: "Year", position: "insideBottom", offset: -5, fontSize: 11, fill: "#64748B" }}/>
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} stroke="#CBD5E1" tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`}/>
                      <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #E2E8F0", borderRadius: 8 }} formatter={(v) => formatINR(v)}/>
                      <Area type="monotone" dataKey="invested" stroke="#7A2C8E" fill="url(#gi2)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="projected_value" stroke="#1C3F8E" fill="url(#gp)" strokeWidth={2.5}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {result.milestones?.map(m => (
                    <div key={m.label} className="border border-slate-200 rounded-lg p-3" data-testid={`milestone-${m.label}`}>
                      <div className="text-xs text-slate-400 font-semibold">{m.label}</div>
                      <div className="money font-semibold text-[#0A1128] mt-1">{formatINR(m.projected_value)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
