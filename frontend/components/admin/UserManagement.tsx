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
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";


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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

const fetchUsers = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from("users_view")
    .select("*");

  if (error) {
    console.error("USER FETCH ERROR:", error);
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
      (payload) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all registered users
          </p>
        </div>
        <Button onClick={fetchUsers}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 text-green-600" /> Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Administrator role</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{userCount}</div>
            <p className="text-xs text-muted-foreground">Standard accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {totalUsers} users
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
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
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p>{u.full_name || "No Name"}</p>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                        {isUserActive(u.last_login) && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3" />
                          Joined: {new Date(u.created_at!).toLocaleDateString()}
                        </div>

                        {u.last_login && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3" />
                            Last: {new Date(u.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Analyses: </span>
                      <span className="text-lg">{u.analyses_count}</span>
                    </p>
                  </div>
                </div>
              ))}
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
