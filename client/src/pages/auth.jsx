import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye, EyeOff, Coffee, Shield, User,
  Receipt, BarChart2, Users,
} from "lucide-react";

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("admin1@odoocafe.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useStore((s) => s.login);
  const openSession = useStore((s) => s.openSession);
  const currentUserId = useStore((s) => s.currentUserId);
  const currentUser = useStore((s) => s.users?.find((u) => u.id === currentUserId));
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "POS Login | Odoo Cafe";
  }, []);

  const selectRole = (role) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("admin1@odoocafe.com");
      setPassword("password123");
    } else {
      setEmail("emp1@odoocafe.com");
      setPassword("password123");
    }
  };

  const fillDemo = (e, p, role) => {
    setEmail(e);
    setPassword(p);
    setSelectedRole(role);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
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

  const features = [
    {
      icon: <Receipt className="w-4 h-4 text-[#FAF3E0]" />,
      title: "Smart ordering",
      desc: "Fast order processing with kitchen sync",
    },
    {
      icon: <BarChart2 className="w-4 h-4 text-[#FAF3E0]" />,
      title: "Live analytics",
      desc: "Real-time sales & inventory tracking",
    },
    {
      icon: <Users className="w-4 h-4 text-[#FAF3E0]" />,
      title: "Team management",
      desc: "Role-based access for staff & admins",
    },
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: '"Inter", sans-serif' }}>

      {/* ── Left brand panel (60%) ── */}
      <div className="hidden lg:flex lg:w-[60%] flex-col items-center justify-center px-12 py-8 bg-[#6F4E37] relative overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FAF3E0]/15 blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Logo mark */}
          <div className="w-24 h-24 bg-[#FAF3E0]/10 border border-[#FAF3E0]/20 flex items-center justify-center mx-auto mb-6">
            <Coffee className="w-12 h-12 text-[#FAF3E0]" />
          </div>

          {/* Brand name */}
          <h1 className="text-7xl font-extrabold text-[#FAF3E0] tracking-tight leading-none mb-3">
            Odoo Café
          </h1>
          <p className="text-sm text-[#FAF3E0]/70 tracking-[4px] uppercase font-bold mb-8">
            Point of Sale
          </p>

          {/* Decorative divider */}
          <div className="w-16 h-[2px] bg-[#FAF3E0]/40 mx-auto mb-8" />

          {/* Feature list */}
          <div className="flex flex-col gap-3 text-left max-w-sm mx-auto">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 px-5 py-3 bg-white/5 border border-[#FAF3E0]/20"
              >
                <span className="mt-1 flex-shrink-0 scale-110">{icon}</span>
                <div>
                  <p className="text-[15px] font-bold text-[#FAF3E0] mb-0.5">{title}</p>
                  <p className="text-[12px] text-[#FAF3E0]/60 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel (40%) ── */}
      <div className="w-full lg:w-[40%] flex-shrink-0 bg-white flex items-center justify-center p-8 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] relative z-20">
        <div className="w-full max-w-[380px]">

          {/* Header */}
          <div className="mb-6">
            {/* Show logo on mobile (left panel is hidden) */}
            <div className="flex items-center gap-2.5 mb-4 lg:hidden">
              <div className="w-10 h-10 bg-[#6F4E37]/10 border border-[#6F4E37]/20 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-[#6F4E37]" />
              </div>
              <span className="text-xl font-bold text-[#2B2118]">Odoo Café POS</span>
            </div>
            <h2 className="text-2xl font-bold text-[#6F4E37] tracking-tight">Welcome back</h2>
            <p className="text-[13px] font-medium text-[#6F4E37]/80 mt-1">Sign in to your workspace to continue</p>
          </div>

          {/* Role selector */}
          <p className="text-[10px] uppercase tracking-[2px] font-bold text-[#8B6347]/70 mb-2">
            Select role
          </p>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF3E0]/50 border border-[#6F4E37]/10 mb-6">
            {[
              { key: "admin", label: "Admin", Icon: Shield },
              { key: "employee", label: "Employee", Icon: User },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectRole(key)}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === key
                    ? "bg-white text-[#6F4E37] border border-[#6F4E37]/20 shadow-sm"
                    : "text-[#8B6347] hover:bg-[#6F4E37]/5 hover:text-[#4A3B2F] border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedRole === key && key === "admin" ? "text-[#6F4E37]" : ""}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-[11px] font-bold text-[#4A3B2F] uppercase tracking-wider">
                Email address
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="name@cafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#FAF3E0]/30 h-10 px-3 border-[#6F4E37]/20 rounded-none focus:bg-white focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] text-[13px] font-medium text-[#6F4E37] placeholder:text-[#A89481] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-[11px] font-bold text-[#4A3B2F] uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#FAF3E0]/30 h-10 px-3 pr-10 border-[#6F4E37]/20 rounded-none focus:bg-white focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] text-[13px] font-medium text-[#6F4E37] placeholder:text-[#A89481] transition-all"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6347] hover:text-[#6F4E37] transition-colors p-1"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Continue as current user */}
            {currentUserId && currentUser && (
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() => navigate("/pos")}
                  variant="outline"
                  className="w-full h-10 border-[#6F4E37]/25 text-[#6F4E37] hover:bg-[#FAF3E0]/50 hover:border-[#6F4E37]/50 text-[13px] font-bold rounded-none cursor-pointer transition-all shadow-sm"
                >
                  Continue as {currentUser.name}
                </Button>
                <div className="relative flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#6F4E37]/15" />
                  <span className="text-[9px] text-[#8B6347] uppercase tracking-[1.5px] font-bold bg-white px-2">
                    or switch account
                  </span>
                  <div className="flex-1 h-px bg-[#6F4E37]/15" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              id="login-submit"
              disabled={isLoading}
              className={`w-full bg-[#6F4E37] hover:bg-[#6F4E37]/90 active:scale-[0.99] text-white text-[13px] font-bold h-10 rounded-none transition-all cursor-pointer disabled:opacity-60 ${!currentUserId && !currentUser ? "mt-6" : ""}`}
            >
              {isLoading
                ? "Signing in…"
                : currentUserId
                ? "Switch account"
                : "Sign in to workspace"}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#6F4E37]/15" />
              <span className="text-[9px] text-[#8B6347]/60 uppercase tracking-[1.5px] font-bold">
                Demo accounts
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#6F4E37]/15" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "Admin 1",    label: "admin1",     email: "admin1@odoocafe.com", password: "password123", roleKey: "admin" },
                { role: "Admin 2",    label: "admin2",     email: "admin2@odoocafe.com", password: "password123", roleKey: "admin" },
                { role: "Employee 1", label: "employee-1", email: "emp1@odoocafe.com",   password: "password123", roleKey: "employee" },
                { role: "Employee 2", label: "employee-2", email: "emp2@odoocafe.com",   password: "password123", roleKey: "employee" },
              ].map(({ role, email: e, password: p, roleKey }) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => fillDemo(e, p, roleKey)}
                  className="bg-[#FAF3E0]/30 text-left px-2.5 py-2 border border-[#6F4E37]/15 hover:bg-[#FAF3E0] hover:border-[#6F4E37]/30 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="block text-[9px] text-[#8B6347] font-bold uppercase tracking-[0.5px] mb-0.5">
                    {role}
                  </span>
                  <span className="block text-[11px] font-medium text-[#6F4E37]">
                    {e}
                  </span>
                  <span className="block text-[10px] font-medium text-[#A89481]">
                    {p}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}