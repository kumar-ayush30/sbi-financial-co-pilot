import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { api, setSession } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data);
      toast.success("Welcome back!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex">
      <div className="hidden md:flex md:w-1/2 relative bg-[#0A1128] text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1565373679107-344d38dbf734?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBiYW5raW5nJTIwcHJvZmVzc2lvbmFsJTIwaW5kaWFufGVufDB8fHx8MTc4MjI1OTI1Nnww&ixlib=rb-4.1.0&q=85)', backgroundSize: "cover" }} />
        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center font-bold font-heading">S</div>
            <div className="font-heading font-bold tracking-tight">SBI Co-Pilot</div>
          </Link>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-heading text-3xl font-semibold">Welcome to smarter banking.</h2>
          <p className="mt-3 text-white/70">Your AI financial partner — analyze, recommend, simulate. All from one secure dashboard.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/60"><ShieldCheck size={16}/> Bank-grade encrypted login</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-slate-200">
          <CardContent className="p-8">
            <h1 className="font-heading text-2xl font-semibold text-[#0A1128]">Sign in</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to continue</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" data-testid="login-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1.5" autoFocus />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" data-testid="login-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1.5" />
              </div>
              <Button type="submit" disabled={loading} data-testid="login-submit-button" className="w-full bg-[#1C3F8E] hover:bg-[#15306B] h-11">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="text-sm text-slate-600 mt-6 text-center">
              New here? <Link to="/register" data-testid="link-to-register" className="text-[#1C3F8E] font-medium hover:underline">Create account</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
