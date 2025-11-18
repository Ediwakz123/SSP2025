import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { businesses, LOCATION_INFO, getUniqueCategories } from "../data/businesses";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { MapPin, Filter, RefreshCcw } from "lucide-react";

export function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const clusterLayer = useRef<any>(null);

    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedZone, setSelectedZone] = useState("all");
    const [totalMarkers, setTotalMarkers] = useState(0);

    const categories = getUniqueCategories();

    // ✅ Load and initialize Leaflet smoothly once
    useEffect(() => {
        const loadLeaflet = async () => {
            if (typeof window.L !== "undefined") {
                initMap();
                return;
            }

            const addCSS = (href: string) => {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = href;
                document.head.appendChild(link);
            };

            addCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
            addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
            addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");

            const leafletScript = document.createElement("script");
            leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            leafletScript.onload = () => {
                const clusterScript = document.createElement("script");
                clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
                clusterScript.onload = initMap;
                document.head.appendChild(clusterScript);
            };
            document.head.appendChild(leafletScript);
        };
        loadLeaflet();
    }, []);

    const initMap = () => {
        // @ts-ignore
        const L = window.L;
        if (!mapRef.current || leafletMap.current) return;

        const map = L.map(mapRef.current as HTMLElement, {
            zoomControl: true,
            attributionControl: false,
        }).setView(
            [LOCATION_INFO.center_latitude, LOCATION_INFO.center_longitude],
            15
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        // Barangay marker
        L.marker([LOCATION_INFO.center_latitude, LOCATION_INFO.center_longitude], {
            icon: L.divIcon({
                html: `<div style="background-color:#ef4444;width:26px;height:26px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
            }),
        })
            .addTo(map)
            .bindPopup(
                `<b>Brgy. ${LOCATION_INFO.barangay}</b><br>${LOCATION_INFO.municipality}, ${LOCATION_INFO.province}<br><small>Population: ${LOCATION_INFO.population.toLocaleString()}</small>`
            );

        leafletMap.current = map;
        renderClusters(businesses);
    };

    // ✅ Render live clusters
    const renderClusters = (data: typeof businesses) => {
        // @ts-ignore
        const L = window.L;
        if (!leafletMap.current) return;

        if (clusterLayer.current) leafletMap.current.removeLayer(clusterLayer.current);

        // @ts-ignore
        const clusters = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 60,
            disableClusteringAtZoom: 17,
            spiderfyDistanceMultiplier: 2,
        });

        const colorMap: Record<string, string> = {
            Hardware: "#3b82f6",
            Cafe: "#8b5cf6",
            Retail: "#10b981",
            Services: "#f59e0b",
            Restaurant: "#ef4444",
            Pharmacy: "#06b6d4",
            "Furniture Store": "#ec4899",
            Resort: "#84cc16",
            Bakery: "#f97316",
            "Pet Store": "#a855f7",
        };

        const bounds = L.latLngBounds([]);
        data.forEach((biz) => {
            const color = colorMap[biz.category] || "#6b7280";
            const marker = L.circleMarker([biz.latitude, biz.longitude], {
                radius: 8,
                fillColor: color,
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
            }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 220px;">
          <strong>${biz.business_name}</strong><br/>
          <span style="color:${color};font-weight:600;">${biz.category}</span><br/>
          <small>${biz.street}</small><br/>
          <small>Zone: ${biz.zone_type}</small><br/>
          <small style="color:#6b7280;">${biz.latitude.toFixed(5)}, ${biz.longitude.toFixed(5)}</small>
        </div>
      `);

            clusters.addLayer(marker);
            bounds.extend([biz.latitude, biz.longitude]);
        });

        leafletMap.current.addLayer(clusters);
        clusterLayer.current = clusters;

        if (bounds.isValid()) leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        setTotalMarkers(data.length);
    };

    // ✅ Dynamic updates
    useEffect(() => {
        if (!leafletMap.current) return;
        let filtered = businesses;

        if (selectedCategory !== "all")
            filtered = filtered.filter((b) => b.category === selectedCategory);
        if (selectedZone !== "all")
            filtered = filtered.filter((b) => b.zone_type === selectedZone);

        renderClusters(filtered);
    }, [selectedCategory, selectedZone]);

    // ✅ Reset button
    const resetView = () => {
        if (!leafletMap.current) return;
        leafletMap.current.setView(
            [LOCATION_INFO.center_latitude, LOCATION_INFO.center_longitude],
            15
        );
        setSelectedCategory("all");
        setSelectedZone("all");
        renderClusters(businesses);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="w-5 h-5" />
                        Map Filters
                    </CardTitle>
                    <CardDescription>Filter businesses by category and zone type</CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Business Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-input-background">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Zone Type</Label>
                            <Select value={selectedZone} onValueChange={setSelectedZone}>
                                <SelectTrigger className="bg-input-background">
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
                        <Button onClick={resetView} variant="outline" className="flex items-center gap-2">
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
                        Click on markers to view business details. Red marker indicates barangay center.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        ref={mapRef}
                        className="w-full h-[600px] rounded-lg border border-border"
                        style={{ zIndex: 0 }}
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
                            const colors: Record<string, string> = {
                                Hardware: "#3b82f6",
                                Cafe: "#8b5cf6",
                                Retail: "#10b981",
                                Services: "#f59e0b",
                                Restaurant: "#ef4444",
                                Pharmacy: "#06b6d4",
                                "Furniture Store": "#ec4899",
                                Resort: "#84cc16",
                                Bakery: "#f97316",
                                "Pet Store": "#a855f7",
                            };
                            const color = colors[category] || "#6b7280";
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
