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
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "../ui/select";

import {
  Activity,
  LogIn,
  BarChart3,
  Database,
  Clock,
  Search,
  RefreshCcw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

// ---------------- TYPES ----------------
interface ActivityLog {
  id: number;
  action: string;
  status?: string;
  user_id?: string | null;
  user_email?: string | null;
  details?: string | null;
  context?: Record<string, any> | null;
  created_at: string;
}

// Helper to safely parse context
const parseContext = (value: any): Record<string, any> | null => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
  return { value };
};

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------- FETCH LOGS ----------------
  const fetchLogs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading logs:", error);
      setLogs([]);
    } else {
      const normalized: ActivityLog[] = (data || []).map((row: any) => ({
        ...row,
        context: parseContext(row.context),
      }));
      setLogs(normalized);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 🔥 Real-time listener
  useEffect(() => {
    const channel = supabase
      .channel("realtime_activity_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          setLogs((prev) => [
            { ...(payload.new as any), context: parseContext((payload.new as any).context) },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // synchronous cleanup
    };
  }, []);

  // ---------------- FILTERING & SEARCH ----------------
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) =>
        actionFilter === "all" ? true : log.action === actionFilter
      )
      .filter((log) => {
        const q = searchQuery.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          (log.user_email || "").toLowerCase().includes(q) ||
          (log.user_id || "").toLowerCase().includes(q) ||
          (log.details || "").toLowerCase().includes(q) ||
          JSON.stringify(log.context || {})
            .toLowerCase()
            .includes(q)
        );
      });
  }, [logs, actionFilter, searchQuery]);

  // ---------------- STATS ----------------
  const totalActivities = logs.length;
  const loginCount = logs.filter((l) => l.action === "user_login").length;
  const analysisCount = logs.filter(
    (l) => l.action === "clustering_analysis"
  ).length;
  const dataChanges = logs.filter((l) =>
    ["seed_data_reset", "seed_data_updated"].includes(l.action)
  ).length;

  // ---------------- HELPERS ----------------
  const getIcon = (action: string) => {
    if (action === "user_login") return <LogIn className="text-blue-600" />;
    if (action === "clustering_analysis")
      return <BarChart3 className="text-purple-600" />;
    if (action.includes("seed_data"))
      return <Database className="text-orange-500" />;
    return <Activity className="text-gray-400" />;
  };

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      user_login: "User Login",
      clustering_analysis: "Clustering Analysis",
      seed_data_reset: "Seed Reset",
      seed_data_updated: "Seed Update",
    };
    return map[action] || action.replace(/_/g, " ");
  };

  // ---------------- RENDER ----------------
  return (
    <div className="space-y-8">
      {/* HEADER COUNTERS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-muted-foreground">Logged actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginCount}</div>
            <p className="text-xs text-muted-foreground">
              Authentication events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisCount}</div>
            <p className="text-xs text-muted-foreground">
              Clustering operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataChanges}</div>
            <p className="text-xs text-muted-foreground">Seed data updates</p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CARD */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} activities
          </CardDescription>
        </CardHeader>

        {/* Search & Filter Row */}
        <div className="flex items-center gap-4 px-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Array.from(new Set(logs.map((l) => l.action))).map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* LOG LIST */}
        <ScrollArea className="h-[600px] pr-4 pb-4">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="w-full space-y-2 rounded-xl border bg-[#fafafa] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full border bg-white p-2">
                    {getIcon(log.action)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {formatAction(log.action)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                    </div>

                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </p>

                    {log.user_email && (
                      <p className="text-xs text-muted-foreground">
                        email:{" "}
                        <span className="font-medium">{log.user_email}</span>
                      </p>
                    )}

                    {log.user_id && (
                      <p className="text-xs text-muted-foreground">
                        user id:{" "}
                        <span className="font-medium">{log.user_id}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Simple details text */}
                {log.details && (
                  <div className="rounded-lg border bg-white p-3 text-xs">
                    <p>{log.details}</p>
                  </div>
                )}

                {/* Context metadata (e.g. num_clusters, business_type, etc.) */}
                {log.context && Object.keys(log.context).length > 0 && (
                  <div className="rounded-lg border bg-white p-3 text-xs">
                    {Object.entries(log.context).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground">
                          {key}:
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!loading && filteredLogs.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                No activities found.
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
