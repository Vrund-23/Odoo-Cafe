import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const userId = useStore((s) => s.currentUserId);
  if (!userId) return <Navigate to="/auth" />;
  return <Outlet />;
}
