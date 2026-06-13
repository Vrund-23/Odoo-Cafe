import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PosHeader } from "@/components/PosHeader";

export const Route = createFileRoute("/pos")({ component: PosLayout });

function PosLayout() {
  const userId = useStore((s) => s.currentUserId);
  if (!userId) return <Navigate to="/auth" />;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PosHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
