"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, AlertCircle, LogOut, Loader2, ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const PLACEHOLDERS = [
  "89 food d",
  "10000 salary c",
  "500 petrol d 22/06",
  "1200 car service d",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [summaryType, setSummaryType] = useState<"today" | "last7Days" | "currentMonth">("today");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const summaryOptions = [
    { id: "today", label: "Today's Summary" },
    { id: "last7Days", label: "Last 7 Days Summary" },
    { id: "currentMonth", label: "Current Month Summary" }
  ];
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      } else {
        setHistory({ user: data.user });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSaving(true);
    setSuccessData(null);
    setErrorData(null);

    try {
      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessData(data);
        setInput("");
        fetchHistory(); // Refresh summary and history
      } else {
        setErrorData(data.error || "Unable to save transaction. Please try again.");
      }
    } catch (err) {
      setErrorData("Unable to save transaction. Please try again.");
    } finally {
      setIsSaving(false);
      // keep focus for next entry
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const groupedTx = history?.recent?.reduce((acc: any, tx: any) => {
    const date = new Date(tx.date);
    const dateStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {history?.user ? `Hi, ${history.user.charAt(0).toUpperCase() + history.user.slice(1)}! 👋` : 'Expense Tracker'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quick expense capture and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full glass-card hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </header>

      {/* Entry Card */}
      <div className="glass-card rounded-3xl p-6 mb-8 relative overflow-hidden shadow-xl shadow-emerald-500/10 dark:shadow-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              className="w-full glass-input rounded-2xl px-6 py-5 text-xl font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500/70 transition-all focus:ring-2 focus:ring-emerald-500/50"
              disabled={isSaving}
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={isSaving || !input.trim()}
            className="w-full glass-button rounded-2xl py-4 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSaving ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {/* Error Message */}
        {errorData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 rounded-2xl p-5 mb-8 flex gap-4"
          >
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="text-red-800 dark:text-red-200">
              <p className="font-semibold mb-1">Invalid Input</p>
              <pre className="text-sm whitespace-pre-wrap font-sans">{errorData}</pre>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {successData && !errorData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 mb-8"
          >
            <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Saved Successfully!</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-emerald-900/80 dark:text-emerald-100/80 mb-4">
              <div className="text-slate-500 dark:text-slate-400">Amount:</div>
              <div className="font-medium text-slate-900 dark:text-white">₹{successData.transaction.amount}</div>
              
              <div className="text-slate-500 dark:text-slate-400">Notes:</div>
              <div className="font-medium text-slate-900 dark:text-white capitalize">{successData.transaction.notes}</div>
              
              <div className="text-slate-500 dark:text-slate-400">Category:</div>
              <div className="font-medium text-slate-900 dark:text-white">{successData.transaction.category}</div>
              
              <div className="text-slate-500 dark:text-slate-400">Type:</div>
              <div className="font-medium text-slate-900 dark:text-white">{successData.transaction.type}</div>
              
              <div className="text-slate-500 dark:text-slate-400">Date:</div>
              <div className="font-medium text-slate-900 dark:text-white">{successData.transaction.date}</div>
            </div>
            <div className="pt-3 border-t border-emerald-200 dark:border-emerald-500/20 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Saved To: </span>
              <span className="font-medium text-emerald-700 dark:text-emerald-300">{successData.sheetName}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Widget */}
      {history?.summary && (
        <div className="glass-card rounded-3xl p-6 mb-8 border border-slate-200 dark:border-white/5">
          <div className="mb-6 relative inline-block z-10">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 glass-card px-4 py-2.5 rounded-xl border border-white/40 dark:border-white/10 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-white/5 uppercase tracking-wider"
            >
              {summaryOptions.find(o => o.id === summaryType)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400'}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 mt-2 w-64 glass-card rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70"
                >
                  <div className="p-1.5 flex flex-col gap-1">
                    {summaryOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSummaryType(option.id as any);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all uppercase tracking-wider ${
                          summaryType === option.id 
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Income
              </div>
              <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">₹{history.summary[summaryType]?.income || 0}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-red-600 dark:text-red-400" /> Expense
              </div>
              <div className="text-xl font-semibold text-red-600 dark:text-red-400">₹{history.summary[summaryType]?.expense || 0}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Net</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">₹{history.summary[summaryType]?.net || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Transactions</h2>
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600/50 dark:text-emerald-500/50" />
          </div>
        ) : Object.keys(groupedTx).length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8 glass-card rounded-2xl">No recent transactions.</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTx).map(([dateStr, txs]: [string, any]) => (
              <div key={dateStr}>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 ml-2">{dateStr}</h3>
                <div className="space-y-3">
                  {txs.map((tx: any, i: number) => (
                    <div key={i} className="glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Credit' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300'}`}>
                          {tx.type === 'Credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white capitalize">{tx.notes}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{tx.category}</div>
                        </div>
                      </div>
                      <div className={`font-semibold ${tx.type === 'Credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {tx.type === 'Credit' ? '+' : ''}₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
