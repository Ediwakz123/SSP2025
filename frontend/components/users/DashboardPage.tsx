import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";

import {
  Loader2,
  LayoutDashboard,
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
  Download,
  LogIn,
  Clock
} from "lucide-react";

import { LOCATION_INFO } from "../../data/businesses";
import { supabase } from "../../lib/supabase";
import BusinessMap from "../auth/BusinessMaps";
import { LucideIcon } from "lucide-react";
import { useActivity, logActivity } from "../../utils/activity";

// -------------------------------
// TYPES
// -------------------------------
type Business = {
  business_id?: number;
  business_name?: string;
  general_category?: string;
  type?: string;
  street: string;
  zone_type?: string;
  latitude: number;
  longitude: number;
  competitor_density_50m?: number;
  competitor_density_100m?: number;
  competitor_density_200m?: number;
  business_density_50m?: number;
  business_density_100m?: number;
  business_density_200m?: number;
};

type ActivityLog = {
  id: number;
  action: string;
  created_at?: string;
  metadata?: Record<string, any> | null;
};

type PageType = "clustering" | "analytics" | "map" | "opportunities";

type LightActionProps = {
  icon: LucideIcon;
  title: string;
  desc: string;
  action: PageType;
};

// ------------------------------------------------
// Utility Functions
// ------------------------------------------------

// Clean action text
function cleanAction(action: string) {
  if (!action) return "";
  return action
    .replace(/^Opened\s*/i, "")
    .replace(/^Clicked\s*/i, "")
    .replace(/_/g, " ")
    .trim();
}

