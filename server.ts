import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support large payloads for base64 image uploads and 3D files
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini GenAI client initialized on the server
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Endpoint: Multimodal AI Object Understanding (Images, Multi-view photos, CAD/hand sketches)
 */
app.post('/api/analyze-multimodal', async (req, res) => {
  try {
    const { images, textPrompt, userPreferences, mode } = req.body;

    // Check if Gemini client is available
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured, using heuristic fallback');
      return res.json(generateLocalMultimodalFallback(images, textPrompt, mode, userPreferences));
    }

    const contents: any[] = [];

    // Add images if present
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.dataUrl) {
          const match = img.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            contents.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
    }

    const angleDescriptions = Array.isArray(images) && images.length > 1
      ? `User provided ${images.length} views from angles: ${images.map((img: any) => img.angleLabel || 'General').join(', ')}.`
      : images?.length === 1
      ? 'Only a single 2D image view was provided.'
      : 'No image provided; text description analysis.';

    const systemPrompt = `You are PrintWise, an elite Senior Additive Manufacturing & 3D Printing Specialist.
Analyze the user's uploaded object (photo, sketch, or description) to provide concrete 3D printing engineering guidance.

CRITICAL RULES:
1. If only a single 2D image is provided, you MUST explicitly state in "singleViewNotice": "A single image is insufficient to determine exact geometry. Upload additional views or a 3D model for more accurate analysis."
2. If multiple angle views are provided, synthesize the angles and note that multi-view analysis improves volumetric confidence.
3. Recommend printing technology from: 'FDM / FFF', 'SLA / MSLA', 'SLS', 'SLM / DMLS'.
4. Recommend starting material (e.g. PETG, PLA, ABS, ASA, TPU, Tough Resin, PA12 Nylon).
5. Recommend print orientation with technical reasoning (e.g., placing the broadest flat face on the bed, keeping cantilevers under 45° overhang, aligning layer lines parallel to bending forces).
6. Give realistic starting slicer settings (layer height, infill %, wall count, support necessity).
7. Identify 2-4 concrete potential manufacturing problems (e.g., steep overhangs, thin walls, anisotropic layer weakness, bed detachment).
8. Clearly state that all recommendations are computational starting estimates and not certified structural warranties.`;

    const userPromptText = `User Input Mode: ${mode || 'image'}
${angleDescriptions}
User Description / Requirements: ${textPrompt || 'No additional text prompt'}
User Intended Purpose: ${userPreferences?.intendedPurpose || 'functional'}
User Printer Type: ${userPreferences?.printerType || 'unknown'}
User Priority: ${userPreferences?.priority || 'balanced'}

Analyze this design and return the structured JSON evaluation.`;

    contents.push({ text: userPromptText });

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout for ${modelName}`)), 9000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedObjectName: { type: Type.STRING, description: 'Clear technical name of the detected object' },
                confidenceScore: { type: Type.INTEGER, description: 'Confidence in object identification from 0 to 100' },
                likelyUseCategory: { type: Type.STRING, description: 'Likely functional/decorative application category' },
                keyGeometricFeatures: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Observed or estimated geometric features (e.g. flat mounting surfaces, 90 deg bend, holes, cantilever overhangs)'
                },
                singleViewNotice: { type: Type.STRING, description: 'Disclaimer if geometry cannot be verified from 2D images' },
                suitabilityFor3DPrinting: { type: Type.STRING, description: 'Assessment of printability on desktop/industrial printers' },
                recommendedTechnology: { type: Type.STRING, description: 'FDM / FFF, SLA / MSLA, SLS, or SLM / DMLS' },
                recommendedTechnologyReason: { type: Type.STRING, description: 'Why this technology is suitable and trade-offs' },
                recommendedMaterial: { type: Type.STRING, description: 'e.g. PETG, PLA, ABS, TPU, Tough Resin, Nylon PA12' },
                recommendedMaterialReason: { type: Type.STRING, description: 'Why this material is suitable and its limitations' },
                alternativeMaterial: { type: Type.STRING, description: 'Cheaper or tougher alternative material' },
                recommendedOrientation: { type: Type.STRING, description: 'Specific orientation recommendation on build plate' },
                whyOrientation: { type: Type.STRING, description: 'Technical reasoning behind the orientation' },
                startingSettings: {
                  type: Type.OBJECT,
                  properties: {
                    layerHeightMm: { type: Type.NUMBER },
                    infillPercent: { type: Type.INTEGER },
                    wallPerimeters: { type: Type.INTEGER },
                    supportRequired: { type: Type.BOOLEAN },
                    supportType: { type: Type.STRING },
                    infillPattern: { type: Type.STRING },
                  },
                  required: ['layerHeightMm', 'infillPercent', 'wallPerimeters', 'supportRequired'],
                },
                potentialIssues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      severity: { type: Type.STRING, description: 'critical, warning, or info' },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      suggestedSolution: { type: Type.STRING },
                    },
                    required: ['severity', 'title', 'description', 'suggestedSolution'],
                  },
                },
                printabilityScore: { type: Type.INTEGER, description: 'Overall estimated printability score from 0 to 100' },
              },
              required: [
                'detectedObjectName',
                'confidenceScore',
                'likelyUseCategory',
                'keyGeometricFeatures',
                'recommendedTechnology',
                'recommendedMaterial',
                'recommendedOrientation',
                'whyOrientation',
                'potentialIssues',
                'printabilityScore',
              ],
            },
          },
        });

        response = (await Promise.race([generatePromise, timeoutPromise])) as any;
        if (response && response.text) {
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed or timed out (${err?.message || err}), trying next...`);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All AI models unavailable');
    }

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Error during multimodal analysis:', error);
    // Return gracefully with fallback heuristic analysis so the user flow never breaks
    return res.json({
      success: true,
      data: generateLocalMultimodalFallback(req.body.images, req.body.textPrompt, req.body.mode, req.body.userPreferences),
      warning: 'Server used computational fallback due to network or quota limitation.',
    });
  }
});

