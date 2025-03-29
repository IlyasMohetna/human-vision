export interface PolygonData {
  objectId: string;
  label: string;
  polygon: [number, number][];
}

export interface ApiResponse {
  id: number;
  city: string;
  variants: {
    type: string;
    path: string;
  }[];
  meta: any;
  objects: PolygonData[];
  vehicle: any;
}
