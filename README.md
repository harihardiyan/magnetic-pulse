
# Magnetic Pulse: Global Geomagnetic Analytical Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![IGRF-14](https://img.shields.io/badge/Model-IGRF--14-blue)](https://www.ngdc.noaa.gov/IAGA/vmod/igrf.html)
[![Version](https://img.shields.io/badge/Version-1.0.0-emerald)](https://github.com/harihardiyan/magnetic-pulse)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-repo-id/deploy-status)](https://www.netlify.com)

**Magnetic Pulse** is a high-precision geophysical dashboard designed for the analysis and visualization of Earth's magnetic field. Powered by the **IGRF-14 (International Geomagnetic Reference Field)** model, this toolkit provides researchers, navigators, and hobbyists with accurate data regarding magnetic declination, inclination, and field intensity across a temporal range from 1900 to 2030.

---

## 🔬 The Engine: Scientific Foundation

At the heart of this application lies a custom implementation of the **IGRF-14** international reference model. 

### Mathematical Approach
The dashboard utilizes a simplified spherical harmonic expansion to calculate the geomagnetic field vector components ($X, Y, Z$) at any given geodetic coordinate. The model accounts for:
*   **Main Field Dynamics**: Calculating the core-generated magnetic field using coefficients provided by the International Association of Geomagnetism and Aeronomy (IAGA).
*   **Secular Variation (SV)**: Predicting the annual drift of magnetic poles through 1st-order temporal derivatives.
*   **Geodetic to Geocentric Transformation**: Utilizing the **WGS84 ellipsoid** to transform user coordinates into geocentric space for precise mathematical modeling.

---

## 🚀 Key Features

### 1. Interactive 3D Holographic Engine
A bespoke 3D visualization of the Earth using **D3.js** and **TopoJSON**.
*   **Precision Navigation**: Optimized for both Desktop (Scroll-to-Zoom) and Mobile (Dedicated UI controls).
*   **Real-time Tracking**: Visualizes the Target location alongside the Geodetic North and the drifting Magnetic North Pole.

### 2. Temporal Pulse Analysis
*   **Historical Trends**: Analyze magnetic field mutations from 1900 up to 2030 predictions.
*   **Interactive Charting**: A dynamic SVG-based time-series graph allowing users to scrub through a century of geomagnetic data.

### 3. Professional Archival Suite (SSS-Grade Reports)
*   **PDF Export**: Generate high-fidelity scientific reports including geodetic reference data and absolute magnetic components.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Bundler**: Vite
*   **Visualization**: D3.js v7
*   **Reporting**: jsPDF, autoTable

---

## 📖 Deployment Guide

### Deploy to Netlify (Recommended)

1.  **Push code to GitHub**:
    Create a new repository and push all files including the newly added `netlify.toml` and `package.json`.
2.  **Connect to Netlify**:
    - Log in to [Netlify](https://app.netlify.com).
    - Select **"Add new site"** > **"Import an existing project"**.
    - Choose **GitHub** and select the `magnetic-pulse` repository.
3.  **Build Settings**:
    Netlify will automatically detect the settings from `netlify.toml`:
    - **Build Command**: `npm run build`
    - **Publish directory**: `dist`
4.  **Deploy**: Click **"Deploy site"**. Your toolkit will be live in seconds!

### Local Development

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/harihardiyan/magnetic-pulse.git
    npm install
    ```

2.  **Run Dev Server**:
    ```bash
    npm run dev
    ```

---

## 👤 Author

**Hari Hardiyan**  
Geophysical Software Engineer  
📧 [lorozloraz@gmail.com](mailto:lorozloraz@gmail.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
