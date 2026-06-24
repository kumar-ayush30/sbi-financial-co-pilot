import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Server, Database, BarChart3, ShieldCheck, Target, Eye, Sparkles } from "lucide-react";

const tech = [
  { icon: Brain, label: "Multi-Agent AI" },
  { icon: Server, label: "FastAPI" },
  { icon: Database, label: "MongoDB" },
  { icon: BarChart3, label: "Recharts" },
  { icon: Sparkles, label: "Gemini 2.5 Flash" },
  { icon: ShieldCheck, label: "JWT + bcrypt" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center text-white font-bold font-heading">S</div>
            <div className="font-heading font-bold text-[#0A1128]">SBI Co-Pilot</div>
          </Link>
          <div className="flex gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/register"><Button className="bg-[#1C3F8E] hover:bg-[#15306B]">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">About</div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A1128] mt-3 tracking-tight">An AI co-pilot for every Indian&apos;s wallet.</h1>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <Target size={28} className="text-[#1C3F8E] mb-4"/>
            <h2 className="font-heading text-2xl font-semibold text-[#0A1128]">Mission</h2>
            <p className="text-slate-600 mt-3 leading-relaxed">Help users optimize spending, increase savings, and make better financial decisions through AI-driven insights tailored to Indian banking.</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <Eye size={28} className="text-[#7A2C8E] mb-4"/>
            <h2 className="font-heading text-2xl font-semibold text-[#0A1128]">Vision</h2>
            <p className="text-slate-600 mt-3 leading-relaxed">Become India&apos;s most trusted AI banking copilot — combining the credibility of SBI with the intelligence of modern AI.</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-heading text-2xl font-semibold text-[#0A1128]">Technology</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {tech.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-4">
                <Icon size={20} className="text-[#1C3F8E]"/>
                <span className="text-sm font-medium text-[#0A1128]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-br from-[#0A1128] to-[#1C3F8E] rounded-2xl p-10 text-white">
          <h2 className="font-heading text-2xl font-semibold">Ready to take control of your finances?</h2>
          <p className="text-white/70 mt-2">Join thousands optimising their money with AI.</p>
          <Link to="/register" className="inline-block mt-6"><Button className="bg-white text-[#1C3F8E] hover:bg-white/90 h-11 px-6">Start free</Button></Link>
        </div>
      </section>
    </div>
  );
}
