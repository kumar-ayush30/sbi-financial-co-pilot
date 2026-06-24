import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import FinancialHealth from "@/pages/FinancialHealth";
import AIChat from "@/pages/AIChat";
import WealthSimulator from "@/pages/WealthSimulator";
import Recommendations from "@/pages/Recommendations";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import About from "@/pages/About";

const isAuthed = () => !!localStorage.getItem("sbi_access_token");

const Protected = ({ children }) => {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
};

function App() {
  useEffect(() => { document.title = "SBI Financial Co-Pilot"; }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/health" element={<FinancialHealth />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/wealth" element={<WealthSimulator />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
