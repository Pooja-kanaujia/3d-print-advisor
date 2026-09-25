import { MaterialDetail } from '../types';

export const MATERIALS_DATABASE: Record<string, MaterialDetail> = {
  // FDM Materials
  pla: {
    id: 'pla',
    name: 'PLA (Polylactic Acid)',
    category: 'FDM',
    tensileStrengthMpa: 50,
    heatDeflectionTempC: 55,
    flexibility: 'Rigid',
    difficulty: 1,
    costIndex: '$',
    suitabilityReason: 'Easiest material to print with excellent dimensional accuracy, minimal warping, and low cost. Ideal for visual prototypes, concept models, and decorative parts.',
    importantLimitations: [
      'Low heat resistance (softens in hot cars or direct summer sun above 50°C)',
      'Brittle under sudden impact shock',
      'Creeps under continuous sustained mechanical load'
    ],
    recommendedNozzleTemp: '200–215 °C',
    recommendedBedTemp: '50–60 °C',
    enclosureRequired: false,
  },
  petg: {
    id: 'petg',
    name: 'PETG (Polyethylene Terephthalate Glycol)',
    category: 'FDM',
    tensileStrengthMpa: 52,
    heatDeflectionTempC: 75,
    flexibility: 'Semi-Flexible',
    difficulty: 2,
    costIndex: '$',
    suitabilityReason: 'Optimal balance of strength, impact toughness, chemical resistance, and moderate heat resistance with reliable layer adhesion. Outstanding choice for functional brackets, enclosures, and snap-fits.',
    importantLimitations: [
      'Prone to stringing and oozing if moisture is absorbed',
      'Can adhere too strongly to smooth PEI/glass build sheets (use glue stick release agent)',
      'Slightly more flexible than PLA (less stiff)'
    ],
    recommendedNozzleTemp: '235–250 °C',
    recommendedBedTemp: '75–85 °C',
    enclosureRequired: false,
  },
  abs: {
    id: 'abs',
    name: 'ABS (Acrylonitrile Butadiene Styrene)',
    category: 'FDM',
    tensileStrengthMpa: 43,
    heatDeflectionTempC: 95,
    flexibility: 'Rigid',
    difficulty: 3,
    costIndex: '$',
    suitabilityReason: 'Good impact resistance, high heat tolerance, and can be acetone vapor smoothed. Widely used for automotive interior components and moving mechanical enclosures.',
    importantLimitations: [
      'High thermal contraction causing severe warping and layer delamination without an enclosed chamber',
      'Emits unpleasant styrene fumes and VOCs during printing (ventilation/HEPA required)',
      'Degrades with prolonged UV exposure outdoors'
    ],
    recommendedNozzleTemp: '240–260 °C',
    recommendedBedTemp: '100–110 °C',
    enclosureRequired: true,
  },
  asa: {
    id: 'asa',
    name: 'ASA (Acrylonitrile Styrene Acrylate)',
    category: 'FDM',
    tensileStrengthMpa: 46,
    heatDeflectionTempC: 95,
    flexibility: 'Rigid',
    difficulty: 3,
    costIndex: '$$',
    suitabilityReason: 'True UV-resistant and weather-resistant counterpart to ABS. Retains color, structural integrity, and impact resistance outdoors without yellowing or brittle degradation.',
    importantLimitations: [
      'Requires an enclosed heated chamber to prevent warping and corner lifting on parts >100mm',
      'Produces VOC fumes during extrusion; proper filtration advised',
      'Requires dry storage to avoid moisture popping'
    ],
    recommendedNozzleTemp: '250–265 °C',
    recommendedBedTemp: '100–110 °C',
    enclosureRequired: true,
  },
  tpu: {
    id: 'tpu',
    name: 'TPU 95A (Thermoplastic Polyurethane)',
    category: 'FDM',
    tensileStrengthMpa: 35,
    heatDeflectionTempC: 60,
    flexibility: 'Flexible',
    difficulty: 3,
    costIndex: '$$',
    suitabilityReason: 'Extreme abrasion resistance, energy dampening, and rubber-like flexibility. Perfect for phone bumpers, vibration isolators, gaskets, drone bumpers, and non-slip feet.',
    importantLimitations: [
      'Requires slow print speeds (20–40 mm/s) to prevent filament buckling in extruder',
      'Bowden-tube extruders can jam easily; direct-drive strongly recommended',
      'Supports are exceptionally difficult to detach from TPU surfaces'
    ],
    recommendedNozzleTemp: '220–240 °C',
    recommendedBedTemp: '40–60 °C',
    enclosureRequired: false,
  },
  nylon: {
    id: 'nylon',
    name: 'Nylon / PA (Polyamide 6/12)',
    category: 'FDM',
    tensileStrengthMpa: 65,
    heatDeflectionTempC: 90,
    flexibility: 'Semi-Flexible',
    difficulty: 4,
    costIndex: '$$$',
    suitabilityReason: 'Exceptional layer adhesion, fatigue resistance, low friction coefficient, and durability under repeated cyclic stress. Premier choice for functional gears, bushings, and living hinges.',
    importantLimitations: [
      'Extremely hygroscopic; must be thoroughly dried for 8+ hours and printed directly from a drybox',
      'Severe warping tendency on open-frame printers',
      'Requires high nozzle temperatures (250–280°C) and specialized bed adhesive'
    ],
    recommendedNozzleTemp: '255–275 °C',
    recommendedBedTemp: '80–100 °C',
    enclosureRequired: true,
  },
  pc: {
    id: 'pc',
    name: 'PC (Polycarbonate)',
    category: 'FDM',
    tensileStrengthMpa: 72,
    heatDeflectionTempC: 120,
    flexibility: 'Rigid',
    difficulty: 5,
    costIndex: '$$$',
    suitabilityReason: 'One of the strongest and most heat-resistant FDM thermoplastics available. Exceptional mechanical stiffness, optical clarity potential, and continuous thermal rating up to 110°C.',
    importantLimitations: [
      'Demands very high nozzle temperatures (280–310°C) and hot bed (110–125°C)',
      'Violent warping if chamber is not actively heated above 60°C',
      'Highly moisture-sensitive; bubbles and weakens if not dried'
    ],
    recommendedNozzleTemp: '280–305 °C',
    recommendedBedTemp: '110–125 °C',
    enclosureRequired: true,
  },
  cf_petg: {
    id: 'cf_petg',
    name: 'Carbon Fiber PETG (PETG-CF)',
    category: 'FDM',
    tensileStrengthMpa: 62,
    heatDeflectionTempC: 80,
    flexibility: 'Rigid',
    difficulty: 2,
    costIndex: '$$',
    suitabilityReason: 'Reinforced with chopped micro carbon fibers, providing increased structural rigidity, dimensional stability, virtually zero warping, and a stunning matte carbon finish that hides layer lines.',
    importantLimitations: [
      'Abrasive filament: rapidly destroys standard brass nozzles (hardened steel nozzle mandatory)',
      'Slightly lower elongation at break (more brittle than raw PETG)',
      'Slightly reduced Z-axis inter-layer bonding compared to neat PETG'
    ],
    recommendedNozzleTemp: '240–255 °C',
    recommendedBedTemp: '75–85 °C',
    enclosureRequired: false,
  },

  // Resin Materials (SLA/MSLA)
  standard_resin: {
    id: 'standard_resin',
    name: 'Standard Photopolymer Resin',
    category: 'Resin',
    tensileStrengthMpa: 40,
    heatDeflectionTempC: 45,
    flexibility: 'Rigid',
    difficulty: 2,
    costIndex: '$',
    suitabilityReason: 'Unmatched surface smoothness, crisp micron-level feature resolution, and isotropic details without visible FDM layer ridges. Ideal for figurines, dental molds, and jewelry masters.',
    importantLimitations: [
      'Brittle on impact drop or sudden shear force',
      'Low thermal endurance; softens in direct heat',
      'Requires messy IPA wash and UV cure post-processing; liquid resin is toxic to bare skin'
    ],
    enclosureRequired: false,
  },
  tough_resin: {
    id: 'tough_resin',
    name: 'Tough / ABS-Like Resin',
    category: 'Resin',
    tensileStrengthMpa: 52,
    heatDeflectionTempC: 65,
    flexibility: 'Semi-Flexible',
    difficulty: 3,
    costIndex: '$$',
    suitabilityReason: 'Engineered with polyurethane acrylates to simulate injection-molded ABS. High elongation at break and shock absorption, making it suitable for functional snap-fits and mechanical prototypes.',
    importantLimitations: [
      'Gradual photo-aging: continues to crosslink and embrittle over months under sunlight UV',
      'Requires precise post-curing cycle to balance stiffness and impact toughness',
      'More viscous liquid; requires longer rest and lift times'
    ],
    enclosureRequired: false,
  },
  eng_hightemp_resin: {
    id: 'eng_hightemp_resin',
    name: 'High-Temperature Engineering Resin',
    category: 'Resin',
    tensileStrengthMpa: 60,
    heatDeflectionTempC: 180,
    flexibility: 'Rigid',
    difficulty: 4,
    costIndex: '$$$',
    suitabilityReason: 'Extreme heat resistance capable of operating up to 180–230°C HDT under load. Used for hot fluid manifolds, injection mold inserts, and aerodynamic wind tunnel testing.',
    importantLimitations: [
      'Very brittle at room temperature; poor shatter resistance',
      'Requires multi-stage thermal oven post-curing (e.g. 1 hour at 80°C + 1 hour at 160°C)',
      'Expensive specialty polymer'
    ],
    enclosureRequired: false,
  },
  flexible_resin: {
    id: 'flexible_resin',
    name: 'Elastic / Flexible 80A Resin',
    category: 'Resin',
    tensileStrengthMpa: 15,
    heatDeflectionTempC: 40,
    flexibility: 'Elastomeric',
    difficulty: 3,
    costIndex: '$$$',
    suitabilityReason: 'Shore 80A elasticity with high rebound and tear resistance. Delivers soft-touch ergonomic grips, silicone-like gaskets, and realistic anatomical surgical models.',
    importantLimitations: [
      'Difficult to remove support structures cleanly without leaving tear blemishes',
      'Requires dense, thick support geometry to prevent peeling deformation during vat release',
      'Lower tensile strength compared to thermoplastic TPU'
    ],
    enclosureRequired: false,
  },

  // Powder Bed (SLS)
  pa12_sls: {
    id: 'pa12_sls',
    name: 'Nylon PA12 (SLS Powder)',
    category: 'Powder',
    tensileStrengthMpa: 48,
    heatDeflectionTempC: 145,
    flexibility: 'Semi-Flexible',
    difficulty: 4,
    costIndex: '$$$',
    suitabilityReason: 'Support-free manufacturing enables infinite geometric freedom, internal channels, and interconnected moving assemblies. Outstanding isotropic strength, chemical resistance, and industrial production reliability.',
    importantLimitations: [
      'Requires industrial SLS system ($15k–$250k investment)',
      'Parts have a porous sugar-cube surface texture unless bead blasted or vapor smoothed',
      'Hollow geometries require powder escape holes to drain unsintered nylon'
    ],
    enclosureRequired: true,
  },

  // Metal (SLM/DMLS)
  stainless_316l: {
    id: 'stainless_316l',
    name: 'Stainless Steel 316L (DMLS / SLM)',
    category: 'Metal',
    tensileStrengthMpa: 550,
    heatDeflectionTempC: 600,
    flexibility: 'Rigid',
    difficulty: 5,
    costIndex: '$$$$',
    suitabilityReason: 'Full solid metal part with superior marine/acid corrosion resistance, high tensile strength (550+ MPa), and surgical biocompatibility potential.',
    importantLimitations: [
      'Extreme industrial machinery cost and argon gas atmosphere requirement',
      'Requires solid welded metal support structures cut away via EDM wire or CNC machining',
      'Massive residual thermal stresses require post-weld stress relief oven cycle'
    ],
    enclosureRequired: true,
  }
};

export const REGULATORY_DISCLAIMER =
  'IMPORTANT SAFETY NOTICE: Recommendations provided are computational starting points. Do NOT claim or assume food contact, aerospace, medical, structural pressure vessel, or fire-safety compliance without certified virgin food-grade resin/filament certifications, sanitary nozzle verification, and standardized ASTM/ISO laboratory testing.';
