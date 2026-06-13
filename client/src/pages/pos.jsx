import { Outlet, Navigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PosHeader } from "@/components/PosHeader";

export default function PosLayout() {
  const userId = useStore((s) => s.currentUserId);

  if (!userId) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF3E0] text-[#6F4E37] select-none" style={{ fontFamily: '"Inter", sans-serif' }}>
      <PosHeader />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
