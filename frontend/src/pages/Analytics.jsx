import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { api, formatINR } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#1C3F8E", "#7A2C8E", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#EC4899"];

export default function Analytics() {
  const [monthly, setMonthly] = useState([]);
  const [cats, setCats] = useState([]);
  const [savings, setSavings] = useState([]);

  useEffect(() => {
    (async () => {
      const [m, c, s] = await Promise.all([
        api.get("/analytics/monthly-spending"),
        api.get("/analytics/category-breakdown"),
        api.get("/analytics/savings-trend"),
      ]);
      setMonthly(m.data); setCats(c.data); setSavings(s.data);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Insights</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Analytics</h1>
        <p className="text-slate-500 mt-1">Deep dives across months, categories and savings.</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="font-heading text-xl font-semibold mb-4">Monthly Spending</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }}/>
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v => formatINR(v)} contentStyle={{ borderRadius: 8 }}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]}/>
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="font-heading text-xl font-semibold mb-4">Category Breakdown</div>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cats} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={(d) => d.category}>
                    {cats.map((c) => <Cell key={c.category} fill={COLORS[cats.indexOf(c) % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => formatINR(v)}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="font-heading text-xl font-semibold mb-4">Savings Trend</div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={savings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }}/>
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={v => formatINR(v)} contentStyle={{ borderRadius: 8 }}/>
                  <Line type="monotone" dataKey="savings" stroke="#7A2C8E" strokeWidth={3} dot={{ r: 5, fill: "#7A2C8E" }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
