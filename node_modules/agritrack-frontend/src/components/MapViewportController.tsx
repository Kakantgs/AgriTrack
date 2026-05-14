import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapViewportControllerProps = {
  center: [number, number];
  enabled: boolean;
};

export function MapViewportController({ center, enabled }: MapViewportControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    map.flyTo(center, map.getZoom(), {
      animate: true,
      duration: 0.8
    });
  }, [center, enabled, map]);

  return null;
}
