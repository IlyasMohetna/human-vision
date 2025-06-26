export interface Dataset {
  id: number;
  name: string;
  city_id: number;
  status_id: number;
  created_at: string;
  city: { id: number; name: string };
  status: { id: number; name: string };
  variant: { id: number; path: string };
  variant_count?: number;
}
