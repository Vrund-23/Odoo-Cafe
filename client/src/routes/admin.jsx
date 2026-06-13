import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const userId = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === userId));

  useEffect(() => {
    if (userId && user && user.role !== "User") {
      toast.error("Access denied: Admin role required");
    }
  }, [userId, user]);

  if (!userId) return <Navigate to="/auth" />;
  if (user && user.role !== "User") return <Navigate to="/pos" />;

  return <Outlet />;
}
