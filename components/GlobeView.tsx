
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

interface GlobeViewProps {
  lat: number;
  lon: number;
  year: number;
}

const GlobeView: React.FC<GlobeViewProps> = ({ lat, lon, year }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Approximate Magnetic North Pole drift
  const getMagPole = (y: number) => {
    const baseLat = 86.5;
    const baseLon = 164.0;
    const drift = (y - 2025);
    return { lat: baseLat + drift * 0.05, lon: baseLon + drift * 0.2 };
  };

  // Helper for programmatic zoom
  const handleManualZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    if (direction === 'reset') {
      svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    } else {
      const factor = direction === 'in' ? 1.5 : 0.6;
      svg.transition().duration(500).call(zoomRef.current.scaleBy, factor);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 350;
    const initialScale = 130;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('cursor', 'grab')
      .style('touch-action', 'none'); // Critical for mobile stability

    svg.selectAll("*").remove();

    // Projection setup
    const projection = d3.geoOrthographic()
      .scale(initialScale)
      .center([0, 0])
      .rotate([-lon, -lat])
      .translate([width / 2, height / 2 - 20]);

    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();

    // Defs for gradients and glow
    const defs = svg.append("defs");
    
    const radialGradient = defs.append("radialGradient")
      .attr("id", "globe-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    radialGradient.append("stop").attr("offset", "0%").attr("stop-color", "#0f172a");
    radialGradient.append("stop").attr("offset", "100%").attr("stop-color", "#1e293b");

    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    // Ocean/Atmosphere Shadow
    const globeBack = g.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2 - 20)
      .attr("r", projection.scale())
      .style("fill", "url(#globe-gradient)")
      .style("stroke", "rgba(59, 130, 246, 0.3)")
      .style("stroke-width", "0.5");

    // Atmospheric Glow
    const globeGlow = g.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2 - 20)
      .attr("r", projection.scale() + 2)
      .style("fill", "none")
      .style("stroke", "rgba(37, 99, 235, 0.2)")
      .style("stroke-width", "4")
      .style("filter", "url(#glow)");

    const mapGroup = g.append("g");
    const markerGroup = g.append("g");

    // Grid
    const grid = mapGroup.append("path")
      .datum(graticule())
      .attr("class", "graticule")
      .attr("d", path as any)
      .style("fill", "none")
      .style("stroke", "rgba(59, 130, 246, 0.15)")
      .style("stroke-width", "0.5");

    // Load and Render Countries
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((worldData: any) => {
      const countries = topojson.feature(worldData, worldData.objects.countries);
      
      const land = mapGroup.append("path")
        .datum(countries)
        .attr("d", path as any)
        .style("fill", "rgba(59, 130, 246, 0.08)")
        .style("stroke", "rgba(148, 163, 184, 0.4)")
        .style("stroke-width", "0.5");

      // Update function
      const update = () => {
        path.projection(projection);
        const currentScale = projection.scale();
        
        // Update globe base and glow sizes
        globeBack.attr("r", currentScale);
        globeGlow.attr("r", currentScale + 2);
        
        grid.attr("d", path as any);
        land.attr("d", path as any);
        drawMarkers();
        
        // Update Zoom Level State for UI
        setZoomLevel(Math.round((currentScale / initialScale) * 100));
      };

      // Marker rendering logic
      const drawMarkers = () => {
        markerGroup.selectAll(".marker-wrap").remove();
        
        const currentScale = projection.scale();
        const scaleFactor = currentScale / initialScale;
        
        const magPole = getMagPole(year);
        const markers = [
          { coords: [lon, lat], color: "#3b82f6", label: "Target", size: 6 * Math.sqrt(scaleFactor), pulse: true },
          { coords: [0, 90], color: "#94a3b8", label: "True N", size: 3 * Math.sqrt(scaleFactor), pulse: false },
          { coords: [magPole.lon, magPole.lat], color: "#f43f5e", label: "Mag N", size: 5 * Math.sqrt(scaleFactor), pulse: true }
        ];

        markers.forEach(m => {
          const rotation = projection.rotate();
          const center = [-rotation[0], -rotation[1]];
          const distance = d3.geoDistance(center as [number, number], [m.coords[0], m.coords[1]]);

          if (distance < Math.PI / 2) {
            const p = projection([m.coords[0], m.coords[1]]);
            if (p) {
              const wrap = markerGroup.append("g").attr("class", "marker-wrap");

              if (m.pulse) {
                wrap.append("circle")
                  .attr("cx", p[0])
                  .attr("cy", p[1])
                  .attr("r", m.size * 2)
                  .style("fill", m.color)
                  .style("opacity", 0.3)
                  .append("animate")
                  .attr("attributeName", "r")
                  .attr("values", `${m.size};${m.size * 2.5};${m.size}`)
                  .attr("dur", "2s")
                  .attr("repeatCount", "indefinite");
              }

              wrap.append("circle")
                .attr("cx", p[0])
                .attr("cy", p[1])
                .attr("r", m.size)
                .style("fill", m.color)
                .style("stroke", "white")
                .style("stroke-width", 1.5)
                .style("filter", "url(#glow)");

              // Only show labels if zoom is high enough or it's the target
              if (scaleFactor > 0.8 || m.label === "Target") {
                wrap.append("text")
                  .attr("x", p[0] + m.size + 4)
                  .attr("y", p[1] + 3)
                  .text(m.label)
                  .style("font-size", `${Math.max(7, 9 * Math.sqrt(scaleFactor))}px`)
                  .style("font-weight", "900")
                  .style("fill", m.color)
                  .style("text-transform", "uppercase")
                  .style("letter-spacing", "1px");
              }
            }
          }
        });
      };

      // Zoom Behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 12]) // Increased max zoom for mobile detail
        .on("zoom", (event) => {
          projection.scale(initialScale * event.transform.k);
          update();
        });

      zoomRef.current = zoom; // Store for manual button access

      // Drag behavior
      const drag = d3.drag<SVGSVGElement, unknown>()
        .on("start", () => setIsDragging(true))
        .on("drag", (event) => {
          const rotate = projection.rotate();
          const currentScale = projection.scale();
          const k = 75 / currentScale; 
          projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
          ]);
          update();
        })
        .on("end", () => setIsDragging(false));

      svg.call(drag as any);
      svg.call(zoom as any);

      // Animation to target on load/change
      const initialRotate = projection.rotate();
      const targetRotate: [number, number, number] = [-lon, -lat, 0];
      
      d3.transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .tween("rotate", () => {
          const r = d3.interpolate(initialRotate, targetRotate);
          return (t) => {
            projection.rotate(r(t));
            update();
          };
        });

      update();
    });

  }, [lat, lon, year]);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-slate-800 transition-all duration-500 hover:border-blue-500/30">
      <div className="flex justify-between items-start mb-2 px-4 relative z-30">
        <div>
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">Holographic Engine</h3>
          <p className="text-[10px] font-bold text-slate-500">PRECISION EXPLORATION</p>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1">Magnification</div>
          <div className="text-xs font-mono font-bold text-blue-400">{zoomLevel}%</div>
        </div>
      </div>
      
      <div className="relative flex justify-center items-center h-[320px]">
        {/* Manual Zoom Controls - Perfect for Mobile */}
        <div className="absolute right-4 flex flex-col gap-2 z-40">
          <button 
            onClick={() => handleManualZoom('in')}
            className="w-10 h-10 bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
            aria-label="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button 
            onClick={() => handleManualZoom('out')}
            className="w-10 h-10 bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
            aria-label="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button 
            onClick={() => handleManualZoom('reset')}
            className="w-10 h-10 bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-90"
            aria-label="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          </button>
        </div>

        {/* Navigation Compass Overlay (Visual Only) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border border-blue-500/20 rounded-full"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] border border-blue-500/5 rounded-full"></div>
        </div>

        <svg ref={svgRef} className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}></svg>

        {/* Dynamic Tooltip during drag */}
        {isDragging && (
          <div className="absolute bottom-10 bg-blue-600 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce shadow-lg shadow-blue-500/40 z-30">
            Scanning Surface...
          </div>
        )}

        {/* Interaction Hint - Hidden on mobile, shown on hover for desktop */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[8px] font-bold text-slate-300">
            SCROLL/BUTTONS TO ZOOM • DRAG TO ROTATE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-2 relative z-30">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 mb-2"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Target</span>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-rose-500 mb-2"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Magnetic</span>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-slate-500 mb-2"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Geodetic</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeView;
