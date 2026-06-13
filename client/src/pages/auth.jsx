import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Coffee, Shield, User } from "lucide-react";

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("admin@cafe.com");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((s) => s.login);
  const openSession = useStore((s) => s.openSession);
  const currentUserId = useStore((s) => s.currentUserId);
  const navigate = useNavigate();

  // Redirect to /pos if already logged in
  useEffect(() => {
    if (currentUserId) {
      navigate("/pos");
    }
  }, [currentUserId, navigate]);

  // Set page title for SEO
  useEffect(() => {
    document.title = "POS Login | Odoo Cafe";
  }, []);

  // Sync role selections to default demo credentials
  const selectRole = (role) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("admin@cafe.com");
      setPassword("admin");
    } else {
      setEmail("eric@cafe.com");
      setPassword("eric");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (!user) {
        toast.error("Invalid email or password");
        return;
      }
      await openSession();
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/pos");
    } catch {
      toast.error("Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF3E0] via-[#FDF8F0] to-[#F5E8CC] p-4 font-sans selection:bg-[#D4A373]/20">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white border border-[#6F4E37]/15 rounded-3xl relative overflow-hidden">
        {/* Coffee brown accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6F4E37] via-[#D4A373] to-[#6F4E37]" />

        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-7 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#6F4E37]/10 flex items-center justify-center mb-3.5 border border-[#6F4E37]/20">
            <Coffee className="w-6 h-6 text-[#6F4E37]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2B2118]">Odoo Café POS</h1>
          <p className="text-xs text-[#6F4E37]/60 font-medium mt-1">Point of Sale & Kitchen Management System</p>
        </div>

        {/* Role Quick Selector Tabs */}
        <div className="mb-6">
          <Label className="text-[10px] uppercase tracking-wider font-bold text-[#6F4E37]/60 block mb-2 text-center">
            Select Role to Auto-Fill
          </Label>
          <div className="grid grid-cols-2 gap-2 bg-[#FAF3E0] p-1.5 rounded-xl border border-[#6F4E37]/15">
            <button
              type="button"
              id="role-admin"
              onClick={() => selectRole("admin")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === "admin"
                  ? "bg-white text-zinc-800 border border-zinc-200 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-750"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#6F4E37]" />
              Admin
            </button>
            <button
              type="button"
              id="role-employee"
              onClick={() => selectRole("employee")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === "employee"
                  ? "bg-white text-zinc-800 border border-zinc-200 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-750"
              }`}
            >
              <User className="w-3.5 h-3.5 text-zinc-500" />
              Employee
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold text-zinc-650">Email Address</Label>
            <Input
              type="email"
              id="login-email"
              placeholder="name@cafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#FAF3E0] border-[#6F4E37]/20 rounded-xl focus:bg-white focus:border-[#6F4E37]/50 focus-visible:ring-0 text-[#2B2118]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-bold text-zinc-650">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="login-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#FAF3E0] border-[#6F4E37]/20 rounded-xl pr-10 focus:bg-white focus:border-[#6F4E37]/50 focus-visible:ring-0 text-[#2B2118]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F4E37]/60 hover:text-zinc-600 transition"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            id="login-submit"
            disabled={isLoading}
            className="w-full bg-[#6F4E37] hover:bg-[#6F4E37]/90 active:scale-[0.99] text-white font-extrabold py-5 rounded-xl transition-all shadow-md shadow-[#6F4E37]/20 mt-6 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login to Workspace"}
          </Button>
        </form>

        {/* Demo Information */}
        <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
          <p className="text-[10px] text-[#6F4E37]/60 leading-relaxed font-semibold uppercase tracking-wider">
            Demo Credentials
          </p>
          <div className="mt-2 text-xs text-[#2B2118]/60 font-medium grid grid-cols-2 gap-1 px-4">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@cafe.com");
                setPassword("admin");
                setSelectedRole("admin");
              }}
              className="bg-[#FAF3E0] py-1.5 px-2 rounded-lg border border-[#6F4E37]/15 text-left cursor-pointer hover:bg-[#6F4E37]/5 transition active:scale-[0.98]"
            >
              <span className="text-[#6F4E37] block text-[9px] uppercase font-bold">Admin</span>
              admin@cafe.com / admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("eric@cafe.com");
                setPassword("eric");
                setSelectedRole("employee");
              }}
              className="bg-[#FAF3E0] py-1.5 px-2 rounded-lg border border-[#6F4E37]/15 text-left cursor-pointer hover:bg-[#6F4E37]/5 transition active:scale-[0.98]"
            >
              <span className="text-[#6F4E37] block text-[9px] uppercase font-bold">Employee</span>
              eric@cafe.com / eric
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("emp1@cafe.com");
                setPassword("123qwe");
                setSelectedRole("employee");
              }}
              className="bg-[#FAF3E0] py-1.5 px-2 rounded-lg border border-[#6F4E37]/15 text-left cursor-pointer hover:bg-[#6F4E37]/5 transition active:scale-[0.98]"
            >
              <span className="text-[#6F4E37] block text-[9px] uppercase font-bold">Employee 1</span>
              emp1@cafe.com / 123qwe
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("emp2@cafe.com");
                setPassword("123qwe");
                setSelectedRole("employee");
              }}
              className="bg-[#FAF3E0] py-1.5 px-2 rounded-lg border border-[#6F4E37]/15 text-left cursor-pointer hover:bg-[#6F4E37]/5 transition active:scale-[0.98]"
            >
              <span className="text-[#6F4E37] block text-[9px] uppercase font-bold">Employee 2</span>
              emp2@cafe.com / 123qwe
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
