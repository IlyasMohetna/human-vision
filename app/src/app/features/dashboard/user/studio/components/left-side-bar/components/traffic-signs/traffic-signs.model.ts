export interface TrafficSignResponse {
  data: {
    dataset_id: number;
    image_path: string;
    results: TrafficSignResult[];
  };
}

export interface TrafficSignResult {
  objectId: string;
  predicted_label: string;
  accuracy: string;
  bounding_box: BoundingBox;
  crop_path: string;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}
