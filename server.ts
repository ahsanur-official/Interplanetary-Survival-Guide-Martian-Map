import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MarsWay API' });
  });

  // Ask MarsWay AI Assistant Endpoint
  app.post('/api/ask-marsway', async (req, res) => {
    try {
      const { query, context } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      const client = getAIClient();
      if (!client) {
        // Graceful response if API key is not yet configured
        res.json({
          source: 'local-knowledge',
          answer: `[AI Studio Gemini key not configured in environment; utilizing MarsWay built-in spatial planetary intelligence dataset]. For: "${query}", explore the interactive map, mission layers, and location telemetry.`,
          action: null,
        });
        return;
      }

      const systemPrompt = `You are "Ask MarsWay", the intelligent AI spatial assistant for MarsWay (an interactive Mars exploration, mapping, and mission intelligence platform).
Your role is to assist scientists, students, and space explorers with scientifically grounded information regarding Mars topography, NASA/ESA/ISRO/CNSA missions, planetary science, and future human exploration scenarios.

CRITICAL RULES:
1. NEVER fabricate scientific data, temperatures, or coordinates. Reference authoritative datasets (NASA Planetary Data System, MGS MOLA, Odyssey THEMIS, MRO HiRISE/SHARAD/CRISM, MSL REMS, Mars 2020 MEDA).
2. Clearly distinguish between Observed Data, Derived Models, and Hypothetical Human Mission Planning.
3. If the user's query asks to see, locate, fly to, or examine a specific crater, volcano, rover, landing site, or feature, produce a JSON object with:
   - "answer": concise, scientifically accurate explanation (2-4 sentences) with data source attribution.
   - "action": an action object if applicable, or null.
     Action types:
     - { "type": "fly_to", "lat": number, "lng": number, "zoom": number, "name": string, "featureId": string }
     - { "type": "select_mission", "missionId": string, "name": string }
     - { "type": "toggle_layer", "layerId": "viking" | "mola" | "themis" | "opm" | "geology" | "water_ice" | "human_zones" }
     - { "type": "compare", "site1Id": string, "site2Id": string }
     - { "type": "human_mode" }
4. Respond in valid JSON only with structure:
   {
     "answer": "string",
     "action": { ... } | null
   }`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nCurrent Map Context: ${JSON.stringify(context || {})}\n\nUser Question: ${query}\n\nRespond with strict JSON only.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { answer: responseText, action: null };
      }

      res.json({
        source: 'gemini-2.5-flash',
        ...parsed,
      });
    } catch (err: any) {
      console.error('Gemini API query error:', err);
      res.status(500).json({
        error: 'AI query processing failure',
        details: err?.message || 'Unknown error',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MarsWay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
