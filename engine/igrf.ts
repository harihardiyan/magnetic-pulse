
import { IGRF14_COEFFS } from './igrf_coeffs';
import { GeomagneticResult, SecularVariation } from '../types';

export class IGRF14Engine {
  private a_wgs84 = 6378137.0;
  private f_wgs84 = 1 / 298.257223563;
  private e2 = this.f_wgs84 * (2 - this.f_wgs84);
  private a_re = 6371200.0;

  private getInterpolatedCoeffs(year: number) {
    const epochs = IGRF14_COEFFS.epochs;
    const maxDegree = IGRF14_COEFFS.g_data[2025].length - 1;
    
    let g = Array.from({ length: maxDegree + 1 }, () => new Array(maxDegree + 1).fill(0));
    let h = Array.from({ length: maxDegree + 1 }, () => new Array(maxDegree + 1).fill(0));

    if (year >= 2025) {
      const dt = year - 2025;
      const g2025 = IGRF14_COEFFS.g_data[2025];
      const h2025 = IGRF14_COEFFS.h_data[2025];
      const gsv = IGRF14_COEFFS.g_sv;
      const hsv = IGRF14_COEFFS.h_sv;

      for (let n = 1; n <= maxDegree; n++) {
        for (let m = 0; m <= n; m++) {
          g[n][m] = g2025[n][m] + gsv[n][m] * dt;
          h[n][m] = (h2025[n][m] || 0) + (hsv[n][m] || 0) * dt;
        }
      }
    } else {
      // Find bounding epochs
      let i = 0;
      while (i < epochs.length - 1 && epochs[i + 1] <= year) i++;
      
      const t0 = epochs[i];
      const t1 = epochs[i + 1];
      const frac = (year - t0) / (t1 - t0);

      const g0 = IGRF14_COEFFS.g_data[t0 as keyof typeof IGRF14_COEFFS.g_data];
      const g1 = IGRF14_COEFFS.g_data[t1 as keyof typeof IGRF14_COEFFS.g_data];
      const h0 = IGRF14_COEFFS.h_data[t0 as keyof typeof IGRF14_COEFFS.h_data];
      const h1 = IGRF14_COEFFS.h_data[t1 as keyof typeof IGRF14_COEFFS.h_data];

      for (let n = 1; n <= maxDegree; n++) {
        for (let m = 0; m <= n; m++) {
          g[n][m] = g0[n][m] + frac * (g1[n][m] - g0[n][m]);
          h[n][m] = (h0[n][m] || 0) + frac * ((h1[n][m] || 0) - (h0[n][m] || 0));
        }
      }
    }
    return { g, h };
  }

  private computeAt(lat: number, lon: number, alt: number, year: number) {
    const phi = (lat * Math.PI) / 180;
    const s_phi = Math.sin(phi);
    const N_c = this.a_wgs84 / Math.sqrt(1 - this.e2 * Math.pow(s_phi, 2));
    
    const rho = (N_c + alt) * Math.cos(phi);
    const z = (N_c * (1 - this.e2) + alt) * s_phi;
    const r = Math.sqrt(Math.pow(rho, 2) + Math.pow(z, 2));
    const theta_gc = Math.atan2(rho, z);
    const psi = phi - Math.asin(z / r);

    const { g, h } = this.getInterpolatedCoeffs(year);
    const maxDegree = g.length - 1;

    const P = Array.from({ length: maxDegree + 1 }, () => new Array(maxDegree + 1).fill(0));
    const dP = Array.from({ length: maxDegree + 1 }, () => new Array(maxDegree + 1).fill(0));

    const costh = Math.cos(theta_gc);
    const sinth = Math.sin(theta_gc);

    P[0][0] = 1.0;
    P[1][0] = costh;
    P[1][1] = sinth;
    dP[1][0] = -sinth;
    dP[1][1] = costh;

    for (let n = 2; n <= maxDegree; n++) {
      P[n][0] = ((2 * n - 1) * costh * P[n - 1][0] - (n - 1) * P[n - 2][0]) / n;
      dP[n][0] = ((2 * n - 1) * (costh * dP[n - 1][0] - sinth * P[n - 1][0]) - (n - 1) * dP[n - 2][0]) / n;
      for (let m = 1; m <= n; m++) {
        if (n === m) {
          const f = Math.sqrt(1.0 - 0.5 / n);
          P[n][n] = f * sinth * P[n - 1][n - 1];
          dP[n][n] = f * (sinth * dP[n - 1][n - 1] + costh * P[n - 1][n - 1]);
        } else {
          const gnm = Math.sqrt(n * n - m * m);
          const gn1m = Math.sqrt((n - 1) * (n - 1) - m * m);
          P[n][m] = ((2 * n - 1) * costh * P[n - 1][m] - gn1m * P[n - 2][m]) / gnm;
          dP[n][m] = ((2 * n - 1) * (costh * dP[n - 1][m] - sinth * P[n - 1][m]) - gn1m * dP[n - 2][m]) / gnm;
        }
      }
    }

    let Br = 0, Bt = 0, Bp = 0;
    const lam = (lon * Math.PI) / 180;

    for (let n = 1; n <= maxDegree; n++) {
      const re_r = Math.pow(this.a_re / r, n + 2);
      for (let m = 0; m <= n; m++) {
        const cm = Math.cos(m * lam);
        const sm = Math.sin(m * lam);
        const gh = g[n][m] * cm + h[n][m] * sm;
        Br += (n + 1) * re_r * gh * P[n][m];
        Bt -= re_r * gh * dP[n][m];
        if (m > 0) {
          Bp += (re_r * m * (g[n][m] * sm - h[n][m] * cm) * P[n][m]) / (sinth + 1e-15);
        }
      }
    }

    const X_gc = -Bt;
    const Z_gc = -Br;
    const X = X_gc * Math.cos(psi) - Z_gc * Math.sin(psi);
    const Y = Bp;
    const Z = X_gc * Math.sin(psi) + Z_gc * Math.cos(psi);
    const H = Math.sqrt(X * X + Y * Y);
    const F = Math.sqrt(H * H + Z * Z);
    const D = (Math.atan2(Y, X) * 180) / Math.PI;
    const I = (Math.atan2(Z, H) * 180) / Math.PI;

    return { X, Y, Z, F, H, D, I };
  }

  public solve(lat: number, lon: number, alt: number, year: number): GeomagneticResult {
    const now = this.computeAt(lat, lon, alt, year);
    const next = this.computeAt(lat, lon, alt, year + 1.0);

    const sv: SecularVariation = {
      dX: next.X - now.X,
      dY: next.Y - now.Y,
      dZ: next.Z - now.Z,
      dF: next.F - now.F,
      dH: next.H - now.H,
      dD: (next.D - now.D) * 60,
      dI: (next.I - now.I) * 60,
    };

    return { ...now, sv };
  }
}
