import React, { useState } from 'react';
import { MATERIALS_DATABASE, REGULATORY_DISCLAIMER } from '../data/materialsDatabase';
import { MaterialDetail } from '../types';
import {
  X,
  Search,
  Thermometer,
  ShieldAlert,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Beaker,
} from 'lucide-react';

interface MaterialExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial?: (material: MaterialDetail) => void;
  activeMaterialId?: string;
}

export const MaterialExplorerModal: React.FC<MaterialExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectMaterial,
  activeMaterialId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const materials = Object.values(MATERIALS_DATABASE).filter((mat) => {
    const matchesCategory =
      selectedCategory === 'ALL' || mat.category.toUpperCase() === selectedCategory;
    const matchesSearch =
      mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.suitabilityReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-cyan-400" />
              Additive Manufacturing Materials Database
            </h2>
            <p className="text-xs text-slate-400">
              Technical property encyclopedia across thermoplastics, engineering photopolymers, and laser-sintered powders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['ALL', 'FDM', 'RESIN', 'POWDER', 'METAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by material name or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Regulatory Banner */}
        <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{REGULATORY_DISCLAIMER}</span>
        </div>

        {/* Material Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => {
            const isSelected = mat.id === activeMaterialId;

            return (
              <div
                key={mat.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-500 ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {mat.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Cost:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{mat.costIndex}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400">Print Difficulty:</span>
                      <span className="font-mono text-amber-400 font-semibold">{mat.difficulty}/5</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mb-2">{mat.name}</h3>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {mat.suitabilityReason}
                  </p>

                  {/* Property Badges */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-400" /> Tensile
                      </div>
                      <span className="font-mono font-semibold text-slate-100">{mat.tensileStrengthMpa} MPa</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                        <Thermometer className="w-3 h-3 text-red-400" /> HDT Limit
                      </div>
                      <span className="font-mono font-semibold text-slate-100">{mat.heatDeflectionTempC} °C</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 mb-0.5">Flexibility</div>
                      <span className="font-mono font-semibold text-slate-100">{mat.flexibility}</span>
                    </div>
                  </div>

                  {/* Print Parameters if FDM */}
                  {mat.recommendedNozzleTemp && (
                    <div className="text-[11px] font-mono text-slate-400 mb-3 bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <span>Nozzle: {mat.recommendedNozzleTemp}</span>
                      <span>Bed: {mat.recommendedBedTemp}</span>
                      <span>{mat.enclosureRequired ? 'Enclosure: Required' : 'Enclosure: Open'}</span>
                    </div>
                  )}

                  {/* Limitations */}
                  <div className="space-y-1 mb-4">
                    <div className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Important Limitations:
                    </div>
                    {mat.importantLimitations.map((lim, lIdx) => (
                      <div key={lIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5 pl-1">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{lim}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {onSelectMaterial && (
                  <button
                    onClick={() => {
                      onSelectMaterial(mat);
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Active Part Material
                      </>
                    ) : (
                      'Apply This Material To Analysis'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Showing {materials.length} material specification profiles
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
