import * as THREE from 'three';

export interface SampleModelPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultDimensions: { x: number; y: number; z: number };
  createGeometry: () => THREE.BufferGeometry;
}

/**
 * Procedural generation of a Mechanical L-Bracket with mounting holes and gusset rib.
 */
function createMechanicalLBracket(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Base horizontal plate: 80mm long (X), 40mm wide (Y), 8mm thick (Z)
  const baseGeom = new THREE.BoxGeometry(80, 40, 8);
  baseGeom.translate(40, 20, 4);
  geometries.push(baseGeom);

  // Vertical upright plate: 8mm thick (X), 40mm wide (Y), 70mm tall (Z)
  const uprightGeom = new THREE.BoxGeometry(8, 40, 70);
  uprightGeom.translate(4, 20, 43); // 8 + 35 = 43
  geometries.push(uprightGeom);

  // Reinforcing Gusset Rib (triangular prism along center)
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(8, 8);
  gussetShape.lineTo(60, 8);
  gussetShape.lineTo(8, 60);
  gussetShape.closePath();

  const extrudeSettings = { depth: 6, bevelEnabled: false };
  const gussetGeom = new THREE.ExtrudeGeometry(gussetShape, extrudeSettings);
  // Rotate so depth aligns with Y axis centered at Y=20
  gussetGeom.rotateX(Math.PI / 2);
  gussetGeom.translate(0, 23, 0);
  geometries.push(gussetGeom);

  // Counterbore boss rings (simulating mounting hole surrounds)
  const boss1 = new THREE.CylinderGeometry(8, 8, 3, 16);
  boss1.rotateX(Math.PI / 2);
  boss1.translate(55, 20, 8);
  geometries.push(boss1);

  const boss2 = new THREE.CylinderGeometry(8, 8, 3, 16);
  boss2.translate(8, 20, 55);
  geometries.push(boss2);

  return mergeBufferGeometries(geometries);
}

/**
 * Procedural Phone Stand with angled backrest, cable slot, and front retaining lip.
 */
function createPhoneStand(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Main base footprint: 75mm wide (X), 90mm deep (Y), 6mm thick (Z)
  const base = new THREE.BoxGeometry(75, 90, 6);
  base.translate(37.5, 45, 3);
  geometries.push(base);

  // Angled backrest plate (angled at 65° from horizontal)
  const backrest = new THREE.BoxGeometry(75, 6, 100);
  backrest.rotateX(-0.4); // ~23 degrees tilt back
  backrest.translate(37.5, 40, 48);
  geometries.push(backrest);

  // Front retaining lip: 75mm wide, 10mm deep, 18mm high
  const lip = new THREE.BoxGeometry(75, 10, 18);
  lip.translate(37.5, 85, 9);
  geometries.push(lip);

  // Two angled support braces
  const braceShape = new THREE.Shape();
  braceShape.moveTo(0, 0);
  braceShape.lineTo(50, 0);
  braceShape.lineTo(10, 60);
  braceShape.closePath();

  const braceSettings = { depth: 5, bevelEnabled: false };
  const brace1 = new THREE.ExtrudeGeometry(braceShape, braceSettings);
  brace1.rotateY(Math.PI / 2);
  brace1.translate(10, 15, 6);
  geometries.push(brace1);

  const brace2 = brace1.clone();
  brace2.translate(55, 0, 0);
  geometries.push(brace2);

  return mergeBufferGeometries(geometries);
}

/**
 * Procedural Drone Motor Mount with motor collar, 4 arms, and screw bosses.
 */
function createDroneMotorMount(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Center motor ring: 36mm outer diam, 28mm inner
  const ring = new THREE.CylinderGeometry(18, 18, 8, 32);
  ring.translate(0, 0, 4);
  geometries.push(ring);

  // Central bearing hub
  const hub = new THREE.CylinderGeometry(8, 8, 12, 24);
  hub.translate(0, 0, 6);
  geometries.push(hub);

  // 4 Symmetric mounting arms
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const arm = new THREE.BoxGeometry(45, 10, 6);
    arm.translate(22.5, 0, 3);
    arm.rotateZ(angle);

    const holeBoss = new THREE.CylinderGeometry(6, 6, 8, 16);
    const bx = Math.cos(angle) * 40;
    const by = Math.sin(angle) * 40;
    holeBoss.translate(bx, by, 4);

    geometries.push(arm);
    geometries.push(holeBoss);
  }

  return mergeBufferGeometries(geometries);
}

/**
 * Procedural Precision Helical Gear
 */
