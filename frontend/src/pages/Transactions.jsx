import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, formatINR } from "@/lib/api";
import { toast } from "sonner";
import { Upload, Trash2, Search, FileText } from "lucide-react";

const catColor = {
  Salary: "bg-emerald-100 text-emerald-700",
  Groceries: "bg-blue-100 text-blue-700",
  Dining: "bg-orange-100 text-orange-700",
  Transport: "bg-cyan-100 text-cyan-700",
  Shopping: "bg-pink-100 text-pink-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  Healthcare: "bg-red-100 text-red-700",
  EMI: "bg-rose-100 text-rose-700",
  Investment: "bg-indigo-100 text-indigo-700",
  Fuel: "bg-amber-100 text-amber-700",
  Education: "bg-teal-100 text-teal-700",
};

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [search, setSearch] = useState("");
  const fileRef = useRef();

  const load = async () => {
    const { data } = await api.get("/transactions?limit=300");
    setTxns(data);
  };

  useEffect(() => { load(); }, []);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv";
      const { data } = await api.post(`/transactions/upload-${ext}`, fd, { headers: { "Content-Type": "multipart/form-data" }});
      toast.success(ext === "csv" ? `Imported ${data.imported} transactions` : "PDF uploaded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
  };

  const remove = async (id) => {
    try { await api.delete(`/transactions/${id}`); setTxns(t => t.filter(x => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = txns.filter(t => !search || (t.merchant_name + t.category + t.description).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Activity</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Transactions</h1>
          <p className="text-slate-500 mt-1">{txns.length} entries across your linked accounts.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileRef} accept=".csv,.pdf" onChange={onUpload} className="hidden"/>
          <Button onClick={() => fileRef.current?.click()} data-testid="upload-statement-button" className="bg-[#1C3F8E] hover:bg-[#15306B]"><Upload size={16}/> Upload CSV / PDF</Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <Input data-testid="txn-search" placeholder="Search merchant, category…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9"/>
            </div>
            <div className="text-sm text-slate-500">{filtered.length} shown</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Merchant</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Method</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid={`txn-row-${t.id}`}>
                    <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{t.transaction_date}</td>
                    <td className="py-3 pr-4 font-medium text-[#0A1128]">{t.merchant_name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={`${catColor[t.category] || "bg-slate-100 text-slate-700"} font-medium`}>{t.category}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{t.payment_method}</td>
                    <td className={`py-3 pr-4 text-right money font-semibold ${t.transaction_type === "credit" ? "text-emerald-600" : "text-[#0A1128]"}`}>
                      {t.transaction_type === "credit" ? "+" : "−"}{formatINR(t.amount)}
                    </td>
                    <td className="py-3">
                      <button onClick={()=>remove(t.id)} data-testid={`delete-txn-${t.id}`} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400"><FileText size={24} className="mx-auto mb-2"/>No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
