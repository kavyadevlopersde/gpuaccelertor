import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  Cpu,
  Layers,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingDown,
  BarChart3,
  Server,
  Code,
  ShieldAlert,
  Database,
  Sliders,
  DollarSign,
  Download,
  Terminal,
  FileText,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Clock,
  Target,
  Box,
  Share2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import KineticGrid, {
  KineticGridHandle,
  GlobalTheme,
} from "./components/ui/kinetic-grid";

export interface IndustrialProblem {
  id: string;
  name: string;
  domain: string;
  vars: number;
  cons: number;
  nonzeros: number;
  type: string;
  description: string;
  baselineObjective: number;
  unit: string;
}

const INDUSTRIAL_PROBLEMS: Record<string, IndustrialProblem> = {
  refinery_scheduling: {
    id: "refinery_scheduling",
    name: "Refinery Short-Term Scheduling (IOCL/HPCL Model)",
    domain: "Refining & Petrochemicals",
    vars: 128400,
    cons: 94600,
    nonzeros: 412000,
    type: "MILP / MINLP",
    description:
      "Crude unit allocation, tank farm blending schedule, crude distillation throughput maximization with quality specs.",
    baselineObjective: 14250800,
    unit: "₹ / day",
  },
  crude_pooling: {
    id: "crude_pooling",
    name: "Gasoline & Crude Quality Pooling (MINLP)",
    domain: "Blending Operations",
    vars: 45200,
    cons: 38100,
    nonzeros: 189000,
    type: "Non-Convex MINLP",
    description:
      "Non-linear octane, sulfur, and RVP blending constraints across multi-tank distribution networks.",
    baselineObjective: 8920400,
    unit: "₹ / batch",
  },
  supply_chain: {
    id: "supply_chain",
    name: "Multi-Echelon Freight Logistics (NTPC/Coal-Grid)",
    domain: "Supply Chain & Power",
    vars: 210500,
    cons: 162000,
    nonzeros: 840000,
    type: "Large-Scale MILP",
    description:
      "Multi-period train rake routing, coal movement optimization, and thermal power station inventory balancing.",
    baselineObjective: 45200100,
    unit: "₹ / month",
  },
  miplib_mzzv11: {
    id: "miplib_mzzv11",
    name: "MIPLIB Instance: mzzv11 (Hard Combinatorial)",
    domain: "Standard Public Benchmark",
    vars: 10240,
    cons: 9800,
    nonzeros: 125000,
    type: "MIPLIB Benchmark",
    description:
      "Challenging integer benchmark instance from MIPLIB 2017 suite used for evaluating cut generation.",
    baselineObjective: -21840,
    unit: "Obj Value",
  },
  netlib_afiro: {
    id: "netlib_afiro",
    name: "Netlib LP Instance: afiro (Sparse Baseline)",
    domain: "Netlib LP Benchmark",
    vars: 51,
    cons: 27,
    nonzeros: 102,
    type: "Linear Program",
    description:
      "Classic Netlib sparse LP used for testing Dual Simplex basis factorization speed and numerical precision.",
    baselineObjective: -464.75,
    unit: "Obj Value",
  },
};

const SOLVER_BENCHMARKS = [
  {
    name: "Param-Opt (Engine)",
    solveTime: 14.2,
    gapPercent: 0.0,
    memoryMB: 480,
    stabilityScore: 98,
    licenseCost: 0,
  },
  {
    name: "Gurobi 11.0",
    solveTime: 11.8,
    gapPercent: 0.0,
    memoryMB: 510,
    stabilityScore: 99,
    licenseCost: 45000,
  },
  {
    name: "IBM CPLEX 22.1",
    solveTime: 12.5,
    gapPercent: 0.0,
    memoryMB: 540,
    stabilityScore: 98,
    licenseCost: 42000,
  },
  {
    name: "HiGHS (Open Source)",
    solveTime: 28.6,
    gapPercent: 0.02,
    memoryMB: 620,
    stabilityScore: 91,
    licenseCost: 0,
  },
  {
    name: "SCIP 8.0 (Academic)",
    solveTime: 42.1,
    gapPercent: 0.05,
    memoryMB: 710,
    stabilityScore: 89,
    licenseCost: 0,
  },
  {
    name: "COIN-OR CBC",
    solveTime: 68.4,
    gapPercent: 0.12,
    memoryMB: 830,
    stabilityScore: 82,
    licenseCost: 0,
  },
];

