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
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { answer: responseText, action: null };
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
