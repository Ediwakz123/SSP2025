// Merged Analytics Page combining full UI with realtime Supabase data
// Final Clean + Export Modal + Category Normalization + Icons + User-friendly features
// ⭐ Now includes DATE RANGE FILTER + QUICK FILTERS

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  MapPin,
  Building2,
  Target,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { useActivity, logActivity } from "../../utils/activity";
import { toast } from "sonner";

export function UserAnalyticsPage() {
  useActivity();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<
    { name: string; value: number }[]
  >([]);
  const [zones, setZones] = useState<{ name: string; value: number }[]>([]);
  const [streets, setStreets] = useState<{ name: string; value: number }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // QUICK FILTER function
 const applyQuickFilter = (days?: number | "year") => {
  if (days === 0) {
    toast.message("Filtering analytics: Today");
    logActivity("Filtered Analytics", { range: "Today" });
  } else if (days === 7) {
    toast.message("Filtering analytics: Last 7 days");
    logActivity("Filtered Analytics", { range: "Last 7 Days" });
  } else if (days === 30) {
    toast.message("Filtering analytics: Last 30 days");
    logActivity("Filtered Analytics", { range: "Last 30 Days" });
  } else if (days === "year") {
    toast.message("Filtering analytics: This Year");
    logActivity("Filtered Analytics", { range: "This Year" });
  }


    const today = new Date();
    const end = today.toISOString().split("T")[0];

    if (days === "year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(end);
      loadAnalytics(true);
      return;
    }

    const start = new Date();
    start.setDate(today.getDate() - days!);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end);
    loadAnalytics(true);
  };

  // Load analytics (supports date filtering)
  const loadAnalytics = useCallback(
    async (applyFilter: boolean = false) => {
      setLoading(true);

      let query = supabase.from("businesses").select("*");

      // APPLY DATE FILTER
      if (applyFilter && startDate && endDate) {
        query = query
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);
      }

      const { data: bizData } = await query;
      const list = bizData || [];
      setBusinesses(list);

      // Category normalization
      const normalizeCategoryName = (name: string) => {
        if (!name) return "Unknown";

        return name
          .trim()
          .toLowerCase()
          .replace(/&/g, "/")
          .replace(/\s+/g, " ")
          .replace("merchandising/trading", "merchandise / trading")
          .replace("merchandising / trading", "merchandise / trading")
          .replace("merchandise/trading", "merchandise / trading")
          .replace("merchandizing / trading", "merchandise / trading")
          .replace("merchandizing/trading", "merchandise / trading");
      };

      const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
      };

      // CATEGORY AGGREGATION
      const catMap = new Map();
      list.forEach((b) => {
        if (b.general_category) {
          const clean = normalizeCategoryName(b.general_category);
          const finalName = toTitleCase(clean);
          catMap.set(finalName, (catMap.get(finalName) || 0) + 1);
        }
      });
      const catArr = Array.from(catMap).map(([name, value]) => ({
        name,
        value,
      }));
      setCategories(catArr);

      // ZONE AGGREGATION
      const zoneMap = new Map();
      list.forEach((b) => {
        if (b.zone_type) {
          zoneMap.set(b.zone_type, (zoneMap.get(b.zone_type) || 0) + 1);
        }
      });
      const zoneArr = Array.from(zoneMap).map(([name, value]) => ({
        name,
        value,
      }));
      setZones(zoneArr);

      // STREET AGGREGATION
      const streetMap = new Map();
      list.forEach((b) => {
        if (b.street)
          streetMap.set(b.street, (streetMap.get(b.street) || 0) + 1);
      });
      const streetArr = Array.from(streetMap).map(([name, value]) => ({
        name,
        value,
      }));
      setStreets(streetArr);

      // STATS
      setStats({
        total_businesses: list.length,
        categories: catArr,
        zones: zoneArr,
      });

      setLoading(false);
    },
    [startDate, endDate]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

 if (loading || !stats) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      Loading analytics...
    </div>
  );
}


  const categoryData = categories;
  const zoneData = zones;

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
  ];

  // ========================
  // EXPORT FUNCTIONS
  // ========================

  const exportCSV = () => {
    const rows = [
      ["Category", "Count"],
      ...categories.map((c) => [c.name, c.value]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "business_analytics.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(categories);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "business_analytics.xlsx");
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("Business Analytics Report", 10, 10);

    pdf.setFontSize(12);
    let y = 20;

    categories.forEach((c) => {
      pdf.text(`${c.name}: ${c.value}`, 10, y);
      y += 8;
    });

    pdf.save("business_analytics.pdf");
  };

  
  // ========================
  // RETURN UI
  // ========================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl">Analytics</h1>
        <p className="text-muted-foreground">
          Business distribution and insights
        </p>
      </div>

      {/* ⭐ DATE RANGE FILTER + QUICK FILTERS */}
      <div className="border p-4 rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-lg font-medium">Filter by Date</h2>

        {/* Date Selectors */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-sm text-muted-foreground">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm text-muted-foreground">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* QUICK FILTERS */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => applyQuickFilter(0)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Today
          </button>

          <button
            onClick={() => applyQuickFilter(7)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Last 7 Days
          </button>

          <button
            onClick={() => applyQuickFilter(30)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Last 30 Days
          </button>

          <button
            onClick={() => applyQuickFilter("year")}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            This Year
          </button>

          <button
  onClick={() => {
    setStartDate("");
    setEndDate("");
    toast.message("Analytics date filter reset");
    logActivity("Reset Analytics Date Filter");
    loadAnalytics();
  }}
            className="px-3 py-1 bg-red-200 text-red-700 rounded hover:bg-red-300 transition"
          >
            Reset
          </button>
        </div>

        {startDate && endDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Showing results from <b>{startDate}</b> to <b>{endDate}</b>.
          </p>
        )}
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="size-4" />
              Total Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total_businesses}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="size-4" />
              Avg. Businesses per Street
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {streets.length
                ? (businesses.length / streets.length).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per area</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="size-4" />
              Avg. Businesses per Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {zones.length
                ? (businesses.length / zones.length).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on zone distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="size-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">Business types</p>
          </CardContent>
        </Card>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl space-y-5 animate-fadeIn">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-600" />
              Export Report
            </h2>

            <p className="text-sm text-muted-foreground">
              Choose a file format. PDF is best for sharing. Excel and CSV are
              best for editing.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                 exportCSV();
toast.success("Exported analytics as CSV");
logActivity("Exported Analytics Report", { format: "CSV" });

                  setShowExportModal(false);
                }}
                className="w-full flex items-center gap-2 bg-gray-100 py-2 px-3 rounded-md hover:bg-gray-200 transition"
              >
                <FileText className="w-4 h-4 text-gray-600" />
                Export as CSV
              </button>

              <button
                onClick={() => {
                 exportExcel();
toast.success("Exported analytics as Excel");
logActivity("Exported Analytics Report", { format: "Excel" });

                }}
                className="w-full flex items-center gap-2 bg-gray-100 py-2 px-3 rounded-md hover:bg-gray-200 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export as Excel (.xlsx)
              </button>

              <button
                onClick={() => {
                exportPDF();
toast.success("Exported analytics as PDF");
logActivity("Exported Analytics Report", { format: "PDF" });

                }}
                className="w-full flex items-center gap-2 bg-gray-100 py-2 px-3 rounded-md hover:bg-gray-200 transition"
              >
                <FileDown className="w-4 h-4 text-red-600" />
                Export as PDF
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full py-2 rounded-md bg-black text-white hover:bg-gray-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <Tabs
  defaultValue="category"
  className="space-y-4"
  onValueChange={(value) => {
    if (value === "category") {
      toast.message("Viewing analytics by category");
      logActivity("Viewed Analytics - By Category");
    }
    if (value === "zone") {
      toast.message("Viewing analytics by zone");
      logActivity("Viewed Analytics - By Zone");
    }
    if (value === "distribution") {
      toast.message("Viewing business distribution insights");
      logActivity("Viewed Analytics - Distribution");
    }
  }}
>
  <TabsList>
    <TabsTrigger value="category">By Category</TabsTrigger>
    <TabsTrigger value="zone">By Zone</TabsTrigger>
    <TabsTrigger value="distribution">Distribution</TabsTrigger>
  </TabsList>



      {/* EXPORT BUTTON BELOW TABS */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export Report
        </button>
      </div>

        {/* CATEGORY TAB */}
        <TabsContent value="category" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* BAR CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Business Count by Category</CardTitle>
                <CardDescription>
                  Distribution of business types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* PIE CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Category Percentage</CardTitle>
                <CardDescription>Proportional distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* SUMMARY */}
          <Card>
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {categoryData.map((cat, index) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <Badge variant="secondary">{cat.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZONE TAB */}
        <TabsContent value="zone" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Distribution</CardTitle>
              <CardDescription>
                Commercial vs Residential areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                    outerRadius={120}
                    dataKey="value"
                  >
                    {zoneData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ZONE SUMMARY */}
          <div className="grid md:grid-cols-2 gap-4">
            {zoneData.map((zone, index) => (
              <Card key={zone.name}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {zone.name} Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl mb-2">{zone.value}</div>
                  <p className="text-sm text-muted-foreground">
                    {(
                      (zone.value / stats.total_businesses) *
                      100
                    ).toFixed(1)}
                    % of total businesses
                  </p>
                  <div className="h-2 bg-muted rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${
                          (zone.value / stats.total_businesses) *
                          100
                        }%`,
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* DISTRIBUTION TAB */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Distribution Overview</CardTitle>
              <CardDescription>
                Comprehensive analysis of all business data
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* TOP CATEGORIES */}
                <div className="space-y-2">
                  <h4 className="text-sm">Top Business Categories</h4>
                  {categoryData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((cat, index) => (
                      <div
                        key={cat.name}
                        className="flex items-center gap-3"
                      >
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="flex-1 text-sm">
                          {cat.name}
                        </span>
                        <span className="text-sm">{cat.value}</span>
                      </div>
                    ))}
                </div>

                {/* INSIGHTS */}
                <div className="space-y-2">
                  <h4 className="text-sm">Key Insights</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="size-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Most popular: {categoryData[0]?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {categoryData[0]?.value} businesses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm">
                          {(
                            ((zoneData.find(
                              (z) => z.name === "Commercial"
                            )?.value || 0) /
                              stats.total_businesses) *
                            100
                          ).toFixed(1)}
                          % in commercial zones
                        </p>
                        <p className="text-xs text-muted-foreground">
                          High business concentration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Activity className="size-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Avg. per Street:{" "}
                          {streets.length
                            ? (
                                businesses.length /
                                streets.length
                              ).toFixed(1)
                            : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Population per area
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
