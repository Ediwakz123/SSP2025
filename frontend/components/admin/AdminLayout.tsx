import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard,
  Users,
  ListOrdered,
  Database,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Only show email, not auth-checking
  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      setAdminEmail(res.data.user?.email ?? "Admin");
    });
  }, []);

  const currentPath = location.pathname;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { id: "users", label: "User Management", icon: Users, path: "/admin/user-management" },
    { id: "logs", label: "Activity Logs", icon: ListOrdered, path: "/admin/activity-logs" },
    { id: "seed", label: "Seed Data", icon: Database, path: "/admin/seed-data" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r shadow-sm transition-all duration-300 
        ${isSidebarOpen ? "w-64" : "w-20"} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <div>
              <h1 className="font-bold text-lg">Admin Portal</h1>
              <p className="text-xs text-gray-500">Store Placement</p>
            </div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Admin Profile */}
        <div className="p-4 flex items-center gap-3 border-b">
          <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold">
            {adminEmail?.charAt(0).toUpperCase()}
          </div>

          {isSidebarOpen && (
            <div>
              <p className="font-semibold text-sm">{adminEmail}</p>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                admin
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-3 py-2 rounded-lg gap-3 text-sm transition
                  ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }
                `}
              >
                <Icon size={18} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 text-sm"
          >
            <LogOut size={18} />
            {isSidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
