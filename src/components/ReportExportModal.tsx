import React, { useState } from 'react';
import { AdvisorReport } from '../types';
import {
  X,
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AdvisorReport;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'report' | 'slicer_cheat_sheet' | 'markdown'>('report');

  if (!isOpen) return null;

  const currentOrientation =
    report.candidateOrientations[report.selectedOrientationIndex] || report.candidateOrientations[0];

  const markdownReport = `
# PRINTWISE 3D PRINTING ADVISORY REPORT
Generated: ${new Date(report.createdAt).toLocaleString()}
Object: ${report.objectName}
Analysis Confidence: ${report.confidenceScore}% (${report.isGeometricExact ? 'Exact Geometric Analysis' : 'Multimodal AI Vision Heuristic'})

---------------------------------------------------------
1. PRINTABILITY OVERVIEW
---------------------------------------------------------
Printability Score: ${report.printability.overallScore} / 100 (${report.printability.rating})
- Geometry Quality: ${report.printability.breakdown.geometry.score}/100 (${report.printability.breakdown.geometry.status})
- Overhang Severity: ${report.printability.breakdown.overhangs.score}/100 (${report.printability.breakdown.overhangs.status})
- Bed Stability: ${report.printability.breakdown.stability.score}/100 (${report.printability.breakdown.stability.status})
- Support Overhead: ${report.printability.breakdown.supports.score}/100 (${report.printability.breakdown.supports.status})
- Thin Features: ${report.printability.breakdown.thinFeatures.score}/100 (${report.printability.breakdown.thinFeatures.status})

---------------------------------------------------------
2. RECOMMENDED PRODUCTION CONFIGURATION
---------------------------------------------------------
Technology: ${report.technology.technology}
Primary Material: ${report.material.primaryMaterial.name}
Alternative Material: ${report.material.alternatives.map((m) => m.name).join(', ') || 'None'}
Optimal Orientation: ${currentOrientation?.name || 'Base Flat'}
- Rotation: [${currentOrientation?.rotationDegrees.join('°, ')}°]
- Estimated Support Waste: ${currentOrientation?.estimatedSupportGrams ?? 0} g
- Build Plate Contact Area: ${currentOrientation?.bedContactAreaMm2 ?? 0} mm²
- Part Height: ${currentOrientation?.estimatedHeightMm ?? 0} mm

---------------------------------------------------------
3. STARTING SLICER SETTINGS (Bambu Studio / PrusaSlicer / Cura)
---------------------------------------------------------
Layer Height: ${report.settings.layerHeightMm} mm
Infill Density: ${report.settings.infillPercent}%
Infill Pattern: ${report.settings.infillPattern}
Wall / Perimeter Loops: ${report.settings.wallPerimeters}
Top Solid Layers: ${report.settings.topLayers}
Bottom Solid Layers: ${report.settings.bottomLayers}
Support Structure: ${report.settings.supportRequired ? report.settings.supportType : 'Disabled'}
Support Threshold Angle: ${report.settings.supportOverhangAngleDeg}°
Brim Recommendation: ${report.settings.brimOrRaftRecommendation}
Nozzle Temperature Range: ${report.settings.nozzleTempRange}
Bed Temperature Range: ${report.settings.bedTempRange}
Print Speed Range: ${report.settings.printSpeedRange}

---------------------------------------------------------
4. POTENTIAL ISSUES & MITIGATIONS
---------------------------------------------------------
${report.printability.issues.map((i) => `* [${i.severity.toUpperCase()}] ${i.title}: ${i.description}\n  -> Solution: ${i.suggestedSolution}`).join('\n\n')}

---------------------------------------------------------
5. SAFETY & REGULATORY DISCLAIMER
---------------------------------------------------------
${report.safetyDisclaimer}
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrintWise_Report_${report.objectName.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              PrintWise Assessment Report & Slicer Export
            </h2>
            <p className="text-xs text-slate-400">
              Download complete manufacturing specification or copy profile parameters directly into your slicer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Actions */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'report' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formal Report
            </button>
            <button
              onClick={() => setActiveTab('slicer_cheat_sheet')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'slicer_cheat_sheet'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Slicer Cheat-Sheet
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'markdown' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Markdown Text
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'report' && (
            <div className="space-y-6 text-slate-200">
              {/* Report Header Card */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                    PrintWise Assessment Summary
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">{report.objectName}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Analyzed on {new Date(report.createdAt).toLocaleDateString()} • Modality: {report.inputModality}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase">Printability</div>
                    <div className="text-3xl font-black font-mono text-cyan-400">
                      {report.printability.overallScore}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Level Spec Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Technology</div>
                  <div className="font-bold text-slate-100 text-sm">{report.technology.technology}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">Suitability: High</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Material</div>
                  <div className="font-bold text-slate-100 text-sm">{report.material.primaryMaterial.name.split(' (')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-1">HDT: {report.material.primaryMaterial.heatDeflectionTempC}°C</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Orientation</div>
                  <div className="font-bold text-slate-100 text-sm truncate">{currentOrientation?.name.split(' (')[0]}</div>
                  <div className="text-[10px] text-cyan-400 mt-1">{currentOrientation?.overallScore} pts overall</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Est. Duration</div>
                  <div className="font-bold text-slate-100 text-sm">
                    {Math.floor(report.estimatedTotalTimeMinutes / 60)}h {report.estimatedTotalTimeMinutes % 60}m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">~{report.estimatedPartWeightGrams}g part + {report.estimatedSupportWeightGrams}g sup</div>
                </div>
              </div>

              {/* Slicer Settings Overview */}
              <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Starting Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Layer Height:</span>
                    <span className="text-cyan-400 font-bold">{report.settings.layerHeightMm} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Infill Density:</span>
                    <span className="text-cyan-400 font-bold">{report.settings.infillPercent}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Infill Pattern:</span>
                    <span className="text-slate-200 font-bold">{report.settings.infillPattern}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Wall Perimeters:</span>
                    <span className="text-cyan-400 font-bold">{report.settings.wallPerimeters} loops</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Supports:</span>
                    <span className="text-slate-200 font-bold">
                      {report.settings.supportRequired ? report.settings.supportType : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nozzle Temp:</span>
                    <span className="text-slate-200 font-bold">{report.settings.nozzleTempRange}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bed Temp:</span>
                    <span className="text-slate-200 font-bold">{report.settings.bedTempRange}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Print Speed:</span>
                    <span className="text-slate-200 font-bold">{report.settings.printSpeedRange}</span>
                  </div>
                </div>
              </div>

              {/* Safety Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Safety Notice:</strong> {report.safetyDisclaimer}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slicer_cheat_sheet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  <Terminal className="w-4 h-4" /> Bambu Studio / OrcaSlicer / PrusaSlicer Parameter Map
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                  <p className="text-slate-500"># Quality / Precision</p>
                  <p>layer_height = {report.settings.layerHeightMm}</p>
                  <p>first_layer_height = 0.20</p>
                  <p className="text-slate-500 pt-2"># Strength / Shell</p>
                  <p>perimeters = {report.settings.wallPerimeters}</p>
                  <p>top_solid_layers = {report.settings.topLayers}</p>
                  <p>bottom_solid_layers = {report.settings.bottomLayers}</p>
                  <p className="text-slate-500 pt-2"># Infill</p>
                  <p>fill_density = {report.settings.infillPercent}%</p>
                  <p>fill_pattern = {report.settings.infillPattern.toLowerCase()}</p>
                  <p className="text-slate-500 pt-2"># Support & Adhesion</p>
                  <p>enable_support = {report.settings.supportRequired ? '1' : '0'}</p>
                  <p>support_type = {report.settings.supportType === 'Tree / Organic' ? 'tree' : 'normal'}</p>
                  <p>support_threshold_angle = {report.settings.supportOverhangAngleDeg}</p>
                  <p>brim_type = {report.settings.brimOrRaftRecommendation.includes('Brim') ? 'outer_only' : 'none'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {markdownReport}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
