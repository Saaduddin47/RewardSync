import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Users, ShieldCheck, FileCheck2, UserCog, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const menuByRole = {
  recruiter: [{ label: "Recruiter", to: "/recruiter", icon: Users }],
  bgv: [{ label: "BGV", to: "/bgv", icon: ShieldCheck }],
  manager: [{ label: "Manager", to: "/manager", icon: FileCheck2 }],
  admin: [{ label: "Admin", to: "/admin", icon: UserCog }],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  const menu = menuByRole[user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:block">
          <h1 className="mb-6 text-lg font-bold">Recruitment Tracker</h1>
          <nav className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-600"
                  }`}
                >
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full p-4 md:p-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm capitalize text-slate-500">{user?.role} dashboard</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleTheme}>
                {document.documentElement.classList.contains("dark") ? <Sun size={16} /> : <Moon size={16} />}
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
