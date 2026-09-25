import React from 'react';
import { PrintabilityAssessment, PrintabilityIssue } from '../types';
import {
  X,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Flame,
  Anchor,
  Layers,
  Wrench,
} from 'lucide-react';

interface PrintabilityBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  printability: PrintabilityAssessment;
  activeCategoryKey?: string | null;
}

export const PrintabilityBreakdownModal: React.FC<PrintabilityBreakdownModalProps> = ({
  isOpen,
  onClose,
  printability,
  activeCategoryKey,
}) => {
  if (!isOpen) return null;

  const { overallScore, rating, breakdown, issues } = printability;

  const categories = [
    {
      key: 'geometry',
      title: 'Geometric Manifold Quality',
      icon: Maximize2,
      data: breakdown.geometry,
      weight: '20% Weight',
      description: 'Checks for closed triangular meshes, consistent face normal orientation, non-manifold edges, and edge intersection integrity.',
    },
    {
      key: 'overhangs',
      title: 'Cantilever & Overhang Severity',
      icon: Flame,
      data: breakdown.overhangs,
      weight: '25% Weight',
      description: 'Calculates the proportion of surfaces pointing downward steeper than the 45° self-supporting threshold.',
    },
    {
      key: 'stability',
      title: 'Build Plate Adhesion & Stability',
      icon: Anchor,
      data: breakdown.stability,
      weight: '25% Weight',
      description: 'Measures total first-layer contact footprint against the center-of-mass height to prevent part detachment.',
    },
    {
      key: 'supports',
      title: 'Support Structure Overhead',
      icon: Layers,
      data: breakdown.supports,
      weight: '15% Weight',
      description: 'Estimates sacrificial support column volume, printing duration overhead, and post-processing blemish risk.',
    },
    {
      key: 'thinFeatures',
      title: 'Thin Walls & Feature Resilience',
      icon: Wrench,
      data: breakdown.thinFeatures,
      weight: '15% Weight',
      description: 'Verifies minimum wall thickness against typical 0.4mm nozzle extrusion track width (minimum 2–3 line widths recommended).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              Printability Score Calculation Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Computational evaluation of manufacturing risk factors based on part geometry and slicer physics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Big Score Summary Banner */}
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Composite Printability Rating
              </div>
              <div className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <span>{rating}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                  Starting Estimate
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Scores above 75 indicate reliable print execution on tuned desktop 3D printers with standard slicer profiles.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black font-mono text-cyan-400">{overallScore}</div>
              <div className="text-xs font-mono text-slate-500">out of 100</div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Evaluated Criteria Breakdown
            </h3>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isHighlight = activeCategoryKey === cat.key;
              const score = cat.data.score;
              const barColor =
                score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-cyan-500' : 'bg-amber-500';

              return (
                <div
                  key={cat.key}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighlight
                      ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{cat.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cat.weight} • Status: <span className="text-slate-300 font-medium">{cat.data.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-slate-100">{score}</span>
                      <span className="text-xs font-mono text-slate-500">/100</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-1">{cat.data.detail}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
                </div>
              );
            })}
          </div>

          {/* Detected Issues Section */}
          {issues.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Detected Manufacturing Warnings & Solutions
              </h3>
              <div className="space-y-2.5">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      issue.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : issue.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                      {issue.severity === 'critical' && (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      {issue.severity === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      {issue.severity === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
                      <span>{issue.title}</span>
                    </div>
                    <p className="text-slate-300 mb-2 leading-relaxed">{issue.description}</p>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-slate-200">
                      <strong className="text-cyan-400">Suggested Slicer Solution: </strong>
                      {issue.suggestedSolution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
