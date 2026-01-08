
import React from 'react';
import { GeomagneticResult } from '../types';

interface ResultCardProps {
  result: GeomagneticResult;
  location: string;
  coords: { lat: number; lon: number };
  year: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, location, coords, year }) => {
  const renderSV = (val: number, unit: string) => {
    const isPositive = val >= 0;
    const sign = isPositive ? '+' : '';
    const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-600';
    return (
      <div className={`inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 ${colorClass} text-[9px] font-black ml-2`}>
        {sign}{val.toFixed(2)} {unit}
      </div>
    );
  };

  const items = [
    { 
      label: 'Declination (D)', 
      value: `${result.D.toFixed(3)}°`, 
      sv: renderSV(result.sv.dD, 'min/yr'),
      desc: 'Compass correction from True North.',
      icon: 'N'
    },
    { 
      label: 'Inclination (I)', 
      value: `${result.I.toFixed(3)}°`, 
      sv: renderSV(result.sv.dI, 'min/yr'),
      desc: 'Magnetic dip relative to horizon.',
      icon: '∠'
    },
    { 
      label: 'Total Intensity (F)', 
      value: `${result.F.toFixed(1)} nT`, 
      sv: renderSV(result.sv.dF, 'nT/yr'),
      desc: 'Strength of the magnetic shield.',
      icon: '⚡'
    },
    { 
      label: 'Horizontal (H)', 
      value: `${result.H.toFixed(1)} nT`, 
      sv: renderSV(result.sv.dH, 'nT/yr'),
      desc: 'Strength on the horizontal plane.',
      icon: '↔'
    },
    { 
      label: 'North Component (X)', 
      value: `${result.X.toFixed(1)} nT`, 
      sv: renderSV(result.sv.dX, 'nT/yr'),
      desc: 'True north component vector.',
      icon: '↑'
    },
    { 
      label: 'Vertical Component (Z)', 
      value: `${result.Z.toFixed(1)} nT`, 
      sv: renderSV(result.sv.dZ, 'nT/yr'),
      desc: 'Vertical component (downwards).',
      icon: '↓'
    }
  ];

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <h3 className="text-xl font-black tracking-tight truncate max-w-md">{location}</h3>
            </div>
            <p className="text-slate-400 text-sm font-medium ml-12">
              {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}° • <span className="text-blue-400">Epoch {year.toFixed(2)}</span>
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] block font-black text-blue-400 uppercase tracking-widest mb-1">Status</span>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold uppercase tracking-tight">Geocentric Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="group relative p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-500/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
                <span className="text-lg opacity-20 group-hover:opacity-100 transition-opacity font-bold">{item.icon}</span>
              </div>
              <div className="flex items-baseline flex-wrap">
                <span className="text-xl font-black text-slate-900 mono tracking-tighter">{item.value}</span>
                {item.sv}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-10 flex items-center justify-between text-[9px] font-black text-slate-300 border-t border-slate-50 pt-6 uppercase tracking-[0.3em]">
          <span>IGRF-14 CORE • WGS84 MODEL</span>
          <span className="flex items-center gap-1">
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            PROFESSIONAL GRADE
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
