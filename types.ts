
export interface SecularVariation {
  dX: number;
  dY: number;
  dZ: number;
  dF: number;
  dH: number;
  dD: number; // arc-minutes/year
  dI: number; // arc-minutes/year
}

export interface GeomagneticResult {
  X: number; // North component (nT)
  Y: number; // East component (nT)
  Z: number; // Vertical component (nT)
  F: number; // Total Intensity (nT)
  H: number; // Horizontal Intensity (nT)
  D: number; // Declination (degrees)
  I: number; // Inclination (degrees)
  sv: SecularVariation;
}

export interface HistoricalPoint {
  year: number;
  D: number;
  F: number;
}

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
  display_name: string;
}

export interface CalculationState {
  loading: boolean;
  error: string | null;
  result: GeomagneticResult | null;
  history: HistoricalPoint[] | null;
  location: LocationInfo | null;
  year: number;
}
