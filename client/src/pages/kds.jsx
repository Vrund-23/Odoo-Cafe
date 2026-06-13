import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coffee, Search, X, Clock } from "lucide-react";

const TicketTimer = ({ createdAt, stage }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stage === 'Completed') return;
    
    const calculateElapsed = () => Math.floor((Date.now() - createdAt) / 1000);
    setElapsed(calculateElapsed());
    
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [createdAt, stage]);

  if (stage === 'Completed') {
    return <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Done</span>;
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const color = mins >= 15 ? 'text-rose-500' : mins >= 10 ? 'text-amber-500' : 'text-[#6F4E37]/80';

  return (
    <span className={`text-[11px] font-bold flex items-center gap-1 ${color}`}>
      <Clock className="w-3 h-3" />
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
};

const STAGES = [
  { key: "all", label: "All" },
  { key: "ToCook", label: "To Cook" },
  { key: "Preparing", label: "Preparing" },
  { key: "Completed", label: "Completed" },
];

const NEXT = {
  ToCook: "Preparing",
  Preparing: "Completed",
  Completed: null,
};

export default function KDSPage() {
  const tickets = useStore((s) => s.kds);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const setStage = useStore((s) => s.setKdsStage);
  const toggleItem = useStore((s) => s.toggleKdsItem);
  const fetchKds = useStore((s) => s.fetchKds);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [prodFilter, setProdFilter] = useState([]);
  const [catFilter, setCatFilter] = useState([]);

  useEffect(() => {
    fetchKds(); // Initial fetch

    const interval = setInterval(() => {
      fetchKds();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [fetchKds]);

  const counts = {
    all: tickets.length,
    ToCook: tickets.filter((t) => t.stage === "ToCook").length,
    Preparing: tickets.filter((t) => t.stage === "Preparing").length,
    Completed: tickets.filter((t) => t.stage === "Completed").length,
  };

  let filtered = tab === "all" ? tickets : tickets.filter((t) => t.stage === tab);
  if (q) filtered = filtered.filter((t) => t.orderNumber.includes(q));
  if (prodFilter.length)
    filtered = filtered.filter((t) => t.items.some((i) => prodFilter.includes(i.productId)));
  if (catFilter.length)
    filtered = filtered.filter((t) =>
      t.items.some((i) => {
        const p = products.find((p) => p.id === i.productId);
        return p && catFilter.includes(p.categoryId);
      }),
    );

  const toggleArr = (arr, v, set) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#2B2118]">
      <header className="border-b border-[#6F4E37]/30 px-6 py-5 flex items-center gap-6 bg-white shadow-sm">
        <Link
          to="/pos"
          className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer bg-[#6F4E37] text-white hover:bg-[#6F4E37]/90 active:scale-[0.98] shadow-md shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to POS</span>
        </Link>
        
        <div className="flex items-center gap-2 shrink-0">
          <Coffee className="w-7 h-7 text-[#6F4E37]" />
          <h1 className="font-extrabold text-2xl text-[#2B2118] tracking-tight">Kitchen Display</h1>
        </div>

        <div className="flex gap-2 ml-4 bg-[#FAF3E0] p-1.5 rounded-2xl shrink-0">
          {STAGES.map((s) => {
            const isSelected = tab === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setTab(s.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-[#6F4E37] shadow-sm ring-1 ring-black/5"
                    : "text-[#6F4E37]/70 hover:text-[#6F4E37] hover:bg-white/50"
                }`}
              >
                {s.label}
                <span 
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected ? "bg-[#6F4E37]/10 text-[#6F4E37]" : "bg-[#6F4E37]/5 text-[#6F4E37]/60"
                  }`}
                >
                  {counts[s.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto relative w-80 shrink-0">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search ticket #..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11 pr-4 py-6 bg-zinc-50 border-[#6F4E37]/20 focus:bg-white focus:border-[#6F4E37]/50 text-[#2B2118] rounded-2xl text-base shadow-inner"
          />
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 border-r border-[#6F4E37]/20 p-3 space-y-4 min-h-[calc(100vh-3.5rem)] bg-white text-[#2B2118]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/80">Product</h3>
              {prodFilter.length > 0 && (
                <button onClick={() => setProdFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-[#6F4E37] cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer text-[#2B2118]/80 hover:text-[#6F4E37] font-medium">
                  <input
                    type="checkbox"
                    checked={prodFilter.includes(p.id)}
                    onChange={() => toggleArr(prodFilter, p.id, setProdFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#6F4E37]/30"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/80">Category</h3>
              {catFilter.length > 0 && (
                <button onClick={() => setCatFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-[#6F4E37] cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer text-[#2B2118]/80 hover:text-[#6F4E37] font-medium">
                  <input
                    type="checkbox"
                    checked={catFilter.includes(c.id)}
                    onChange={() => toggleArr(catFilter, c.id, setCatFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#6F4E37]/30"
                  />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#FAF3E0]">
          {filtered.map((t) => {
            const stageColor =
              t.stage === "ToCook"
                ? "border-rose-500/50"
                : t.stage === "Preparing"
                  ? "border-[#6F4E37]/50"
                  : "border-emerald-500/50";
            return (
              <Card
                key={t.id}
                className={`h-[320px] bg-white border-2 ${stageColor} p-3.5 hover:shadow-md transition duration-200 cursor-pointer rounded-3xl flex flex-col`}
                onClick={() => {
                  const nx = NEXT[t.stage];
                  if (nx) setStage(t.id, nx);
                }}
              >
                <div className="flex items-center justify-between mb-3 border-b border-[#6F4E37]/15 pb-2 shrink-0">
                  <div>
                    <span className="font-extrabold text-lg text-[#2B2118]">#{t.orderNumber}</span>
                    <div className="mt-0.5"><TicketTimer createdAt={t.createdAt} stage={t.stage} /></div>
                  </div>
                  <Badge variant="outline" className="text-[#6F4E37] border-[#6F4E37]/20 bg-[#FAF3E0] font-bold">
                    {t.stage}
                  </Badge>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {t.items.map((i) => {
                      const p = products.find((x) => x.id === i.productId);
                      return (
                        <button
                          key={i.productId}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(t.id, i.productId);
                          }}
                          className={`block w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#FAF3E0]/50 transition ${
                            i.done ? "line-through text-zinc-400 bg-zinc-50" : "text-[#2B2118] font-semibold bg-zinc-50/50"
                          }`}
                        >
                          <span className="font-extrabold text-[#6F4E37] mr-2">
                            {i.qty}×
                          </span>
                          {p?.name}
                        </button>
                      );
                    })}
                  </div>
                {NEXT[t.stage] && (
                  <div className="mt-3 pt-2 border-t border-[#6F4E37]/10 text-center text-xs text-zinc-500 font-bold shrink-0">
                    Click card to progress to {NEXT[t.stage]}
                  </div>
                )}
              </Card>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center text-[#6F4E37]/60 font-semibold py-12">
              No active tickets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

