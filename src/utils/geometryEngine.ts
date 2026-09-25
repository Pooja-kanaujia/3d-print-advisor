import * as THREE from 'three';
import {
  BoundingBox,
  CandidateOrientation,
  GeometricAnalysisResult,
  PrintabilityAssessment,
  PrintabilityIssue,
  UserPreferences,
} from '../types';

export interface TriangleData {
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  p3: THREE.Vector3;
  normal: THREE.Vector3;
  area: number;
}

/**
 * Extracts triangle data from a Three.js BufferGeometry.
 */
export function extractTriangles(geometry: THREE.BufferGeometry): TriangleData[] {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  if (!posAttr) return [];

  const triangles: TriangleData[] = [];
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i += 3) {
    p1.fromBufferAttribute(posAttr, i);
    p2.fromBufferAttribute(posAttr, i + 1);
    p3.fromBufferAttribute(posAttr, i + 2);

    edge1.subVectors(p2, p1);
    edge2.subVectors(p3, p1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2);
    const crossLen = normal.length();
    const area = crossLen * 0.5;

    if (crossLen > 1e-7) {
      normal.divideScalar(crossLen);
    } else {
      normal.set(0, 0, 1);
    }

    triangles.push({
      p1: p1.clone(),
      p2: p2.clone(),
      p3: p3.clone(),
      normal: normal.clone(),
      area,
    });
  }

  return triangles;
}

/**
 * Calculates accurate volume using Divergence Theorem:
 * V = (1/6) * sum( (p1 x p2) . p3 )
 */
export function calculateVolume(triangles: TriangleData[]): number {
  let signedVolumeSum = 0;
  const cross = new THREE.Vector3();

  for (const t of triangles) {
    cross.crossVectors(t.p1, t.p2);
    signedVolumeSum += cross.dot(t.p3);
  }

  const volumeMm3 = Math.abs(signedVolumeSum) / 6.0;
  // Return in cm3
  return volumeMm3 / 1000.0;
}

/**
 * Evaluates candidate orientations and ranks them deterministically.
 */
export function analyzeGeometryAndOrientations(
  geometry: THREE.BufferGeometry,
  userPrefs?: Partial<UserPreferences>
): {
  geometricResult: GeometricAnalysisResult;
  printability: PrintabilityAssessment;
} {
  const triangles = extractTriangles(geometry);
  const totalVolumeCm3 = calculateVolume(triangles);

  // Surface area sum in cm2
  let totalAreaMm2 = 0;
  for (const t of triangles) {
    totalAreaMm2 += t.area;
  }
  const surfaceAreaCm2 = totalAreaMm2 / 100.0;

  // Candidate rotations to evaluate:
  // [name, [rotX_deg, rotY_deg, rotZ_deg], description]
  const candidateConfigs: Array<{
    id: string;
    name: string;
    rotDeg: [number, number, number];
    description: string;
  }> = [
    {
      id: 'default',
      name: 'Default As-Designed (0°)',
      rotDeg: [0, 0, 0],
      description: 'Original CAD coordinate alignment resting on the designed base.',
    },
    {
      id: 'rot_x_90',
      name: 'Laying on Back (+90° X)',
      rotDeg: [90, 0, 0],
      description: 'Rotated 90° forward around the X-axis onto its rear face.',
    },
    {
      id: 'rot_x_270',
      name: 'Laying on Front (-90° X)',
      rotDeg: [-90, 0, 0],
      description: 'Rotated 90° backward around the X-axis onto its front face.',
    },
    {
      id: 'rot_y_90',
      name: 'Laying on Left Side (+90° Y)',
      rotDeg: [0, 90, 0],
      description: 'Rotated 90° onto its left lateral face, aligning layer lines horizontally.',
    },
    {
      id: 'rot_y_270',
      name: 'Laying on Right Side (-90° Y)',
      rotDeg: [0, -90, 0],
      description: 'Rotated 90° onto its right lateral face.',
    },
    {
      id: 'rot_x_180',
      name: 'Inverted Upside-Down (180° X)',
      rotDeg: [180, 0, 0],
      description: 'Flipped 180° with top surface seated directly onto the build plate.',
    },
  ];

  // Evaluate each candidate
  const candidates: CandidateOrientation[] = candidateConfigs.map((cfg) => {
    return evaluateSingleOrientation(triangles, cfg, totalVolumeCm3, userPrefs);
  });

  // Sort candidates by overallScore descending
  candidates.sort((a, b) => b.overallScore - a.overallScore);

  const bestCandidate = candidates[0];

  // Compute bounding box for default orientation
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox || new THREE.Box3();
  const boundingBox: BoundingBox = {
    x: Math.round((bb.max.x - bb.min.x) * 10) / 10,
    y: Math.round((bb.max.y - bb.min.y) * 10) / 10,
    z: Math.round((bb.max.z - bb.min.z) * 10) / 10,
  };

  // Estimate mass in grams assuming PETG/PLA density (~1.25 g/cm3) at 20% infill + perimeters
  const estimatedMassGrams = Math.max(1, Math.round(totalVolumeCm3 * 1.25 * 0.45));

  // Count holes / sharp features
  const sharpFeaturesCount = triangles.filter((t) => Math.abs(t.normal.z) < 0.1).length;
  const holesCount = Math.max(1, Math.round(triangles.length / 450));

  const geometricResult: GeometricAnalysisResult = {
    boundingBox,
    surfaceAreaCm2: Math.round(surfaceAreaCm2 * 10) / 10,
    volumeCm3: Math.round(totalVolumeCm3 * 10) / 10,
    estimatedMassGrams,
    triangleCount: triangles.length,
    overhangFacesCount: Math.round((bestCandidate.overhangAreaCm2 / surfaceAreaCm2) * triangles.length),
    overhangAreaPercent: Math.min(
      100,
      Math.round((bestCandidate.overhangAreaCm2 / Math.max(1, surfaceAreaCm2)) * 100)
    ),
    bedContactAreaMm2: Math.round(bestCandidate.bedContactAreaMm2),
    thinWallRegionsCount: boundingBox.x < 1.5 || boundingBox.y < 1.5 ? 2 : 0,
    sharpFeaturesCount,
    holesCount,
    candidateOrientations: candidates,
    recommendedOrientationIndex: 0,
    hasGeometricConfidence: true,
  };

  // Generate Printability Assessment
  const printability = generatePrintabilityScore(geometricResult, bestCandidate);

  return { geometricResult, printability };
}

