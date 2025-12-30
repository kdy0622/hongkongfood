
export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface TravelGuideResult {
  content: string;
  sources: GroundingSource[];
}

export interface AppState {
  query: string;
  loading: boolean;
  result: TravelGuideResult | null;
  error: string | null;
}