export interface LogEntry {
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "accent";
}

export interface ConvergencePoint {
  step: string;
  nodes: number;
  primal: number;
  dual: number;
  gap: number;
}

export interface TreeNode {
  id: string;
  label: string;
  depth: number;
  bound: number;
  status: string;
  varsFixed: number;
  isInteger: boolean;
}

export default function App() {
  const gridRef = useRef<KineticGridHandle | null>(null);

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<
    "console" | "tree" | "convergence" | "architecture" | "roi"
  >("console");
  const [globalColor, setGlobalColor] = useState<GlobalTheme>("default");

  // Solver Configuration State
  const [selectedProblem, setSelectedProblem] =
    useState<string>("refinery_scheduling");
  const [algorithm, setAlgorithm] = useState<string>("Dual Simplex");
  const [presolveLevel, setPresolveLevel] = useState<string>("Aggressive");
  const [threads, setThreads] = useState<number>(8);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [targetGap, setTargetGap] = useState<number>(0.01);
  const [cuts, setCuts] = useState({
    gomory: true,
    mir: true,
    knapsack: true,
    clique: true,
  });

  // Execution Simulation State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionPhase, setExecutionPhase] = useState<string>("Idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [convergenceData, setConvergenceData] = useState<ConvergencePoint[]>([]);
  const [matrixMetrics, setMatrixMetrics] = useState({
    density: "0.0034%",
    luFillIn: "1.14x",
    conditionNumber: "4.2e+04",
    presolveEliminatedVars: 0,
    presolveEliminatedCons: 0,
  });

  // Search Tree State
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);

  // Enterprise ROI Calculator State
  const [licensesToReplace, setLicensesToReplace] = useState<number>(15);
  const [annualMaintenanceINR, setAnnualMaintenanceINR] = useState<number>(3500000);
  const [operationalEfficiencyGain, setOperationalEfficiencyGain] =
    useState<number>(1.8);

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTriggerCenterWave = () => {
    if (gridRef.current) {
      gridRef.current.triggerRipple(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const handleExecuteSolver = () => {
    if (isExecuting) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsExecuting(true);
    setLogs([]);
    setConvergenceData([]);
    setCurrentStep(0);
    setExecutionPhase("Presolve");

    // Also trigger a ripple on execution
    handleTriggerCenterWave();

    const prob = INDUSTRIAL_PROBLEMS[selectedProblem];
    const baseObj = prob.baselineObjective;
    let stepCount = 0;

    const initialTree: TreeNode[] = [
      {
        id: "1",
        label: "Node 0 (Root)",
        depth: 0,
        bound: baseObj * 1.08,
        status: "Active",
        varsFixed: 0,
        isInteger: false,
      },
    ];
    setTreeNodes(initialTree);
    setSelectedTreeNode(initialTree[0]);

    const addLog = (
      msg: string,
      type: "info" | "success" | "warning" | "accent" = "info"
    ) => {
      const now = new Date();
      const timestamp =
        now.toLocaleTimeString("en-US", { hour12: false }) +
        "." +
        String(now.getMilliseconds()).padStart(3, "0");
      setLogs((prev) => [...prev, { timestamp, text: msg, type }]);
    };

    addLog(`[PARAM-OPT INIT] Loading problem formulation: ${prob.name}`);
    addLog(
      `[MATRIX STATS] Variables: ${prob.vars.toLocaleString()} | Constraints: ${prob.cons.toLocaleString()} | Non-Zeros: ${prob.nonzeros.toLocaleString()}`
    );
    addLog(
      `[CONFIG] Solver Engine configured with ${threads} parallel threads. Presolve: ${presolveLevel}. Target Gap: ${targetGap}%`
    );

    timerRef.current = setInterval(() => {
      stepCount++;
      setCurrentStep(stepCount);

      if (stepCount === 2) {
        addLog(
          `[PRESOLVE] Starting Presolve Pass 1... Tighter bounds discovered on 4,120 binary variables.`,
          "accent"
        );
        const elimVars = Math.floor(
          prob.vars *
            (presolveLevel === "Aggressive"
              ? 0.28
              : presolveLevel === "Basic"
              ? 0.12
              : 0)
        );
        const elimCons = Math.floor(
          prob.cons *
            (presolveLevel === "Aggressive"
              ? 0.22
              : presolveLevel === "Basic"
              ? 0.08
              : 0)
        );
        setMatrixMetrics((prev) => ({
          ...prev,
          presolveEliminatedVars: elimVars,
          presolveEliminatedCons: elimCons,
        }));
        addLog(
          `[PRESOLVE] Eliminated ${elimVars.toLocaleString()} redundant variables & ${elimCons.toLocaleString()} trivial rows.`,
          "success"
        );
      } else if (stepCount === 4) {
        setExecutionPhase("Root LP");
        addLog(
          `[ROOT LP] Factorizing initial basis matrix (LU Factorization with Markowitz Pivoting)...`
        );
        addLog(
          `[ROOT LP] Condition Number: 3.8e+04. Dynamic Steepest-Edge Dual Simplex running...`
        );
      } else if (stepCount === 6) {
        setExecutionPhase("Cutting Loop");
        addLog(
          `[CUT ENGINE] Solved Root LP relaxation. Continuous Obj: ${(
            baseObj * 1.082
          ).toFixed(2)}`
        );
        addLog(
          `[CUT ENGINE] Separating cuts: Gomory Mixed-Integer (${
            cuts.gomory ? "ON" : "OFF"
          }), MIR (${cuts.mir ? "ON" : "OFF"}), Cover (${
            cuts.knapsack ? "ON" : "OFF"
          }).`
        );
        addLog(
          `[CUT ENGINE] Added 342 valid cuts. Tightened Dual Bound: ${(
            baseObj * 1.051
          ).toFixed(2)}`,
          "success"
        );
      } else if (stepCount === 8) {
        setExecutionPhase("Branch & Bound");
        addLog(
          `[HEURISTICS] Feasibility Pump triggered. Found Primal Integer Feasible solution!`,
          "warning"
        );
        addLog(
          `[HEURISTICS] Initial Incumbent Objective: ${(
            baseObj * 1.025
          ).toFixed(2)}`
        );

        const generatedTree: TreeNode[] = [
          {
            id: "1",
            label: "Node 0 (Root)",
            depth: 0,
            bound: baseObj * 1.051,
            status: "Branching",
            varsFixed: 0,
            isInteger: false,
          },
          {
            id: "2",
            label: "Node 1 (L)",
            depth: 1,
            bound: baseObj * 1.042,
            status: "Active",
            varsFixed: 12,
            isInteger: false,
          },
          {
            id: "3",
            label: "Node 2 (R)",
            depth: 1,
            bound: baseObj * 1.05,
            status: "Pruned (Infeasible)",
            varsFixed: 12,
            isInteger: false,
          },
          {
            id: "4",
            label: "Node 3 (LL)",
            depth: 2,
            bound: baseObj * 1.025,
            status: "Integer Solution",
            varsFixed: 28,
            isInteger: true,
          },
          {
            id: "5",
            label: "Node 4 (LR)",
            depth: 2,
            bound: baseObj * 1.038,
            status: "Active",
            varsFixed: 31,
            isInteger: false,
          },
          {
            id: "6",
            label: "Node 5 (LRA)",
            depth: 3,
            bound: baseObj * 1.011,
            status: "Active",
            varsFixed: 45,
            isInteger: false,
          },
          {
            id: "7",
            label: "Node 6 (LRB)",
            depth: 3,
            bound: baseObj * 1.002,
            status: "Pruned (Bound)",
            varsFixed: 48,
            isInteger: false,
          },
        ];
        setTreeNodes(generatedTree);
      } else if (stepCount >= 9 && stepCount <= 15) {
        const progress = (stepCount - 8) / 7;
        const currentPrimal = baseObj * 1.025 - progress * baseObj * 0.025;
        const currentDual = baseObj * 0.96 + progress * baseObj * 0.04;
        const gap =
          Math.abs((currentPrimal - currentDual) / currentPrimal) * 100;

        setConvergenceData((prev) => [
          ...prev,
          {
            step: `Sec ${(stepCount * 0.9).toFixed(1)}`,
            nodes: stepCount * 45,
            primal: parseFloat(currentPrimal.toFixed(2)),
            dual: parseFloat(currentDual.toFixed(2)),
            gap: parseFloat(gap.toFixed(2)),
          },
        ]);

        addLog(
          `[B&B SEARCH] Nodes: ${stepCount * 45} | Active Leaves: ${
            15 - stepCount
          } | Best Primal: ${currentPrimal.toFixed(
            2
          )} | Best Dual: ${currentDual.toFixed(2)} | Gap: ${gap.toFixed(2)}%`
        );
      } else if (stepCount > 15) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsExecuting(false);
        setExecutionPhase("Finished");
        addLog(
          `[SOLVER COMPLETE] Optimal solution found within target optimality gap!`,
          "success"
        );
        addLog(
          `[SUMMARY] Final Objective: ${baseObj.toLocaleString()} ${
            prob.unit
          } | Elapsed Time: 14.2s | Total Nodes: 680`
        );
      }
    }, 700);
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsExecuting(false);
    setExecutionPhase("Idle");
    setLogs([]);
    setConvergenceData([]);
    setTreeNodes([]);
    setSelectedTreeNode(null);
  };

  const calculateSavings = () => {
    const directLicenseSavings = licensesToReplace * annualMaintenanceINR;
    const operationalSavings =
      INDUSTRIAL_PROBLEMS[selectedProblem].baselineObjective *
      (operationalEfficiencyGain / 100) *
      365;
    const totalINR = directLicenseSavings + operationalSavings;
    return {
      licenseINR: directLicenseSavings / 10000000,
      opINR: operationalSavings / 10000000,
      totalINR: totalINR / 10000000,
    };
  };

  const savings = calculateSavings();

  const handleExportReport = () => {
    const reportData = {
      engine: "PARAM-OPT v2.4-IND-CORE",
      timestamp: new Date().toISOString(),
      problem: INDUSTRIAL_PROBLEMS[selectedProblem],
      configuration: {
        algorithm,
        presolveLevel,
        threads,
        timeLimit,
        targetGap,
        cuts,
      },
      matrixMetrics,
      roiImpact: {
        licensesToReplace,
        annualMaintenanceINR,
        operationalEfficiencyGainPercent: operationalEfficiencyGain,
        licenseCostSavingsCrores: savings.licenseINR,
        operationalSavingsCrores: savings.opINR,
        totalStrategicImpactCroresPerYear: savings.totalINR,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PARAM-OPT_${selectedProblem}_report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <KineticGrid ref={gridRef} globalColor={globalColor}>
      {/* Top Header / Navigation Bar styled matching the picture */}
      <header className="relative z-20 border-b border-white/10 bg-zinc-950/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Path */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono font-bold text-sm shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                PARAM-OPT Optimization Core
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                @/solvers/param-opt-v2.4.rs
              </span>
            </div>
          </div>

          {/* Theme Switcher & Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
              <button
                id="theme-default-btn"
                onClick={() => setGlobalColor("default")}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  globalColor === "default"
                    ? "bg-sky-500/20 text-sky-300 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Default
              </button>
              <button
                id="theme-mono-btn"
                onClick={() => setGlobalColor("monochrome")}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  globalColor === "monochrome"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monochrome
              </button>
            </div>

            <button
              onClick={handleExportReport}
              className="text-xs bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-950" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Component Demo Area (Styled exactly matching the picture) */}
      <main className="relative z-10">
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center relative pointer-events-auto pt-8 pb-12">
          {/* Pill Badge with ping dot */}
          <div className="inline-flex items-center space-x-2 mb-6 rounded-full border border-sky-400/20 bg-sky-500/10 px-3.5 py-1 text-xs font-medium tracking-wide text-sky-300 backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            <span>Interactive Canvas • C++ / Rust Solver Core + Dual Simplex</span>
          </div>

          {/* Hero Typography */}
          <h1 className="max-w-4xl text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            High-Performance Industrial
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Mathematical Optimization Engine
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 font-normal leading-relaxed">
            Sovereign solver engine for large-scale MILP &amp; MINLP problems featuring ultra-sparse Dual Simplex, dynamic Markowitz LU refactorization, and real-time gap convergence.
          </p>

          {/* Interactive Hints Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-4 py-2 rounded-xl backdrop-blur-md">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                Problem Selection
              </kbd>
              <span>IOCL/HPCL, NTPC Logistics, MIPLIB</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-4 py-2 rounded-xl backdrop-blur-md">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                1-Click Execution
              </kbd>
              <span>Real-time B&amp;B search with dynamic gap convergence</span>
            </div>
          </div>

          {/* Hero Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleExecuteSolver}
              disabled={isExecuting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-medium text-sm transition-all shadow-[0_0_25px_rgba(56,189,248,0.35)] active:scale-95 flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Optimizing Engine Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Solver Engine</span>
                </>
              )}
            </button>

            <button
              onClick={handleTriggerCenterWave}
              className="px-5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 font-medium text-sm transition-all active:scale-95"
            >
              Trigger Center Wave
            </button>

            <a
              href="#solver-workspace"
              className="px-5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 font-medium text-sm transition-all active:scale-95"
            >
              Explore Solver Workspace
            </a>
          </div>
        </section>

        {/* Solver Workspace Navigation Tabs */}
        <section id="solver-workspace" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
            <div className="flex flex-wrap gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80">
              <button
                onClick={() => setActiveTab("console")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === "console"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Solver Console</span>
              </button>

              <button
                onClick={() => setActiveTab("tree")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === "tree"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Search Tree</span>
              </button>

              <button
                onClick={() => setActiveTab("convergence")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === "convergence"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Convergence &amp; Benchmarks</span>
              </button>

              <button
                onClick={() => setActiveTab("architecture")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === "architecture"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Matrix &amp; Presolve</span>
              </button>

              <button
                onClick={() => setActiveTab("roi")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === "roi"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Enterprise ROI</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab 1: Solver Console */}
        {activeTab === "console" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column: Problem & Parameters */}
              <div className="col-span-12 lg:col-span-4 space-y-5">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Box className="h-4 w-4 text-sky-400" />
                      Target Industrial Instance
                    </h3>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                      Problem Selection
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.values(INDUSTRIAL_PROBLEMS).map((prob) => (
                      <button
                        key={prob.id}
                        onClick={() => setSelectedProblem(prob.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedProblem === prob.id
                            ? "bg-sky-950/40 border-sky-500/50 text-white shadow-md shadow-sky-950/50"
                            : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-xs text-sky-300">
                            {prob.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            {prob.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">
                          {prob.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                          <span>Vars: {prob.vars.toLocaleString()}</span>
                          <span>•</span>
                          <span>Cons: {prob.cons.toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hyperparameters Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-sky-400" />
                    Engine Hyperparameters
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        LP Simplex Method
                      </label>
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                      >
                        <option>Dual Simplex</option>
                        <option>Primal Simplex</option>
                        <option>Barrier Interior Point</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Presolve Level
                      </label>
                      <select
                        value={presolveLevel}
                        onChange={(e) => setPresolveLevel(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                      >
                        <option>Aggressive</option>
                        <option>Basic</option>
                        <option>Off</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Threads
                      </label>
                      <input
                        type="number"
                        value={threads}
                        onChange={(e) => setThreads(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Time (s)
                      </label>
                      <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        MIP Gap %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={targetGap}
                        onChange={(e) => setTargetGap(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={handleExecuteSolver}
                      disabled={isExecuting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Solving Active...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          <span>Execute Engine</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Status Cards & Terminal Logs */}
              <div className="col-span-12 lg:col-span-8 flex flex-col space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-[11px] text-zinc-400 block">
                      Presolve Reductions
                    </span>
                    <div className="text-lg font-bold font-mono text-sky-400 mt-1">
                      {matrixMetrics.presolveEliminatedVars.toLocaleString()}{" "}
                      <span className="text-xs text-zinc-500">vars</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {matrixMetrics.presolveEliminatedCons.toLocaleString()}{" "}
                      rows removed
                    </span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-[11px] text-zinc-400 block">
                      Matrix Density (CSC)
                    </span>
                    <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
                      {matrixMetrics.density}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Ultra-Sparse Matrix
                    </span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-[11px] text-zinc-400 block">
                      LU Condition
                    </span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {matrixMetrics.conditionNumber}
                    </div>
                    <span className="text-[10px] text-emerald-500/80 mt-1 block">
                      Stable Markowitz
                    </span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-[11px] text-zinc-400 block">
                      Fill-In Ratio
                    </span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                      {matrixMetrics.luFillIn}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Basis Refactor
                    </span>
                  </div>
                </div>

                {/* Live Terminal Output Console */}
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs flex flex-col min-h-[380px] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4 text-sky-400" />
                      <span className="text-zinc-200 font-semibold text-xs">
                        PARAM-OPT Runtime Log Stream
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800/90 px-2.5 py-1 rounded-lg text-xs">
                        <span className="flex h-2 w-2 relative">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isExecuting ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              isExecuting ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          ></span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-300">
                          {isExecuting ? `Status: ${executionPhase}` : "Status: Ready"}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800">
                        Step {currentStep}/16
                      </span>
                    </div>
                  </div>

                  <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar"
                  >
                    {logs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-sans space-y-2 py-12">
                        <Cpu className="h-8 w-8 text-zinc-700" />
                        <p>
                          Click "Execute Solver Engine" to launch mathematical
                          optimization.
                        </p>
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 text-[11px] leading-relaxed"
                        >
                          <span className="text-zinc-600 select-none font-mono text-[10px]">
                            {log.timestamp}
                          </span>
                          <span
                            className={`flex-1 ${
                              log.type === "success"
                                ? "text-emerald-400"
                                : log.type === "warning"
                                ? "text-amber-400"
                                : log.type === "accent"
                                ? "text-sky-400"
                                : "text-zinc-300"
                            }`}
                          >
                            {log.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 mt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>
                      Target: {INDUSTRIAL_PROBLEMS[selectedProblem].domain}
                    </span>
                    <span>Threading: OpenMP Parallel Core</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Search Tree */}
        {activeTab === "tree" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-400" />
                      Branch-and-Cut Search Tree Architecture
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Dynamic node decomposition, active leaf selection, and integer bounding hierarchy
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                    Strong Branching Active
                  </span>
                </div>

                <div className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-8 flex items-center justify-center relative overflow-x-auto">
                  {treeNodes.length === 0 ? (
                    <div className="text-center text-zinc-500 space-y-3">
                      <Layers className="h-10 w-10 text-zinc-700 mx-auto" />
                      <p className="text-xs">
                        No search tree generated yet. Execute the solver engine to inspect tree expansion.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-12 w-full max-w-2xl">
                      <div className="flex justify-center">
                        {treeNodes
                          .filter((n) => n.depth === 0)
                          .map((node) => (
                            <button
                              key={node.id}
                              onClick={() => setSelectedTreeNode(node)}
                              className={`px-4 py-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col items-center shadow-lg ${
                                selectedTreeNode?.id === node.id
                                  ? "bg-sky-500/20 border-sky-400 text-sky-300 ring-2 ring-sky-500/30"
                                  : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                              }`}
                            >
                              <span className="font-bold">{node.label}</span>
                              <span className="text-[10px] opacity-75">
                                Bound: {node.bound.toFixed(0)}
                              </span>
                            </button>
                          ))}
                      </div>

                      <div className="w-1/2 h-0.5 bg-zinc-800 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-mono">
                          x1 &le; 0 | x1 &ge; 1
                        </div>
                      </div>

                      <div className="flex justify-between w-full max-w-lg">
                        {treeNodes
                          .filter((n) => n.depth === 1)
                          .map((node) => (
                            <button
                              key={node.id}
                              onClick={() => setSelectedTreeNode(node)}
                              className={`px-4 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col items-center shadow-md ${
                                node.status.includes("Infeasible")
                                  ? "bg-rose-950/40 border-rose-800/80 text-rose-400"
                                  : selectedTreeNode?.id === node.id
                                  ? "bg-sky-500/20 border-sky-400 text-sky-300 ring-2 ring-sky-500/30"
                                  : "bg-zinc-900 border-zinc-700 text-zinc-300"
                              }`}
                            >
                              <span className="font-bold">{node.label}</span>
                              <span className="text-[10px] opacity-75">
                                {node.status}
                              </span>
                            </button>
                          ))}
                      </div>

                      <div className="flex justify-around w-full">
                        {treeNodes
                          .filter((n) => n.depth === 2)
                          .map((node) => (
                            <button
                              key={node.id}
                              onClick={() => setSelectedTreeNode(node)}
                              className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col items-center ${
                                node.isInteger
                                  ? "bg-emerald-950/50 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50"
                                  : selectedTreeNode?.id === node.id
                                  ? "bg-sky-500/20 border-sky-400 text-sky-300"
                                  : "bg-zinc-900 border-zinc-700 text-zinc-300"
                              }`}
                            >
                              <span className="font-bold">{node.label}</span>
                              <span className="text-[10px] opacity-75">
                                {node.isInteger
                                  ? "★ Integer Sol"
                                  : `Bound: ${node.bound.toFixed(0)}`}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Node context */}
              <div className="col-span-12 lg:col-span-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-400" />
                  Active Node Context
                </h3>

                {selectedTreeNode ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-sky-300 font-mono">
                          {selectedTreeNode.label}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            selectedTreeNode.isInteger
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {selectedTreeNode.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono pt-2 border-t border-zinc-900">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Tree Depth:</span>
                          <span className="text-zinc-200">
                            {selectedTreeNode.depth}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Local Dual Bound:</span>
                          <span className="text-zinc-200">
                            {selectedTreeNode.bound.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Variables Fixed:</span>
                          <span className="text-zinc-200">
                            {selectedTreeNode.varsFixed}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Integrality Feasible:</span>
                          <span
                            className={
                              selectedTreeNode.isInteger
                                ? "text-emerald-400"
                                : "text-zinc-400"
                            }
                          >
                            {selectedTreeNode.isInteger
                              ? "Yes (Incumbent)"
                              : "No (Fractional)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-300 block">
                        Branching Decision Variable
                      </span>
                      <p className="text-xs text-zinc-400">
                        Variable{" "}
                        <code className="text-sky-400 font-mono">
                          x_blend_unit_42
                        </code>{" "}
                        selected via Strong Branching score (Fractional: 0.428).
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Click any node on the search tree to inspect local bounds.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Convergence & Benchmarks */}
        {activeTab === "convergence" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-sky-400" />
                    Primal Upper Bound vs. Dual Lower Bound Convergence
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time gap reduction during Branch-and-Cut optimization
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {convergenceData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <Activity className="h-8 w-8 text-zinc-700 mb-2" />
                    Execute the solver engine to plot real-time convergence curves.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="step" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "0.75rem",
                          fontSize: "11px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line
                        type="monotone"
                        dataKey="primal"
                        stroke="#10b981"
                        name="Primal Bound (Feasible Sol)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="dual"
                        stroke="#0ea5e9"
                        name="Dual Bound (Relaxation)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Benchmarks vs Gurobi/CPLEX */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-sky-400" />
                  Solve Time Comparison across Industrial Benchmarks (Seconds)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SOLVER_BENCHMARKS} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" stroke="#71717a" fontSize={11} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#71717a"
                        fontSize={10}
                        width={130}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "0.75rem",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="solveTime" fill="#0ea5e9" radius={[0, 6, 6, 0]}>
                        {SOLVER_BENCHMARKS.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name.includes("Param-Opt")
                                ? "#10b981"
                                : "#38bdf8"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-sky-400" />
                  Competitive Solver Matrix
                </h3>

                <div className="space-y-2.5 text-xs">
                  {SOLVER_BENCHMARKS.map((solver, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span
                          className={`font-semibold ${
                            solver.name.includes("Param-Opt")
                              ? "text-emerald-400"
                              : "text-zinc-300"
                          }`}
                        >
                          {solver.name}
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Memory: {solver.memoryMB} MB | Stability:{" "}
                          {solver.stabilityScore}/100
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sky-300">
                          {solver.solveTime}s
                        </span>
                        <div className="text-[10px] text-zinc-500">
                          {solver.licenseCost === 0
                            ? "Open / Sovereign"
                            : `$${solver.licenseCost.toLocaleString()}/yr`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Matrix & Presolve */}
        {activeTab === "architecture" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-sky-400" />
                  Sparse Matrix Structure Preview (CSC / CSR Form)
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Visual representation of non-zero structural entries across linear constraints
                </p>

                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="grid grid-cols-12 gap-1.5 w-full max-w-sm">
                    {Array.from({ length: 144 }).map((_, i) => {
                      const isNonZero =
                        (i * 37) % 7 === 0 || (i * 13) % 11 === 0;
                      return (
                        <div
                          key={i}
                          className={`h-4 rounded-sm transition-all ${
                            isNonZero
                              ? "bg-sky-500 shadow-sm shadow-sky-500/50"
                              : "bg-zinc-900/40"
                          }`}
                          title={
                            isNonZero
                              ? `Non-zero A[${Math.floor(i / 12)}, ${i % 12}]`
                              : "Zero Entry"
                          }
                        />
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-[11px] text-zinc-400 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-sky-500 rounded-sm"></span>
                      <span>Non-zero Coefficient</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-zinc-900 border border-zinc-800 rounded-sm"></span>
                      <span>Zero Entry</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  Presolve &amp; Reduction Analytics
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">
                        Domain Bound Tightening
                      </span>
                      <span className="text-sky-400 font-mono">
                        3,820 variables
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-3/4"></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">
                        Parallel Row &amp; Column Elimination
                      </span>
                      <span className="text-indigo-400 font-mono">
                        1,450 rows
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-1/2"></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">
                        Implication Graph Clique Extraction
                      </span>
                      <span className="text-emerald-400 font-mono">
                        248 cliques
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 5: Enterprise ROI */}
        {activeTab === "roi" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-sky-400" />
                  Sovereign License &amp; Operational Impact
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1.5">
                      Foreign Solver Licenses to Replace (Gurobi / CPLEX)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={licensesToReplace}
                      onChange={(e) => setLicensesToReplace(Number(e.target.value))}
                      className="w-full accent-sky-500 bg-zinc-950 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-xs font-mono text-sky-400 mt-1">
                      <span>1 License</span>
                      <span className="font-bold">{licensesToReplace} Licenses</span>
                      <span>50 Licenses</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1.5">
                      Annual Maintenance per License (₹)
                    </label>
                    <input
                      type="number"
                      value={annualMaintenanceINR}
                      onChange={(e) =>
                        setAnnualMaintenanceINR(Number(e.target.value))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1.5">
                      Estimated Operational Efficiency Gain (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={operationalEfficiencyGain}
                      onChange={(e) =>
                        setOperationalEfficiencyGain(Number(e.target.value))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
                    <span className="text-xs text-zinc-400 block">
                      Direct License Cost Savings
                    </span>
                    <div className="text-2xl font-bold font-mono text-sky-400 mt-2">
                      ₹ {savings.licenseINR.toFixed(2)} Cr
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Annual Recurring Expenditure Saved
                    </span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
                    <span className="text-xs text-zinc-400 block">
                      Yield &amp; Logistics Savings
                    </span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                      ₹ {savings.opINR.toFixed(2)} Cr
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      From Short-Term Scheduling Tightening
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/30 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-sky-300 font-semibold tracking-wider uppercase">
                      Total National Strategic Impact
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-white mt-1">
                      ₹ {savings.totalINR.toFixed(2)} Crores / year
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Reduces foreign technological dependence across Indian industrial refining and logistics infrastructure.
                    </p>
                  </div>
                  <button
                    onClick={handleExportReport}
                    className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-zinc-800/80 py-8 bg-zinc-950/60 text-center text-xs text-zinc-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400 font-medium">PARAM-OPT Solver Core</span>
              <span>•</span>
              <span>Sovereign Mathematical Optimization Engine</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTriggerCenterWave}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Ripple Effect
              </button>
              <button
                onClick={handleExportReport}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Export JSON Report
              </button>
            </div>
          </div>
        </footer>
      </main>
    </KineticGrid>
  );
}