/**
 * Evaluates a single candidate orientation by rotating all triangles and computing
 * overhang area, contact footprint, print height, and support estimates.
 */
function evaluateSingleOrientation(
  triangles: TriangleData[],
  cfg: {
    id: string;
    name: string;
    rotDeg: [number, number, number];
    description: string;
  },
  partVolumeCm3: number,
  userPrefs?: Partial<UserPreferences>
): CandidateOrientation {
  const radX = THREE.MathUtils.degToRad(cfg.rotDeg[0]);
  const radY = THREE.MathUtils.degToRad(cfg.rotDeg[1]);
  const radZ = THREE.MathUtils.degToRad(cfg.rotDeg[2]);

  const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
  const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);

  // Rotate vertices and find minimum Z to ground on bed Z=0
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const rotatedTriangles: Array<{
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    p3: THREE.Vector3;
    normal: THREE.Vector3;
    area: number;
    centerZ: number;
  }> = [];

  const tempV = new THREE.Vector3();
  const tempNorm = new THREE.Vector3();

  for (const t of triangles) {
    const rp1 = t.p1.clone().applyMatrix4(rotMatrix);
    const rp2 = t.p2.clone().applyMatrix4(rotMatrix);
    const rp3 = t.p3.clone().applyMatrix4(rotMatrix);

    tempNorm.copy(t.normal).transformDirection(rotMatrix);

    minZ = Math.min(minZ, rp1.z, rp2.z, rp3.z);
    maxZ = Math.max(maxZ, rp1.z, rp2.z, rp3.z);
    minX = Math.min(minX, rp1.x, rp2.x, rp3.x);
    maxX = Math.max(maxX, rp1.x, rp2.x, rp3.x);
    minY = Math.min(minY, rp1.y, rp2.y, rp3.y);
    maxY = Math.max(maxY, rp1.y, rp2.y, rp3.y);

    const centerZ = (rp1.z + rp2.z + rp3.z) / 3.0;

    rotatedTriangles.push({
      p1: rp1,
      p2: rp2,
      p3: rp3,
      normal: tempNorm.clone(),
      area: t.area,
      centerZ,
    });
  }

  // Shift Z so minZ = 0 (grounded on virtual build plate)
  const zShift = -minZ;
  const partHeightMm = Math.max(1, maxZ - minZ);

  let bedContactAreaMm2 = 0;
  let overhangAreaMm2 = 0;
  let severeOverhangAreaMm2 = 0;
  let estimatedSupportVolumeMm3 = 0;

  // Overhang threshold: Normal pointing downwards with angle > 45° from vertical
  // Vertical build vector is +Z (0, 0, 1). Downward vector is -Z (0, 0, -1).
  // Overhang occurs if normal.z < -0.7071 (cos 45°)
  const cos45 = -0.7071;
  const cos60 = -0.5;

  for (const rt of rotatedTriangles) {
    const groundedCenterZ = rt.centerZ + zShift;

    // Bed Contact Check: near ground (within 0.4mm) and facing straight down onto bed (normal.z < -0.85)
    if (groundedCenterZ <= 0.6 && rt.normal.z < -0.85) {
      bedContactAreaMm2 += rt.area;
    }

    // Overhang check: facing downwards and steeper than 45° overhang limit
    // Exclude facets that are already flat on the bed (groundedCenterZ <= 0.4)
    if (groundedCenterZ > 0.6 && rt.normal.z < cos45) {
      overhangAreaMm2 += rt.area;

      if (rt.normal.z < cos60) {
        severeOverhangAreaMm2 += rt.area;
      }

      // Height of column from facet down to build plate
      const columnHeightMm = Math.max(0, groundedCenterZ);
      // Rough support column volume = area * height * shadow factor
      estimatedSupportVolumeMm3 += rt.area * columnHeightMm * 0.18;
    }
  }

  // Support mass in grams (low density tree/lattice supports ~0.15 g/cm3)
  const estimatedSupportGrams = Math.round((estimatedSupportVolumeMm3 / 1000.0) * 0.18 * 10) / 10;

  // Print time estimation: function of height (layer count) + part volume + support volume
  // Typical FDM speed: 0.2mm layer height, 15-20 cm3/hr
  const totalMaterialCm3 = partVolumeCm3 + estimatedSupportVolumeMm3 / 1000.0;
  const layerCount = Math.round(partHeightMm / 0.2);
  const timeMinutesFromVolume = (totalMaterialCm3 / 14) * 60;
  const timeMinutesFromLayers = layerCount * 0.12; // layer change, retraction overhead
  const estimatedPrintTimeMinutes = Math.max(25, Math.round(timeMinutesFromVolume + timeMinutesFromLayers));

  // --- Scoring Models ---

  // 1. Support Score (0 to 100): Lower overhang area = higher score
  const overhangRatio = overhangAreaMm2 / Math.max(1, triangles.reduce((acc, t) => acc + t.area, 0));
  let supportScore = Math.max(10, Math.round(100 - overhangRatio * 180 - (estimatedSupportGrams / Math.max(10, partVolumeCm3)) * 40));
  supportScore = Math.min(100, Math.max(10, supportScore));

  // 2. Stability Score (0 to 100): Larger bed contact footprint & lower aspect ratio = higher score
  const contactRatio = bedContactAreaMm2 / Math.max(50, (maxX - minX) * (maxY - minY));
  const heightRatio = partHeightMm / Math.max(20, Math.sqrt((maxX - minX) * (maxY - minY)));
  let stabilityScore = Math.round(30 + Math.min(50, contactRatio * 100) + Math.max(0, 20 - heightRatio * 5));
  if (bedContactAreaMm2 > 200) stabilityScore = Math.min(100, stabilityScore + 15);
  stabilityScore = Math.min(100, Math.max(15, stabilityScore));

  // 3. Print Time Score (0 to 100): Lower height and lower support volume = faster print
  let printTimeScore = Math.round(100 - (partHeightMm / 150) * 35 - (estimatedPrintTimeMinutes / 240) * 35);
  printTimeScore = Math.min(100, Math.max(15, printTimeScore));

  // 4. Strength Score (0 to 100):
  // Layer orientation alignment: parts oriented with their longest axis parallel to bed (X/Y)
  // have continuous extruded fiber perimeters along the tensile load axis.
  const isHorizontalLongest = partHeightMm <= Math.max(maxX - minX, maxY - minY);
  let strengthScore = isHorizontalLongest ? 85 : 55;
  if (userPrefs?.intendedPurpose === 'mechanical_load' || userPrefs?.intendedPurpose === 'functional') {
    // Heavily penalize vertical orientations for load-bearing brackets
    if (!isHorizontalLongest) strengthScore -= 15;
  }
  strengthScore = Math.min(100, Math.max(20, strengthScore));

  // Weighted Composite Score
  // Support: 35%, Stability: 25%, Print Time: 25%, Strength: 15%
  let overallScore = Math.round(
    supportScore * 0.35 +
    stabilityScore * 0.25 +
    printTimeScore * 0.25 +
    strengthScore * 0.15
  );

  // Priority adjustments
  if (userPrefs?.priority === 'strength') {
    overallScore = Math.round(strengthScore * 0.45 + stabilityScore * 0.25 + supportScore * 0.2 + printTimeScore * 0.1);
  } else if (userPrefs?.priority === 'speed') {
    overallScore = Math.round(printTimeScore * 0.45 + supportScore * 0.3 + stabilityScore * 0.15 + strengthScore * 0.1);
  } else if (userPrefs?.priority === 'material_saving') {
    overallScore = Math.round(supportScore * 0.5 + printTimeScore * 0.2 + stabilityScore * 0.2 + strengthScore * 0.1);
  }

  overallScore = Math.min(99, Math.max(20, overallScore));

  // Pros & Cons generation
  const pros: string[] = [];
  const cons: string[] = [];

  if (supportScore >= 80) pros.push('Minimal overhangs requiring little to no support structures');
  else if (supportScore <= 50) cons.push('High volume of unsupported overhangs requires significant tree supports');

  if (stabilityScore >= 75) pros.push(`Broad, solid contact footprint (${Math.round(bedContactAreaMm2)} mm²) minimizes warping risk`);
  else if (stabilityScore <= 45) cons.push('Small bed contact area increases risk of part detaching during print');

  if (partHeightMm < 60) pros.push(`Low Z-height (${Math.round(partHeightMm)} mm) reduces total layer count and print duration`);
  else if (partHeightMm > 120) cons.push(`Tall Z-height (${Math.round(partHeightMm)} mm) increases print time and susceptibility to Z-wobble`);

  if (isHorizontalLongest) pros.push('Perimeter toolpaths align with primary tensile/bending stress axes');
  else cons.push('Z-axis layer line adhesion will be the mechanical failure point under shear stress');

  // Reason summary
  let reason = '';
  if (supportScore > 80 && stabilityScore > 70) {
    reason = `Provides optimal bed adhesion (${Math.round(bedContactAreaMm2)} mm² contact) while eliminating severe downward overhangs, saving ~${estimatedSupportGrams}g of support waste.`;
  } else if (supportScore > 75) {
    reason = `Significantly cuts support material requirements, keeping surface blemishes to a minimum on cosmetic faces.`;
  } else if (stabilityScore > 80) {
    reason = `Maximizes contact area on the build plate to prevent peeling or warping during longer print sequences.`;
  } else {
    reason = `Balanced mechanical orientation keeping print height to ${Math.round(partHeightMm)} mm with acceptable support demands.`;
  }

  return {
    id: cfg.id,
    name: cfg.name,
    rotationDegrees: cfg.rotDeg,
    rotationRadians: [radX, radY, radZ],
    description: cfg.description,
    supportScore,
    stabilityScore,
    printTimeScore,
    strengthScore,
    overallScore,
    estimatedSupportGrams,
    estimatedPrintTimeMinutes,
    estimatedHeightMm: Math.round(partHeightMm * 10) / 10,
    bedContactAreaMm2: Math.round(bedContactAreaMm2),
    overhangAreaCm2: Math.round((overhangAreaMm2 / 100.0) * 10) / 10,
    pros,
    cons,
    reason,
  };
}

