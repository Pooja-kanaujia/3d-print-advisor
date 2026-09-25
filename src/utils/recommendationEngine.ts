import {
  AdvisorReport,
  GeometricAnalysisResult,
  InputMode,
  MaterialDetail,
  MaterialRecommendation,
  PrintabilityAssessment,
  PrintSettings,
  TechnologyRecommendation,
  UserPreferences,
} from '../types';
import { MATERIALS_DATABASE, REGULATORY_DISCLAIMER } from '../data/materialsDatabase';

export function buildAdvisorReport(params: {
  objectName: string;
  confidenceScore: number;
  inputModality: InputMode;
  isGeometricExact: boolean;
  singleViewNotice?: string;
  detectedFeatures: string[];
  likelyUse: string;
  geometricAnalysis?: GeometricAnalysisResult;
  printability: PrintabilityAssessment;
  userPrefs: UserPreferences;
  selectedOrientationIndex?: number;
}): AdvisorReport {
  const {
    objectName,
    confidenceScore,
    inputModality,
    isGeometricExact,
    singleViewNotice,
    detectedFeatures,
    likelyUse,
    geometricAnalysis,
    printability,
    userPrefs,
    selectedOrientationIndex = 0,
  } = params;

  const candidateOrientations = geometricAnalysis?.candidateOrientations || [];
  const chosenOrientation = candidateOrientations[selectedOrientationIndex] || candidateOrientations[0];

  // 1. Recommend Technology
  const technology = recommendTechnology(userPrefs, likelyUse, geometricAnalysis);

  // 2. Recommend Material
  const material = recommendMaterial(userPrefs, likelyUse, technology);

  // 3. Recommend Starting Slicer Settings
  const settings = recommendSettings(userPrefs, technology, material.primaryMaterial, geometricAnalysis);

  // 4. Generate "Why This Recommendation?" technical reasoning
  const whyDecisions = generateWhyDecisions({
    userPrefs,
    chosenOrientation,
    technology,
    material: material.primaryMaterial,
    settings,
    geometricAnalysis,
    isGeometricExact,
  });

  // Calculate totals
  const estimatedPartWeightGrams = geometricAnalysis?.estimatedMassGrams || 65;
  const estimatedSupportWeightGrams = chosenOrientation?.estimatedSupportGrams ?? 12;
  const estimatedTotalTimeMinutes = chosenOrientation?.estimatedPrintTimeMinutes ?? 180;

  return {
    id: `report_${Date.now()}`,
    createdAt: new Date().toISOString(),
    objectName,
    confidenceScore,
    inputModality,
    isGeometricExact,
    singleViewNotice,
    detectedFeatures,
    likelyUse,
    printability,
    geometricAnalysis,
    candidateOrientations,
    selectedOrientationIndex,
    technology,
    material,
    settings,
    whyDecisions,
    estimatedTotalTimeMinutes,
    estimatedPartWeightGrams,
    estimatedSupportWeightGrams,
    safetyDisclaimer: REGULATORY_DISCLAIMER,
  };
}