function createHelicalGear(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Main gear body cylinder: 60mm diameter, 16mm height
  const body = new THREE.CylinderGeometry(30, 30, 16, 32);
  body.translate(0, 0, 8);
  geometries.push(body);

  // 18 teeth extruded around perimeter
  const teethCount = 16;
  for (let i = 0; i < teethCount; i++) {
    const angle = (i * 2 * Math.PI) / teethCount;
    const tooth = new THREE.BoxGeometry(7, 4, 16);
    tooth.translate(31, 0, 8);
    tooth.rotateZ(angle);
    geometries.push(tooth);
  }

  // Raised center shaft boss
  const boss = new THREE.CylinderGeometry(15, 15, 24, 24);
  boss.translate(0, 0, 12);
  geometries.push(boss);

  return mergeBufferGeometries(geometries);
}

/**
 * Procedural Articulated Flexi Lizard (Print-in-Place)
 */
function createArticulatedLizard(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Head (Tapered triangle with rounded nose and eye bumps)
  const headGeom = new THREE.ConeGeometry(14, 26, 16);
  headGeom.rotateX(Math.PI / 2);
  headGeom.scale(1, 0.45, 1);
  headGeom.translate(0, 52, 6);
  geometries.push(headGeom);

  // Eye bumps
  const eyeL = new THREE.SphereGeometry(3, 12, 12);
  eyeL.translate(-7, 50, 8);
  geometries.push(eyeL);

  const eyeR = new THREE.SphereGeometry(3, 12, 12);
  eyeR.translate(7, 50, 8);
  geometries.push(eyeR);

  // 6 Interlocking Body Vertebrae Segments
  const bodyCount = 6;
  for (let i = 0; i < bodyCount; i++) {
    const yPos = 38 - i * 11;
    const widthScale = 1.0 - Math.abs(i - 2) * 0.12;

    // Segment main body capsule/box
    const seg = new THREE.BoxGeometry(18 * widthScale, 9, 8);
    seg.translate(0, yPos, 5);
    geometries.push(seg);

    // Spine crest ridge
    const ridge = new THREE.ConeGeometry(2, 6, 4);
    ridge.rotateX(Math.PI / 2);
    ridge.translate(0, yPos, 10);
    geometries.push(ridge);

    // Interlocking hinge link pins (simulating print-in-place ball/socket links)
    if (i < bodyCount - 1) {
      const linkPin = new THREE.CylinderGeometry(2, 2, 8, 12);
      linkPin.translate(0, yPos - 5.5, 5);
      geometries.push(linkPin);
    }
  }

  // 4 Splayed Legs with Feet and Toes
  // Front Left Leg
  const frontLegL = new THREE.BoxGeometry(16, 6, 4);
  frontLegL.rotateZ(0.5);
  frontLegL.translate(-16, 32, 3);
  geometries.push(frontLegL);
  const footFL = new THREE.BoxGeometry(8, 12, 3);
  footFL.translate(-24, 35, 2);
  geometries.push(footFL);

  // Front Right Leg
  const frontLegR = new THREE.BoxGeometry(16, 6, 4);
  frontLegR.rotateZ(-0.5);
  frontLegR.translate(16, 32, 3);
  geometries.push(frontLegR);
  const footFR = new THREE.BoxGeometry(8, 12, 3);
  footFR.translate(24, 35, 2);
  geometries.push(footFR);

  // Rear Left Leg
  const rearLegL = new THREE.BoxGeometry(18, 6, 4);
  rearLegL.rotateZ(-0.4);
  rearLegL.translate(-16, 0, 3);
  geometries.push(rearLegL);
  const footRL = new THREE.BoxGeometry(8, 12, 3);
  footRL.translate(-24, -3, 2);
  geometries.push(footRL);

  // Rear Right Leg
  const rearLegR = new THREE.BoxGeometry(18, 6, 4);
  rearLegR.rotateZ(0.4);
  rearLegR.translate(16, 0, 3);
  geometries.push(rearLegR);
  const footRR = new THREE.BoxGeometry(8, 12, 3);
  footRR.translate(24, -3, 2);
  geometries.push(footRR);

  // 8 Articulated Tail Segments (gradually tapering and gently curving)
  const tailSegments = 8;
  for (let t = 0; t < tailSegments; t++) {
    const scale = Math.max(0.3, 1.0 - t * 0.09);
    const curveOffset = Math.sin(t * 0.45) * 6;
    const yPos = -30 - t * 9;

    const tailSeg = new THREE.BoxGeometry(12 * scale, 7.5, 6 * scale);
    tailSeg.translate(curveOffset, yPos, 4 * scale);
    geometries.push(tailSeg);

    if (t < tailSegments - 1) {
      const link = new THREE.CylinderGeometry(1.5 * scale, 1.5 * scale, 6, 8);
      link.translate(curveOffset, yPos - 4.5, 4 * scale);
      geometries.push(link);
    }
  }

  return mergeBufferGeometries(geometries);
}

