import React, { useState } from "react";
import { X, Copy, Check, Terminal, ExternalLink, Sparkles, BookOpen, Layers } from "lucide-react";

interface SetupDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupDocsModal({ isOpen, onClose }: SetupDocsModalProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Setup Documentation & Integration</h2>
              <p className="text-xs text-zinc-400">Step-by-step instructions for adding KineticGrid to your repository</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-zinc-300">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center">1</span>
              <h3 className="font-semibold text-white text-sm">Install Prerequisites & Utilities</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Ensure you have Tailwind CSS configured and standard shadcn utility helpers installed.
            </p>
            <div className="relative group bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200">
              <code>npm install clsx tailwind-merge lucide-react</code>
              <button 
                onClick={() => copyToClipboard("npm install clsx tailwind-merge lucide-react", "cmd1")}
                className="absolute right-3 top-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1"
              >
                {copiedItem === "cmd1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedItem === "cmd1" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-mono font-bold flex items-center justify-center">2</span>
              <h3 className="font-semibold text-white text-sm">Verify <code className="text-sky-300 text-xs">@/lib/utils.ts</code></h3>
            </div>
            <p className="text-xs text-zinc-400">
              Standard class merger utility used across shadcn components:
            </p>
            <div className="relative group bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200">
              <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`}
              </pre>
              <button 
                onClick={() => copyToClipboard(`import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}`, "utils")}
                className="absolute right-3 top-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1"
              >
                {copiedItem === "utils" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedItem === "utils" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">3</span>
              <h3 className="font-semibold text-white text-sm">Add Component File</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Create <code className="text-zinc-200 font-mono">components/ui/kinetic-grid.tsx</code> and copy the source code from the main viewer.
            </p>
          </div>

          {/* Props Table */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-zinc-400">Available Component Props</h4>
            <div className="border border-zinc-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-2.5">Prop</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Default</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono text-[11px] text-zinc-300">
                  <tr>
                    <td className="p-2.5 text-sky-300 font-semibold">globalColor</td>
                    <td className="p-2.5 text-amber-300">"default" | "monochrome"</td>
                    <td className="p-2.5 text-zinc-400">"default"</td>
                    <td className="p-2.5 font-sans text-xs text-zinc-400">Color scheme for glowing nodes and lines</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300 font-semibold">children</td>
                    <td className="p-2.5 text-zinc-400">ReactNode</td>
                    <td className="p-2.5 text-zinc-500">-</td>
                    <td className="p-2.5 font-sans text-xs text-zinc-400">Content layered on top of the interactive canvas</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300 font-semibold">cellSize</td>
                    <td className="p-2.5 text-zinc-400">number</td>
                    <td className="p-2.5 text-zinc-400">55</td>
                    <td className="p-2.5 font-sans text-xs text-zinc-400">Distance between grid intersection nodes (px)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300 font-semibold">influenceRadius</td>
                    <td className="p-2.5 text-zinc-400">number</td>
                    <td className="p-2.5 text-zinc-400">260</td>
                    <td className="p-2.5 font-sans text-xs text-zinc-400">Cursor magnetic attraction range (px)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300 font-semibold">maxWarp</td>
                    <td className="p-2.5 text-zinc-400">number</td>
                    <td className="p-2.5 text-zinc-400">24</td>
                    <td className="p-2.5 font-sans text-xs text-zinc-400">Max displacement towards pointer (px)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
