/**
 * PrintWise — AI 3D Printing Advisor
 * Core TypeScript Type Definitions
 */

export type InputMode = '3d_model' | 'image' | 'multi_image' | 'sketch' | 'text_description';

export type IntendedPurpose =
  | 'functional'
  | 'decorative'
  | 'prototype'
  | 'mechanical_load'
  | 'flexible'
  | 'high_temp'
  | 'outdoor'
  | 'food_contact';

export type PrinterType = 'fdm' | 'sla' | 'sls' | 'slm' | 'unknown';

export type Priority = 'cost' | 'strength' | 'quality' | 'speed' | 'material_saving' | 'balanced';

export interface PrinterInfo {
  buildVolumeX: number; // mm
  buildVolumeY: number; // mm
  buildVolumeZ: number; // mm
  nozzleDiameter: number; // mm (e.g. 0.4)
  maxNozzleTemp: number; // °C (e.g. 260)
  maxBedTemp: number; // °C (e.g. 100)
  availableMaterials: string[];
}

export interface UserPreferences {
  intendedPurpose: IntendedPurpose;
  printerType: PrinterType;
  printerInfo: PrinterInfo;
  priority: Priority;
  customNotes?: string;
}

export interface ImageAngleInput {
  id: string;
  dataUrl: string;
  angleLabel: 'Front' | 'Top' | 'Right' | 'Left' | 'Isometric' | 'General';
  fileName?: string;
}

export interface BoundingBox {
  x: number; // width in mm
  y: number; // depth in mm
  z: number; // height in mm
}

export interface CandidateOrientation {
  id: string;
  name: string;
  rotationDegrees: [number, number, number]; // [X, Y, Z] in degrees
  rotationRadians: [number, number, number];
  description: string;
  supportScore: number; // 0-100
  stabilityScore: number; // 0-100
  printTimeScore: number; // 0-100
  strengthScore: number; // 0-100
  overallScore: number; // 0-100
  estimatedSupportGrams: number;
  estimatedPrintTimeMinutes: number;
  estimatedHeightMm: number;
  bedContactAreaMm2: number;
  overhangAreaCm2: number;
  pros: string[];
  cons: string[];
  reason: string;
}

export interface GeometricAnalysisResult {
  boundingBox: BoundingBox;
  surfaceAreaCm2: number;
  volumeCm3: number;
  estimatedMassGrams: number;
  triangleCount: number;
  overhangFacesCount: number;
  overhangAreaPercent: number; // percentage > 45 deg
  bedContactAreaMm2: number;
  thinWallRegionsCount: number;
  sharpFeaturesCount: number;
  holesCount: number;
  candidateOrientations: CandidateOrientation[];
  recommendedOrientationIndex: number;
  hasGeometricConfidence: boolean;
}

export interface PrintabilityIssue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  suggestedSolution: string;
}

export interface PrintabilityBreakdown {
  geometry: { score: number; status: string; detail: string };
  overhangs: { score: number; status: string; detail: string };
  stability: { score: number; status: string; detail: string };
  supports: { score: number; status: string; detail: string };
  thinFeatures: { score: number; status: string; detail: string };
}

export interface PrintabilityAssessment {
  overallScore: number; // 0-100
  rating: 'Excellent' | 'Good' | 'Moderate' | 'Challenging' | 'High Risk';
  breakdown: PrintabilityBreakdown;
  issues: PrintabilityIssue[];
}

export interface TechnologyRecommendation {
  technology: 'FDM / FFF' | 'SLA / MSLA' | 'SLS' | 'SLM / DMLS';
  suitability: 'High' | 'Moderate' | 'Specialized';
  headlineReason: string;
  why: string[];
  tradeOffs: string[];
  alternativeTechnology?: string;
  alternativeReason?: string;
}

export interface MaterialDetail {
  id: string;
  name: string;
  category: 'FDM' | 'Resin' | 'Powder' | 'Metal';
  tensileStrengthMpa: number;
  heatDeflectionTempC: number;
  flexibility: 'Rigid' | 'Semi-Flexible' | 'Flexible' | 'Elastomeric';
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 easiest, 5 hardest
  costIndex: '$' | '$$' | '$$$' | '$$$$';
  suitabilityReason: string;
  importantLimitations: string[];
  recommendedNozzleTemp?: string;
  recommendedBedTemp?: string;
  enclosureRequired: boolean;
}

export interface MaterialRecommendation {
  primaryMaterial: MaterialDetail;
  alternatives: MaterialDetail[];
  reasoning: string;
  regulatoryDisclaimer: string;
}

export interface PrintSettings {
  layerHeightMm: number;
  infillPercent: number;
  infillPattern: 'Gyroid' | 'Grid' | 'Honeycomb' | 'Cubic' | 'Concentric';
  wallPerimeters: number;
  topLayers: number;
  bottomLayers: number;
  supportRequired: boolean;
  supportType: 'Tree / Organic' | 'Standard Grid' | 'Snug' | 'None';
  supportOverhangAngleDeg: number;
  nozzleTempRange: string;
  bedTempRange: string;
  printSpeedRange: string;
  fanSpeedPercent: string;
  brimOrRaftRecommendation: 'None' | 'Brim (5mm)' | 'Raft' | 'Mouse Ears';
  startingProfileNotes: string[];
}

export interface AdvisorReport {
  id: string;
  createdAt: string;
  objectName: string;
  confidenceScore: number; // 0-100
  inputModality: InputMode;
  isGeometricExact: boolean; // True for 3D model geometry, False for 2D/image/text AI estimate!
  singleViewNotice?: string;
  detectedFeatures: string[];
  likelyUse: string;
  printability: PrintabilityAssessment;
  geometricAnalysis?: GeometricAnalysisResult;
  candidateOrientations: CandidateOrientation[];
  selectedOrientationIndex: number;
  technology: TechnologyRecommendation;
  material: MaterialRecommendation;
  settings: PrintSettings;
  whyDecisions: {
    orientation: string;
    technology: string;
    material: string;
    settings: string;
    infill: string;
  };
  estimatedTotalTimeMinutes: number;
  estimatedPartWeightGrams: number;
  estimatedSupportWeightGrams: number;
  safetyDisclaimer: string;
}
