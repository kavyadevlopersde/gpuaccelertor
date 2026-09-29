import React from "react";
import { Sliders, RotateCcw, Zap, Sparkles } from "lucide-react";
import { GlobalTheme } from "./ui/kinetic-grid";

interface TuningPanelProps {
  cellSize: number;
  setCellSize: (v: number) => void;
  influenceRadius: number;
  setInfluenceRadius: (v: number) => void;
  maxWarp: number;
  setMaxWarp: (v: number) => void;
  lerpSpeed: number;
  setLerpSpeed: (v: number) => void;
  showDots: boolean;
  setShowDots: (v: boolean) => void;
  globalColor: GlobalTheme;
  setGlobalColor: (c: GlobalTheme) => void;
  onReset: () => void;
  onTriggerBurst: () => void;
}

export function TuningPanel({
  cellSize,
  setCellSize,
  influenceRadius,
  setInfluenceRadius,
  maxWarp,
  setMaxWarp,
  lerpSpeed,
  setLerpSpeed,
  showDots,
  setShowDots,
  globalColor,
  setGlobalColor,
  onReset,
  onTriggerBurst,
}: TuningPanelProps) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Live Physics Tuning Playground</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
          title="Reset to default constants"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
        {/* Cell Size */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono">
            <span className="text-zinc-400">CELL_SIZE</span>
            <span className="text-sky-300 font-bold">{cellSize}px</span>
          </div>
          <input
            type="range"
            min="35"
            max="80"
            step="1"
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] text-zinc-500 block">Density of grid intersection mesh</span>
        </div>

        {/* Influence Radius */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono">
            <span className="text-zinc-400">INFLUENCE_RADIUS</span>
            <span className="text-sky-300 font-bold">{influenceRadius}px</span>
          </div>
          <input
            type="range"
            min="150"
            max="420"
            step="10"
            value={influenceRadius}
            onChange={(e) => setInfluenceRadius(Number(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] text-zinc-500 block">Magnetic attraction distance</span>
        </div>

        {/* Max Warp */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono">
            <span className="text-zinc-400">MAX_WARP</span>
            <span className="text-sky-300 font-bold">{maxWarp}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="45"
            step="1"
            value={maxWarp}
            onChange={(e) => setMaxWarp(Number(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] text-zinc-500 block">Peak deformation towards pointer</span>
        </div>

        {/* Lerp Speed */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono">
            <span className="text-zinc-400">LERP_SPEED</span>
            <span className="text-sky-300 font-bold">{lerpSpeed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.03"
            max="0.20"
            step="0.01"
            value={lerpSpeed}
            onChange={(e) => setLerpSpeed(Number(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] text-zinc-500 block">Spring follow damping rate</span>
        </div>
      </div>

      {/* Row 2: Theme presets and quick actions */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-400 font-medium">Palette Preset:</span>
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 space-x-1">
            <button
              onClick={() => setGlobalColor("default")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                globalColor === "default"
                  ? "bg-sky-500/20 text-sky-300 font-medium shadow-sm border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Default Cyan
            </button>
            <button
              onClick={() => setGlobalColor("monochrome")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                globalColor === "monochrome"
                  ? "bg-white/20 text-white font-medium shadow-sm border border-white/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monochrome
            </button>
            <button
              onClick={() => setGlobalColor("emerald")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                globalColor === "emerald"
                  ? "bg-emerald-500/20 text-emerald-300 font-medium shadow-sm border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Emerald
            </button>
            <button
              onClick={() => setGlobalColor("violet")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                globalColor === "violet"
                  ? "bg-purple-500/20 text-purple-300 font-medium shadow-sm border border-purple-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Violet
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showDots}
              onChange={(e) => setShowDots(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-sky-500 focus:ring-0"
            />
            <span>Background Dot Mesh</span>
          </label>

          <button
            onClick={onTriggerBurst}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all active:scale-95 border border-zinc-700/60"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Ripple Shockwave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
