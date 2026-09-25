import React from 'react';
import { AdvisorReport } from '../types';
import {
  X,
  HelpCircle,
  Compass,
  Cpu,
  Beaker,
  Sliders,
  Grid,
  CheckCircle2,
} from 'lucide-react';

interface WhyExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AdvisorReport;
  activeTopic?: 'orientation' | 'technology' | 'material' | 'settings' | 'infill' | 'all';
}

export const WhyExplanationModal: React.FC<WhyExplanationModalProps> = ({
  isOpen,
  onClose,
  report,
  activeTopic = 'all',
}) => {
  if (!isOpen) return null;

  const topics = [
    {
      id: 'orientation',
      title: 'Why This Orientation?',
      icon: Compass,
      headline: `Selected Orientation: ${report.candidateOrientations[report.selectedOrientationIndex]?.name || 'Base Flat on Plate'}`,
      explanation: report.whyDecisions.orientation,
      highlights: [
        `Bed contact footprint: ${report.candidateOrientations[report.selectedOrientationIndex]?.bedContactAreaMm2 ?? 250} mm²`,
        `Estimated support material: ${report.candidateOrientations[report.selectedOrientationIndex]?.estimatedSupportGrams ?? 8} grams`,
        `Tensile load axis aligned with continuous extruded perimeter fibers`,
      ],
    },
    {
      id: 'technology',
      title: 'Why This Printing Technology?',
      icon: Cpu,
      headline: `Recommended Method: ${report.technology.technology}`,
      explanation: report.technology.headlineReason,
      highlights: report.technology.why,
    },
    {
      id: 'material',
      title: 'Why This Material?',
      icon: Beaker,
      headline: `Chosen Polymer: ${report.material.primaryMaterial.name}`,
      explanation: report.whyDecisions.material,
      highlights: [
        `Tensile Strength: ${report.material.primaryMaterial.tensileStrengthMpa} MPa`,
        `Heat Deflection Temperature: ${report.material.primaryMaterial.heatDeflectionTempC} °C`,
        `Flexibility: ${report.material.primaryMaterial.flexibility}`,
      ],
    },
    {
      id: 'settings',
      title: 'Why These Slicer Settings?',
      icon: Sliders,
      headline: `${report.settings.layerHeightMm}mm Layer Height & ${report.settings.wallPerimeters} Wall Perimeters`,
      explanation: report.whyDecisions.settings,
      highlights: report.settings.startingProfileNotes,
    },
    {
      id: 'infill',
      title: 'Why This Infill Pattern & Density?',
      icon: Grid,
      headline: `${report.settings.infillPercent}% ${report.settings.infillPattern} Infill`,
      explanation: report.whyDecisions.infill,
      highlights: [
        'Gyroid infill provides true 3D isotropic shear load distribution without directional weakness planes',
        'Avoids nozzle drag collisions common in rectilinear/grid cross-overs',
        'Optimizes material usage while keeping internal wall buckling resistance high',
      ],
    },
  ];

  const filteredTopics =
    activeTopic === 'all'
      ? topics
      : topics.filter((t) => t.id === activeTopic);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              Engineering Reasoning & Decisions Behind Recommendations
            </h2>
            <p className="text-xs text-slate-400">
              Transparent justifications based on mechanics of materials, thermal contraction, and additive toolpaths.
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
          {filteredTopics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                    <div className="text-xs font-mono text-cyan-400/90">{item.headline}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {item.explanation}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Technical Factors:
                    </div>
                    {item.highlights.map((hl, hIdx) => (
                      <div key={hIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                )}
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
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
