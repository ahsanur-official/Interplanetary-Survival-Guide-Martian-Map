import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Authoritative Gazetteer of Certified Martian Coordinates (NASA PDS / MGS MOLA / USGS Astrogeology)
// Longitudes in standard GIS format [-180, 180]
const CANONICAL_MARS_LOCATIONS: Record<string, { lat: number; lng: number; zoom: number; elevationM: number; name: string }> = {
  'olympus mons': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'olympus': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'অলিম্পাস': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'অলিম্পাস মনস': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'jezero crater': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'jezero': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'জেজেরো': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'জেজেরো ক্রেটার': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'perseverance': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Perseverance Rover (Jezero Crater)' },
  'ingenuity': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Ingenuity Helicopter (Jezero Crater)' },
  'gale crater': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'gale': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'গেল': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'গেল ক্রেটার': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'curiosity': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Curiosity Rover (Gale Crater)' },
  'mount sharp': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'aeolis mons': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'valles marineris': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'marineris': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'ভ্যালিস মেরিনারিস': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'grand canyon': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'elysium mons': { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  'elysium': { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  'arsia mons': { lat: -8.4, lng: -121.1, zoom: 5, elevationM: 17761, name: 'Arsia Mons' },
  'pavonis mons': { lat: 0.8, lng: -113.4, zoom: 5, elevationM: 14058, name: 'Pavonis Mons' },
  'ascraeus mons': { lat: 11.9, lng: -104.5, zoom: 5, elevationM: 18225, name: 'Ascraeus Mons' },
  'hellas planitia': { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  'hellas': { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  'utopia planitia': { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  'utopia': { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  'zhurong': { lat: 25.066, lng: 109.925, zoom: 7, elevationM: -4000, name: 'Zhurong Rover (Utopia Planitia)' },
  'meridiani planum': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  'meridiani': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  'opportunity': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Opportunity Rover (Meridiani Planum)' },
  'gusev crater': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  'gusev': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  'spirit': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Spirit Rover (Gusev Crater)' },
  'chryse planitia': { lat: 22.48, lng: -47.97, zoom: 6, elevationM: -3627, name: 'Chryse Planitia' },
  'viking 1': { lat: 22.48, lng: -47.97, zoom: 7, elevationM: -3627, name: 'Viking 1 Lander (Chryse Planitia)' },
  'viking 2': { lat: 48.27, lng: 134.0, zoom: 7, elevationM: -4100, name: 'Viking 2 Lander (Utopia Planitia)' },
  'pathfinder': { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  'sojourner': { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  'phoenix': { lat: 68.22, lng: -125.7, zoom: 7, elevationM: -4150, name: 'Phoenix Lander (Green Valley)' },
  'insight': { lat: 4.502, lng: 135.623, zoom: 7, elevationM: -2600, name: 'InSight Lander (Elysium Planitia)' },
  'arcadia planitia': { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  'arcadia': { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  'cydonia': { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae (Face on Mars)' },
  'cydonia mensae': { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae' },
  'korolev': { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater (Water Ice)' },
  'korolev crater': { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater' },
  'planum boreum': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'north pole': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'উত্তর মেরু': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'planum australe': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'south pole': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'দক্ষিণ মেরু': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'alba mons': { lat: 40.5, lng: -109.9, zoom: 5, elevationM: 6770, name: 'Alba Mons' },
  'noctis labyrinthus': { lat: -7.0, lng: -101.2, zoom: 5, elevationM: 2000, name: 'Noctis Labyrinthus' },
  'kasei valles': { lat: 24.6, lng: -65.0, zoom: 5, elevationM: -3000, name: 'Kasei Valles' },
  'syrtis major': { lat: 8.4, lng: 69.5, zoom: 5, elevationM: 1000, name: 'Syrtis Major Planum' },
  'isidis planitia': { lat: 12.9, lng: 87.0, zoom: 5, elevationM: -3800, name: 'Isidis Planitia' },
  'schiaparelli': { lat: -2.7, lng: 16.7, zoom: 6, elevationM: -1500, name: 'Schiaparelli Crater' },
  'mawrth vallis': { lat: 23.99, lng: -18.96, zoom: 6, elevationM: -2240, name: 'Mawrth Vallis' },
  'oxia planum': { lat: 18.2, lng: -24.3, zoom: 6, elevationM: -3000, name: 'Oxia Planum' },
  'beagle 2': { lat: 11.53, lng: 90.43, zoom: 7, elevationM: -3800, name: 'Beagle 2 (Isidis Planitia)' },
};

function resolveCanonicalMarsLocation(queryOrName: string) {
  if (!queryOrName) return null;
  const q = queryOrName.toLowerCase().trim();
  if (CANONICAL_MARS_LOCATIONS[q]) {
    return CANONICAL_MARS_LOCATIONS[q];
  }
  for (const [key, loc] of Object.entries(CANONICAL_MARS_LOCATIONS)) {
    if (key.length >= 4 && (q.includes(key) || key.includes(q))) {
      return loc;
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'MarsWay API',
      liveModel: 'gemini-3.8-live',
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Ask MarsWay AI Assistant Endpoint (using gemini-3.8-flash)
  app.post('/api/ask-marsway', async (req, res) => {
    try {
      const { query, context } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      const client = getAIClient();
      if (!client) {
        const canonical = resolveCanonicalMarsLocation(query);
        res.json({
          source: 'local-knowledge',
          answer: canonical
            ? `MarsWay built-in spatial planetary dataset located: ${canonical.name} at coordinates (${canonical.lat.toFixed(2)}°, ${canonical.lng.toFixed(2)}°), elevation ${canonical.elevationM}m.`
            : `[AI Studio Gemini key not configured in environment; utilizing MarsWay built-in spatial planetary intelligence dataset]. For: "${query}", explore the interactive map, mission layers, and location telemetry.`,
          action: canonical
            ? {
                type: 'fly_to',
                lat: canonical.lat,
                lng: canonical.lng,
                zoom: canonical.zoom,
                name: canonical.name,
                elevationM: canonical.elevationM,
              }
            : null,
        });
        return;
      }

      const systemPrompt = `You are "Ask MarsWay", the intelligent AI spatial assistant for MarsWay (an interactive Mars exploration, mapping, and mission intelligence platform).
Your role is to assist scientists, students, and space explorers with scientifically grounded information regarding Mars topography, NASA/ESA/ISRO/CNSA missions, planetary science, and future human exploration scenarios.

CRITICAL RULES:
1. NEVER fabricate scientific data, temperatures, or coordinates. Reference authoritative datasets (NASA Planetary Data System, MGS MOLA, Odyssey THEMIS, MRO HiRISE/SHARAD/CRISM, MSL REMS, Mars 2020 MEDA).
2. Clearly distinguish between Observed Data, Derived Models, and Hypothetical Human Mission Planning.
3. CRITICAL LONGITUDE SPECIFICATION: All longitudes MUST be in standard GIS format between -180 and +180 degrees.
   Authoritative Reference Locations:
   - Olympus Mons: lat: 18.65, lng: -133.8, zoom: 5
   - Jezero Crater (Perseverance / Ingenuity): lat: 18.38, lng: 77.58, zoom: 7
   - Gale Crater (Curiosity): lat: -4.59, lng: 137.44, zoom: 7
   - Valles Marineris (Grand Canyon): lat: -13.9, lng: -59.2, zoom: 5
   - Elysium Mons: lat: 25.02, lng: 147.21, zoom: 5
   - Arsia Mons: lat: -8.4, lng: -121.1, zoom: 5
   - Pavonis Mons: lat: 0.8, lng: -113.4, zoom: 5
   - Ascraeus Mons: lat: 11.9, lng: -104.5, zoom: 5
   - Hellas Planitia (Basin): lat: -42.7, lng: 70.0, zoom: 4
   - Utopia Planitia (Zhurong Rover): lat: 25.066, lng: 109.925, zoom: 6
   - Meridiani Planum (Opportunity): lat: -1.95, lng: -5.53, zoom: 7
   - Gusev Crater (Spirit): lat: -14.57, lng: 175.47, zoom: 7
   - Chryse Planitia (Viking 1): lat: 22.48, lng: -47.97, zoom: 6
   - Arcadia Planitia (Human Landing Candidate): lat: 39.2, lng: -170.3, zoom: 5
   - Cydonia Mensae: lat: 40.74, lng: -9.46, zoom: 6
   - Korolev Crater: lat: 73.0, lng: 165.0, zoom: 5
   - Planum Boreum (North Polar Cap): lat: 85.0, lng: 0.0, zoom: 4
   - Planum Australe (South Polar Cap): lat: -85.0, lng: 0.0, zoom: 4
4. If the user's query asks to see, locate, fly to, or examine a specific crater, volcano, rover, landing site, or feature, produce a JSON object with:
   - "answer": concise, scientifically accurate explanation (2-4 sentences) with data source attribution.
   - "action": an action object if applicable, or null.
     Action types:
     - { "type": "fly_to", "lat": number, "lng": number, "zoom": number, "name": string, "featureId": string }
     - { "type": "select_mission", "missionId": string, "name": string }
     - { "type": "toggle_layer", "layerId": "viking" | "mola" | "themis" | "opm" }
     - { "type": "compare", "site1Id": string, "site2Id": string }
     - { "type": "human_mode" }
5. Respond in valid JSON only with structure:
   {
     "answer": "string",
     "action": { ... } | null
   }`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
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
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { answer: responseText, action: null };
      }

      // Canonical snapping & auto-detection: Guarantee 100% accurate coordinates for all Martian targets
      const canonicalFromQuery = resolveCanonicalMarsLocation(query);
      if (parsed.action && parsed.action.type === 'fly_to') {
        const canonical = resolveCanonicalMarsLocation(parsed.action.name) || canonicalFromQuery;
        if (canonical) {
          parsed.action.lat = canonical.lat;
          parsed.action.lng = canonical.lng;
          parsed.action.zoom = canonical.zoom;
          parsed.action.name = canonical.name;
          parsed.action.elevationM = canonical.elevationM;
        }
      } else if (!parsed.action && canonicalFromQuery) {
        // User asked for a location or rover in any language, auto-attach certified fly_to action
        parsed.action = {
          type: 'fly_to',
          lat: canonicalFromQuery.lat,
          lng: canonicalFromQuery.lng,
          zoom: canonicalFromQuery.zoom,
          name: canonicalFromQuery.name,
          elevationM: canonicalFromQuery.elevationM,
        };
      }

      res.json({
        source: 'gemini-3.8-flash',
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

  // Create HTTP server to attach both Express and WebSocketServer
  const server = http.createServer(app);

  // Attach WebSocketServer for Gemini Live (gemini-3.8-live) Real-Time Audio Streaming
  const wss = new WebSocketServer({ server, path: '/api/live-ws' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message:
            'GEMINI_API_KEY is not configured in the AI Studio environment. Please configure it in Settings > Secrets to enable Live Voice Conversations.',
        })
      );
      clientWs.close();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const voiceName = url.searchParams.get('voice') || 'Zephyr';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let session: any = null;
    let isClosed = false;

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch {
          // ignore close errors
        }
        session = null;
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', (err) => {
      console.error('Mars Live client WS error:', err);
      cleanup();
    });

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
          systemInstruction: `You are "MarsWay Live Flight Controller", an AI planetary scientist and exploration mission guide for the MarsWay interactive Mars platform.
You are in real-time, low-latency, two-way voice communication with an astronaut or planetary scientist exploring Mars.
Guidelines for spoken speech:
1. Speak naturally, conversationally, concisely, and clearly in 1 to 3 spoken sentences. Avoid long monologues.
2. Ground all answers in authentic scientific datasets (NASA Planetary Data System, MGS MOLA elevation, Odyssey THEMIS thermal infrared, MRO HiRISE imagery, Mars 2020 Perseverance and MSL Curiosity findings).
3. Distinguish between actual observational facts and future human exploration scenarios.
4. When asked to look at, fly to, or examine a specific landmark, crater, volcano, canyon, or landing site, invoke the tool "flyToLocation".
5. When asked about a robotic rover or lander, invoke "selectMission".
6. When asked about elevation, topography, or infrared, invoke "toggleLayer" with "mola" or "themis".
Keep your tone adventurous, composed, scientific, and encouraging.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'flyToLocation',
                  description:
                    'Fly the interactive Mars camera to a landmark, crater, volcano, canyon, or landing site',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: 'Name of the crater, mountain, or feature on Mars',
                      },
                      lat: {
                        type: Type.NUMBER,
                        description: 'Latitude in decimal degrees (-90 to +90)',
                      },
                      lng: {
                        type: Type.NUMBER,
                        description: 'Longitude in decimal degrees (0 to 360 or -180 to +180)',
                      },
                      zoom: {
                        type: Type.NUMBER,
                        description: 'Camera zoom level (typically 4 to 8)',
                      },
                    },
                    required: ['name', 'lat', 'lng'],
                  },
                },
                {
                  name: 'selectMission',
                  description: 'Open details and rover traverse for a Mars surface mission',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      missionId: {
                        type: Type.STRING,
                        description:
                          'Mission identifier (perseverance, curiosity, opportunity, spirit, zhurong, viking1, etc.)',
                      },
                      name: {
                        type: Type.STRING,
                        description: 'Name of the mission',
                      },
                    },
                    required: ['missionId'],
                  },
                },
                {
                  name: 'toggleLayer',
                  description: 'Switch active global GIS raster layer on Mars',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      layerId: {
                        type: Type.STRING,
                        description: 'Layer ID: viking, mola, themis, or opm',
                      },
                    },
                    required: ['layerId'],
                  },
                },
              ],
            },
          ],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Model audio and text
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript_model',
                      text: part.text,
                    })
                  );
                }
              }
            }

            // User speech transcription
            const userText = (message.serverContent as any)?.inputAudioTranscription?.text;
            if (userText) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript_user',
                  text: userText,
                })
              );
            }

            // User interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // Model turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }

            // Tool calls
            const toolCall = (message as any).toolCall;
            if (toolCall) {
              if (toolCall.functionCalls) {
                for (const fc of toolCall.functionCalls) {
                  if (fc.name === 'flyToLocation' && fc.args) {
                    const canonical = resolveCanonicalMarsLocation(fc.args.name);
                    if (canonical) {
                      fc.args.lat = canonical.lat;
                      fc.args.lng = canonical.lng;
                      fc.args.zoom = canonical.zoom;
                      fc.args.name = canonical.name;
                    }
                  }
                }
              }

              clientWs.send(
                JSON.stringify({
                  type: 'tool_call',
                  toolCall,
                })
              );

              // Acknowledge function call to allow generation to proceed
              try {
                const functionResponses = (toolCall.functionCalls || []).map((fc: any) => ({
                  response: { output: { status: 'executed', function: fc.name } },
                  id: fc.id,
                }));
                session.sendToolResponse({ functionResponses });
              } catch (fcErr) {
                console.error('Failed to send tool response to Live API:', fcErr);
              }
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message: err?.message || 'Live API connection error',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'session_ready',
            model: 'gemini-3.8-live',
            voice: voiceName,
            sampleRate: 24000,
          })
        );
      }

      clientWs.on('message', (raw) => {
        if (!session) return;
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'audio' && msg.audio) {
            session.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (msg.type === 'text' && msg.text) {
            session.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: msg.text }],
                },
              ],
              turnComplete: true,
            });
          }
        } catch (e) {
          console.error('Error handling client message:', e);
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize gemini-3.8-live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: `Failed to initialize gemini-3.8-live session: ${err?.message || 'Unknown error'}`,
          })
        );
        clientWs.close();
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MarsWay Server & Gemini Live WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
