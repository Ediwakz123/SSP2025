import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/* ---------------------- Types ---------------------- */
type Business = {
  id: number;
  business_name: string;
  category: string;
  zone_type: string;
  street?: string;
};

type CategoryCount = { category: string; count: number };
type ZoneCount = { zone_type: string; count: number };
type StreetCount = { street: string; count: number };

type ClusterCentroid = {
  cluster_id: number;
  latitude: number;
  longitude: number;
  density: number;
  color: string;
};

/* ---------------------- Component ---------------------- */
export default function AnalyticsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [zones, setZones] = useState<ZoneCount[]>([]);
  const [streets, setStreets] = useState<StreetCount[]>([]);
  const [clusterCentroids, setClusterCentroids] = useState<ClusterCentroid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        undefined;

      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(`${API_BASE}/analytics`, { headers });
      const data = await res.json();

      setBusinesses(data.businesses || []);
      setCategories(data.categoryCounts || []);
      setZones(data.zoneCounts || []);
      setStreets(data.streetCounts || []);
      setClusterCentroids(data.clusterCentroids || []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading analytics…
      </div>
    );
  }

  const totalBusinesses = businesses.length;
  const totalCategories = categories.length;
  const avgPerCategory =
    totalCategories > 0 ? (totalBusinesses / totalCategories).toFixed(1) : 0;

  const zoneData = zones.map((z) => ({
    name: z.zone_type,
    value: z.count,
  }));

  const ZONE_COLORS = ["#3B82F6", "#EF4444"];

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Businesses</CardTitle>
            <CardDescription>Registered businesses in area</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalBusinesses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Categories</CardTitle>
            <CardDescription>Unique business types</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalCategories}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. per Category</CardTitle>
            <CardDescription>Business density metric</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{avgPerCategory}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Business Distribution by Category</CardTitle>
          <CardDescription>
            Number of businesses in each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categories}>
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Zone Types */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Type Distribution</CardTitle>
          <CardDescription>Commercial vs Residential zones</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="60%" height={300}>
            <PieChart>
              <Pie
                data={zoneData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {zoneData.map((entry, i) => (
                  <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Streets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Business Locations</CardTitle>
          <CardDescription>Streets with highest business concentration</CardDescription>
        </CardHeader>
        <CardContent>
          {streets.map((s, i) => (
            <div key={i} className="flex items-center justify-between border-b py-2">
              <span>{s.street}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cluster Centroids Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Cluster Centroids Geographic Distribution</CardTitle>
          <CardDescription>
            Real-time cluster visualization based on seed + user-uploaded business data.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {clusterCentroids.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cluster data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="longitude"
                  name="Longitude"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="latitude"
                  name="Latitude"
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => {
                    if (name === "density") return [`${value}`, "Businesses in Cluster"];
                    if (name === "cluster_id") return [`Cluster ${value}`, "Cluster"];
                    return [value, name];
                  }}
                />

                {clusterCentroids.map((cluster, index) => (
                  <Scatter
                    key={index}
                    name={`Cluster ${cluster.cluster_id}`}
                    data={[cluster]}
                    fill={cluster.color}
                    stroke={cluster.color}
                    shape="circle"
                    radius={cluster.density * 3}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
