import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Search, X } from "lucide-react";

export const Route = createFileRoute("/kds")({ component: KDSPage });

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

function KDSPage() {
  const tickets = useStore((s) => s.kds);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const setStage = useStore((s) => s.setKdsStage);
  const toggleItem = useStore((s) => s.toggleKdsItem);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [prodFilter, setProdFilter] = useState([]);
  const [catFilter, setCatFilter] = useState([]);

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
    <div className="min-h-screen bg-[#FAF3E0] text-white">
      <header className="border-b border-[#6F4E37]/30 px-4 py-3 flex items-center gap-3">
        <Coffee className="w-6 h-6 text-[#6F4E37]" />
        <h1 className="font-bold text-lg text-[#6F4E37] tracking-tight">Kitchen Display</h1>
        <div className="flex gap-1.5 ml-4">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                tab === s.key ? "bg-[#6F4E37] text-white" : "bg-white border border-[#6F4E37]/20 hover:bg-[#FAF3E0]"
              }`}
            >
              {s.label} <span className="ml-1 text-xs opacity-75">{counts[s.key]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search ticket #..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-[#FAF3E0] text-white border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 border-r border-[#6F4E37]/20 p-3 space-y-4 min-h-[calc(100vh-3.5rem)] bg-white">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/60">Product</h3>
              {prodFilter.length > 0 && (
                <button onClick={() => setProdFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#6F4E37]/80">
                  <input
                    type="checkbox"
                    checked={prodFilter.includes(p.id)}
                    onChange={() => toggleArr(prodFilter, p.id, setProdFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#C85D40]/30"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/60">Category</h3>
              {catFilter.length > 0 && (
                <button onClick={() => setCatFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#6F4E37]/80">
                  <input
                    type="checkbox"
                    checked={catFilter.includes(c.id)}
                    onChange={() => toggleArr(catFilter, c.id, setCatFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#C85D40]/30"
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
                className={`bg-white border-2 ${stageColor} p-3 hover:bg-[#FAF3E0]/40 transition duration-200 cursor-pointer text-white rounded-3xl flex flex-col justify-between`}
                onClick={() => {
                  const nx = NEXT[t.stage];
                  if (nx) setStage(t.id, nx);
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-[#6F4E37]/15 pb-2">
                    <span className="font-extrabold text-lg text-white">#{t.orderNumber}</span>
                    <Badge variant="outline" className="text-[#6F4E37]/80 border-zinc-700 bg-[#FAF3E0]">
                      {t.stage}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {t.items.map((i) => {
                      const p = products.find((x) => x.id === i.productId);
                      return (
                        <button
                          key={i.productId}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(t.id, i.productId);
                          }}
                          className={`block w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#FAF3E0] transition ${
                            i.done ? "line-through text-zinc-500 bg-[#FAF3E0]/20" : "text-zinc-200"
                          }`}
                        >
                          <span className="font-extrabold text-[#6F4E37] mr-2.5">
                            {i.qty}×
                          </span>
                          {p?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {NEXT[t.stage] && (
                  <div className="mt-4 pt-2 border-t border-[#6F4E37]/10 text-center text-xs text-zinc-500 font-bold">
                    Click card to progress to {NEXT[t.stage]}
                  </div>
                )}
              </Card>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center text-zinc-500 font-semibold py-12">
              No active tickets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
