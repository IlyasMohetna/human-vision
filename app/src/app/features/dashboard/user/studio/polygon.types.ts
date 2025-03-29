export interface PolygonData {
  points: { x: number; y: number }[];
  type: 'high' | 'medium' | 'low';
  label?: string;
}

export interface PolygonDataMap {
  [id: string]: PolygonData;
}
