declare module "react-leaflet-heatmap-layer-v3" {
    import { LayerGroupProps } from "react-leaflet";
    import { LatLngTuple } from "leaflet";

    export interface HeatmapLayerProps extends LayerGroupProps {
        points: LatLngTuple[];
        longitudeExtractor: (point: LatLngTuple) => number;
        latitudeExtractor: (point: LatLngTuple) => number;
        intensityExtractor: (point: LatLngTuple) => number;
        radius?: number;
        blur?: number;
        max?: number;
        fitBoundsOnLoad?: boolean;
        fitBoundsOnUpdate?: boolean;
        minOpacity?: number;
        maxZoom?: number;
        gradient?: { [key: number]: string };
    }

    export const HeatmapLayer: React.FC<HeatmapLayerProps>;
}
