import React, { useState } from 'react';
import { IntendedPurpose, PrinterType, Priority, UserPreferences } from '../types';
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Target,
  Wrench,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface AdditionalInfoFormProps {
  preferences: UserPreferences;
  onChange: (updated: UserPreferences) => void;
  onApply?: () => void;
}

export const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  preferences,
  onChange,
  onApply,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const purposeOptions: Array<{ id: IntendedPurpose; label: string; desc: string }> = [
    { id: 'functional', label: 'Functional', desc: 'Everyday structural use' },
    { id: 'mechanical_load', label: 'Mechanical / Load-Bearing', desc: 'Withstands high torque or tension' },
    { id: 'prototype', label: 'Rapid Prototype', desc: 'Fast dimensional check' },
    { id: 'decorative', label: 'Decorative / Visual', desc: 'Aesthetic surface priority' },
    { id: 'flexible', label: 'Flexible / Elastomeric', desc: 'Bumper, gasket, or dampener' },
    { id: 'high_temp', label: 'High Temperature', desc: 'Survives > 70°C environments' },
    { id: 'outdoor', label: 'Outdoor / Weather', desc: 'UV sunlight and rain resistance' },
    { id: 'food_contact', label: 'Food-Contact', desc: 'Sanitary material constraints' },
  ];

  const printerTypeOptions: Array<{ id: PrinterType; label: string }> = [
    { id: 'fdm', label: 'FDM / FFF (Filament Extrusion)' },
    { id: 'sla', label: 'SLA / MSLA (Resin Photopolymer)' },
    { id: 'sls', label: 'SLS (Powder Bed Sintering)' },
    { id: 'slm', label: 'SLM / DMLS (Metal Powder)' },
    { id: 'unknown', label: "I don't know / Recommend for me" },
  ];

  const priorityOptions: Array<{ id: Priority; label: string; desc: string }> = [
    { id: 'balanced', label: 'Balanced', desc: 'Optimum compromise of speed, cost & durability' },
    { id: 'cost', label: 'Lowest Cost', desc: 'Minimizes material expenditure & supports' },
    { id: 'strength', label: 'Highest Strength', desc: 'Dense perimeters & load-aligned layers' },
    { id: 'quality', label: 'Best Surface Quality', desc: 'Ultra-thin layer heights & detail' },
    { id: 'speed', label: 'Fastest Print', desc: 'Thick layers & coarse infill geometry' },
    { id: 'material_saving', label: 'Lowest Material', desc: 'Conserves filament/resin volume' },
  ];

  const handlePurposeChange = (purpose: IntendedPurpose) => {
    onChange({ ...preferences, intendedPurpose: purpose });
  };

  const handlePrinterTypeChange = (pType: PrinterType) => {
    onChange({ ...preferences, printerType: pType });
  };

  const handlePriorityChange = (prio: Priority) => {
    onChange({ ...preferences, priority: prio });
  };

  const handlePrinterInfoChange = (field: string, val: any) => {
    onChange({
      ...preferences,
      printerInfo: {
        ...preferences.printerInfo,
        [field]: val,
      },
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>Refine Print Context & Constraints</span>
              <span className="text-[10px] text-cyan-400 font-mono font-normal lowercase">
                ({preferences.intendedPurpose} • {preferences.priority} priority)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Optional printer specifications and functional requirements to tune recommendations
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Customize Details'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Settings Form */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800 space-y-6 text-xs">
          {/* 1. Intended Purpose */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Intended Part Purpose
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {purposeOptions.map((opt) => {
                const isSelected = preferences.intendedPurpose === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePurposeChange(opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Priority */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Manufacturing Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {priorityOptions.map((opt) => {
                const isSelected = preferences.priority === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePriorityChange(opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Printer Type */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Printer Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {printerTypeOptions.map((opt) => {
                const isSelected = preferences.printerType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePrinterTypeChange(opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Hardware Parameters (Optional) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" /> Printer Hardware Constraints (Optional)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Build Volume (X × Y × Z mm)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={preferences.printerInfo.buildVolumeX}
                    onChange={(e) => handlePrinterInfoChange('buildVolumeX', parseInt(e.target.value) || 220)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                    placeholder="220"
                  />
                  <span className="text-slate-500">×</span>
                  <input
                    type="number"
                    value={preferences.printerInfo.buildVolumeY}
                    onChange={(e) => handlePrinterInfoChange('buildVolumeY', parseInt(e.target.value) || 220)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                    placeholder="220"
                  />
                  <span className="text-slate-500">×</span>
                  <input
                    type="number"
                    value={preferences.printerInfo.buildVolumeZ}
                    onChange={(e) => handlePrinterInfoChange('buildVolumeZ', parseInt(e.target.value) || 250)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                    placeholder="250"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nozzle Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.printerInfo.nozzleDiameter}
                  onChange={(e) => handlePrinterInfoChange('nozzleDiameter', parseFloat(e.target.value) || 0.4)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  placeholder="0.4"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Max Nozzle Temp (°C)</label>
                <input
                  type="number"
                  value={preferences.printerInfo.maxNozzleTemp}
                  onChange={(e) => handlePrinterInfoChange('maxNozzleTemp', parseInt(e.target.value) || 260)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  placeholder="260"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Max Bed Temp (°C)</label>
                <input
                  type="number"
                  value={preferences.printerInfo.maxBedTemp}
                  onChange={(e) => handlePrinterInfoChange('maxBedTemp', parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
