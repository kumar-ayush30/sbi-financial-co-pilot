import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, HeartPulse, Sparkles, TrendingUp, BadgePercent, BarChart3, LogOut, ChevronRight } from "lucide-react";
import { clearSession, getStoredUser } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { to: "/transactions", label: "Transactions", icon: Receipt, id: "nav-transactions" },
  { to: "/health", label: "Financial Health", icon: HeartPulse, id: "nav-health" },
  { to: "/ai-chat", label: "AI Co-Pilot", icon: Sparkles, id: "nav-chat" },
  { to: "/wealth", label: "Wealth Simulator", icon: TrendingUp, id: "nav-wealth" },
  { to: "/recommendations", label: "Recommendations", icon: BadgePercent, id: "nav-recos" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, id: "nav-analytics" },
];

export default function AppLayout() {
  const nav_go = useNavigate();
  const user = getStoredUser();
  const initials = (user?.full_name || "U").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  const logout = () => { clearSession(); nav_go("/login"); };

  return (
    <div className="min-h-screen flex bg-[#F4F6F9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A1128] text-white/85 flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] flex items-center justify-center font-bold font-heading">S</div>
            <div>
              <div className="font-heading font-bold text-white tracking-tight">SBI Co-Pilot</div>
              <div className="text-xs text-white/50 uppercase tracking-widest">Financial AI</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, id }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={id}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-[#1C3F8E]/50 text-white border-l-4 border-[#7A2C8E] pl-2"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="w-9 h-9 rounded-full bg-[#7A2C8E] flex items-center justify-center text-white font-semibold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate" data-testid="user-name">{user?.full_name || "User"}</div>
              <div className="text-xs text-white/50 truncate">{user?.email}</div>
            </div>
            <button onClick={logout} data-testid="logout-button" className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-64 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