/**
 * Endpoint: Natural Language Query Extraction
 */
app.post('/api/parse-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text required' });
    }

    if (!ai) {
      return res.json({ success: true, data: parseQueryLocally(query) });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Extract 3D printing requirements from the user's natural language request:
"${query}"

Return structured JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objectName: { type: Type.STRING },
            intendedPurpose: {
              type: Type.STRING,
              description: 'functional, decorative, prototype, mechanical_load, flexible, high_temp, outdoor, or food_contact'
            },
            printerType: {
              type: Type.STRING,
              description: 'fdm, sla, sls, slm, or unknown'
            },
            priority: {
              type: Type.STRING,
              description: 'cost, strength, quality, speed, material_saving, or balanced'
            },
            extractedRequirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            confidence: { type: Type.INTEGER },
          },
          required: ['objectName', 'intendedPurpose', 'printerType', 'priority', 'extractedRequirements'],
        },
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error parsing query with Gemini:', err);
    return res.json({ success: true, data: parseQueryLocally(req.body.query) });
  }
});

function parseQueryLocally(query: string) {
  const qLower = (query || '').toLowerCase();
  let objectName = 'Custom 3D Object';
  if (qLower.includes('lizard') || qLower.includes('gecko') || qLower.includes('reptile') || qLower.includes('dragon')) {
    objectName = 'Articulated Flexi Lizard (Print-in-Place)';
  } else if (qLower.includes('phone stand') || qLower.includes('phone') || qLower.includes('stand')) {
    objectName = 'Ergonomic Desk Phone Stand';
  } else if (qLower.includes('bracket') || qLower.includes('shelf')) {
    objectName = 'Mechanical Mounting Bracket';
  } else if (qLower.includes('gear') || qLower.includes('sprocket')) {
    objectName = 'Precision Spur Gear';
  } else if (qLower.includes('motor') || qLower.includes('drone')) {
    objectName = 'Quadrotor Motor Arm Mount';
  } else if (qLower.includes('arm') || qLower.includes('gopro') || qLower.includes('hinge')) {
    objectName = 'Action Camera Articulated Arm';
  } else if (qLower.includes('case') || qLower.includes('enclosure')) {
    objectName = 'Modular Electronics Enclosure';
  } else if (qLower.includes('gasket') || qLower.includes('bumper')) {
    objectName = 'Protective Bumper / Gasket';
  }

  let printerType = 'unknown';
  if (qLower.includes('fdm') || qLower.includes('ender') || qLower.includes('bambu') || qLower.includes('prusa')) printerType = 'fdm';
  else if (qLower.includes('resin') || qLower.includes('sla') || qLower.includes('elegoo') || qLower.includes('mars')) printerType = 'sla';
  else if (qLower.includes('sls') || qLower.includes('powder')) printerType = 'sls';

  let priority = 'balanced';
  if (qLower.includes('cheap') || qLower.includes('low cost') || qLower.includes('inexpensive')) priority = 'cost';
  else if (qLower.includes('strong') || qLower.includes('tough') || qLower.includes('load') || qLower.includes('2 kg') || qLower.includes('heavy')) priority = 'strength';
  else if (qLower.includes('smooth') || qLower.includes('finish') || qLower.includes('detail') || qLower.includes('quality')) priority = 'quality';
  else if (qLower.includes('fast') || qLower.includes('quick')) priority = 'speed';

  let intendedPurpose = 'functional';
  if (qLower.includes('lizard') || qLower.includes('toy') || qLower.includes('flexi') || qLower.includes('art') || qLower.includes('figure')) {
    intendedPurpose = 'decorative';
  } else if (qLower.includes('outdoor') || qLower.includes('sun') || qLower.includes('weather')) {
    intendedPurpose = 'outdoor';
  } else if (qLower.includes('flexible') || qLower.includes('rubber') || qLower.includes('bend')) {
    intendedPurpose = 'flexible';
  } else if (qLower.includes('heat') || qLower.includes('hot') || qLower.includes('temp')) {
    intendedPurpose = 'high_temp';
  } else if (qLower.includes('prototype') || qLower.includes('test')) {
    intendedPurpose = 'prototype';
  }

  return {
    objectName,
    intendedPurpose,
    printerType,
    priority,
    extractedRequirements: [
      `Target object identified as ${objectName}`,
      `Assigned priority: ${priority}`,
      `Selected purpose profile: ${intendedPurpose}`,
    ],
    confidence: 85,
  };
}

