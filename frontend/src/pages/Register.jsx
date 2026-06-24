import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { api, setSession } from "@/lib/api";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState(1); // 1=details, 2=otp, 3=kyc
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    age: 28, monthly_income: 65000, risk_tolerance: "medium",
    financial_goal: "Build emergency fund",
    pan: "", aadhaar_last4: "", sbi_account_last4: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sendOtp = async () => {
    if (!form.phone || form.phone.length < 10) return toast.error("Enter a valid phone number");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/send", { phone: form.phone });
      setOtpSent(true);
      toast.success(`OTP sent. Demo OTP: ${data.demo_otp} (or use 123456)`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "OTP send failed");
    }
    setLoading(false);
  };

  const verifyAndContinue = async () => {
    setLoading(true);
    try {
      await api.post("/auth/otp/verify", { phone: form.phone, otp });
      toast.success("Phone verified");
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
  };

  const finalSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setSession(data);
      toast.success("Account created! Let's verify your KYC…");
      nav("/onboarding");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-slate-200">
        <CardContent className="p-8">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center text-white font-bold font-heading">S</div>
            <div className="font-heading font-bold text-[#0A1128]">SBI Co-Pilot</div>
          </Link>

          <div className="flex items-center gap-2 mb-6">
            {[1,2,3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${step>=s ? 'bg-[#1C3F8E]' : 'bg-slate-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0A1128]">Create your account</h1>
              <p className="text-sm text-slate-500">Step 1 of 3 — Basic details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input data-testid="reg-fullname" value={form.full_name} onChange={e=>set("full_name", e.target.value)} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input data-testid="reg-email" type="email" value={form.email} onChange={e=>set("email", e.target.value)} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Phone (10 digits)</Label>
                  <Input data-testid="reg-phone" value={form.phone} onChange={e=>set("phone", e.target.value.replace(/\D/g,""))} maxLength={10} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Password (8+, with digit & uppercase)</Label>
                  <Input data-testid="reg-password" type="password" value={form.password} onChange={e=>set("password", e.target.value)} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Age</Label>
                  <Input data-testid="reg-age" type="number" value={form.age} onChange={e=>set("age", parseInt(e.target.value)||0)} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Monthly income (₹)</Label>
                  <Input data-testid="reg-income" type="number" value={form.monthly_income} onChange={e=>set("monthly_income", parseFloat(e.target.value)||0)} className="mt-1.5"/>
                </div>
                <div>
                  <Label>Risk tolerance</Label>
                  <Select value={form.risk_tolerance} onValueChange={v=>set("risk_tolerance", v)}>
                    <SelectTrigger data-testid="reg-risk" className="mt-1.5"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low — Capital preservation</SelectItem>
                      <SelectItem value="medium">Medium — Balanced</SelectItem>
                      <SelectItem value="high">High — Aggressive growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Financial goal</Label>
                  <Input data-testid="reg-goal" value={form.financial_goal} onChange={e=>set("financial_goal", e.target.value)} className="mt-1.5"/>
                </div>
              </div>
              <Button data-testid="reg-step1-continue" onClick={()=>{
                if(!form.full_name||!form.email||!form.phone||!form.password) return toast.error("Fill all required fields");
                setStep(2);
              }} className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">Continue</Button>
              <div className="text-sm text-center text-slate-600">Already have an account? <Link to="/login" className="text-[#1C3F8E] font-medium hover:underline">Sign in</Link></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0A1128]">Verify your phone</h1>
              <p className="text-sm text-slate-500">Step 2 of 3 — We&apos;ll send a 6-digit OTP to <span className="font-medium">+91 {form.phone}</span></p>
              {!otpSent ? (
                <Button data-testid="reg-send-otp" onClick={sendOtp} disabled={loading} className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">Send OTP</Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="reg-otp-input">
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i}/>)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="text-xs text-slate-500 text-center">Demo: any code shown in the toast above, or <strong>123456</strong></div>
                  <Button data-testid="reg-verify-otp" onClick={verifyAndContinue} disabled={loading||otp.length<6} className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">Verify & Continue</Button>
                </div>
              )}
              <Button variant="ghost" onClick={()=>setStep(1)} className="w-full">Back</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0A1128]">KYC details (optional)</h1>
              <p className="text-sm text-slate-500">Step 3 of 3 — Help us personalize SBI product recommendations.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>PAN (10 chars)</Label>
                  <Input data-testid="reg-pan" value={form.pan} maxLength={10} onChange={e=>set("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="mt-1.5"/>
                </div>
                <div>
                  <Label>Aadhaar (last 4)</Label>
                  <Input data-testid="reg-aadhaar" value={form.aadhaar_last4} maxLength={4} onChange={e=>set("aadhaar_last4", e.target.value.replace(/\D/g,""))} className="mt-1.5"/>
                </div>
                <div className="sm:col-span-2">
                  <Label>SBI account number (last 4)</Label>
                  <Input data-testid="reg-sbi" value={form.sbi_account_last4} maxLength={4} onChange={e=>set("sbi_account_last4", e.target.value.replace(/\D/g,""))} className="mt-1.5"/>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-md">
                <ShieldCheck size={14} className="text-[#10B981]"/> All sensitive data is encrypted. We only store last-4 of Aadhaar / account.
              </div>
              <Button data-testid="reg-finish" onClick={finalSubmit} disabled={loading} className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">
                {loading ? "Creating account..." : "Create account & see my dashboard"}
              </Button>
              <Button variant="ghost" onClick={()=>setStep(2)} className="w-full">Back</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
