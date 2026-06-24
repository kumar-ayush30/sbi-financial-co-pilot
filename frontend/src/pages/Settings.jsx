import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { api, clearSession, getStoredUser, formatINR } from "@/lib/api";
import { toast } from "sonner";
import { User, Sliders, Database, ShieldCheck, Bell, Brain, Sun, AlertTriangle, Download, Trash2 } from "lucide-react";

const Section = ({ icon: Icon, title, children }) => (
  <Card className="border-stone-200 bg-stone-50/40">
    <CardContent className="p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-md bg-[#1C3F8E]/8 text-[#1C3F8E] flex items-center justify-center"><Icon size={18} strokeWidth={1.75}/></div>
        <div className="font-heading text-xl font-semibold text-[#1f2937]">{title}</div>
      </div>
      <div className="space-y-5">{children}</div>
    </CardContent>
  </Card>
);

const Row = ({ label, hint, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-stone-200 last:border-0">
    <div>
      <div className="text-sm font-medium text-[#1f2937]">{label}</div>
      {hint && <div className="text-xs text-stone-500 mt-0.5">{hint}</div>}
    </div>
    <div className="min-w-[200px] flex justify-end">{children}</div>
  </div>
);

export default function Settings() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState({});
  const [resetText, setResetText] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [prefs, setPrefs] = useState({ savings_alerts: true, investment_opp: true, monthly_reports: true, ai_freq: "weekly", health_monitor: true, smart_save: true, dark_mode: false, language: "en", currency: "INR" });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data);
        setProfile(data.profile || {});
      } catch (e) { console.error(e); }
    })();
  }, []);

  const saveProfile = async () => {
    try {
      await api.put("/auth/profile", {
        age: profile.age, monthly_income: profile.monthly_income,
        risk_tolerance: profile.risk_tolerance, financial_goal: profile.financial_goal,
        target_savings: profile.target_savings,
      });
      toast.success("Preferences saved");
    } catch (e) { toast.error("Save failed"); }
  };

  const exportData = async () => {
    try {
      const { data } = await api.get("/user/export-data");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `sbi-copilot-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (e) { toast.error("Export failed"); }
  };

  const doReset = async () => {
    if (resetText !== "RESET") return toast.error("Type RESET to confirm");
    try {
      await api.post("/user/reset-data");
      toast.success("All financial data deleted");
      setResetOpen(false); setResetText("");
      nav("/onboarding");
    } catch (e) { toast.error("Reset failed"); }
  };

  const doDeleteAccount = async () => {
    try {
      await api.delete("/user/account");
      clearSession();
      toast.success("Account deleted");
      nav("/");
    } catch (e) { toast.error("Delete failed"); }
  };

  if (!me) return <div className="text-stone-500 p-8">Loading settings…</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Account</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1f2937] mt-2">Settings</h1>
        <p className="text-stone-500 mt-1">Manage your profile, preferences, data and security.</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <Row label="Full name"><div className="text-sm text-stone-700">{me.user.full_name}</div></Row>
        <Row label="Email"><div className="text-sm text-stone-700">{me.user.email}</div></Row>
        <Row label="Phone"><div className="text-sm text-stone-700">+91 {me.user.phone}</div></Row>
        <Row label="KYC Status">
          {me.data_status.kyc_status === "verified"
            ? <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">VERIFIED</span>
            : <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">PENDING</span>}
        </Row>
      </Section>

      {/* Financial Preferences */}
      <Section icon={Sliders} title="Financial Preferences">
        <Row label="Age">
          <Input data-testid="set-age" type="number" value={profile.age || ""} onChange={e=>setProfile({...profile, age: parseInt(e.target.value)||null})} className="w-40"/>
        </Row>
        <Row label="Monthly income" hint="₹ INR">
          <Input data-testid="set-income" type="number" value={profile.monthly_income || ""} onChange={e=>setProfile({...profile, monthly_income: parseFloat(e.target.value)||0})} className="w-40"/>
        </Row>
        <Row label="Risk tolerance">
          <select data-testid="set-risk" value={profile.risk_tolerance || "medium"} onChange={e=>setProfile({...profile, risk_tolerance: e.target.value})} className="w-40 h-9 border border-stone-300 rounded-md px-3 text-sm bg-white">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Row>
        <Row label="Financial goal">
          <Input data-testid="set-goal" value={profile.financial_goal || ""} onChange={e=>setProfile({...profile, financial_goal: e.target.value})} className="w-64"/>
        </Row>
        <Row label="Target savings (₹)">
          <Input data-testid="set-target" type="number" value={profile.target_savings || ""} onChange={e=>setProfile({...profile, target_savings: parseFloat(e.target.value)||0})} className="w-40"/>
        </Row>
        <Button onClick={saveProfile} data-testid="save-prefs" className="bg-[#1C3F8E] hover:bg-[#15306B]">Save Preferences</Button>
      </Section>

      {/* Data Management */}
      <Section icon={Database} title="Data Management">
        <Row label="Current data source" hint={`${me.data_status.transaction_count} transactions loaded`}>
          <span className="text-xs px-2 py-1 rounded-full bg-[#1C3F8E]/10 text-[#1C3F8E] font-semibold uppercase">{me.data_status.data_source}</span>
        </Row>
        <Row label="Upload bank statement" hint="CSV format">
          <Button asChild variant="outline"><Link to="/onboarding" data-testid="set-upload-link">Upload</Link></Button>
        </Row>
        <Row label="Download your data" hint="JSON export of everything">
          <Button onClick={exportData} variant="outline" data-testid="set-export"><Download size={14}/> Export</Button>
        </Row>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <Row label="Savings alerts"><Switch checked={prefs.savings_alerts} onCheckedChange={v=>setPrefs({...prefs, savings_alerts: v})}/></Row>
        <Row label="Investment opportunities"><Switch checked={prefs.investment_opp} onCheckedChange={v=>setPrefs({...prefs, investment_opp: v})}/></Row>
        <Row label="Monthly reports"><Switch checked={prefs.monthly_reports} onCheckedChange={v=>setPrefs({...prefs, monthly_reports: v})}/></Row>
      </Section>

      {/* AI Preferences */}
      <Section icon={Brain} title="AI Preferences">
        <Row label="Recommendation frequency">
          <select value={prefs.ai_freq} onChange={e=>setPrefs({...prefs, ai_freq: e.target.value})} className="w-40 h-9 border border-stone-300 rounded-md px-3 text-sm bg-white">
            <option>daily</option><option>weekly</option><option>monthly</option>
          </select>
        </Row>
        <Row label="Financial health monitoring"><Switch checked={prefs.health_monitor} onCheckedChange={v=>setPrefs({...prefs, health_monitor: v})}/></Row>
        <Row label="Smart savings suggestions"><Switch checked={prefs.smart_save} onCheckedChange={v=>setPrefs({...prefs, smart_save: v})}/></Row>
      </Section>

      {/* System */}
      <Section icon={Sun} title="System">
        <Row label="Language">
          <select value={prefs.language} onChange={e=>setPrefs({...prefs, language: e.target.value})} className="w-40 h-9 border border-stone-300 rounded-md px-3 text-sm bg-white">
            <option value="en">English</option><option value="hi">हिंदी</option>
          </select>
        </Row>
        <Row label="Currency"><div className="text-sm text-stone-700 font-mono">₹ INR</div></Row>
      </Section>

      {/* Privacy & Security */}
      <Section icon={ShieldCheck} title="Privacy & Security">
        <Row label="Password" hint="Change is coming soon"><Button variant="outline" disabled>Change password</Button></Row>
        <Row label="Multi-factor authentication" hint="TOTP via authenticator app"><Switch disabled/></Row>
      </Section>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={18}/></div>
            <div className="font-heading text-xl font-semibold text-red-700">Danger Zone</div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-[#1f2937]">Reset all financial data</div>
                <div className="text-xs text-stone-500 mt-0.5">Removes transactions, insights, recommendations. Keeps your account.</div>
              </div>
              <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" data-testid="reset-data-button"><Trash2 size={14}/> Reset data</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="text-red-600">Confirm Data Reset</DialogTitle></DialogHeader>
                  <p className="text-sm text-stone-600">This action permanently removes all imported financial information. Your account and credentials are preserved.</p>
                  <div>
                    <Label>Type <span className="font-mono font-bold">RESET</span> to confirm</Label>
                    <Input data-testid="reset-confirm-input" value={resetText} onChange={e=>setResetText(e.target.value)} className="mt-1.5 font-mono"/>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={()=>setResetOpen(false)}>Cancel</Button>
                    <Button onClick={doReset} disabled={resetText !== "RESET"} data-testid="reset-confirm-button" className="bg-red-600 hover:bg-red-700">I understand, reset</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-red-200">
              <div>
                <div className="text-sm font-medium text-red-700">Delete account</div>
                <div className="text-xs text-stone-500 mt-0.5">Permanently removes your account and ALL data.</div>
              </div>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" data-testid="delete-account-button">Delete account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="text-red-600">Delete account permanently?</DialogTitle></DialogHeader>
                  <p className="text-sm text-stone-600">This cannot be undone. All your data will be permanently erased.</p>
                  <DialogFooter>
                    <Button variant="ghost" onClick={()=>setDeleteOpen(false)}>Cancel</Button>
                    <Button onClick={doDeleteAccount} data-testid="delete-account-confirm" className="bg-red-600 hover:bg-red-700">Yes, delete forever</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
