import * as L from "leaflet";

declare module "leaflet" {
    function markerClusterGroup(options?: any): L.MarkerClusterGroup;
}
