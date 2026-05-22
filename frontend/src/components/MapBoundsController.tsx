import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapBoundsControllerProps = {
  bounds: [number, number][] | null;
  enabled?: boolean;
};

export function MapBoundsController({ bounds, enabled = true }: MapBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !bounds || bounds.length === 0) {
      return;
    }

    if (bounds.length === 1) {
      map.flyTo(bounds[0], Math.max(map.getZoom(), 16), {
        animate: true,
        duration: 0.8
      });
      return;
    }

    map.fitBounds(bounds, {
      animate: true,
      duration: 0.8,
      padding: [34, 34],
      maxZoom: 17
    });
  }, [bounds, enabled, map]);

  return null;
}
