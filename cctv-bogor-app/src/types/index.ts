export type DensityLabel = 'Lancar' | 'Sedang' | 'Padat';

export interface CCTVLocation {
  id: string;
  nama: string;
  lat: number;
  lon: number;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance';
  description?: string;
  sequence_order?: number;
  threshold_low?: number;
  threshold_high?: number;
}

export interface AlternativeRoute {
  route_name: string;
  description: string;
  maps_url: string;
  estimated_time: string;
}

// Response from FastAPI POST /api/analyze
// vehicle_count is intentionally excluded — kept server-side only
export interface AnalyzeResponse {
  success: boolean;
  traffic_label: DensityLabel;
  recommendation: string;
  alternative_routes: AlternativeRoute[];
  peak_hours: string;
  cached: boolean;
  timestamp: string;
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface VideoStreamConfig {
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  width: string | number;
  height?: string | number;
}
