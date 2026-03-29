import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  Users,
  ShieldCheck,
  FileCheck2,
  UserCog,
  LogOut,
  Home,
  ClipboardPlus,
  Receipt,
  Target,
  ListChecks,
  UserSearch,
  CheckCircle2,
  Building2,
  UserPlus,
  RotateCcw,
  Settings,
  FileDown,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const menuByRole = {
  recruiter: [
    { label: "Dashboard", to: "/recruiter", icon: Home },
    { label: "Submit Joiner", to: "/recruiter/submit-joiner", icon: ClipboardPlus },
    { label: "My Claims", to: "/recruiter/my-claims", icon: Receipt },
    { label: "Target Progress", to: "/recruiter/target-progress", icon: Target },
  ],
  bgv: [
    { label: "Dashboard", to: "/bgv", icon: ShieldCheck },
    { label: "Pending Verifications", to: "/bgv/pending-verifications", icon: ListChecks },
    { label: "All Joiners", to: "/bgv/all-joiners", icon: UserSearch },
  ],
  manager: [
    { label: "Dashboard", to: "/manager", icon: Home },
    { label: "Incentive Claims", to: "/manager/incentive-claims", icon: FileCheck2 },
    { label: "Approval Queue", to: "/manager/approval-queue", icon: CheckCircle2 },
    { label: "Recovery Deficits", to: "/manager", hash: "#recovery-deficits", icon: RotateCcw },
    { label: "Reports", to: "/manager/reports", icon: FileDown },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: UserCog },
    { label: "Employees", to: "/admin/employees", icon: Building2 },
    { label: "Create User", to: "/admin/create-user", icon: UserPlus },
    { label: "Recovery Management", to: "/admin/recovery-management", icon: RotateCcw },
    { label: "Incentive Settings", to: "/admin/incentive-settings", icon: Settings },
    { label: "Export Report", to: "/admin/export-report", icon: FileDown },
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const shouldUseDark = storedTheme ? storedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  const menu = menuByRole[user?.role] || [];
  const sectionTitle = menu.find((item) => location.pathname === item.to)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card px-4 py-6 transition-transform md:sticky md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <h1 className="mb-2 flex items-center gap-2 text-xl font-bold">
            <Users size={18} /> RewardSync
          </h1>
          <p className="mb-6 text-xs uppercase tracking-wider text-foreground/60">{user?.role}</p>
          <nav className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = item.hash
                ? location.pathname === item.to && location.hash === item.hash
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={`${item.to}${item.hash || ""}`}
                  to={item.hash ? `${item.to}${item.hash}` : item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-background"
                  }`}
                >
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full px-4 py-4 md:px-8 md:py-6">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground md:text-xl">{sectionTitle}</h2>
              <p className="text-xs capitalize text-foreground/70 md:text-sm">{user?.name} · {user?.role} dashboard</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="md:hidden" onClick={() => setIsSidebarOpen((prev) => !prev)}>
                <Menu size={16} />
              </Button>
              <Button variant="outline" onClick={toggleTheme}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut size={16} className="mr-2" /> Logout
              </Button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