// Days difference
function daysDiff(dateString?: string) {
  if (!dateString) return 9999;
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

function getActionIcon(action: string) {
  const a = action.toLowerCase();

  if (a.includes("dashboard")) return LayoutDashboard;
  if (a.includes("clustering")) return GitBranch;
  if (a.includes("analytic")) return BarChart3;
  if (a.includes("map")) return MapIcon;
  if (a.includes("opportunit")) return TrendingUp;
  if (a.includes("export")) return Download;
  if (a.includes("login")) return LogIn;

  return ActivityIcon;
}


// ------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------
export function DashboardPage() {
  useActivity(); // Auto-page logging
  

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Load user info
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        const meta = user.user_metadata;
        const fullname =
          `${meta.first_name || ""} ${meta.last_name || ""}`.trim() ||
          user.email ||
          null;
        setUserName(fullname);
      }
    };

    loadUser();
  }, []);

  // Load businesses + logs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: biz } = await supabase.from("businesses").select("*");
        setBusinesses(biz || []);

        const { data: logs } = await supabase
          .from("activity_logs")
          .select("id, action, created_at, metadata")
          .order("created_at", { ascending: false })
          .limit(40);

        setActivityLogs(logs || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // CATEGORY NORMALIZATION
  const normalizeCategory = (category: string) => {
    if (!category) return "Unknown";
    const c = category.trim().toLowerCase();
    if (c.includes("merch")) return "Merchandise / Trading";
    if (c.includes("food")) return "Food & Beverage";
    if (c.includes("rest")) return "Restaurant";
    if (c.includes("service")) return "Services";
    if (c.includes("retail")) return "Retail";
    if (c.includes("entertain")) return "Entertainment / Leisure";
    return category.trim();
  };

  // CATEGORY COUNTS
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    businesses.forEach((b) => {
      const clean = normalizeCategory(b.general_category || b.type || "Unknown");
      map.set(clean, (map.get(clean) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([general_category, count]) => ({ general_category, count }))
      .sort((a, b) => b.count - a.count);
  }, [businesses]);

  // LOW COMPETITION
  const lowCompetition = useMemo(() => {
    const stats = new Map<string, { total: number; low: number }>();

    businesses.forEach((b) => {
      const cat = normalizeCategory(b.general_category || "");
      const isLow =
        (b.competitor_density_200m ?? 0) <= 2 &&
        (b.competitor_density_100m ?? 0) <= 1;

      const entry = stats.get(cat) || { total: 0, low: 0 };
      entry.total++;
      if (isLow) entry.low++;
      stats.set(cat, entry);
    });

    return Array.from(stats.entries())
      .filter(([_, s]) => s.low >= 3)
      .map(([category, s]) => ({ category, score: s.low }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [businesses]);

  // Stats
  const stats = [
    { title: "Total Businesses", value: businesses.length, icon: Store },
    { title: "Business Categories", value: categoryCounts.length, icon: Briefcase },
    { title: "Commercial Zones", value: businesses.filter((b) => b.zone_type === "Commercial").length, icon: Building2 },
    { title: "Residential Zones", value: businesses.filter((b) => b.zone_type === "Residential").length, icon: MapPin },
    { title: "Growth Potential", value: "High", icon: TrendingUp },
  ];

  // ------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading dashboard...
      </div>
    );
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div>
        <p className="text-lg font-semibold">
          Welcome back,{" "}
          <span className="text-blue-600">{userName || "User"}</span> 👋
        </p>
        <p className="text-sm text-gray-600">Data powered by Supabase</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm border">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-gray-600">{stat.title}</p>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-full">
                  <Icon className="w-5 h-5 text-gray-800" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT SIDE */}
        <div className="space-y-6 lg:col-span-2">

          {/* Overview */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Business Landscape Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info label="Barangay" value={LOCATION_INFO.barangay} />
                <Info label="Municipality" value={LOCATION_INFO.municipality} />
                <Info label="Province" value={LOCATION_INFO.province} />
                <Info label="Postal Code" value={LOCATION_INFO.postal_code} />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm">Coordinates:</p>
                <p>
                  {LOCATION_INFO.center_latitude.toFixed(4)},{" "}
                  {LOCATION_INFO.center_longitude.toFixed(4)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Business Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryCounts.map((item, index) => (
                <CategoryBar
                  key={item.general_category}
                  rank={index + 1}
                  category={item.general_category}
                  count={item.count}
                  total={businesses.length}
                />
              ))}
            </CardContent>
          </Card>

          {/* Low competition */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Top 5 Low-Competition Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowCompetition.map((lc, index) => (
                <div
                  key={lc.category}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{lc.category}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {lc.score} low-competition spots
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Next actions */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <LightAction
                icon={GitBranch}
                title="Run K-Means Analysis"
                desc="Analyze optimal business locations"
                action="clustering"
              />
              <LightAction
                icon={BarChart3}
                title="View Analytics"
                desc="Detailed insights & graphs"
                action="analytics"
              />
              <LightAction
                icon={MapIcon}
                title="Interactive Map"
                desc="Visualize business data"
                action="map"
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* Map */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessMap />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Location Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Summary icon={Store} text={`${businesses.length} registered businesses`} />
              <Summary icon={Users} text="Growing population" />
              <Summary icon={Building2} text="Commercial-residential mix" />
              <Summary icon={TrendingUp} text="Strong potential" />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border flex-1">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <ActivityIcon className="w-4 h-4" />
            </CardHeader>

            {/* Search + Filter */}
            <div className="px-4 pb-2 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="all">All Time</option>
                <option value="yesterday">Yesterday</option>
                <option value="3days">Last 3 Days</option>
                <option value="week">This Week</option>
              </select>
            </div>

            <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
              {(() => {
                let logs = activityLogs.filter((log) => {
                  const diff = daysDiff(log.created_at);

                  if (filterType === "yesterday") return diff <= 2 && diff > 1;
                  if (filterType === "3days") return diff <= 3;
                  if (filterType === "week") return diff <= 7;
                  return true;
                });

                if (searchQuery.trim() !== "") {
                  const q = searchQuery.toLowerCase();
                  logs = logs.filter((log) =>
                    log.action.toLowerCase().includes(q) ||
                    (log.metadata?.page || "").toLowerCase().includes(q)
                  );
                }

                if (logs.length === 0)
                  return (
                    <p className="text-sm text-center text-gray-500">
                      No activity found.
                    </p>
                  );

                  

                return logs.map((log) => {
  const Icon = getActionIcon(log.action);

  return (
    <div
      key={log.id}
      className="flex items-center justify-between py-3 border-b last:border-none"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-600" />

        <div className="flex flex-col">
          <p className="font-medium text-sm">{cleanAction(log.action)}</p>

          {log.metadata?.timeSpentSeconds != null && (
            <p className="text-xs text-gray-500">
              ⏱ {log.metadata.timeSpentSeconds}s spent
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400">
        {new Date(log.created_at!).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </span>
    </div>
  );
});

              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------
// Helper Components
// ------------------------------------------------
function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function CategoryBar({
  rank,
  category,
  count,
  total
}: {
  rank: number;
  category: string;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 text-center text-sm">{rank}</div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span>{category}</span>
          <span className="text-sm">{count} businesses</span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black"
            style={{ width: `${total ? (count / total) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
}

// ------------------------------------------------
// Quick Action Button
// ------------------------------------------------
export function LightAction({
  icon: Icon,
  title,
  desc,
  action
}: LightActionProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        logActivity(`Clicked ${title}`, { page: action });
        navigate(`/user/${action}`);
      }}
      className="p-4 border rounded-lg bg-white hover:bg-gray-100 transition shadow-sm text-left"
    >
      <Icon className="w-8 h-8 mb-2" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </button>
  );
}
