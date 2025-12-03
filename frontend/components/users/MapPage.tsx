import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,

} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { MapPin, Filter, RefreshCcw ,Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { LOCATION_INFO } from "../../data/businesses";
import { useActivity, logActivity } from "../../utils/activity";
import { toast } from "sonner";


// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
type Business = {
  id: number;
  business_name: string;
  general_category: string;
  zone_type: string;
  street: string | null;
  latitude: number;
  longitude: number;
};

// ---------------------------------------------------------
// CATEGORY COLORS
// ---------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverages": "#0ea5e9",          // Sky Blue
  Retail: "#10b981",
  Services: "#f59e0b",
  "Merchandising / Trading": "#ef4444",
  "Entertainment / Leisure": "#a78bfa",
  Miscellaneous: "#475569",
};





// ---------------------------------------------------------
// NORMALIZATION (prevents duplicate legend entries)
// ---------------------------------------------------------
function normalizeCategory(raw?: string | null): string {
  if (!raw) return "Miscellaneous";

  const cleaned = raw.trim();

  const allowed = [
    "Food & Beverages",
    "Retail",
    "Services",
    "Merchandising / Trading",
    "Entertainment / Leisure",
    "Miscellaneous",
  ];

  if (allowed.includes(cleaned)) return cleaned;

  return "Miscellaneous";
}


// ---------------------------------------------------------
// BOUNDARY LIMITS (same as ClusteringPage)
// ---------------------------------------------------------
const BRGY_BOUNDS = {
  minLat: 14.8338,
  maxLat: 14.8413,
  minLng: 120.9518,
  maxLng: 120.9608,
};

function clampToStaCruz(lat: number, lng: number) {
  return {
    latitude: Math.min(Math.max(lat, BRGY_BOUNDS.minLat), BRGY_BOUNDS.maxLat),
    longitude: Math.min(
      Math.max(lng, BRGY_BOUNDS.minLng),
      BRGY_BOUNDS.maxLng
    ),
  };
}

// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------
export function MapPage() {
  useActivity();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const clusterLayer = useRef<any>(null);
const { state } = useLocation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [totalMarkers, setTotalMarkers] = useState(0);
  const [isLeafletReady, setIsLeafletReady] = useState(false);


  
  // ---------------------------------------------------------
  // LOAD SUPABASE DATA
  // ---------------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("businesses").select("*");

      if (error) {
        console.error("Error loading businesses:", error);
        return;
      }

      const list = (data || []) as Business[];

      const valid = list.filter(
        (b) =>
          typeof b.latitude === "number" &&
          typeof b.longitude === "number" &&
          !isNaN(b.latitude) &&
          !isNaN(b.longitude)
      );

      setBusinesses(valid);

      const uniqueCats = Array.from(
        new Set(
          valid
            .map((b) => normalizeCategory(b.general_category))
            .filter((c) => c && c.trim() !== "")
        )
      );
      setCategories(uniqueCats);
    }

    load();
  }, []);

  // ---------------------------------------------------------
  // LOAD LEAFLET
  // ---------------------------------------------------------
  useEffect(() => {
    const loadLeaflet = async () => {
      const w = window as any;
      if (w.L && w.L.markerClusterGroup) {
        setIsLeafletReady(true);
        return;
      }

      const addCSS = (href: string) => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = href;
        document.head.appendChild(l);
      };

      addCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      addCSS(
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
      );
      addCSS(
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
      );

      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src =
          "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

      setIsLeafletReady(true);
    };

    loadLeaflet();
  }, []);

  // ---------------------------------------------------------
  // INIT MAP
  // ---------------------------------------------------------
  useEffect(() => {
    if (!isLeafletReady || !businesses.length || leafletMap.current) return;
    initMap();
    renderClusters(businesses);
  }, [isLeafletReady, businesses]);

  const initMap = () => {
    const L = (window as any).L;

    const map = L.map(mapRef.current!).setView(
      [LOCATION_INFO.center_latitude, LOCATION_INFO.center_longitude],
      15
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    map.setMaxBounds([
      [BRGY_BOUNDS.minLat - 0.002, BRGY_BOUNDS.minLng - 0.002],
      [BRGY_BOUNDS.maxLat + 0.002, BRGY_BOUNDS.maxLng + 0.002],
    ]);

    leafletMap.current = map;
  };

  // ---------------------------------------------------------
  // RENDER BUSINESS MARKERS
  // ---------------------------------------------------------
  const renderClusters = (data: Business[]) => {
    const L = (window as any).L;

    if (!leafletMap.current) return;

    if (clusterLayer.current)
      leafletMap.current.removeLayer(clusterLayer.current);

    const clusters = L.markerClusterGroup({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 17,
    });

    const bounds = L.latLngBounds([]);

    data.forEach((b) => {
      const cleanCategory = normalizeCategory(b.general_category);
      const color = CATEGORY_COLORS[cleanCategory] || "#6b7280";

      const safe = clampToStaCruz(b.latitude, b.longitude);

      const marker = L.circleMarker([safe.latitude, safe.longitude], {
  radius: 8,
  fillColor: color,
  color: "#fff",
  weight: 2,
  fillOpacity: 0.9,
})
  // 👇 ADD THIS CLICK EVENT
  .on("click", () => {
    toast.message(`Viewing: ${b.business_name}`);

    logActivity("Viewed Business Marker", {
      business_name: b.business_name,
      category: cleanCategory,
      zone: b.zone_type,
      street: b.street,
    });
  })

  // keep your popup — no changes
  .bindPopup(`
    <strong>${b.business_name}</strong><br/>
    <span style="color:${color};font-weight:600;">${cleanCategory}</span><br/>
    <small>${b.street ?? ""}</small><br/>
    <small>Zone: ${b.zone_type}</small>
  `);


      clusters.addLayer(marker);
      bounds.extend([safe.latitude, safe.longitude]);
    });

    leafletMap.current.addLayer(clusters);
    clusterLayer.current = clusters;

    if (bounds.isValid()) {
      leafletMap.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    setTotalMarkers(data.length);
  };

  // ---------------------------------------------------------
  // FILTERS
  // ---------------------------------------------------------
  useEffect(() => {
    if (!leafletMap.current) return;

    let filtered = businesses;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (b) =>
          normalizeCategory(b.general_category) === selectedCategory
      );
    }

    if (selectedZone !== "all") {
      filtered = filtered.filter((b) => b.zone_type === selectedZone);
    }

    renderClusters(filtered);
  }, [selectedCategory, selectedZone]);

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------
  const resetView = () => {
  setSelectedCategory("all");
  setSelectedZone("all");
  renderClusters(businesses);

  toast.success("Map view reset");
  logActivity("Reset Map View");
};




// ---------------------------
// MAP LOADING SCREEN
// ---------------------------
if (!isLeafletReady || businesses.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      Loading map...
    </div>
  );
}

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Map Filters
          </CardTitle>
          <CardDescription>
            Filter businesses by category and zone type
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Business Category</Label>
              <Select
  value={selectedCategory}
  onValueChange={(value) => {
    setSelectedCategory(value);
    toast.info(
      value === "all"
        ? "Showing all business categories"
        : `Filtered by category: ${value}`
    );
    logActivity("Filtered Map by Category", { category: value });
  }}
>

                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone */}
            <div className="space-y-2">
              <Label>Zone Type</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={resetView} variant="outline">
              <RefreshCcw className="w-4 h-4" /> Reset Map View
            </Button>

            <Badge variant="secondary" className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Showing {totalMarkers} of {businesses.length} businesses
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Business Map</CardTitle>
          <CardDescription>
            Click markers to view business details. Red marker indicates
            barangay center.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full h-[600px] rounded-lg border border-border"
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {categories.map((category) => {
  const color = CATEGORY_COLORS[category] || "#6b7280"; // fallback gray

  return (
    <div key={category} className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm">{category}</span>
    </div>
  );
})}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
