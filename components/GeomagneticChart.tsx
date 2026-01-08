
import React, { useState, useRef } from 'react';
import { HistoricalPoint } from '../types';

interface GeomagneticChartProps {
  data: HistoricalPoint[];
}

const GeomagneticChart: React.FC<GeomagneticChartProps> = ({ data }) => {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 240;
  const padding = 50;
  const rightPadding = 60;

  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year;
  
  const dValues = data.map(p => p.D);
  const minD = Math.min(...dValues);
  const maxD = Math.max(...dValues);
  const rangeD = (maxD - minD) || 1;

  const fValues = data.map(p => p.F);
  const minF = Math.min(...fValues);
  const maxF = Math.max(...fValues);
  const rangeF = (maxF - minF) || 1;

  const getX = (year: number) => padding + ((year - minYear) / (maxYear - minYear)) * (width - padding - rightPadding);
  const getY = (val: number, min: number, range: number) => height - padding - ((val - min) / range) * (height - 2 * padding);

  const dPath = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.D, minD, rangeD)}`).join(' ');
  const fPath = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.F, minF, rangeF)}`).join(' ');
  
  const dArea = `${dPath} L ${getX(maxYear)} ${height - padding} L ${getX(minYear)} ${height - padding} Z`;
  const fArea = `${fPath} L ${getX(maxYear)} ${height - padding} L ${getX(minYear)} ${height - padding} Z`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    // Reverse map x to year
    let year = minYear + ((x - padding) / (width - padding - rightPadding)) * (maxYear - minYear);
    year = Math.max(minYear, Math.min(maxYear, year));
    setHoverYear(Math.round(year));
  };

  const activePoint = hoverYear !== null ? data.reduce((prev, curr) => {
    return Math.abs(curr.year - hoverYear) < Math.abs(prev.year - hoverYear) ? curr : prev;
  }) : null;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            Historical Trend Analysis
          </h3>
          <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">Temporal Pulse (1900 - 2030)</p>
        </div>
        <div className="flex flex-wrap gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Declination</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Intensity</span>
          </div>
        </div>
      </div>

      <div className="relative group cursor-crosshair overflow-hidden">
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverYear(null)}
          style={{ background: '#ffffff', fontFamily: 'sans-serif' }}
        >
          <defs>
            <linearGradient id="gradD" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.15 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="gradF" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f43f5e', stopOpacity: 0.15 }} />
              <stop offset="100%" style={{ stopColor: '#f43f5e', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1={padding} y1={padding + p * (height - 2 * padding)} x2={width - rightPadding} y2={padding + p * (height - 2 * padding)} stroke="#f8fafc" strokeWidth="2" />
          ))}

          <path d={dArea} fill="url(#gradD)" className="transition-all duration-300" />
          <path d={fArea} fill="url(#gradF)" className="transition-all duration-300" />

          <text x={padding - 10} y={getY(maxD, minD, rangeD)} textAnchor="end" style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: '900' }}>{maxD.toFixed(1)}°</text>
          <text x={padding - 10} y={getY(minD, minD, rangeD)} textAnchor="end" style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: '900' }}>{minD.toFixed(1)}°</text>
          
          <text x={width - rightPadding + 10} y={getY(maxF, minF, rangeF)} textAnchor="start" style={{ fontSize: '10px', fill: '#f43f5e', fontWeight: '900' }}>{maxF.toFixed(0)}</text>
          <text x={width - rightPadding + 10} y={getY(minF, minF, rangeF)} textAnchor="start" style={{ fontSize: '10px', fill: '#f43f5e', fontWeight: '900' }}>{minF.toFixed(0)}</text>

          <path d={dPath} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={fPath} fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {activePoint && (
            <g>
              <line x1={getX(activePoint.year)} y1={padding} x2={getX(activePoint.year)} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={getX(activePoint.year)} cy={getY(activePoint.D, minD, rangeD)} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
              <circle cx={getX(activePoint.year)} cy={getY(activePoint.F, minF, rangeF)} r="5" fill="#f43f5e" stroke="white" strokeWidth="2" />
              
              <rect x={getX(activePoint.year) - 35} y={padding - 35} width="70" height="22" rx="6" fill="#0f172a" />
              <text x={getX(activePoint.year)} y={padding - 20} textAnchor="middle" style={{ fontSize: '10px', fill: 'white', fontWeight: '900' }}>{activePoint.year}</text>
            </g>
          )}

          {[1900, 1930, 1960, 1990, 2025].map(y => (
             <text key={y} x={getX(y)} y={height - padding + 20} textAnchor="middle" style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: '900' }}>{y}</text>
          ))}
        </svg>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Expert Insight</span>
          <p className="text-[11px] text-blue-900/70 font-medium leading-relaxed">
            Geomagnetic poles are in constant motion. Hover the graph to see how the field at this location has mutated over the last century.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-bold italic">Interactive crosshair enabled.</p>
          <div className="text-[9px] font-black text-slate-400 uppercase bg-white px-3 py-1.5 rounded-xl border border-slate-200">IGRF-14 SSS</div>
        </div>
      </div>
    </div>
  );
};

export default GeomagneticChart;
