import { useMapEvents } from "react-leaflet";

type MapEditorProps = {
  onAddPoint: (point: [number, number]) => void;
};

export function MapEditor({ onAddPoint }: MapEditorProps) {
  useMapEvents({
    click(event) {
      onAddPoint([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}
