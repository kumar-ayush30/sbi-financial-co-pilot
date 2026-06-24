import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, Upload, Database, FileText, CheckCircle2, ArrowRight, IdCard } from "lucide-react";

export default function Onboarding() {
  const nav = useNavigate();
  const [stage, setStage] = useState("kyc"); // kyc | choose | upload
  const [kyc, setKyc] = useState({ pan: "", aadhaar_last4: "", sbi_account_last4: "", date_of_birth: "", address: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data.data_status?.kyc_status === "verified") setStage("choose");
        if (data.data_status?.has_data) nav("/dashboard");
      } catch (e) { console.error(e); }
    })();
  }, [nav]);

  const submitKyc = async () => {
    if (!kyc.pan || kyc.pan.length !== 10) return toast.error("Enter valid PAN (10 chars)");
    if (!kyc.aadhaar_last4 || kyc.aadhaar_last4.length !== 4) return toast.error("Enter last 4 of Aadhaar");
    setLoading(true);
    try {
      await api.post("/onboarding/complete-kyc", kyc);
      toast.success("KYC verified");
      setStage("choose");
    } catch (e) {
      toast.error(e.response?.data?.detail || "KYC failed");
    }
    setLoading(false);
  };

  const loadDemo = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/onboarding/load-demo");
      toast.success(`Loaded ${data.loaded} demo transactions`);
      nav("/dashboard");
    } catch (e) {
      toast.error("Failed to load demo data");
    }
    setLoading(false);
  };

  const onCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    try {
      const { data } = await api.post("/transactions/upload-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported ${data.imported} transactions`);
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center text-white font-bold font-heading">S</div>
          <div className="font-heading font-bold text-[#0A1128] text-lg">SBI Co-Pilot Onboarding</div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${stage === "kyc" ? "text-[#1C3F8E] font-semibold" : "text-emerald-600"}`}>
            {stage === "kyc" ? <IdCard size={18}/> : <CheckCircle2 size={18}/>}
            <span className="text-sm">KYC Verification</span>
          </div>
          <ArrowRight size={14} className="text-slate-300"/>
          <div className={`flex items-center gap-2 ${stage === "choose" ? "text-[#1C3F8E] font-semibold" : "text-slate-400"}`}>
            <Database size={18}/>
            <span className="text-sm">Connect Data</span>
          </div>
        </div>

        {stage === "kyc" && (
          <Card className="border-slate-200">
            <CardContent className="p-8">
              <h1 className="font-heading text-3xl font-bold text-[#0A1128]">Verify your identity</h1>
              <p className="text-slate-500 mt-2">As per RBI guidelines, we need to verify your KYC details before showing financial insights.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <Label>PAN Number</Label>
                  <Input data-testid="kyc-pan" value={kyc.pan} maxLength={10} onChange={e=>setKyc({...kyc, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" className="mt-1.5 font-mono"/>
                </div>
                <div>
                  <Label>Aadhaar (last 4)</Label>
                  <Input data-testid="kyc-aadhaar" value={kyc.aadhaar_last4} maxLength={4} onChange={e=>setKyc({...kyc, aadhaar_last4: e.target.value.replace(/\D/g,"")})} placeholder="1234" className="mt-1.5 font-mono"/>
                </div>
                <div>
                  <Label>Date of birth</Label>
                  <Input data-testid="kyc-dob" type="date" value={kyc.date_of_birth} onChange={e=>setKyc({...kyc, date_of_birth: e.target.value})} className="mt-1.5"/>
                </div>
                <div>
                  <Label>SBI account (last 4, optional)</Label>
                  <Input data-testid="kyc-sbi" value={kyc.sbi_account_last4} maxLength={4} onChange={e=>setKyc({...kyc, sbi_account_last4: e.target.value.replace(/\D/g,"")})} className="mt-1.5 font-mono"/>
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea data-testid="kyc-address" value={kyc.address} onChange={e=>setKyc({...kyc, address: e.target.value})} rows={2} className="mt-1.5" placeholder="House, Street, City, State, PIN"/>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-md mt-4">
                <ShieldCheck size={14} className="text-emerald-600"/> All data is encrypted. Only last-4 of Aadhaar / account is stored.
              </div>
              <Button data-testid="kyc-submit" onClick={submitKyc} disabled={loading} className="w-full mt-6 bg-[#1C3F8E] hover:bg-[#15306B] h-11">
                {loading ? "Verifying..." : "Verify KYC & Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === "choose" && (
          <Card className="border-slate-200">
            <CardContent className="p-8">
              <h1 className="font-heading text-3xl font-bold text-[#0A1128]">Connect your financial data</h1>
              <p className="text-slate-500 mt-2">No data is loaded yet. Choose how you&apos;d like to begin.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <label className="block">
                  <input type="file" accept=".csv" onChange={onCsvUpload} className="hidden" data-testid="onb-csv-input"/>
                  <div className="border-2 border-dashed border-slate-200 hover:border-[#1C3F8E] rounded-xl p-6 cursor-pointer transition-all">
                    <Upload size={28} className="text-[#1C3F8E] mb-3"/>
                    <div className="font-heading font-semibold text-[#0A1128]">Upload Statement</div>
                    <div className="text-xs text-slate-500 mt-1">CSV from your bank</div>
                  </div>
                </label>

                <button onClick={loadDemo} disabled={loading} data-testid="onb-use-demo" className="text-left border-2 border-dashed border-slate-200 hover:border-[#7A2C8E] rounded-xl p-6 cursor-pointer transition-all bg-white">
                  <Database size={28} className="text-[#7A2C8E] mb-3"/>
                  <div className="font-heading font-semibold text-[#0A1128]">Use Demo Dataset</div>
                  <div className="text-xs text-slate-500 mt-1">~75 realistic Indian txns to explore</div>
                </button>

                <button disabled className="text-left border-2 border-dashed border-slate-200 rounded-xl p-6 opacity-60 cursor-not-allowed">
                  <FileText size={28} className="text-slate-400 mb-3"/>
                  <div className="font-heading font-semibold text-slate-500">Connect Bank (soon)</div>
                  <div className="text-xs text-slate-400 mt-1">Account Aggregator coming</div>
                </button>
              </div>

              <div className="text-xs text-slate-500 mt-6 text-center">You can switch sources any time from Settings.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
