import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {toast} from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { useActivity, logActivity } from "../../utils/activity";
import {
  Activity,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileType,
  Lightbulb,
  MapPin,
  Store,
  TrendingDown,
  Loader2
} from "lucide-react";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Opportunity {
  title: string;
  category: string;
  location: string;
  businessDensity: number;
  competitors: number;
  zone_type: string;
  saturation: number;
  score: number;
  cluster: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  insights: string[];
}

interface ClusteringRow {
  business_category: string;
  num_clusters: number | null;
  locations: any;
}

interface BusinessRow {
  id: number;
  business_name: string;
  latitude: number;
  longitude: number;
  street: string;
  zone_type: string;
  status: string;
  business_density_200m: number;
  competitor_density_200m: number;
  general_category: string;
}

interface CategoryStat {
  category: string;
  count: number;
  avgBusinessDensity: number;
  avgCompetitors: number;
}

interface ZoneStat {
  zone: string;
  count: number;
}

type GapLevel = "High" | "Medium" | "Low";

interface MarketGap {
  category: string;
  demand: number;
  supply: number;
  gapScore: number;
  gapLevel: GapLevel;
  recommendedLocations: string[];
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function computeSaturation(businessDensity: number, competitors: number) {
  return Math.min(
    Math.round((competitors / (businessDensity + 1)) * 100),
    100
  );
}

function computeOpportunityScore(
  businessDensity: number,
  competitors: number,
  zone: string
) {
  const zoneWeight =
    zone?.toLowerCase() === "commercial"
      ? 20
      : zone?.toLowerCase() === "mixed"
      ? 10
      : 5;

  return Math.min(
    Math.round(
      businessDensity * 2 + (1 / (competitors + 1)) * 40 + zoneWeight
    ),
    100
  );
}

function generateInsights(loc: {
  businessDensity: number;
  competitors: number;
  zone_type: string;
}): string[] {
  const insights: string[] = [];

  if (loc.competitors === 0) {
    insights.push("No direct competitors within 200m.");
  }

  if (loc.businessDensity > 20) {
    insights.push("Located in a high-business activity zone.");
  }

  if (loc.businessDensity < 8) {
    insights.push("Low business presence — great for first movers.");
  }

  if (loc.competitors > 8) {
    insights.push("High competition — consider differentiation.");
  }

  insights.push(`Zone type: ${loc.zone_type}`);

  return insights;
}

function calculateKPIs(opps: Opportunity[]) {
  if (opps.length === 0) {
    return {
      totalOpportunities: 0,
      avgBusinessDensity: 0,
      avgCompetition: 0,
      commercialZones: 0,
    };
  }

  const totalOpportunities = opps.length;

  const avgBusinessDensity = Math.round(
    opps.reduce((s, o) => s + o.businessDensity, 0) / opps.length
  );

  const avgCompetition = Math.round(
    opps.reduce((s, o) => s + o.competitors, 0) / opps.length
  );

  const commercialZones = Math.round(
    (opps.filter((o) => o.zone_type === "Commercial").length /
      opps.length) *
      100
  );

  return {
    totalOpportunities,
    avgBusinessDensity,
    avgCompetition,
    commercialZones,
  };
}

function buildCategoryStats(businesses: BusinessRow[]): CategoryStat[] {
  const map = new Map<
    string,
    { count: number; totalDensity: number; totalCompetitors: number }
  >();

  businesses.forEach((b) => {
    const key = b.general_category || "Uncategorized";
    const prev = map.get(key) ?? {
      count: 0,
      totalDensity: 0,
      totalCompetitors: 0,
    };

    map.set(key, {
      count: prev.count + 1,
      totalDensity: prev.totalDensity + (b.business_density_200m || 0),
      totalCompetitors:
        prev.totalCompetitors + (b.competitor_density_200m || 0),
    });
  });

  const stats: CategoryStat[] = [];

  map.forEach((value, key) => {
    stats.push({
      category: key,
      count: value.count,
      avgBusinessDensity:
        value.count > 0 ? Math.round(value.totalDensity / value.count) : 0,
      avgCompetitors:
        value.count > 0 ? Math.round(value.totalCompetitors / value.count) : 0,
    });
  });

  // Sort by count desc
  stats.sort((a, b) => b.count - a.count);

  return stats;
}

function buildZoneStats(businesses: BusinessRow[]): ZoneStat[] {
  const map = new Map<string, number>();

  businesses.forEach((b) => {
    const key = b.zone_type || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  const stats: ZoneStat[] = [];
  map.forEach((value, key) => {
    stats.push({ zone: key, count: value });
  });

  return stats;
}

function classifyGapLevel(gapScore: number): GapLevel {
  if (gapScore >= 15) return "High";
  if (gapScore >= 5) return "Medium";
  return "Low";
}

function buildMarketGaps(
  businesses: BusinessRow[],
  opportunities: Opportunity[]
): MarketGap[] {
  const map = new Map<
    string,
    { totalDemand: number; totalSupply: number; count: number }
  >();

  businesses.forEach((b) => {
    const key = b.general_category || "Uncategorized";
    const prev = map.get(key) ?? {
      totalDemand: 0,
      totalSupply: 0,
      count: 0,
    };

    map.set(key, {
      totalDemand: prev.totalDemand + (b.business_density_200m || 0),
      totalSupply: prev.totalSupply + (b.competitor_density_200m || 0),
      count: prev.count + 1,
    });
  });

  const gaps: MarketGap[] = [];

  map.forEach((value, key) => {
    if (value.count === 0) return;

    const demand = Math.round(value.totalDemand / value.count);
    const supply = Math.round(value.totalSupply / value.count);
    const gapScore = demand - supply;

    // recommended locations = opportunity streets of this category
    const recLocations = Array.from(
      new Set(
        opportunities
          .filter((o) => o.category === key)
          .map((o) => o.location)
      )
    ).slice(0, 3);

    gaps.push({
      category: key,
      demand,
      supply,
      gapScore,
      gapLevel: classifyGapLevel(gapScore),
      recommendedLocations: recLocations,
    });
  });

  // Sort by gapScore desc (bigger gap = more underserved)
  gaps.sort((a, b) => b.gapScore - a.gapScore);

  return gaps;
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export function OpportunitiesPage() {
  useActivity();
  const navigate = useNavigate();
  const [clusteringResults, setClusteringResults] =
    useState<ClusteringRow | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showAll, setShowAll] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);


  // Load latest clustering result and active businesses
  useEffect(() => {
    const loadData = async () => {
      const [clusterRes, bizRes] = await Promise.all([
        supabase
          .from("clustering_opportunities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("businesses") // adjust table name if needed
          .select("*")
          .eq("status", "Active"),
      ]);

      if (!clusterRes.error && clusterRes.data) {
        setClusteringResults(clusterRes.data as ClusteringRow);
      }

      if (!bizRes.error && bizRes.data) {
        setBusinesses(bizRes.data as BusinessRow[]);
      }

      setLoading(false);
    };

    loadData();
  }, []);

// ----------------------------------------
// LOADING SCREEN
// ----------------------------------------
if (loading) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      Loading opportunities...
    </div>
  );
}


  if (!clusteringResults || !clusteringResults.locations) {
    return (
      <Card className="p-12 text-center">
        <p>No stored opportunities yet.</p>
      </Card>
    );
  }

  const businessType = clusteringResults.business_category;
  const numClusters = clusteringResults.num_clusters ?? 0;

  // Build opportunities array
  const opportunities: Opportunity[] = clusteringResults.locations.map(
    (loc: any): Opportunity => {
      const businessDensity: number = loc.business_density_200m;
      const competitors: number = loc.competitor_density_200m;

      return {
        title: `${businessType} near ${loc.street}`,
        category: loc.general_category,
        location: loc.street,
        businessDensity,
        competitors,
        zone_type: loc.zone_type,
        saturation: computeSaturation(businessDensity, competitors),
        score: computeOpportunityScore(
          businessDensity,
          competitors,
          loc.zone_type
        ),
        cluster: loc.cluster,
        coordinates: {
          lat: loc.latitude,
          lng: loc.longitude,
        },
        insights: generateInsights({
          businessDensity,
          competitors,
          zone_type: loc.zone_type,
        }),
      };
    }
  );

  const displayedOps = showAll ? opportunities : opportunities.slice(0, 5);
  const kpis = calculateKPIs(opportunities);

  // Overview + Market Gap derived data
  const categoryStats = buildCategoryStats(businesses);
  const zoneStats = buildZoneStats(businesses);
  const totalBusinesses = businesses.length;

  const marketGaps = buildMarketGaps(businesses, opportunities);

  const topCategory = categoryStats[0];
  const lowestCompetition = [...categoryStats].sort(
    (a, b) => a.avgCompetitors - b.avgCompetitors
  )[0];

  // ---------------------------------------------------------------------------
  // EXPORT FUNCTIONS (Opportunities list only)
  // ---------------------------------------------------------------------------

  const exportCSV = () => {
    const rows = opportunities.map((o: Opportunity) => ({
      Title: o.title,
      Category: o.category,
      Cluster: o.cluster,
      BusinessDensity: o.businessDensity,
      Competitors: o.competitors,
      ZoneType: o.zone_type,
      Saturation: `${o.saturation}%`,
      Score: `${o.score}%`,
      Latitude: o.coordinates.lat,
      Longitude: o.coordinates.lng,
      Insights: o.insights.join(" | "),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "opportunities.csv";
    a.click();
    
  toast.success("Exported report as CSV");
  logActivity("Exported Opportunities Report", { format: "CSV" });
  };

  const exportExcel = () => {
    const rows = opportunities.map((o: Opportunity) => ({
      Title: o.title,
      Category: o.category,
      Cluster: o.cluster,
      BusinessDensity: o.businessDensity,
      Competitors: o.competitors,
      ZoneType: o.zone_type,
      Saturation: `${o.saturation}%`,
      Score: `${o.score}%`,
      Latitude: o.coordinates.lat,
      Longitude: o.coordinates.lng,
      Insights: o.insights.join(" | "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Opportunities");
    XLSX.writeFile(workbook, "opportunities.xlsx");
     toast.success("Exported report as Excel");
  logActivity("Exported Opportunities Report", { format: "Excel" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Business Opportunities Report", 14, 10);

    const rows = opportunities.map((o: Opportunity) => [
      o.title,
      o.category,
      o.cluster,
      o.businessDensity,
      o.competitors,
      o.zone_type,
      `${o.saturation}%`,
      `${o.score}%`,
      o.coordinates.lat,
      o.coordinates.lng,
    ]);

    autoTable(doc, {
      head: [
        [
          "Title",
          "Category",
          "Cluster",
          "Density",
          "Competitors",
          "Zone",
          "Saturation",
          "Score",
          "Lat",
          "Lng",
        ],
      ],
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save("opportunities.pdf");
     toast.success("Exported report as PDF");
  logActivity("Exported Opportunities Report", { format: "PDF" });
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Business Opportunities</h2>
          <p className="text-muted-foreground">
            Recommended insights for: <strong>{businessType}</strong>
          </p>
        </div>

        <Badge variant="outline">Based on {numClusters} clusters</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{kpis.totalOpportunities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Business Density</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{kpis.avgBusinessDensity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{kpis.avgCompetition}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commercial Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {zoneStats.find((z) => z.zone === "Commercial")?.count ??
                0}{" "}
              / {totalBusinesses}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="market-gaps">Market Gaps</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Category distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Business Category Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current businesses in your study area (Active only)
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="border rounded-lg p-4 flex flex-col gap-1"
                >
                  <p className="text-sm font-medium">{cat.category}</p>
                  <p className="text-2xl font-semibold">{cat.count}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg. businesses density: {cat.avgBusinessDensity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg. competitors: {cat.avgCompetitors}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Zone distribution + quick insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Where most active businesses are located
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {zoneStats.map((zone) => {
                  const percent =
                    totalBusinesses > 0
                      ? Math.round((zone.count / totalBusinesses) * 100)
                      : 0;
                  return (
                    <div key={zone.zone} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{zone.zone}</span>
                        <span>
                          {zone.count} ({percent}%)
                        </span>
                      </div>
                      <Progress value={percent} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Top Category</p>
                    <p className="text-xs text-muted-foreground">
                      {topCategory
                        ? `${topCategory.category} has the most active businesses (${topCategory.count}).`
                        : "No active businesses found."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <Store className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Lowest Competition</p>
                    <p className="text-xs text-muted-foreground">
                      {lowestCompetition
                        ? `${lowestCompetition.category} has relatively low competitor presence but active businesses — good for new entrants.`
                        : "Not enough data to compute competition."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                  <Activity className="w-4 h-4 mt-0.5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Business Density</p>
                    <p className="text-xs text-muted-foreground">
                      Average of {kpis.avgBusinessDensity} nearby businesses
                      around your recommended locations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OPPORTUNITIES TAB */}
        <TabsContent value="opportunities" className="space-y-5">
          {/* Export button */}
          <button
  onClick={() => setShowExportModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
>
  <FileDown className="w-4 h-4" />
  Export Report
</button>


          {/* Export Modal */}
          {openExportModal && (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" />
              <div className="fixed z-50 bg-white p-6 rounded-xl shadow-xl w-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <h2 className="text-lg font-semibold mb-1">Export Report</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a file format. PDF is best for sharing. Excel and CSV
                  are best for editing.
                </p>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full flex justify-start gap-2"
                    onClick={exportCSV}
                  >
                    <FileType className="w-4 h-4 text-green-600" />
                    Export as CSV
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex justify-start gap-2"
                    onClick={exportExcel}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Export as Excel (.xlsx)
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex justify-start gap-2"
                    onClick={exportPDF}
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    Export as PDF
                  </Button>
                </div>

                <Button
                  className="w-full mt-5 bg-black text-white hover:bg-neutral-800"
                  onClick={() => setOpenExportModal(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}

          {/* Opportunity Cards */}
          {displayedOps.map((op: Opportunity, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge variant="default">Cluster {op.cluster}</Badge>
                    <Badge variant="secondary">Score: {op.score}%</Badge>
                  </div>

                  <CardTitle>{op.title}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="size-4" /> {op.location}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Store className="size-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">
                      Business Density
                    </p>
                    <div className="text-lg">{op.businessDensity}</div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <TrendingDown className="size-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">Competitors</p>
                    <div className="text-lg">{op.competitors}</div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Zone Type</p>
                    <Badge variant="outline">{op.zone_type}</Badge>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Activity className="size-4 text-orange-600" />
                    <p className="text-xs text-muted-foreground">Saturation</p>
                    <div className="text-lg">{op.saturation}%</div>
                  </div>
                </div>

                {/* Insights */}
                <div>
                  <h4 className="text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="size-4 text-yellow-600" />
                    Key Insights & Recommendations
                  </h4>

                  <div className="grid md:grid-cols-2 gap-3">
                    {op.insights.map((txt: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-muted/30 rounded text-sm"
                      >
                        {txt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    📍 {op.coordinates.lat.toFixed(5)}°,{" "}
                    {op.coordinates.lng.toFixed(5)}°
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate("/user/dashboard/map", {
                        state: {
                          lat: op.coordinates.lat,
                          lng: op.coordinates.lng,
                          label: op.title,
                        },
                      })
                    }
                  >
                    View on Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {opportunities.length > 5 && !showAll && (
            <Button className="w-full mt-4" onClick={() => setShowAll(true)}>
              Show More
            </Button>
          )}
        </TabsContent>

        {/* MARKET GAPS TAB */}
        <TabsContent value="market-gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Underserved Business Categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categories with higher demand (business activity) than supply
                (competitors) based on your active businesses.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketGaps.map((gap) => {
                const maxValue = Math.max(gap.demand, gap.supply, 1);
                const demandPercent = Math.round(
                  (gap.demand / maxValue) * 100
                );
                const supplyPercent = Math.round(
                  (gap.supply / maxValue) * 100
                );

                return (
                  <div
                    key={gap.category}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {gap.category}
                          </p>
                          <Badge
                            variant={
                              gap.gapLevel === "High"
                                ? "default"
                                : gap.gapLevel === "Medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {gap.gapLevel} Gap
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Demand minus supply score: {gap.gapScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">
                          {gap.demand}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg. demand index
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Market Demand</span>
                        <span>{gap.demand}</span>
                      </div>
                      <Progress value={demandPercent} />

                      <div className="flex justify-between text-xs">
                        <span>Current Supply (Competitors)</span>
                        <span>{gap.supply}</span>
                      </div>
                      <Progress value={supplyPercent} />
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        Recommended Locations:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {gap.recommendedLocations.length > 0 ? (
                          gap.recommendedLocations.map((loc) => (
                            <Badge
                              key={loc}
                              variant="outline"
                              className="text-xs"
                            >
                              {loc}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No specific recommended streets yet for this
                            category.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