/**
 * Procedural GoPro Articulated Mounting Arm
 */
function createGoProArm(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Arm beam: 60mm long, 14mm wide, 12mm thick
  const beam = new THREE.BoxGeometry(60, 14, 12);
  beam.translate(30, 0, 6);
  geometries.push(beam);

  // Two clevis prongs on one side (female fork)
  const prong1 = new THREE.CylinderGeometry(7, 7, 3, 16);
  prong1.rotateX(Math.PI / 2);
  prong1.translate(60, 4, 6);
  geometries.push(prong1);

  const prong2 = new THREE.CylinderGeometry(7, 7, 3, 16);
  prong2.rotateX(Math.PI / 2);
  prong2.translate(60, -4, 6);
  geometries.push(prong2);

  // Single middle tab on the other side (male knuckle)
  const knuckle = new THREE.CylinderGeometry(7, 7, 5, 16);
  knuckle.rotateX(Math.PI / 2);
  knuckle.translate(0, 0, 6);
  geometries.push(knuckle);

  return mergeBufferGeometries(geometries);
}

/**
 * Merge multiple BufferGeometries into a single BufferGeometry with normals and centered onto ground.
 */
function mergeBufferGeometries(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalPositions = 0;
  for (const g of geoms) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    const pos = nonIndexed.getAttribute('position');
    totalPositions += pos.count * 3;
  }

  const mergedPositions = new Float32Array(totalPositions);
  let offset = 0;

  for (const g of geoms) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    const pos = nonIndexed.getAttribute('position');
    const array = pos.array as Float32Array;
    mergedPositions.set(array, offset);
    offset += array.length;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  merged.computeVertexNormals();

  // Re-center on X/Y and place bottom on Z=0
  merged.computeBoundingBox();
  if (merged.boundingBox) {
    const bb = merged.boundingBox;
    const midX = (bb.max.x + bb.min.x) / 2;
    const midY = (bb.max.y + bb.min.y) / 2;
    const minZ = bb.min.z;
    merged.translate(-midX, -midY, -minZ);
  }

  return merged;
}

export const SAMPLE_PRESETS: SampleModelPreset[] = [
  {
    id: 'l_bracket',
    name: 'Heavy-Duty Mechanical L-Bracket',
    category: 'Functional / Mechanical',
    description: 'Structural 90° mounting bracket with reinforcing gusset rib and dual M5 counterbore bolt rings. Ideal for studying print orientation vs shear load.',
    defaultDimensions: { x: 80, y: 40, z: 78 },
    createGeometry: createMechanicalLBracket,
  },
  {
    id: 'phone_stand',
    name: 'Ergonomic Desk Phone Stand',
    category: 'Consumer / Ergonomics',
    description: 'Angled cradle with 65° backrest, cable pass-through channel, and curved front catch. Demonstrates overhang support trade-offs.',
    defaultDimensions: { x: 75, y: 90, z: 75 },
    createGeometry: createPhoneStand,
  },
  {
    id: 'drone_mount',
    name: 'Quadrotor Motor Arm Mount',
    category: 'Aerospace / Robotics',
    description: 'Lightweight motor mount with central bearing relief, 4 radial cross-braced arms, and M3 hardware holes.',
    defaultDimensions: { x: 90, y: 90, z: 12 },
    createGeometry: createDroneMotorMount,
  },
  {
    id: 'helical_gear',
    name: 'Precision Helical Spur Gear',
    category: 'Power Transmission',
    description: 'Involute 16-tooth gear with raised keyway drive hub. Highlights vertical tooth resolution and circular accuracy.',
    defaultDimensions: { x: 62, y: 62, z: 24 },
    createGeometry: createHelicalGear,
  },
  {
    id: 'flexi_lizard',
    name: 'Articulated Flexi Lizard (Print-in-Place)',
    category: 'Decorative / Toys & Hinges',
    description: 'Segmented reptile figurine with multi-joint print-in-place ball-and-socket links, splayed limbs, and tapered tail. Zero-support bridging benchmark.',
    defaultDimensions: { x: 56, y: 148, z: 12 },
    createGeometry: createArticulatedLizard,
  },
  {
    id: 'gopro_arm',
    name: 'Action Camera Articulated Arm',
    category: 'Mounting Hardware',
    description: 'Dual-interlocking hinge extension with knuckle cavities. Evaluates inter-layer shear strength under vibration.',
    defaultDimensions: { x: 74, y: 14, z: 14 },
    createGeometry: createGoProArm,
  },
];

/**
 * STL Loader (Supports both ASCII and Binary STL formats).
 */
export function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const isBinary = checkIsBinarySTL(buffer);
  if (isBinary) {
    return parseBinarySTL(buffer);
  } else {
    const text = new TextDecoder().decode(buffer);
    return parseASCIISTL(text);
  }
}

function checkIsBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const faceCount = view.getUint32(80, true);
  const expectedSize = 84 + faceCount * 50;
  // Standard binary STL check with tolerance for trailing metadata/color chunks
  if (faceCount > 0 && buffer.byteLength >= expectedSize && expectedSize > 84) {
    return true;
  }
  // Check first 500 bytes for null bytes characteristic of binary encoding
  const u8 = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 500));
  for (let i = 0; i < u8.length; i++) {
    if (u8[i] === 0) return true;
  }
  return false;
}

function parseBinarySTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(buffer);
  const faceCount = view.getUint32(80, true);
  const maxFaces = Math.floor((buffer.byteLength - 84) / 50);
  const actualFaceCount = Math.max(0, Math.min(faceCount, maxFaces));

  if (actualFaceCount === 0) {
    const text = new TextDecoder().decode(buffer);
    return parseASCIISTL(text);
  }

  const vertices = new Float32Array(actualFaceCount * 9);
  const normals = new Float32Array(actualFaceCount * 9);

  let offset = 84;
  let vIdx = 0;

  for (let i = 0; i < actualFaceCount; i++) {
    // Normal vector
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    // 3 Vertices
    for (let v = 0; v < 3; v++) {
      const vx = view.getFloat32(offset, true);
      const vy = view.getFloat32(offset + 4, true);
      const vz = view.getFloat32(offset + 8, true);
      offset += 12;

      vertices[vIdx] = vx;
      vertices[vIdx + 1] = vy;
      vertices[vIdx + 2] = vz;

      normals[vIdx] = nx;
      normals[vIdx + 1] = ny;
      normals[vIdx + 2] = nz;
      vIdx += 3;
    }

    offset += 2; // skip 2-byte attribute byte count
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  if (normals[0] === 0 && normals[1] === 0 && normals[2] === 0) {
    geometry.computeVertexNormals();
  } else {
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  }

  normalizeAndGroundGeometry(geometry);
  return geometry;
}

function parseASCIISTL(text: string): THREE.BufferGeometry {
  const lines = text.split('\n');
  const vertices: number[] = [];
  const normals: number[] = [];

  let currentNormal: [number, number, number] = [0, 0, 1];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('facet normal')) {
      const parts = trimmed.split(/\s+/);
      currentNormal = [parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0, parseFloat(parts[4]) || 1];
    } else if (trimmed.startsWith('vertex')) {
      const parts = trimmed.split(/\s+/);
      const vx = parseFloat(parts[1]);
      const vy = parseFloat(parts[2]);
      const vz = parseFloat(parts[3]);
      if (!isNaN(vx) && !isNaN(vy) && !isNaN(vz)) {
        vertices.push(vx, vy, vz);
        normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  if (vertices.length > 0) {
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.computeVertexNormals();
    normalizeAndGroundGeometry(geometry);
  }
  return geometry;
}

/**
 * Basic OBJ Loader
 */
export function parseOBJ(text: string): THREE.BufferGeometry {
  const lines = text.split('\n');
  const vList: [number, number, number][] = [];
  const positions: number[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      vList.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (line.startsWith('f ')) {
      const parts = line.split(/\s+/).slice(1);
      const faceIndices: number[] = [];
      for (const p of parts) {
        const vIdx = parseInt(p.split('/')[0], 10);
        // OBJ 1-indexed, negative is relative
        const resolvedIdx = vIdx > 0 ? vIdx - 1 : vList.length + vIdx;
        faceIndices.push(resolvedIdx);
      }

      // Triangulate n-gons
      for (let i = 1; i < faceIndices.length - 1; i++) {
        const v0 = vList[faceIndices[0]];
        const v1 = vList[faceIndices[i]];
        const v2 = vList[faceIndices[i + 1]];
        if (v0 && v1 && v2) {
          positions.push(...v0, ...v1, ...v2);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  normalizeAndGroundGeometry(geometry);
  return geometry;
}

function normalizeAndGroundGeometry(geometry: THREE.BufferGeometry) {
  const pos = geometry.getAttribute('position');
  if (!pos || pos.count === 0) return;

  geometry.computeBoundingBox();
  if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
    const bb = geometry.boundingBox;
    if (isFinite(bb.min.x) && isFinite(bb.max.x) && isFinite(bb.min.y) && isFinite(bb.max.y) && isFinite(bb.min.z) && isFinite(bb.max.z)) {
      const midX = (bb.max.x + bb.min.x) / 2;
      const midY = (bb.max.y + bb.min.y) / 2;
      const minZ = bb.min.z;
      geometry.translate(-midX, -midY, -minZ);
    }
  }
}
