import React, { useState } from "react";
import { Copy, Check, Terminal, FileCode } from "lucide-react";

export function CodeViewer() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"component" | "usage" | "utils">("component");

  const componentCode = `// components/ui/kinetic-grid.tsx
"use client";
import { useEffect, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Point { x: number; y: number; }
interface Ripple { x: number; y: number; radius: number; opacity: number; born: number; }

const CELL_SIZE = 55;
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 24;
const DOT_SPACING = 28;
const LERP_SPEED = 0.08;
const LINE_BASE = { r: 255, g: 255, b: 255, a: 0.13 };

export default function KineticGrid({
  children,
  className,
  globalColor = "default",
}: {
  children?: ReactNode;
  className?: string;
  globalColor?: "default" | "monochrome";
}) {
  // Canvas references, mouse tracking with linear interpolation, and ripple shockwaves
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const ripplesRef = useRef<Ripple[]>([]);

  // Warped grid computation with edge-pinning and dynamic radial glow
  return (
    <div className={cn("relative w-full min-h-screen overflow-hidden", globalColor === "monochrome" ? "bg-[#000000]" : "bg-[#161618]", className)}>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}`;

  const usageCode = `// app/page.tsx or pages/index.tsx
import KineticGrid from "@/components/ui/kinetic-grid";

export default function Page() {
  return (
    <KineticGrid globalColor="default">
      <main className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          Interactive Kinetic Grid
        </h1>
        <p className="mt-4 text-zinc-400 max-w-lg">
          Move your cursor over the canvas to feel magnetic grid deformation,
          or click anywhere to spawn expanding shockwaves!
        </p>
      </main>
    </KineticGrid>
  );
}`;

  const utilsCode = `// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

  const currentCode =
    activeTab === "component"
      ? componentCode
      : activeTab === "usage"
      ? usageCode
      : utilsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => setActiveTab("component")}
              className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                activeTab === "component"
                  ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              components/ui/kinetic-grid.tsx
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                activeTab === "usage"
                  ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              page.tsx
            </button>
            <button
              onClick={() => setActiveTab("utils")}
              className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                activeTab === "utils"
                  ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              lib/utils.ts
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
            Active in /components/ui
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1 rounded-md transition-all active:scale-95"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area with Syntax Highlighting */}
      <div className="p-6 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[440px] custom-scrollbar bg-zinc-950/90 leading-relaxed">
        {activeTab === "component" ? (
          <pre>
            <code>
              <span className="text-zinc-500">// components/ui/kinetic-grid.tsx</span>
              {"\n"}
              <span className="text-pink-400">"use client"</span>;
              {"\n"}
              <span className="text-purple-400">import</span> {"{ useEffect, useRef, useCallback, ReactNode }"}{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-300">"react"</span>;
              {"\n"}
              <span className="text-purple-400">import</span> {"{ cn }"}{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-300">"@/lib/utils"</span>;
              {"\n\n"}
              <span className="text-purple-400">interface</span>{" "}
              <span className="text-yellow-300">Point</span> {"{"} x:{" "}
              <span className="text-sky-300">number</span>; y:{" "}
              <span className="text-sky-300">number</span>; {"}"}
              {"\n"}
              <span className="text-purple-400">interface</span>{" "}
              <span className="text-yellow-300">Ripple</span> {"{"} x:{" "}
              <span className="text-sky-300">number</span>; y:{" "}
              <span className="text-sky-300">number</span>; radius:{" "}
              <span className="text-sky-300">number</span>; opacity:{" "}
              <span className="text-sky-300">number</span>; born:{" "}
              <span className="text-sky-300">number</span>; {"}"}
              {"\n\n"}
              <span className="text-purple-400">const</span> CELL_SIZE ={" "}
              <span className="text-orange-300">55</span>;
              {"\n"}
              <span className="text-purple-400">const</span> INFLUENCE_RADIUS ={" "}
              <span className="text-orange-300">260</span>;
              {"\n"}
              <span className="text-purple-400">const</span> MAX_WARP ={" "}
              <span className="text-orange-300">24</span>;
              {"\n"}
              <span className="text-purple-400">const</span> DOT_SPACING ={" "}
              <span className="text-orange-300">28</span>;
              {"\n"}
              <span className="text-purple-400">const</span> LERP_SPEED ={" "}
              <span className="text-orange-300">0.08</span>;
              {"\n"}
              <span className="text-purple-400">const</span> LINE_BASE = {"{"} r:{" "}
              <span className="text-orange-300">255</span>, g:{" "}
              <span className="text-orange-300">255</span>, b:{" "}
              <span className="text-orange-300">255</span>, a:{" "}
              <span className="text-orange-300">0.13</span> {"}"};
              {"\n\n"}
              <span className="text-purple-400">export default function</span>{" "}
              <span className="text-blue-400">KineticGrid</span>
              {"({\n  children,\n  className,\n  globalColor = "}
              <span className="text-emerald-300">"default"</span>
              {",\n}: {\n  children?: ReactNode;\n  className?: "}
              <span className="text-sky-300">string</span>
              {";\n  globalColor?: "}
              <span className="text-emerald-300">"default"</span> |{" "}
              <span className="text-emerald-300">"monochrome"</span>
              {";\n}) {\n"}
              <span className="text-zinc-500">
                {"  // Canvas references, mouse tracking with linear interpolation, and ripple shockwaves\n"}
              </span>
              {"  "}
              <span className="text-purple-400">const</span> canvasRef = useRef&lt;
              <span className="text-yellow-300">HTMLCanvasElement</span>&gt;(
              <span className="text-pink-400">null</span>);
              {"\n  "}
              <span className="text-purple-400">const</span> mouseRef = useRef&lt;
              <span className="text-yellow-300">Point</span>&gt;({"{"} x: -
              <span className="text-orange-300">9999</span>, y: -
              <span className="text-orange-300">9999</span> {"}"});
              {"\n  "}
              <span className="text-purple-400">const</span> targetMouseRef = useRef&lt;
              <span className="text-yellow-300">Point</span>&gt;({"{"} x: -
              <span className="text-orange-300">9999</span>, y: -
              <span className="text-orange-300">9999</span> {"}"});
              {"\n  "}
              <span className="text-purple-400">const</span> ripplesRef = useRef&lt;
              <span className="text-yellow-300">Ripple</span>[]&gt;([]);
              {"\n\n"}
              <span className="text-zinc-500">
                {"  // Warped grid computation with edge-pinning and dynamic radial glow\n"}
              </span>
              {"  "}
              <span className="text-purple-400">return</span> (
              {"\n    <"}
              <span className="text-blue-400">div</span> className=&#123;
              <span className="text-blue-400">cn</span>(
              <span className="text-emerald-300">
                "relative w-full min-h-screen overflow-hidden"
              </span>
              , globalColor === <span className="text-emerald-300">"monochrome"</span> ?{" "}
              <span className="text-emerald-300">"bg-[#000000]"</span> :{" "}
              <span className="text-emerald-300">"bg-[#161618]"</span>, className)&#125;&gt;
              {"\n      <"}
              <span className="text-blue-400">canvas</span> ref=&#123;canvasRef&#125;
              className=
              <span className="text-emerald-300">
                "fixed inset-0 w-full h-full z-0 pointer-events-none"
              </span>{" "}
              /&gt;
              {"\n      <"}
              <span className="text-blue-400">div</span> className=
              <span className="text-emerald-300">
                "relative z-10 w-full h-full"
              </span>
              &gt;&#123;children&#125;&lt;/
              <span className="text-blue-400">div</span>&gt;
              {"\n    </"}
              <span className="text-blue-400">div</span>&gt;
              {"\n  );\n}"}
            </code>
          </pre>
        ) : activeTab === "usage" ? (
          <pre>
            <code>
              <span className="text-zinc-500">// app/page.tsx or pages/index.tsx</span>
              {"\n"}
              <span className="text-purple-400">import</span> KineticGrid{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-300">"@/components/ui/kinetic-grid"</span>;
              {"\n\n"}
              <span className="text-purple-400">export default function</span>{" "}
              <span className="text-blue-400">Page</span>() {"{\n"}
              {"  "}
              <span className="text-purple-400">return</span> (
              {"\n    <"}
              <span className="text-blue-400">KineticGrid</span> globalColor=
              <span className="text-emerald-300">"default"</span>&gt;
              {"\n      <"}
              <span className="text-blue-400">main</span> className=
              <span className="text-emerald-300">
                "min-h-screen flex flex-col items-center justify-center text-center p-8"
              </span>
              &gt;
              {"\n        <"}
              <span className="text-blue-400">h1</span> className=
              <span className="text-emerald-300">
                "text-5xl font-extrabold text-white tracking-tight"
              </span>
              &gt;
              {"\n          Interactive Kinetic Grid\n        </"}
              <span className="text-blue-400">h1</span>&gt;
              {"\n        <"}
              <span className="text-blue-400">p</span> className=
              <span className="text-emerald-300">
                "mt-4 text-zinc-400 max-w-lg"
              </span>
              &gt;
              {"\n          Move your cursor over the canvas to feel magnetic grid deformation,\n          or click anywhere to spawn expanding shockwaves!\n        </"}
              <span className="text-blue-400">p</span>&gt;
              {"\n      </"}
              <span className="text-blue-400">main</span>&gt;
              {"\n    </"}
              <span className="text-blue-400">KineticGrid</span>&gt;
              {"\n  );\n}"}
            </code>
          </pre>
        ) : (
          <pre>
            <code>
              <span className="text-zinc-500">// lib/utils.ts</span>
              {"\n"}
              <span className="text-purple-400">import</span> {"{ type ClassValue, clsx }"}{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-300">"clsx"</span>;
              {"\n"}
              <span className="text-purple-400">import</span> {"{ twMerge }"}{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-300">"tailwind-merge"</span>;
              {"\n\n"}
              <span className="text-purple-400">export function</span>{" "}
              <span className="text-blue-400">cn</span>(...inputs:{" "}
              <span className="text-yellow-300">ClassValue</span>[]) {"{\n"}
              {"  "}
              <span className="text-purple-400">return</span> twMerge(clsx(inputs));
              {"\n}"}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}
