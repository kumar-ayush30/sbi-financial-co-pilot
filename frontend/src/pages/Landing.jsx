import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, TrendingUp, BarChart3, Brain, Lock } from "lucide-react";

const features = [
  { icon: Brain, title: "Multi-Agent AI", desc: "Expense Detective, Cost-Cutting Advisor & SBI Product Recommender powered by Gemini." },
  { icon: TrendingUp, title: "Wealth Simulator", desc: "Project 1Y / 3Y / 5Y / 10Y SIP growth instantly." },
  { icon: BarChart3, title: "Smart Analytics", desc: "Spending breakdowns, savings trends, category insights." },
  { icon: ShieldCheck, title: "Bank-Grade Security", desc: "JWT auth, bcrypt, rate-limited APIs, audit logs." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center text-white font-bold font-heading">S</div>
            <div className="font-heading font-bold text-[#0A1128] tracking-tight">SBI Financial Co-Pilot</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" data-testid="header-login-button">Login</Button></Link>
            <Link to="/register"><Button className="bg-[#1C3F8E] hover:bg-[#15306B]" data-testid="header-register-button">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128] via-[#1C3F8E] to-[#7A2C8E]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1565373679107-344d38dbf734?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBiYW5raW5nJTIwcHJvZmVzc2lvbmFsJTIwaW5kaWFufGVufDB8fHx8MTc4MjI1OTI1Nnww&ixlib=rb-4.1.0&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-xs font-medium uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Powered by Gemini AI
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Your personal banking AI.<br />
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Smarter money, every day.</span>
            </h1>
            <p className="text-lg text-white/80 mt-6 max-w-2xl">
              Analyze transactions, detect spending leaks, build wealth with SBI products, and simulate your financial future — all in one intelligent dashboard.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link to="/register">
                <Button size="lg" className="bg-white text-[#1C3F8E] hover:bg-white/90 h-12 px-8 font-medium" data-testid="hero-cta-register">
                  Start Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/40 text-white bg-transparent hover:bg-white/10 h-12 px-8" data-testid="hero-cta-login">
                  I have an account
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-white/70 text-sm">
              <div className="flex items-center gap-2"><Lock size={16}/> Bank-grade security</div>
              <div className="flex items-center gap-2"><ShieldCheck size={16}/> JWT + bcrypt</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">Capabilities</div>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-[#0A1128] mt-3">Built like a private banker, priced for everyone.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} data-testid={`feature-card-${i}`} className="bg-white rounded-xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-lg bg-[#1C3F8E]/10 text-[#1C3F8E] flex items-center justify-center mb-4">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div className="font-heading font-semibold text-[#0A1128] text-lg">{title}</div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap justify-between gap-4">
          <div>© 2026 SBI Financial Co-Pilot. Built with Emergent.</div>
          <div className="flex gap-6">
            <span>Privacy</span><span>Security</span><span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
