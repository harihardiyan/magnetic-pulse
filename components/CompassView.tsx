
import React from 'react';

interface CompassViewProps {
  declination: number;
  intensity: number;
}

const CompassView: React.FC<CompassViewProps> = ({ declination, intensity }) => {
  // Normalize intensity to a scale of 0-1 for visual feedback (Global range approx 20k to 65k)
  const normalizedIntensity = Math.min(Math.max((intensity - 20000) / 45000, 0), 1);
  const glowOpacity = 0.1 + (normalizedIntensity * 0.4);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
      <div 
        className="absolute inset-0 bg-blue-500/10 blur-[100px] transition-opacity duration-1000"
        style={{ opacity: glowOpacity }}
      ></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
          <div>
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Navigation Aid</h4>
            <h3 className="text-xl font-black">Magnetic Orientation</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase block">Deviation</span>
            <span className={`text-lg font-black ${declination >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Math.abs(declination).toFixed(2)}° {declination >= 0 ? 'E' : 'W'}
            </span>
          </div>
        </div>

        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          {/* Compass Outer Ring */}
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full shadow-inner"></div>
          
          {/* Degrees Markers */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="50%" y1="5%" x2="50%" y2="10%"
                transform={`rotate(${i * 30} 128 128)`}
                stroke={i % 3 === 0 ? '#475569' : '#1e293b'}
                strokeWidth={i % 3 === 0 ? '3' : '1'}
                className="origin-center md:scale-100 scale-75"
              />
            ))}
          </svg>

          {/* Labels */}
          <span className="absolute top-4 text-[10px] font-black text-rose-500">N</span>
          <span className="absolute right-4 text-[10px] font-black text-slate-600">E</span>
          <span className="absolute bottom-4 text-[10px] font-black text-slate-600">S</span>
          <span className="absolute left-4 text-[10px] font-black text-slate-600">W</span>

          {/* The Needle */}
          <div 
            className="relative w-1.5 h-[80%] transition-transform duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style={{ transform: `rotate(${declination}deg)` }}
          >
            {/* North Point */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            {/* South Point */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-700 rounded-full"></div>
            {/* Center Pivot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-slate-900 shadow-lg z-20"></div>
          </div>
          
          {/* Static True North Marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-rose-500/30"></div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">True North</span>
            <span className="text-sm font-bold text-slate-300">0.000°</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Mag North</span>
            <span className="text-sm font-bold text-blue-200">{declination.toFixed(3)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompassView;
