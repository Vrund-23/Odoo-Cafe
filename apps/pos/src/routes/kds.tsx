import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type KdsStage } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Search, X } from "lucide-react";

export const Route = createFileRoute("/kds")({ component: KDSPage });

const STAGES: { key: KdsStage | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ToCook", label: "To Cook" },
  { key: "Preparing", label: "Preparing" },
  { key: "Completed", label: "Completed" },
];

const NEXT: Record<KdsStage, KdsStage | null> = {
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
  const [tab, setTab] = useState<KdsStage | "all">("all");
  const [q, setQ] = useState("");
  const [prodFilter, setProdFilter] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState<string[]>([]);

  const counts: Record<string, number> = {
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

  const toggleArr = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Coffee className="w-6 h-6 text-amber-400" />
        <h1 className="font-bold text-lg">Kitchen Display</h1>
        <div className="flex gap-1 ml-4">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                tab === s.key ? "bg-amber-500 text-slate-900" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {s.label} {counts[s.key as string]}
            </button>
          ))}
        </div>
        <div className="ml-auto relative w-64">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search ticket #"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 bg-slate-800 border-slate-700"
          />
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 border-r border-slate-700 p-3 space-y-3 min-h-[calc(100vh-3.5rem)]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase text-slate-400">Product</h3>
              {prodFilter.length > 0 && (
                <button onClick={() => setProdFilter([])} className="text-xs text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFilter.includes(p.id)}
                    onChange={() => toggleArr(prodFilter, p.id, setProdFilter)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase text-slate-400">Category</h3>
              {catFilter.length > 0 && (
                <button onClick={() => setCatFilter([])} className="text-xs text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catFilter.includes(c.id)}
                    onChange={() => toggleArr(catFilter, c.id, setCatFilter)}
                  />
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((t) => {
            const stageColor =
              t.stage === "ToCook"
                ? "border-red-500"
                : t.stage === "Preparing"
                  ? "border-amber-500"
                  : "border-green-500";
            return (
              <Card
                key={t.id}
                className={`bg-slate-800 border-2 ${stageColor} p-3 cursor-pointer hover:bg-slate-750 text-white`}
                onClick={() => {
                  const nx = NEXT[t.stage];
                  if (nx) setStage(t.id, nx);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">#{t.orderNumber}</span>
                  <Badge variant="outline" className="text-white border-slate-500">{t.stage}</Badge>
                </div>
                <div className="space-y-1">
                  {t.items.map((i) => {
                    const p = products.find((x) => x.id === i.productId);
                    return (
                      <button
                        key={i.productId}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(t.id, i.productId);
                        }}
                        className={`block w-full text-left px-2 py-1 rounded hover:bg-slate-700 ${
                          i.done ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {i.qty} × {p?.name}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center text-slate-400 py-12">No tickets</div>
          )}
        </div>
      </div>
    </div>
  );
}
