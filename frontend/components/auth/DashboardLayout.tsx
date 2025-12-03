import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  Map,
  TrendingUp,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

import { Button } from "../ui/button";
import { supabase } from "../../lib/supabase";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ✅ FIXED PAGE DETECTION
  // Extract the segment AFTER /user/
  const currentPath = location.pathname;
  const currentPage =
    currentPath.startsWith("/user/")
      ? currentPath.replace("/user/", "").split("/")[0]
      : "dashboard";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
    { id: "clustering", label: "K-Means Clustering", icon: GitBranch, path: "/user/clustering" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/user/analytics" },
    { id: "map", label: "Map View", icon: Map, path: "/user/map" },
    {
      id: "opportunities",
      label: "Business Opportunities",
      icon: TrendingUp,
      path: "/user/opportunities",
    },
    { id: "profile", label: "My Profile", icon: User, path: "/user/profile" },
  ];

  const handleNavigate = (path: string) => navigate(path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/user/login");
  };

  return (
    <div className="min-h-screen w-full bg-background flex">

      {/* Sidebar */}
      <aside
        className={`glass border-r border-border shadow-sm transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"
          } flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {isSidebarOpen && (
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Store Placement</h1>
              <p className="text-xs text-muted-foreground">Strategic Business Location Analysis</p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-2 transition shadow-md"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background/50">
        <header className="glass border-b border-border px-6 py-4 flex items-center justify-between text-foreground">
          <div>
            <h2 className="text-lg font-heading font-semibold">Sta. Maria, Bulacan</h2>
            <p className="text-sm text-muted-foreground">Strategic Store Placement Dashboard</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
