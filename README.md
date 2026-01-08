# Magnetic Pulse: Global Geomagnetic Analytical Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![IGRF-14](https://img.shields.io/badge/Model-IGRF--14-blue)](https://www.ngdc.noaa.gov/IAGA/vmod/igrf.html)
[![Version](https://img.shields.io/badge/Version-1.0.0-emerald)](https://github.com/harihardiyan/magnetic-pulse)

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
*   **Atmospheric Rendering**: Advanced SVG filters providing a "holographic" aesthetic with depth-culling for back-face markers.

### 2. Temporal Pulse Analysis
*   **Historical Trends**: Analyze magnetic field mutations from 1900 up to 2030 predictions.
*   **Interactive Charting**: A dynamic SVG-based time-series graph allowing users to scrub through a century of geomagnetic data.

### 3. Professional Archival Suite 
*   **PDF Export**: Generate high-fidelity scientific reports including geodetic reference data, absolute magnetic components, and secular variation trends.
*   **Vector Rendering**: Exports current trend charts directly into the PDF for archival purposes.

### 4. Advanced Navigation Aid
*   **Dynamic Compass**: A real-time visualizer that accounts for local magnetic declination (deviation from True North), providing critical orientation data for field-work simulation.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Visualization**: D3.js v7, TopoJSON
*   **Styling**: Tailwind CSS
*   **Reporting**: jsPDF, autoTable
*   **Geodata**: OpenStreetMap (Nominatim API)

---

## 📖 Usage Instructions

### Local Development

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/harihardiyan/magnetic-pulse.git
    cd magnetic-pulse
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Execute Environment**
    ```bash
    npm start
    ```

### How to use the Dashboard
1.  **Search**: Enter a city name, region, or IATA airport code in the primary search bar.
2.  **Calibrate**: Use the **Epoch Slider** to select a specific year for analysis.
3.  **Explore**: Use the 3D Globe to visualize the spatial context of your coordinates. Drag to rotate, and use the `+` / `-` buttons for precision zoom.
4.  **Archive**: Click **"Export SSS-Report"** to download a comprehensive PDF analysis of the current dataset.

---

## 🤝 Acknowledgments

This project is built upon the collective efforts of the international geomagnetic community. Special thanks to:
*   **IAGA (International Association of Geomagnetism and Aeronomy)** for the IGRF coefficient datasets.
*   The **OpenStreetMap** contributors for geocoding services.

---

## 👤 Author

**Hari Hardiyan**  
Geophysical Software Engineer  
📧 [lorozloraz@gmail.com](mailto:lorozloraz@gmail.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Disclaimer: This tool is intended for educational and analytical purposes. For critical maritime or aviation navigation, always refer to certified official governmental magnetic models.*