function recommendTechnology(
  prefs: UserPreferences,
  likelyUse: string,
  geo?: GeometricAnalysisResult
): TechnologyRecommendation {
  // If user already specified an explicit printer
  if (prefs.printerType === 'sla') {
    return {
      technology: 'SLA / MSLA',
      suitability: 'High',
      headlineReason: 'Specified by user preference. Delivers ultra-fine layer resolution and smooth cosmetic surfaces.',
      why: [
        'Photopolymer resin cures layer-by-layer under UV, yielding isotropic features without FDM layer step lines',
        'Excels at intricate micro-details, miniature figurines, and smooth organic contours',
        'Watertight solid structure with micron-level dimensional precision',
      ],
      tradeOffs: [
        'Requires IPA solvent chemical washing and UV post-curing chamber',
        'Standard resins are brittle under sudden impact shock',
        'Liquid resin requires nitrile gloves and adequate ventilation',
      ],
      alternativeTechnology: 'FDM / FFF',
      alternativeReason: 'Better for impact toughness, structural snap-fits, and lower ongoing material cost.',
    };
  }

  if (prefs.printerType === 'sls') {
    return {
      technology: 'SLS',
      suitability: 'High',
      headlineReason: 'Selective Laser Sintering selected. True support-free powder-bed manufacturing.',
      why: [
        'Unfused nylon powder self-supports the model during printing; zero support structures needed',
        'Total geometric freedom for complex nested linkages, internal manifolds, and undercuts',
        'Near-isotropic mechanical properties with genuine engineering nylon (PA12)',
      ],
      tradeOffs: [
        'Powder handling and bead blasting post-processing needed',
        'Parts have a slight porous matte surface texture',
        'Significant machine and operational cost',
      ],
      alternativeTechnology: 'FDM / FFF',
      alternativeReason: 'More accessible for rapid iterative desktop prototyping.',
    };
  }

  // Priority or use cases
  if (prefs.intendedPurpose === 'flexible') {
    return {
      technology: 'FDM / FFF',
      suitability: 'High',
      headlineReason: 'Direct-drive FDM is the most reliable method for elastomeric TPU thermoplastics.',
      why: [
        'TPU filaments (85A–95A) offer high tear resistance and abrasion longevity',
        'Extrudes durable rubberized gaskets and shock dampers with zero chemical post-processing',
      ],
      tradeOffs: [
        'Requires slow print speeds (20–35 mm/s) to prevent filament buckling',
        'Stringing across open air gaps is difficult to eliminate completely',
      ],
      alternativeTechnology: 'SLA / MSLA (Flexible Resin)',
      alternativeReason: 'Consider flexible photopolymer resin if micro-fine surface detail is mandatory.',
    };
  }

  if (prefs.priority === 'quality' && (prefs.intendedPurpose === 'decorative' || prefs.intendedPurpose === 'prototype')) {
    return {
      technology: 'SLA / MSLA',
      suitability: 'High',
      headlineReason: 'Superior surface fidelity and razor-sharp feature resolution.',
      why: [
        'Pixel resolutions down to 22–35 microns hide layer boundaries completely',
        'Leaves crisp text engravings and sharp edges without nozzle extrusion blobbing',
      ],
      tradeOffs: [
        'Higher post-processing effort (washing, scraping, UV curing)',
        'Smaller typical build volumes compared to modern FDM printers',
      ],
      alternativeTechnology: 'FDM / FFF',
      alternativeReason: 'More cost-effective if 0.12mm layer height FDM satisfies visual requirements.',
    };
  }

  // Default to FDM / FFF (most versatile, economical, and accessible)
  return {
    technology: 'FDM / FFF',
    suitability: 'High',
    headlineReason: 'Best balance of accessibility, functional strength, material choices, and cost.',
    why: [
      'Accommodates high-performance engineering thermoplastics (PETG, ABS, Nylon, Polycarbonate)',
      'Minimal post-processing: parts are mechanically ready right off the build plate',
      'Highly economical per-kilogram filament cost with zero toxic chemical baths',
      'Excellent inter-layer adhesion when printed in proper orientation',
    ],
    tradeOffs: [
      'Visible horizontal layer lines (stair-stepping effect on shallow curves)',
      'Requires breakaway or dissolvable support structures for steep overhangs >45°',
      'Anisotropic strength: parts are weaker along the vertical Z build axis',
    ],
    alternativeTechnology: 'SLA / MSLA',
    alternativeReason: 'Recommended if your design contains fine micro-details under 0.5mm or requires glass-smooth surfaces.',
  };
}

