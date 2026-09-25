import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CandidateOrientation } from '../types';
import {
  RotateCcw,
  Eye,
  Maximize2,
  Box,
  Compass,
  Layers,
  Sparkles,
  Flame,
  Info,
} from 'lucide-react';

interface ThreeDViewerProps {
  geometry: THREE.BufferGeometry | null;
  candidateOrientations?: CandidateOrientation[];
  selectedOrientationIndex?: number;
  onSelectOrientation?: (index: number) => void;
  title?: string;
  dimensions?: { x: number; y: number; z: number };
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  geometry,
  candidateOrientations = [],
  selectedOrientationIndex = 0,
  onSelectOrientation,
  title,
  dimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Viewer display settings
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cad' | 'overhang' | 'normals'>('cad');

  // Active orientation
  const currentOrientation = candidateOrientations[selectedOrientationIndex] || candidateOrientations[0];

  // Set up Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // dark slate engineering background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(180, 160, 220);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow looking slightly below bed level
    controls.minDistance = 20;
    controls.maxDistance = 1200;
    controls.target.set(0, 0, 30);
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(120, 250, 150);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.8);
    dirLight2.position.set(-150, -100, -100);
    scene.add(dirLight2);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueRimLight.position.set(-100, 150, -150);
    scene.add(blueRimLight);

    // 6. Build Plate (220mm x 220mm realistic textured engineering grid)
    const buildPlateGroup = new THREE.Group();
    buildPlateGroup.name = 'buildPlate';

    // Grid Helper (10mm fine cells, 50mm major markers)
    // Note: In Three.js standard coordinates, Y is Up, Z is Depth, X is Width.
    // In 3D printing, Z is Height (Up), X is Width, Y is Depth.
    // We map 3D printing Z to Three.js Y, or rotate the scene.
    // Here we place the build plate on the X-Z plane at Y=0!
    const grid = new THREE.GridHelper(240, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    buildPlateGroup.add(grid);

    // Build plate border surface
    const plateGeom = new THREE.BoxGeometry(240, 2, 240);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const plateMesh = new THREE.Mesh(plateGeom, plateMat);
    plateMesh.position.y = -1;
    plateMesh.receiveShadow = true;
    buildPlateGroup.add(plateMesh);

    // Virtual Build Volume Wireframe Box (240 x 240 x 250mm)
    const volumeGeom = new THREE.BoxGeometry(240, 250, 240);
    const volumeEdges = new THREE.EdgesGeometry(volumeGeom);
    const volumeMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.35,
    });
    const volumeBox = new THREE.LineSegments(volumeEdges, volumeMat);
    volumeBox.position.y = 125;
    buildPlateGroup.add(volumeBox);

    scene.add(buildPlateGroup);

    // 7. Axes Helper
    const axes = new THREE.AxesHelper(50);
    axes.position.set(-115, 1, -115);
    scene.add(axes);
    axesHelperRef.current = axes;

    // 8. Render Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 460;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry and Orientation
  useEffect(() => {
    if (!sceneRef.current || !geometry) return;

    // Remove existing mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      sceneRef.current.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      wireframeMeshRef.current = null;
    }
    if (boxHelperRef.current) {
      sceneRef.current.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }

    // Clone geometry so we can transform it
    const displayGeom = geometry.clone();

    // Apply Candidate Orientation rotation
    // Note: 3D printing coordinates [X, Y, Z_up] -> In Three.js: X is X, Z_up is Y, Y_depth is Z.
    // Convert Z-up to Three.js Y-up by swapping or rotating
    if (currentOrientation) {
      const rot = currentOrientation.rotationDegrees;
      displayGeom.rotateX(THREE.MathUtils.degToRad(rot[0]));
      displayGeom.rotateY(THREE.MathUtils.degToRad(rot[1]));
      displayGeom.rotateZ(THREE.MathUtils.degToRad(rot[2]));
    }

    // Reorient to Three.js coordinates: 3D printing Z (height) -> Three.js Y (height)
    // Rotate -90° around X so printing Z points UP in Three.js!
    displayGeom.rotateX(-Math.PI / 2);

    // Compute bounds and place exactly on build plate surface (Y=0)
    displayGeom.computeBoundingBox();
    if (displayGeom.boundingBox) {
      const bb = displayGeom.boundingBox;
      const midX = (bb.max.x + bb.min.x) / 2;
      const midZ = (bb.max.z + bb.min.z) / 2;
      const minY = bb.min.y;
      displayGeom.translate(-midX, -minY, -midZ);
    }
    displayGeom.computeVertexNormals();

    // Material based on viewMode
    let material: THREE.Material;

    if (viewMode === 'overhang') {
      // Create custom vertex colors for Overhang Heatmap
      const coloredGeom = displayGeom.toNonIndexed();
      const pos = coloredGeom.getAttribute('position');
      const norm = coloredGeom.getAttribute('normal');
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const ny = norm.getY(i); // In Three.js, Y is UP. Downward is -Y.
        const py = pos.getY(i);

        // Bed contact faces: near bed (Y < 0.6) and pointing straight down (ny < -0.85)
        if (py < 0.6 && ny < -0.85) {
          // Teal / Bright Green (Bed contact footprint)
          colors[i * 3] = 0.1;
          colors[i * 3 + 1] = 0.9;
          colors[i * 3 + 2] = 0.4;
        } else if (py > 0.6 && ny < -0.7071) {
          // Overhang > 45°: Bright Coral Red / Amber
          colors[i * 3] = 0.95;
          colors[i * 3 + 1] = 0.25;
          colors[i * 3 + 2] = 0.15;
        } else if (py > 0.6 && ny < -0.45) {
          // Moderate Overhang (30° - 45°): Warning Yellow / Amber
          colors[i * 3] = 0.95;
          colors[i * 3 + 1] = 0.7;
          colors[i * 3 + 2] = 0.1;
        } else {
          // Safe upright walls / top surfaces: Engineering Steel Blue
          colors[i * 3] = 0.25;
          colors[i * 3 + 1] = 0.38;
          colors[i * 3 + 2] = 0.55;
        }
      }

      coloredGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.45,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(coloredGeom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.current.add(mesh);
      meshRef.current = mesh;
    } else {
      // High-end CAD Engineering Material
      material = new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // vibrant cyan titanium
        roughness: 0.35,
        metalness: 0.3,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(displayGeom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.current.add(mesh);
      meshRef.current = mesh;
    }

    // Wireframe Overlay
    if (showWireframe) {
      const wireGeom = new THREE.WireframeGeometry(displayGeom);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.5,
      });
      const wireMesh = new THREE.LineSegments(wireGeom, wireMat);
      sceneRef.current.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }

    // Bounding Box Helper
    if (showDimensions && meshRef.current) {
      const bHelper = new THREE.BoxHelper(meshRef.current, 0xf59e0b);
      sceneRef.current.add(bHelper);
      boxHelperRef.current = bHelper;
    }

    // Adjust camera target to center of mesh
    if (displayGeom.boundingBox && controlsRef.current) {
      const bb = displayGeom.boundingBox;
      const centerY = (bb.max.y + bb.min.y) / 2;
      controlsRef.current.target.set(0, centerY, 0);
    }
  }, [geometry, currentOrientation, viewMode, showWireframe, showDimensions]);

  // Toggle axes helper
  useEffect(() => {
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = showAxes;
    }
  }, [showAxes]);

  // Camera presets
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(160, 140, 200);
    controlsRef.current.target.set(0, 30, 0);
    controlsRef.current.update();
  };

  const setCameraTop = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 320, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const setCameraFront = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 30, 280);
    controlsRef.current.target.set(0, 30, 0);
    controlsRef.current.update();
  };

  const setCameraSide = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(280, 30, 0);
    controlsRef.current.target.set(0, 30, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg">
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            {title || '3D Geometry Workspace'}
          </span>
          {dimensions && (
            <span className="text-[11px] font-mono text-cyan-400/90 pl-1 border-l border-slate-700">
              {dimensions.x} × {dimensions.y} × {dimensions.z} mm
            </span>
          )}
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
          <button
            onClick={() => setViewMode('cad')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'cad'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Solid CAD
          </button>
          <button
            onClick={() => setViewMode('overhang')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'overhang'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Overhang Heatmap
          </button>
        </div>
      </div>

      {/* Main WebGL Canvas */}
      <div ref={containerRef} className="w-full flex-1 min-h-[380px] cursor-grab active:cursor-grabbing" />

      {/* Overhang Heatmap Legend (when in overhang mode) */}
      {viewMode === 'overhang' && (
        <div className="absolute top-16 left-3 z-10 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/80 text-[11px] space-y-1.5 shadow-xl max-w-[210px]">
          <div className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-400" /> Overhang Criticality
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <span className="text-slate-300">&gt; 45° Overhang (Needs Support)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <span className="text-slate-300">30°–45° Angle (Marginal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-300">0° Bed Contact Face</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
            <span className="text-slate-300">Self-Supporting Wall</span>
          </div>
        </div>
      )}

      {/* Orientation Switcher Carousel Overlay */}
      {candidateOrientations.length > 0 && onSelectOrientation && (
        <div className="absolute bottom-16 left-3 right-3 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-1.5 max-w-full overflow-x-auto">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Orientation:
            </div>
            {candidateOrientations.map((cand, idx) => {
              const isSelected = idx === selectedOrientationIndex;
              const isBest = idx === 0;
              return (
                <button
                  key={cand.id}
                  onClick={() => onSelectOrientation(idx)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  <span>{cand.name.split(' (')[0]}</span>
                  {isBest && (
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      Top Pick
                    </span>
                  )}
                  <span
                    className={`font-mono text-[10px] px-1 rounded ${
                      isSelected ? 'bg-cyan-600/50 text-white' : 'text-slate-400'
                    }`}
                  >
                    {cand.overallScore} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Tool Bar */}
      <div className="bg-slate-950/95 border-t border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Camera Views */}
        <div className="flex items-center gap-1">
          <button
            onClick={resetCamera}
            title="Reset Isometric View"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={setCameraTop}
            title="Top View (Z build axis)"
            className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors font-mono text-[11px]"
          >
            Top
          </button>
          <button
            onClick={setCameraFront}
            title="Front View"
            className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors font-mono text-[11px]"
          >
            Front
          </button>
          <button
            onClick={setCameraSide}
            title="Side View"
            className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors font-mono text-[11px]"
          >
            Right
          </button>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showWireframe
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Wireframe
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showDimensions
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Bounds
          </button>
          <button
            onClick={() => setShowAxes(!showAxes)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showAxes
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Axes
          </button>
        </div>
      </div>
    </div>
  );
};
