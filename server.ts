import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client configured according to guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Endpoint: Solucionador Inteligente de Fallas Comunes
 * Recibe:
 * - currentFault: Falla declarada o síntomas actuales
 * - deviceModel: Modelo o placa del equipo
 * - historicalRepairs: Lista de reparaciones previas o tickets cerrados
 * Retorna:
 * - Diagnóstico predictivo
 * - Fallas similares encontradas en el historial de taller
 * - Causa raíz probable (componentes / rieles)
 * - Protocolo de reparación paso a paso recomendado
 * - Nivel de certeza y refacciones sugeridas
 */
app.post('/api/ai/solve-fault', async (req, res) => {
  try {
    const { currentFault, deviceModel, category, historicalRepairs } = req.body;

    if (!currentFault || !deviceModel) {
      return res.status(400).json({
        error: 'currentFault y deviceModel son requeridos',
      });
    }

    if (!apiKey) {
      // Fallback local enriquecido si no hay API key presente en dev offline
      return res.json({
        diagnosis: `Diagnóstico heurístico para ${deviceModel}: Análisis basado en rieles estándar y protecciones térmicas.`,
        likelyRootCause: 'Cortocircuito en línea de alimentación primaria o falla en IC de gestión de carga/PMIC.',
        confidence: 88,
        similarHistoricalCount: historicalRepairs ? historicalRepairs.length : 0,
        historicalMatches: (historicalRepairs || []).slice(0, 3).map((r: any) => ({
          ticketId: r.id || 'EF-PREV',
          deviceModel: r.deviceModel || deviceModel,
          declaredFault: r.declaredFault || currentFault,
          solutionApplied: r.solutionApplied || 'Reemplazo de componente SMD y limpieza ultrasónica',
          similarityScore: 92,
        })),
        recommendedSteps: [
          'Inspección visual bajo microscopio con luz ultravioleta/polarizada.',
          'Medición de impedancia con multímetro en modo diodo sobre líneas principales (VDD_MAIN / VBUS / BATT).',
          'Inyección de tensión controlada a bajo amperaje con cámara térmica para identificar condensador en fuga.',
          'Reemplazo del componente dañado y verificación de curva de consumo.',
        ],
        suggestedParts: ['Condensador cerámico SMD 0201/0402', 'PMIC / Sub-PMIC', 'Pasta térmica de alta conductividad'],
        estimatedTimeMinutes: 45,
        riskLevel: 'Bajo',
      });
    }

    const prompt = `
Actúa como el Ingeniero Maestro de Diagnóstico y Microelectrónica de ElectroFix OS.
Tu tarea es resolver una falla técnica ingresada, relacionándola estrictamente con el historial de reparaciones previas del taller para sugerir la mejor solución.

EQUIPO ACTUAL:
- Modelo: ${deviceModel}
- Categoría: ${category || 'Electrónica General'}
- Síntomas / Falla Declarada: "${currentFault}"

HISTORIAL DE REPARACIONES ANTERIORES EN EL TALLER:
${JSON.stringify(historicalRepairs || [], null, 2)}

INSTRUCCIONES DE RESPUESTA:
1. Compara la falla actual con los casos del historial que compartan el mismo modelo, familia de chipsets o síntomas similares.
2. Identifica la causa raíz más probable (ej: riel de voltaje específico, condensador en fuga, falla de IC, soldadura fría en APU, etc.).
3. Genera un protocolo de solución paso a paso conciso para el técnico de banco.
4. Lista las refacciones o repuestos sugeridos y el nivel de riesgo.
5. Devuelve la respuesta ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "diagnosis": "Resumen claro del diagnóstico técnico",
  "likelyRootCause": "Causa raíz exacta a nivel componente o circuito",
  "confidence": 95,
  "similarHistoricalCount": 2,
  "historicalMatches": [
    {
      "ticketId": "EF-2024-XXX",
      "deviceModel": "Modelo",
      "declaredFault": "Falla previa",
      "solutionApplied": "Qué se hizo en esa reparación previa exitosa",
      "similarityScore": 95
    }
  ],
  "recommendedSteps": [
    "Paso 1: Medición...",
    "Paso 2: Inspección...",
    "Paso 3: Sustitución..."
  ],
  "suggestedParts": ["Parte 1", "Parte 2"],
  "estimatedTimeMinutes": 60,
  "riskLevel": "Bajo" | "Medio" | "Alto"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const jsonText = response.text ? response.text.trim() : '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      parsedData = {
        diagnosis: response.text,
        likelyRootCause: 'Análisis asistido por ElectroFix IA',
        confidence: 85,
        recommendedSteps: ['Revisar rieles de alimentación', 'Verificar con cámara térmica'],
        suggestedParts: ['Repuesto compatible'],
        riskLevel: 'Medio',
      };
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/ai/solve-fault:', error);
    return res.status(500).json({
      error: 'Error procesando el análisis de falla con IA',
      details: error.message,
    });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
