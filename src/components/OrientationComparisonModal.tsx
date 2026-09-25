import React from 'react';
import { CandidateOrientation } from '../types';
import { X, Check, ArrowRight, ShieldCheck, Clock, Layers, Anchor } from 'lucide-react';

interface OrientationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateOrientation[];
  selectedIndex: number;
  onSelectOrientation: (index: number) => void;
}

export const OrientationComparisonModal: React.FC<OrientationComparisonModalProps> = ({
  isOpen,
  onClose,
  candidates,
  selectedIndex,
  onSelectOrientation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Candidate Orientation Evaluation Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Computational trade-off analysis across support mass, build plate stability, print duration, and inter-layer strength.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Computational Heuristic:</strong> Scores and mass estimates are calculated deterministically from surface normal divergence and projected column volumes. Not certified lab data.
          </span>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand, idx) => {
            const isSelected = idx === selectedIndex;
            const isTopRanked = idx === 0;

            return (
              <div
                key={cand.id}
                className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Tag */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Option {String.fromCharCode(65 + idx)}
                    </span>
                    {isTopRanked && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm mb-1">{cand.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{cand.description}</p>

                  {/* Overall Score Badge */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 mb-4">
                    <span className="text-xs text-slate-400 font-medium">Overall Score</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-cyan-400">{cand.overallScore}</span>
                      <span className="text-xs text-slate-500 font-mono">/100</span>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" /> Support Waste
                      </span>
                      <span className="font-mono text-slate-200 font-medium">{cand.estimatedSupportGrams} g</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-emerald-400" /> Bed Contact
                      </span>
                      <span className="font-mono text-slate-200 font-medium">{cand.bedContactAreaMm2} mm²</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Print Height
                      </span>
                      <span className="font-mono text-slate-200 font-medium">{cand.estimatedHeightMm} mm</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-400" /> Est. Duration
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {Math.floor(cand.estimatedPrintTimeMinutes / 60)}h {cand.estimatedPrintTimeMinutes % 60}m
                      </span>
                    </div>
                  </div>

                  {/* Factor Score Bars */}
                  <div className="space-y-1.5 mb-4 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Support Efficiency</span>
                        <span className="font-mono">{cand.supportScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${cand.supportScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Bed Stability</span>
                        <span className="font-mono">{cand.stabilityScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${cand.stabilityScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Tensile Strength Alignment</span>
                        <span className="font-mono">{cand.strengthScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${cand.strengthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="space-y-1 text-[11px] mb-4">
                    {cand.pros.slice(0, 2).map((pro, pIdx) => (
                      <p key={pIdx} className="text-emerald-400 flex items-start gap-1">
                        <span className="text-emerald-400 font-bold shrink-0">+</span> {pro}
                      </p>
                    ))}
                    {cand.cons.slice(0, 1).map((con, cIdx) => (
                      <p key={cIdx} className="text-amber-400/90 flex items-start gap-1">
                        <span className="text-amber-400 font-bold shrink-0">-</span> {con}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => {
                    onSelectOrientation(idx);
                    onClose();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" /> Active Orientation
                    </>
                  ) : (
                    <>
                      Select Option {String.fromCharCode(65 + idx)} <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
