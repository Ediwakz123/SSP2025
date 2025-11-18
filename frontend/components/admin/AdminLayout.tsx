import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ListChecks,
  Database,
} from "lucide-react";



const menu = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin" },
  { name: "Users", icon: <Users size={18} />, path: "/admin/users" },
  { name: "Analytics", icon: <BarChart3 size={18} />, path: "/admin/analytics" },
  { name: "Activity Logs", icon: <ListChecks size={18} />, path: "/admin/logs" },
  { name: "Seed Data", icon: <Database size={18} />, path: "/admin/seed" },
];

export default function AdminLayout() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col fixed h-screen">
        <div className="h-20 flex items-center px-6 border-b">
          <p className="text-xl font-bold tracking-tight">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menu.map((m) => (
            <NavLink
              key={m.name}
              to={m.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium
                transition-colors 
                ${
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {m.icon}
              {m.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
