import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Coffee } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@cafe.com");
  const [password, setPassword] = useState("admin");
  const [show, setShow] = useState(false);
  const login = useStore((s) => s.login);
  const signup = useStore((s) => s.signup);
  const openSession = useStore((s) => s.openSession);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const u = login(email, password);
      if (!u) return toast.error("Invalid credentials");
      openSession();
      toast.success(`Welcome ${u.name}`);
      navigate({ to: "/pos" });
    } else {
      const u = signup(name, email, password);
      if (!u) return toast.error("Email already exists");
      openSession();
      toast.success(`Account created`);
      navigate({ to: "/pos" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Coffee className="w-8 h-8 text-amber-700" />
          <h1 className="text-2xl font-bold">Odoo Cafe POS</h1>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-center">
          {mode === "login" ? "Login" : "Sign Up"}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full">
            {mode === "login" ? "Login" : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center text-muted-foreground">
          {mode === "login" ? "Don't have account?" : "Already have account?"}{" "}
          <button
            className="text-primary font-medium underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign Up here" : "Login"}
          </button>
        </p>
        {mode === "login" && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Demo: admin@cafe.com / admin
          </p>
        )}
      </Card>
    </div>
  );
}