function recommendMaterial(
  prefs: UserPreferences,
  likelyUse: string,
  tech: TechnologyRecommendation
): MaterialRecommendation {
  if (tech.technology.startsWith('SLA')) {
    if (prefs.intendedPurpose === 'mechanical_load' || prefs.intendedPurpose === 'functional') {
      return {
        primaryMaterial: MATERIALS_DATABASE.tough_resin,
        alternatives: [MATERIALS_DATABASE.eng_hightemp_resin, MATERIALS_DATABASE.standard_resin],
        reasoning: 'Tough / ABS-Like photopolymer resin incorporates urethane acrylates to prevent brittle snapping under mechanical deflection.',
        regulatoryDisclaimer: REGULATORY_DISCLAIMER,
      };
    }
    if (prefs.intendedPurpose === 'high_temp') {
      return {
        primaryMaterial: MATERIALS_DATABASE.eng_hightemp_resin,
        alternatives: [MATERIALS_DATABASE.tough_resin],
        reasoning: 'High-Temperature Engineering Resin resists thermal deformation up to 180°C HDT after UV/thermal post-curing.',
        regulatoryDisclaimer: REGULATORY_DISCLAIMER,
      };
    }
    if (prefs.intendedPurpose === 'flexible') {
      return {
        primaryMaterial: MATERIALS_DATABASE.flexible_resin,
        alternatives: [MATERIALS_DATABASE.tough_resin],
        reasoning: 'Elastic 80A resin mimics soft-touch silicone with high rebound elasticity.',
        regulatoryDisclaimer: REGULATORY_DISCLAIMER,
      };
    }
    return {
      primaryMaterial: MATERIALS_DATABASE.standard_resin,
      alternatives: [MATERIALS_DATABASE.tough_resin],
      reasoning: 'Standard resin provides the best detail-to-cost ratio with crisp edge definition.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  if (tech.technology === 'SLS') {
    return {
      primaryMaterial: MATERIALS_DATABASE.pa12_sls,
      alternatives: [],
      reasoning: 'Industrial PA12 Nylon powder produces fully dense, fatigue-resistant parts with uniform isotropic strength.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  // FDM / FFF Material logic
  if (prefs.intendedPurpose === 'flexible') {
    return {
      primaryMaterial: MATERIALS_DATABASE.tpu,
      alternatives: [MATERIALS_DATABASE.petg],
      reasoning: 'TPU 95A delivers outstanding flexural fatigue life, impact dampening, and abrasion immunity.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  if (prefs.intendedPurpose === 'outdoor') {
    return {
      primaryMaterial: MATERIALS_DATABASE.asa,
      alternatives: [MATERIALS_DATABASE.petg, MATERIALS_DATABASE.abs],
      reasoning: 'ASA is chemically formulated with an acrylic ester elastomer that repels ultraviolet sunlight degradation and weather embrittlement.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  if (prefs.intendedPurpose === 'high_temp') {
    return {
      primaryMaterial: MATERIALS_DATABASE.pc,
      alternatives: [MATERIALS_DATABASE.abs, MATERIALS_DATABASE.nylon],
      reasoning: 'Polycarbonate maintains structural stiffness up to 110–120°C continuous service temperature without softening.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  if (prefs.intendedPurpose === 'mechanical_load' || prefs.priority === 'strength') {
    return {
      primaryMaterial: MATERIALS_DATABASE.petg,
      alternatives: [MATERIALS_DATABASE.cf_petg, MATERIALS_DATABASE.nylon],
      reasoning: 'PETG combines superior inter-layer bonding strength with high impact resistance and minimal notch sensitivity.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  if (prefs.priority === 'cost' || prefs.intendedPurpose === 'decorative' || prefs.intendedPurpose === 'prototype') {
    return {
      primaryMaterial: MATERIALS_DATABASE.pla,
      alternatives: [MATERIALS_DATABASE.petg],
      reasoning: 'PLA offers the lowest filament cost, near-zero thermal warping, and sharpest overhang crispening for visual concept prototypes.',
      regulatoryDisclaimer: REGULATORY_DISCLAIMER,
    };
  }

  // Default balanced recommendation
  return {
    primaryMaterial: MATERIALS_DATABASE.petg,
    alternatives: [MATERIALS_DATABASE.pla, MATERIALS_DATABASE.cf_petg],
    reasoning: 'PETG provides the optimal modern balance of mechanical durability, temperature threshold (75°C), and hassle-free printability.',
    regulatoryDisclaimer: REGULATORY_DISCLAIMER,
  };
}

function recommendSettings(
  prefs: UserPreferences,
  tech: TechnologyRecommendation,
  material: MaterialDetail,
  geo?: GeometricAnalysisResult
): PrintSettings {
  const isFDM = tech.technology.startsWith('FDM');

  // Layer Height
  let layerHeightMm = 0.20;
  if (prefs.priority === 'quality') layerHeightMm = 0.12;
  else if (prefs.priority === 'speed') layerHeightMm = 0.28;
  else if (prefs.priority === 'strength') layerHeightMm = 0.20;

  // Infill percentage
  let infillPercent = 20;
  if (prefs.intendedPurpose === 'mechanical_load') infillPercent = 40;
  else if (prefs.intendedPurpose === 'decorative') infillPercent = 12;
  else if (prefs.priority === 'strength') infillPercent = 35;
  else if (prefs.priority === 'material_saving') infillPercent = 15;

  // Walls/Perimeters (Most critical for functional strength!)
  let wallPerimeters = 3;
  if (prefs.intendedPurpose === 'mechanical_load' || prefs.priority === 'strength') {
    wallPerimeters = 4; // Adding walls gives far more tensile strength than 100% infill!
  } else if (prefs.priority === 'speed') {
    wallPerimeters = 2;
  }

  // Support
  const overhangHigh = (geo?.overhangAreaPercent ?? 15) > 12;
  const supportRequired = overhangHigh;
  const supportType: PrintSettings['supportType'] = overhangHigh ? 'Tree / Organic' : 'None';

  // Infill pattern
  const infillPattern: PrintSettings['infillPattern'] =
    prefs.intendedPurpose === 'mechanical_load' ? 'Gyroid' : 'Gyroid'; // Gyroid is optimal isotropic

  // Temperatures
  const nozzleTempRange = material.recommendedNozzleTemp || '210–225 °C';
  const bedTempRange = material.recommendedBedTemp || '60–70 °C';

  // Brim
  const needsBrim = (geo?.bedContactAreaMm2 ?? 300) < 150 || material.id === 'abs' || material.id === 'asa';
  const brimOrRaftRecommendation = needsBrim ? 'Brim (5mm)' : 'None';

  return {
    layerHeightMm,
    infillPercent,
    infillPattern,
    wallPerimeters,
    topLayers: 4,
    bottomLayers: 3,
    supportRequired,
    supportType,
    supportOverhangAngleDeg: 45,
    nozzleTempRange,
    bedTempRange,
    printSpeedRange: material.id === 'tpu' ? '25–35 mm/s' : prefs.priority === 'speed' ? '80–120 mm/s' : '50–70 mm/s',
    fanSpeedPercent: material.id === 'abs' || material.id === 'asa' || material.id === 'pc' ? '0–20%' : '100%',
    brimOrRaftRecommendation,
    startingProfileNotes: [
      `Infill Pattern: Gyroid delivers uniform three-dimensional isotropic shear strength and prevents nozzle dragging across intersecting lines.`,
      `Wall Perimeters: Set to ${wallPerimeters} loops. Continuous extruded walls carry ~70% of structural bending stresses.`,
      `Support Strategy: ${supportType} supports provide clean overhang stabilization while leaving minimal contact scar marks.`,
      `Cooling: ${material.id === 'abs' || material.id === 'asa' ? 'Keep part fan low or disabled to prevent layer cracking in chamber' : 'Maintain full part cooling fan for crisp bridge freezing'}.`,
    ],
  };
}

function generateWhyDecisions(params: {
  userPrefs: UserPreferences;
  chosenOrientation: any;
  technology: TechnologyRecommendation;
  material: MaterialDetail;
  settings: PrintSettings;
  geometricAnalysis?: GeometricAnalysisResult;
  isGeometricExact: boolean;
}): {
  orientation: string;
  technology: string;
  material: string;
  settings: string;
  infill: string;
} {
  const { chosenOrientation, technology, material, settings, geometricAnalysis, isGeometricExact } = params;

  const orientWhy = isGeometricExact
    ? `This candidate orientation was computationally selected with an overall score of ${chosenOrientation?.overallScore ?? 85}/100. It maximizes bed contact footprint (${chosenOrientation?.bedContactAreaMm2 ?? 240} mm²), reduces support volume to ~${chosenOrientation?.estimatedSupportGrams ?? 8}g, and minimizes vertical Z-axis layer creep.`
    : `Orienting the primary flat base flat on the build plate ensures maximum bed adhesion and keeps upward cantilever angles under the 45° overhang threshold.`;

  const techWhy = technology.headlineReason;

  const matWhy = `${material.name} was chosen because ${material.suitabilityReason.toLowerCase()}`;

  const settingsWhy = `A ${settings.layerHeightMm}mm layer height provides the ideal balance between layer line resolution and inter-layer molecular fusion. Setting ${settings.wallPerimeters} wall perimeters concentrates material along high-stress outer shells.`;

  const infillWhy = `${settings.infillPercent}% Gyroid infill provides uniform isotropic strength in all three coordinate directions (X, Y, Z) without creating nozzle collision points or internal shear planes.`;

  return {
    orientation: orientWhy,
    technology: techWhy,
    material: matWhy,
    settings: settingsWhy,
    infill: infillWhy,
  };
}