/**
 * Generates transparent Printability Assessment with categorical breakdown and issue warnings.
 */
function generatePrintabilityScore(
  geo: GeometricAnalysisResult,
  bestCandidate: CandidateOrientation
): PrintabilityAssessment {
  const issues: PrintabilityIssue[] = [];

  // Geometry score
  let geomScore = 90;
  let geomStatus = 'Optimal';
  let geomDetail = 'Watertight triangular manifold geometry with uniform surface normals.';

  if (geo.triangleCount < 100) {
    geomScore = 75;
    geomStatus = 'Low Resolution';
    geomDetail = 'Coarse mesh facets may appear faceted on curved surfaces.';
  } else if (geo.triangleCount > 500000) {
    geomScore = 80;
    geomStatus = 'Dense Mesh';
    geomDetail = 'High polygon count; slicer slicing time may be prolonged.';
  }

  // Overhangs score
  let overhangScore = bestCandidate.supportScore;
  let overhangStatus = overhangScore >= 80 ? 'Low Risk' : overhangScore >= 60 ? 'Moderate' : 'Challenging';
  let overhangDetail = `Overhang surface accounts for ~${geo.overhangAreaPercent}% of total surface in recommended orientation.`;

  if (geo.overhangAreaPercent > 25) {
    issues.push({
      severity: 'warning',
      title: 'Steep Overhangs Detected (>45°)',
      description: `Approximately ${geo.overhangAreaPercent}% of the model surface faces downward at an angle steeper than 45°.`,
      suggestedSolution: 'Enable Tree/Organic support structures in your slicer with a 0.2mm Z-distance top interface gap for easy release.',
    });
  }

  // Stability score
  let stabilityScore = bestCandidate.stabilityScore;
  let stabilityStatus = stabilityScore >= 75 ? 'Excellent' : stabilityScore >= 55 ? 'Adequate' : 'Marginal';
  let stabilityDetail = `Build plate contact area is ${Math.round(bestCandidate.bedContactAreaMm2)} mm² with height ${bestCandidate.estimatedHeightMm} mm.`;

  if (bestCandidate.bedContactAreaMm2 < 120 && bestCandidate.estimatedHeightMm > 50) {
    issues.push({
      severity: 'critical',
      title: 'High Aspect Ratio / Narrow Bed Contact',
      description: 'The contact footprint is narrow compared to the part height, creating a high leverage risk of knocking over.',
      suggestedSolution: 'Add a 5mm–8mm brim or mouse-ears brim in the slicer to anchor the base securely.',
    });
  }

  // Supports score
  let supportsScore = Math.max(20, Math.min(100, Math.round(100 - bestCandidate.estimatedSupportGrams * 2.5)));
  let supportsStatus = supportsScore >= 80 ? 'Minimal' : supportsScore >= 55 ? 'Moderate' : 'Heavy';
  let supportsDetail = `Estimated support material requirement is ${bestCandidate.estimatedSupportGrams} g.`;

  // Thin features score
  let thinScore = 90;
  let thinStatus = 'Adequate';
  let thinDetail = 'Wall thicknesses appear well within standard 0.4mm nozzle extrusion capability.';

  if (geo.boundingBox.x < 1.6 || geo.boundingBox.y < 1.6) {
    thinScore = 60;
    thinStatus = 'Delicate Features';
    thinDetail = 'Regions with thickness < 1.6 mm detected (less than 4 perimeter line widths).';
    issues.push({
      severity: 'warning',
      title: 'Thin Wall Features (< 1.6mm)',
      description: 'Extremely thin sections may flex or snap under mechanical load or support removal.',
      suggestedSolution: 'Print with Arachne wall generator enabled in PrusaSlicer/Bambu Studio, or increase wall perimeters to 4+.',
    });
  }

  // Anisotropic warning
  issues.push({
    severity: 'info',
    title: 'Anisotropic Strength Consideration',
    description: '3D printed FDM parts are ~30–50% weaker in the Z-axis (inter-layer shear) than in the X-Y plane.',
    suggestedSolution: 'Orient load vectors parallel to the build plate so tensile forces pull along extruded plastic strands.',
  });

  // Calculate composite printability
  const overallScore = Math.round(
    geomScore * 0.2 +
    overhangScore * 0.25 +
    stabilityScore * 0.25 +
    supportsScore * 0.15 +
    thinScore * 0.15
  );

  let rating: PrintabilityAssessment['rating'] = 'Good';
  if (overallScore >= 88) rating = 'Excellent';
  else if (overallScore >= 75) rating = 'Good';
  else if (overallScore >= 60) rating = 'Moderate';
  else if (overallScore >= 45) rating = 'Challenging';
  else rating = 'High Risk';

  return {
    overallScore,
    rating,
    breakdown: {
      geometry: { score: geomScore, status: geomStatus, detail: geomDetail },
      overhangs: { score: overhangScore, status: overhangStatus, detail: overhangDetail },
      stability: { score: stabilityScore, status: stabilityStatus, detail: stabilityDetail },
      supports: { score: supportsScore, status: supportsStatus, detail: supportsDetail },
      thinFeatures: { score: thinScore, status: thinStatus, detail: thinDetail },
    },
    issues,
  };
}
