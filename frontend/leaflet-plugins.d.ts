import * as L from "leaflet";

declare module "leaflet" {
    interface MarkerClusterGroupOptions {
        maxClusterRadius?: number;
        disableClusteringAtZoom?: number;
        spiderfyOnMaxZoom?: boolean;
        showCoverageOnHover?: boolean;
        zoomToBoundsOnClick?: boolean;
        singleMarkerMode?: boolean;
        animate?: boolean;
    }
    function markerClusterGroup(options?: MarkerClusterGroupOptions): L.MarkerClusterGroup;
}
