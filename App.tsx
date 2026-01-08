
import React, { useState, useCallback, useRef } from 'react';
import { IGRF14Engine } from './engine/igrf';
import { geocodeCity } from './services/geocoding';
import { CalculationState, LocationInfo, HistoricalPoint } from './types';
import ResultCard from './components/ResultCard';
import GeomagneticChart from './components/GeomagneticChart';
import CompassView from './components/CompassView';
import GlobeView from './components/GlobeView';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const engine = new IGRF14Engine();

const QUICK_CITIES = [
  { name: 'Reykjavik', emoji: '🇮🇸', desc: 'Auroral Zone' },
  { name: 'Brasilia', emoji: '🇧🇷', desc: 'Magnetic Anomaly' },
  { name: 'Tokyo', emoji: '🇯🇵', desc: 'Rapid Drift' },
  { name: 'London', emoji: '🇬🇧', desc: 'Reference Point' }
];

const App: React.FC = () => {
  const [cityInput, setCityInput] = useState('');
  const [state, setState] = useState<CalculationState>({
    loading: false,
    error: null,
    result: null,
    history: null,
    location: null,
    year: new Date().getFullYear() + (new Date().getMonth() / 12) + (new Date().getDate() / 365),
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const generateHistory = (lat: number, lon: number): HistoricalPoint[] => {
    const points: HistoricalPoint[] = [];
    for (let y = 1900; y <= 2030; y += 2) {
      const res = engine.solve(lat, lon, 0, y);
      points.push({ year: y, D: res.D, F: res.F });
    }
    return points;
  };

  const handleSearch = useCallback(async (searchCity?: string) => {
    const targetCity = searchCity || cityInput;
    if (!targetCity.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const location = await geocodeCity(targetCity);
      if (!location) {
        setState(prev => ({ ...prev, loading: false, error: 'Location not found. Try another name.' }));
        return;
      }

      const res = engine.solve(location.lat, location.lon, 0, state.year);
      const history = generateHistory(location.lat, location.lon);

      setState(prev => ({
        ...prev,
        loading: false,
        result: res,
        history: history,
        location: location,
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Analysis failed.' 
      }));
    }
  }, [cityInput, state.year]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'GPS not supported on this device.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const location: LocationInfo = {
          name: 'Current Location',
          lat: latitude,
          lon: longitude,
          display_name: `User Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
        };
        const res = engine.solve(latitude, longitude, 0, state.year);
        const history = generateHistory(latitude, longitude);
        setState(prev => ({
          ...prev,
          loading: false,
          result: res,
          history: history,
          location: location,
        }));
      },
      (err) => {
        setState(prev => ({ ...prev, loading: false, error: 'GPS access denied.' }));
      }
    );
  }, [state.year]);

  const exportToPDF = async () => {
    if (!state.result || !state.location) return;

    const doc = new jsPDF();
    const { result, location, year } = state;
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(46, 90, 136);
    doc.text('GEOMAGNETIC ANALYSIS', 105, 38, { align: 'center' });
    doc.setFontSize(10);
    doc.text('SSS-GRADE SCIENTIFIC REPORT', 105, 45, { align: 'center' });
    
    doc.setDrawColor(46, 90, 136);
    doc.setLineWidth(0.5);
    doc.line(75, 48, 135, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Reference: IGRF-14-PRO • Timestamp: ${new Date().toLocaleString()}`, 105, 54, { align: 'center' });

    doc.setDrawColor(240);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(15, 62, 180, 42, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(46, 90, 136);
    doc.text('1. GEODETIC REFERENCE DATA', 22, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Location: ${location.display_name.substring(0, 75)}`, 22, 79);
    doc.text(`Coords: ${location.lat.toFixed(4)}° N, ${location.lon.toFixed(4)}° E`, 22, 86);
    doc.text(`Analysis Epoch: ${year.toFixed(2)}`, 22, 93);

    doc.setFont('helvetica', 'bold');
    doc.text('2. MAGNETIC FIELD CALCULATIONS', 22, 115);
    const tableData = [
      ["Declination (D)", `${result.D.toFixed(3)}°`, `${result.sv.dD >= 0 ? '+' : ''}${result.sv.dD.toFixed(2)} min/yr`],
      ["Inclination (I)", `${result.I.toFixed(3)}°`, `${result.sv.dI >= 0 ? '+' : ''}${result.sv.dI.toFixed(2)} min/yr`],
      ["Total Intensity (F)", `${result.F.toFixed(1)} nT`, `${result.sv.dF >= 0 ? '+' : ''}${result.sv.dF.toFixed(2)} nT/yr`],
      ["Horizontal (H)", `${result.H.toFixed(1)} nT`, `${result.sv.dH >= 0 ? '+' : ''}${result.sv.dH.toFixed(2)} nT/yr`],
      ["North (X)", `${result.X.toFixed(1)} nT`, `${result.sv.dX >= 0 ? '+' : ''}${result.sv.dX.toFixed(2)} nT/yr`],
      ["Vertical (Z)", `${result.Z.toFixed(1)} nT`, `${result.sv.dZ >= 0 ? '+' : ''}${result.sv.dZ.toFixed(2)} nT/yr`],
    ];
    autoTable(doc, {
      startY: 120,
      head: [['Component', 'Absolute Value', 'Annual Drift (SV)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [46, 90, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15, right: 15 }
    });

    let currentY = (doc as any).lastAutoTable.finalY;
    if (currentY + 100 > pageHeight - 30) { doc.addPage(); currentY = 25; } else { currentY += 15; }
    doc.setFont('helvetica', 'bold');
    doc.text('3. SECULAR VARIATION TRENDS (1900 - 2030)', 20, currentY);

    const chartSvg = chartContainerRef.current?.querySelector('svg');
    if (chartSvg) {
      const xml = new XMLSerializer().serializeToString(chartSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(xml)));
      const image64 = 'data:image/svg+xml;base64,' + svgBase64;
      const img = new Image();
      img.src = image64;
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 2400; canvas.height = 960;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            doc.setDrawColor(240);
            doc.roundedRect(15, currentY + 5, 180, 85, 4, 4, 'D');
            doc.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', 20, currentY + 12, 170, 72);
            resolve(null);
          }
        };
      });
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 18, 210, 18, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text('Calculated via IGRF-14 International Reference Model • Professional Archive Suite', 105, pageHeight - 8, { align: 'center' });

    doc.save(`GEOMAG_SSS_${location.name.substring(0, 15).toUpperCase()}.pdf`);
  };

  const getIntensityContext = (f: number) => {
    if (f < 25000) return { label: 'Extremely Weak', color: 'text-rose-600', bg: 'bg-rose-50' };
    if (f < 35000) return { label: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (f < 55000) return { label: 'Normal Field', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    return { label: 'Highly Intense', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50">
      <header className="bg-[#0f172a] text-white py-20 px-4 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[160px] opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full blur-[160px] opacity-20 -ml-48 -mb-48"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-5 py-2 rounded-full text-blue-300 text-[10px] font-black mb-8 uppercase tracking-[0.4em] shadow-inner">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-sm shadow-blue-400"></span>
            Professional Geophysical Suite
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Magnetic Pulse
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
            Explore Earth's magnetic core dynamics from 1900 to 2030. High-precision calculations powered by IGRF-14.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        <section className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-12 sticky top-4 z-40 transition-all hover:shadow-blue-500/5">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Where should we look? (City, Airport, Region...)"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500/30 transition-all placeholder:text-slate-400 text-slate-900 font-bold"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 absolute left-5 top-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <button
              onClick={() => handleSearch()}
              disabled={state.loading}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black rounded-3xl transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transform active:scale-95 uppercase tracking-widest text-xs"
            >
              {state.loading ? 'ANALYZING' : 'CALCULATE'}
            </button>

            <button
              onClick={handleUseCurrentLocation}
              disabled={state.loading}
              className="px-6 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-3xl transition-all border border-slate-200 transform active:scale-95"
              title="Pinpoint My Location"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Quick Discovery:</span>
              {QUICK_CITIES.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleSearch(city.name)}
                  className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 transition-all flex items-center gap-2 group"
                >
                  <span className="grayscale group-hover:grayscale-0 transition-all">{city.emoji}</span>
                  {city.name}
                  <span className="text-[9px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">({city.desc})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Epoch: <span className="text-blue-600">{Math.round(state.year)}</span></span>
                </div>
                <input 
                  type="range" min="1900" max="2030" step="1"
                  value={Math.round(state.year)}
                  onChange={(e) => setState(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full accent-blue-600 h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer hover:accent-blue-700 transition-all"
                />
              </div>
            </div>
          </div>

          {state.error && (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold">!</div>
              {state.error.toUpperCase()}
            </div>
          )}
        </section>

        {state.result && state.location && (
          <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-8">
                <ResultCard result={state.result} location={state.location.display_name} coords={{ lat: state.location.lat, lon: state.location.lon }} year={state.year} />
                <GlobeView lat={state.location.lat} lon={state.location.lon} year={state.year} />
              </div>
              <div className="space-y-8">
                <CompassView declination={state.result.D} intensity={state.result.F} />
                
                <div className={`${getIntensityContext(state.result.F).bg} border border-slate-100 rounded-[2rem] p-6 text-center shadow-xl`}>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Global Context</span>
                  <div className={`text-xl font-black ${getIntensityContext(state.result.F).color}`}>
                    {getIntensityContext(state.result.F).label}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed px-4">
                    The total intensity (F) at this location is {state.result.F.toFixed(0)} nT.
                  </p>
                </div>
              </div>
            </div>

            <div ref={chartContainerRef}>{state.history && <GeomagneticChart data={state.history} />}</div>
            
            <div className="flex justify-center pt-8">
              <button onClick={exportToPDF} className="group flex items-center gap-5 bg-slate-900 hover:bg-black text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="p-3.5 bg-blue-600 rounded-2xl group-hover:rotate-[15deg] transition-transform shadow-xl shadow-blue-500/30">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-[0.4em] text-blue-400 font-black mb-1">Archive Suite</div>
                  <div className="text-lg tracking-tight">EXPORT SSS-REPORT</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {!state.result && !state.loading && (
          <div className="text-center py-40 opacity-20 group">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">Ready for Calibration</p>
            <p className="text-slate-400 text-sm mt-4 tracking-[0.2em] uppercase font-black">Search any point on Earth to begin exploration</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
