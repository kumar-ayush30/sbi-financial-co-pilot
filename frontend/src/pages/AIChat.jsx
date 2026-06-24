import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Sparkles, Send, User } from "lucide-react";

const suggestions = [
  "How can I save more money each month?",
  "What's eating most of my budget?",
  "Should I invest in SBI mutual funds?",
  "How do I build a ₹5 lakh emergency fund?",
];

export default function AIChat() {
  const [messages, setMessages] = useState([{ id: "welcome", role: "assistant", text: "Hi! I'm your SBI Co-Pilot. Ask me anything about your finances — I have access to your transaction history and goals." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/ai/chat-history?limit=10");
        if (data.length) {
          const history = data.reverse().flatMap((h) => [
            { id: `q-${h.id}`, role: "user", text: h.question },
            { id: `a-${h.id}`, role: "assistant", text: h.answer },
          ]);
          setMessages(m => [m[0], ...history]);
        }
      } catch (e) { console.error("chat history load failed:", e); }
    })();
  }, []);

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question) return;
    setInput("");
    const ts = Date.now();
    setMessages(m => [...m, { id: `u-${ts}`, role: "user", text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { question });
      setMessages(m => [...m, { id: `a-${ts}`, role: "assistant", text: data.answer }]);
    } catch (e) {
      setMessages(m => [...m, { id: `e-${ts}`, role: "assistant", text: "Sorry, I hit a snag. Try again?" }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A2C8E]">AI</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0A1128] mt-2">Co-Pilot Chat</h1>
        <p className="text-slate-500 mt-1">Powered by Gemini — answers personalized using your transactions.</p>
      </div>

      <Card className="flex-1 border-slate-200 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`} data-testid={`msg-${i}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-[#1C3F8E]" : "bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E]"} text-white`}>
                  {m.role === "user" ? <User size={16}/> : <Sparkles size={16}/>}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-[#1C3F8E] text-white" : "bg-slate-100 text-[#0A1128]"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1C3F8E] to-[#7A2C8E] text-white"><Sparkles size={16}/></div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3"><div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}/>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}/>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}/>
                </div></div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {messages.length <= 1 && (
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={()=>send(s)} data-testid={`suggestion-${s.slice(0,10)}`} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">{s}</button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 p-4 flex gap-3">
            <Input
              data-testid="chat-input"
              placeholder="Ask about your finances…"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && send()}
              disabled={loading}
              className="flex-1"
            />
            <Button data-testid="chat-send-button" onClick={()=>send()} disabled={loading||!input.trim()} className="bg-[#1C3F8E] hover:bg-[#15306B]">
              <Send size={16}/>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
