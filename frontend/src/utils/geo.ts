export type LatLngTuple = [number, number];

const earthRadiusMeters = 6_371_000;

export function isPointInsidePolygon(point: LatLngTuple, polygon: LatLngTuple[]) {
  let inside = false;
  const [x, y] = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function calculatePolygonAreaHectares(points: LatLngTuple[]) {
  if (points.length < 3) {
    return 0;
  }

  const averageLatitudeRadians =
    (points.reduce((total, [latitude]) => total + latitude, 0) / points.length) * (Math.PI / 180);
  const projected = points.map(([latitude, longitude]) => {
    const x = earthRadiusMeters * longitude * (Math.PI / 180) * Math.cos(averageLatitudeRadians);
    const y = earthRadiusMeters * latitude * (Math.PI / 180);
    return [x, y] as const;
  });

  const areaSquareMeters = Math.abs(
    projected.reduce((total, [x, y], index) => {
      const [nextX, nextY] = projected[(index + 1) % projected.length];
      return total + x * nextY - nextX * y;
    }, 0) / 2
  );

  return areaSquareMeters / 10_000;
}

export function formatAreaHectares(points: LatLngTuple[]) {
  const area = calculatePolygonAreaHectares(points);

  if (area === 0) {
    return "0 ha";
  }

  if (area < 1) {
    return `${area.toFixed(3)} ha`;
  }

  return `${area.toFixed(2)} ha`;
}
