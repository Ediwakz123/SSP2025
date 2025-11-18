import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Store,
  Users,
  MapPin,
  TrendingUp,
  Building2,
  Briefcase,
  BarChart3,
  GitBranch,
  Map as MapIcon,
  Activity as ActivityIcon,
  Loader2,
} from "lucide-react";
import { LOCATION_INFO } from "../../data/businesses";

// ✅ Use your Vite env – in Vercel this will usually be "/api"
const API_BASE = import.meta.env.VITE_API_URL || "/api";

type Business = {
  id?: number;
  business_id?: number;
  business_name?: string;
  name?: string;
  category?: string;
  type?: string;
  zone_type?: string;
};

type SeedStats = {
  total_businesses: number;
  categories: Record<string, number>;
  zones: Record<string, number>;
  avg_population_density?: number;
  avg_foot_traffic?: number;
};

type ActivityLog = {
  id: number;
  action: string;
  created_at?: string;
  user_email?: string;
  metadata?: any;
};

async function fetchJsonWithFallback(
  urls: string[],
  options: RequestInit = {},
) {
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return data;
      }

      // if this URL fails, try next
      lastError = new Error(
        (data && (data.error as string)) ||
          `Request failed: ${res.status} ${res.statusText}`,
      );
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All requests failed");
}

export function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [seedStats, setSeedStats] = useState<SeedStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // ✅ Get logged-in user for personalized greeting
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw);
      const name =
        user.first_name ||
        user.firstName ||
        user.username ||
        user.email ||
        null;
      if (name) setUserName(name as string);
    } catch {
      // ignore parse errors
    }
  }, []);

  // ✅ Load businesses, stats, activity logs from your Vercel backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token") ||
          undefined;

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const [businessJson, statsJson, activityJson] = await Promise.all([
          // businesses – support a couple of possible route names
          fetchJsonWithFallback(
            [
              `${API_BASE}/seed`, // e.g. /api/seed
              `${API_BASE}/seed-data`, // e.g. /api/seed-data
              `${API_BASE}/businesses`, // fallback
            ],
            { headers },
          ),

          // seed stats
          fetchJsonWithFallback(
            [
              `${API_BASE}/seed/stats`, // /api/seed/stats
              `${API_BASE}/seed-stats`, // /api/seed-stats
            ],
            { headers },
          ),

          // activity logs
          fetchJsonWithFallback(
            [
              `${API_BASE}/activity`, // /api/activity
              `${API_BASE}/logs`, // /api/logs
              `${API_BASE}/activity/logs`, // /api/activity/logs
            ],
            { headers },
          ),
        ]);

        const businessList: Business[] =
          businessJson.businesses || businessJson.data || businessJson || [];
        setBusinesses(Array.isArray(businessList) ? businessList : []);

        const statsData: SeedStats =
          statsJson.stats || statsJson || { total_businesses: 0, categories: {}, zones: {} };
        setSeedStats(statsData);

        let logs: ActivityLog[] = [];
        if (Array.isArray(activityJson)) {
          logs = activityJson;
        } else if (Array.isArray(activityJson.logs)) {
          logs = activityJson.logs;
        }
        setActivityLogs(logs.slice(0, 5)); // show latest 5
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Derive categories & counts from real data
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          businesses
            .map((b) => b.category || b.type || "")
            .filter(Boolean),
        ),
      ),
    [businesses],
  );

  const commercialZones = useMemo(
    () => businesses.filter((b) => b.zone_type === "Commercial").length,
    [businesses],
  );

  const residentialZones = useMemo(
    () => businesses.filter((b) => b.zone_type === "Residential").length,
    [businesses],
  );

  const totalBusinesses =
    seedStats?.total_businesses ?? businesses.length ?? 0;

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of businesses) {
      const cat = (b.category || b.type || "Unknown") as string;
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [businesses]);

  // ✅ Same visual stats cards, but backed by live stats
  const stats = [
    {
      title: "Total Businesses",
      value: totalBusinesses,
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Business Categories",
      value: categories.length,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Population",
      value: LOCATION_INFO.population.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Commercial Zones",
      value: commercialZones,
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Residential Zones",
      value: residentialZones,
      icon: MapPin,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Growth Potential",
      value:
        seedStats && seedStats.avg_foot_traffic && seedStats.avg_population_density
          ? "High"
          : "Analyzing…",
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  // ✅ Loading skeleton (keeps same look, just clearer)
  if (loading && businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="w-6 h-6 mb-2 animate-spin" />
        Loading dashboard data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User greeting + data source */}
      <div className="space-y-1">
        {userName && (
          <p className="text-base font-semibold">
            Welcome back, <span className="text-primary">{userName}</span> 👋
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Data source: Supabase (via Vercel serverless API)
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid – same design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-3xl mt-2">{stat.value}</h3>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Location Info – unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Barangay</p>
              <p>{LOCATION_INFO.barangay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Municipality</p>
              <p>{LOCATION_INFO.municipality}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Province</p>
              <p>{LOCATION_INFO.province}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Postal Code</p>
              <p>{LOCATION_INFO.postal_code}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Coordinates</p>
            <p>
              {LOCATION_INFO.center_latitude.toFixed(4)},{" "}
              {LOCATION_INFO.center_longitude.toFixed(4)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories – same visual style but using real data */}
      <Card>
        <CardHeader>
          <CardTitle>Business Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No businesses found yet.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryCounts.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span>{item.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} businesses
                        </span>
                      </div>
                      <div className="bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{
                            width:
                              totalBusinesses > 0
                                ? `${(item.count / totalBusinesses) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions – unchanged, still using window.navigateTo */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => (window as any).navigateTo?.("clustering")}
              className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
            >
              <GitBranch className="w-8 h-8 mb-2 text-primary" />
              <h4>Run K-Means Analysis</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze optimal business locations
              </p>
            </button>
            <button
              onClick={() => (window as any).navigateTo?.("analytics")}
              className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 mb-2 text-primary" />
              <h4>View Analytics</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Explore detailed charts and graphs
              </p>
            </button>
            <button
              onClick={() => (window as any).navigateTo?.("map")}
              className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
            >
              <MapIcon className="w-8 h-8 mb-2 text-primary" />
              <h4>Interactive Map</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize business locations
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ New: Recent Activity Logs (matches your style) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{log.action}</p>
                    {log.user_email && (
                      <p className="text-xs text-muted-foreground">
                        {log.user_email}
                      </p>
                    )}
                  </div>
                  {log.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