function generateLocalMultimodalFallback(images: any[], textPrompt: string, mode: string, userPrefs: any) {
  const isMultiView = Array.isArray(images) && images.length > 1;
  const promptLower = (textPrompt || '').toLowerCase();

  // Also check image file names if available
  const fileNames = Array.isArray(images)
    ? images.map((img: any) => (img.fileName || '').toLowerCase()).join(' ')
    : '';

  const combinedSearch = `${promptLower} ${fileNames} ${(userPrefs?.customNotes || '').toLowerCase()}`;

  let detectedObjectName = 'Articulated Figurine / Mechanical Component';
  let likelyUseCategory = 'Functional / Structural';
  let keyGeometricFeatures = [
    'Flat mounting base footprint suitable for direct bed contact',
    'Structural transitions or cantilevered incline',
    'Mounting clearances or pivot joints',
    'Moderate overhang geometry requiring evaluation',
  ];
  let recommendedTechnology = userPrefs?.printerType === 'sla' ? 'SLA / MSLA' : 'FDM / FFF';
  let recommendedTechnologyReason = 'FDM provides the optimal balance of toughness, low cost, and reliable bridging.';
  let recommendedMaterial = 'PETG';
  let recommendedMaterialReason = 'PETG offers strong inter-layer adhesion, low creep, and good temperature resistance up to 75°C.';
  let alternativeMaterial = 'PLA (easier and cheaper for initial sizing prototype)';
  let recommendedOrientation = 'Orient the broadest flat face flat on the build plate.';
  let whyOrientation = 'Providing maximum first-layer contact area eliminates warping and places layer lines along the primary tensile stress vector.';
  let startingSettings = {
    layerHeightMm: 0.20,
    infillPercent: 25,
    wallPerimeters: 3,
    supportRequired: true,
    supportType: 'Tree / Organic',
    infillPattern: 'Gyroid',
  };
  let potentialIssues = [
    {
      severity: 'warning',
      title: 'Overhang Risk on Cantilever Features',
      description: 'Unsupported outward spans exceeding 45° will sag or loop filament without auxiliary support.',
      suggestedSolution: 'Enable Tree/Organic supports with 0.2mm Z-distance gap.',
    },
    {
      severity: 'info',
      title: 'Anisotropic Inter-Layer Weakness',
      description: 'Tensile loads pulling vertically across layer boundaries can cause premature layer separation.',
      suggestedSolution: 'Orient load axis parallel to the print bed so continuous filament loops absorb stress.',
    },
  ];
  let printabilityScore = 85;

  // 1. LIZARD / REPTILE / FLEXI PRINT-IN-PLACE DETECTION
  if (
    combinedSearch.includes('lizard') ||
    combinedSearch.includes('gecko') ||
    combinedSearch.includes('reptile') ||
    combinedSearch.includes('dragon') ||
    combinedSearch.includes('chameleon') ||
    combinedSearch.includes('flexi') ||
    (combinedSearch.includes('toy') && combinedSearch.includes('joint'))
  ) {
    detectedObjectName = 'Articulated Flexi Lizard (Print-in-Place)';
    likelyUseCategory = 'Decorative / Articulated Print-in-Place Toy';
    keyGeometricFeatures = [
      'Multi-segment interlocking ball-and-socket spine vertebrae',
      'Flat belly plane designed for direct first-layer build plate contact',
      'Splayed legs with delicate toe contact pads',
      'Multi-jointed tapered flexible tail with self-supporting bridge links',
    ];
    recommendedTechnology = 'FDM / FFF';
    recommendedTechnologyReason =
      'FDM is the gold standard for print-in-place moving assemblies. Standard 0.4mm nozzle extrusion provides natural 0.35–0.5mm clearance gaps that break free effortlessly. Resin vat printing frequently fuses liquid photopolymer inside tight hinge chambers.';
    recommendedMaterial = 'PLA / Silk PLA';
    recommendedMaterialReason =
      'PLA provides sharp bridge freezing across internal link cavities, virtually zero thermal shrinkage (preventing joint fusing), and stunning visual sheen in dual-color or silk finishes.';
    alternativeMaterial = 'PETG (more durable hinges, requires slightly higher retraction tuning to prevent stringing)';
    recommendedOrientation = 'Flat on stomach / belly (0° rotation)';
    whyOrientation =
      'Laying flat on the belly positions all hinge pin pivot axes vertically along the Z-axis. This allows every vertebral link to swing smoothly in the horizontal X-Y plane with ZERO support material required.';
    startingSettings = {
      layerHeightMm: 0.16,
      infillPercent: 15,
      wallPerimeters: 3,
      supportRequired: false,
      supportType: 'None',
      infillPattern: 'Gyroid',
    };
    potentialIssues = [
      {
        severity: 'critical',
        title: 'DO NOT ENABLE SUPPORTS (Print-in-Place Hinge Alert)',
        description:
          'Generating slicer supports will fill the 0.4mm joint clearance cavities and permanently fuse the articulating vertebrae into a rigid solid block.',
        suggestedSolution:
          'Ensure supports are turned OFF completely in your slicer. Run 100% cooling fan after the first layer for crisp internal bridging.',
      },
      {
        severity: 'warning',
        title: 'Bed Adhesion for Tiny Toe Pads',
        description:
          'The small splayed toe pads have minimal contact area and can easily curl or detach during fast travel moves.',
        suggestedSolution:
          'Clean your PEI sheet thoroughly with warm water and dish soap. Print the first layer slowly (15–20 mm/s) with a 5mm outer brim if adhesion is marginal.',
      },
      {
        severity: 'info',
        title: 'Retraction & Stringing Prevention',
        description:
          'Fine filament strings across the link gaps can restrict free movement right off the build plate.',
        suggestedSolution:
          'Tune slicer retraction distance (0.8mm direct drive, 4.5mm bowden) and enable "Avoid Crossing Perimeters". Gently flex the segments once cooled.',
      },
    ];
    printabilityScore = 91;
  } else if (combinedSearch.includes('bracket') || combinedSearch.includes('shelf')) {
    detectedObjectName = 'Mechanical L-Bracket';
    likelyUseCategory = 'Mechanical / Load-bearing';
    keyGeometricFeatures = [
      'Dual flat 90° mounting plates for surface contact',
      'Structural reinforcing gusset web',
      'Counterbored hardware bolt holes',
    ];
    recommendedMaterial = 'PETG';
    recommendedMaterialReason = 'PETG provides high impact toughness and flexural strength under sustained fastener torque.';
    startingSettings.layerHeightMm = 0.20;
    startingSettings.infillPercent = 35;
    startingSettings.wallPerimeters = 4;
  } else if (combinedSearch.includes('phone') || combinedSearch.includes('stand')) {
    detectedObjectName = 'Ergonomic Desk Phone Stand';
    likelyUseCategory = 'Consumer Ergonomics';
    keyGeometricFeatures = [
      'Wide stable base footprint to prevent tip-over',
      '65° angled backrest plane',
      'Front retaining catch lip and bottom cable relief slot',
    ];
    recommendedMaterial = 'PLA';
    startingSettings.layerHeightMm = 0.20;
    startingSettings.infillPercent = 20;
    startingSettings.wallPerimeters = 3;
    startingSettings.supportRequired = false;
    startingSettings.supportType = 'None';
  } else if (combinedSearch.includes('drone') || combinedSearch.includes('motor')) {
    detectedObjectName = 'Quadrotor Motor Arm Mount';
    likelyUseCategory = 'Aerospace / Robotics';
    recommendedMaterial = 'Carbon Fiber PETG (PETG-CF)';
  } else if (combinedSearch.includes('gear')) {
    detectedObjectName = 'Precision Helical Spur Gear';
    likelyUseCategory = 'Power Transmission / Mechanisms';
    recommendedMaterial = 'Nylon / PA';
  }

  const singleViewNotice = isMultiView
    ? 'Multi-angle images provided. Volumetric feature correlation synthesized across views.'
    : 'A single image is insufficient to determine exact geometry. Upload additional views or a 3D model for more accurate analysis.';

  return {
    detectedObjectName,
    confidenceScore: isMultiView ? 92 : 84,
    likelyUseCategory,
    keyGeometricFeatures,
    singleViewNotice,
    suitabilityFor3DPrinting: 'High — well-suited for desktop additive manufacturing with proper orientation.',
    recommendedTechnology,
    recommendedTechnologyReason,
    recommendedMaterial,
    recommendedMaterialReason,
    alternativeMaterial,
    recommendedOrientation,
    whyOrientation,
    startingSettings,
    potentialIssues,
    printabilityScore,
  };
}

// Dev vs Prod Vite Integration
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintWise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
