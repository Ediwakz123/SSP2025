import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

import { toast } from "sonner";

import {
  Users,
  Search,
  RefreshCcw,
  UserCheck,
  UserX,
  Calendar,
  Activity,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

interface ProfileUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "user";
  last_login: string | null;
  created_at: string | null;
  analyses_count: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [_loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

const fetchUsers = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from("users_view")
    .select("*");

  if (error) {
    console.error("USER FETCH ERROR:", error);
    toast.error("Failed to load users");
    setLoading(false);
    return;
  }

  const usersList: ProfileUser[] = data.map(u => ({
    id: u.id,
    email: u.email,
    full_name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
    role: u.role === "admin" ? "admin" : "user",
    created_at: u.created_at,
    last_login: u.last_sign_in_at,
    analyses_count: 0,
  }));

  setUsers(usersList);
  setLoading(false);
};


  useEffect(() => {
    fetchUsers();
  }, []);

  // Real-time updates when profiles table changes
  useEffect(() => {
  const channel = supabase
    .channel("profiles_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      (_payload) => {
        fetchUsers();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  const filteredUsers = useMemo(() => {
    return users
      .filter((u) =>
        roleFilter === "all" ? true : u.role === roleFilter
      )
      .filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      });
  }, [users, roleFilter, searchQuery]);

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const activeCount = users.filter((u) => isUserActive(u.last_login)).length;

  function isUserActive(lastLogin: string | null) {
    if (!lastLogin) return false;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(lastLogin).getTime() < sevenDays;
  }

  return (
    <div className="page-wrapper space-y-6">
      {/* Hero Header */}
      <div className="page-content relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-600 via-fuchsia-500 to-pink-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-white/80 text-sm mt-1">
                Manage and monitor all {totalUsers} registered users
              </p>
            </div>
          </div>
          <Button 
            onClick={fetchUsers}
            className="bg-white text-purple-600 hover:bg-white/90 border-0"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="stat-card-modern stat-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-xs text-gray-400 mt-1">Registered accounts</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-modern stat-success">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-modern stat-warning">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Admin Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
              <p className="text-xs text-gray-400 mt-1">Administrator role</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="stat-card-modern stat-info">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">{userCount}</p>
              <p className="text-xs text-gray-400 mt-1">Standard accounts</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <Card className="border-0 shadow-card overflow-hidden animate-fadeInUp delay-100">
        <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">All Users</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {totalUsers} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Role filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Cards */}
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{u.full_name || "No Name"}</p>
                        <span className={`badge-modern ${u.role === "admin" ? "badge-primary" : "badge-info"}`}>
                          {u.role}
                        </span>
                        {isUserActive(u.last_login) && (
                          <span className="badge-modern badge-success">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500">{u.email}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined: {new Date(u.created_at!).toLocaleDateString()}
                        </div>

                        {u.last_login && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Last: {new Date(u.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Analyses</p>
                    <p className="text-2xl font-bold text-gray-900">{u.analyses_count}</p>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No users found matching your criteria.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
