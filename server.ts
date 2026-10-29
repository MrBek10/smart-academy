import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEPRECATED_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash-thinking',
];

function sanitizeModel(model?: string): string {
  if (!model || DEPRECATED_MODELS.includes(model)) {
    return 'gemini-3.8-flash';
  }
  return model;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const server = http.createServer(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
      time: new Date().toISOString(),
    });
  });

  // 1. Multi-turn AI Assistant Q&A Endpoint
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          text: null,
        });
      }

      const { prompt, context, history, settings } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const model = sanitizeModel(settings?.model);
      const historyList = Array.isArray(history) ? history : [];
      const memoryLimit = typeof settings?.memoryLimit === 'number' ? settings.memoryLimit : 20;
      const limitedHistory = historyList.slice(-memoryLimit);

      const conversationText = limitedHistory
        .map((h: any) => `${h.role === 'user' ? 'Foydalanuvchi' : 'AI Yordamchi'}: ${h.text}`)
        .join('\n\n');

      let fullPrompt = prompt;
      if (conversationText.trim().length > 0) {
        fullPrompt = `[Oldingi suhbat tarixi]:\n${conversationText}\n\n${
          context ? `[Qo'shimcha dars konteksti]:\n${context}\n\n` : ''
        }[Joriy savol]:\n${prompt}`;
      } else if (context) {
        fullPrompt = `[Dars konteksti]:\n${context}\n\n[O'quvchi savoli]:\n${prompt}`;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
          systemInstruction:
            settings?.systemInstruction ||
            `Siz "Smart Academy" o'quv va IT dasturlash akademiyasi platformasining bosh sun'iy intellekt repetitori va mentorisiz.
O'zbek tilida aniq, ravon va pedagogik mezonlar asosida javob bering.`,
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.5,
        },
      });

      return res.json({ text: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/gemini/assistant:', error);
      return res.status(500).json({
        error: error?.message || 'Server error generating assistant response',
        text: null,
      });
    }
  });

  // 2. Streaming AI Assistant Endpoint (Server-Sent Events)
  app.post('/api/gemini/assistant/stream', async (req, res) => {
    try {
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const { prompt, context, history, settings } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const model = sanitizeModel(settings?.model);
      const historyList = Array.isArray(history) ? history : [];
      const memoryLimit = typeof settings?.memoryLimit === 'number' ? settings.memoryLimit : 20;
      const limitedHistory = historyList.slice(-memoryLimit);

      const conversationText = limitedHistory
        .map((h: any) => `${h.role === 'user' ? 'Foydalanuvchi' : 'AI Yordamchi'}: ${h.text}`)
        .join('\n\n');

      let fullPrompt = prompt;
      if (conversationText.trim().length > 0) {
        fullPrompt = `[Oldingi suhbat tarixi]:\n${conversationText}\n\n${
          context ? `[Qo'shimcha dars konteksti]:\n${context}\n\n` : ''
        }[Joriy savol]:\n${prompt}`;
      } else if (context) {
        fullPrompt = `[Dars konteksti]:\n${context}\n\n[O'quvchi savoli]:\n${prompt}`;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ai.models.generateContentStream({
        model: model,
        contents: fullPrompt,
        config: {
          systemInstruction: settings?.systemInstruction,
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.5,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Error in /api/gemini/assistant/stream:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error?.message || 'Streaming error' });
      }
      res.end();
    }
  });

  // 3. AI Code Mentor (Bugs, Clean Code, Hints, Q&A)
  app.post('/api/gemini/code-mentor', async (req, res) => {
    try {
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          text: null,
        });
      }

      const { action, code, language, errorOutput, task, question } = req.body;
      const lang = language || 'Python';

      let prompt = '';
      let systemInstruction = `Siz professional IT dasturlash mentori va katta dasturchisiz (Senior Engineer). 
O'quvchining dasturiy savollariga o'zbek tilida samimiy, dalillar bilan, Clean Code tamoyillariga tayangan holda javob bering.`;
      let temperature = 0.3;

      if (action === 'bug') {
        prompt = `Men ${lang} dasturlash tilida quyidagi kodni yozdim:
\`\`\`${lang}
${code || ''}
\`\`\`

${errorOutput ? `Konsol/Kompilyator xatosi:\n${errorOutput}\n` : ''}

Iltimos, ushbu kodda qanday xatolik borligini o'zbek tilida sodda, tushunarli qilib tushuntirib bering va to'g'rilangan to'liq kod variantini taqdim eting.`;
      } else if (action === 'clean') {
        prompt = `Quyidagi ${lang} kodini Clean Code (toza kod), samaradorlik va eng yaxshi amaliyotlar (Best Practices) bo'yicha tahlil qiling:
\`\`\`${lang}
${code || ''}
\`\`\`

1. Kodni qanday optimallashtirish mumkin?
2. O'qilishi va tezligini qanday oshirish mumkin?
3. Toza va zamonaviy ${lang} sintaksisidagi varianti qanday bo'ladi?`;
        temperature = 0.4;
      } else if (action === 'hint') {
        prompt = `Topshiriq: "${task || ''}"
Foydalanuvchi yozgan hozirgi ${lang} kodi:
\`\`\`${lang}
${code || ''}
\`\`\`

Iltimos, to'liq yechimni berib qo'ymasdan, foydalanuvchiga to'g'ri yo'lni topishga yordam beradigan 1-2 ta yo'naltiruvchi maslahat (hint) bering.`;
        temperature = 0.4;
      } else {
        // Custom question
        prompt = `Foydalanuvchi ${lang} darsi yuzasidan savol berdi:
Savol: "${question || ''}"
Joriy kod:
\`\`\`${lang}
${code || ''}
\`\`\`
Iltimos, o'zbek tilida aniq va tushunarli javob bering.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });

      return res.json({ text: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/gemini/code-mentor:', error);
      return res.status(500).json({
        error: error?.message || 'Error communicating with code mentor',
        text: null,
      });
    }
  });

  // 4. Code Execution Virtual Sandbox Endpoint
  app.post('/api/gemini/execute', async (req, res) => {
    const startTime = Date.now();
    try {
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const { code, language, stdin } = req.body;
      const lang = language || 'code';

      const prompt = `Siz ${lang} tili uchun aniq, virtual kod ijrochisiz (Execution Sandbox Engine).
Berilgan kodni kompilyatsiya va ijro qiling va FAQAT dastur standart chiqishi (stdout) yoki xatolik bo'lsa (stderr) ni qaytaring. 
Hech qanday tushuntirish, markdown bezaklar qo'shmang — faqat terminalga chiqadigan sof matnni bering.

KOD:
\`\`\`${lang}
${code}
\`\`\`
${stdin ? `STDIN KIRUVCHI MA'LUMOT:\n${stdin}` : ''}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });

      const timeMs = Date.now() - startTime;
      return res.json({
        stdout: response.text || '',
        timeMs,
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/execute:', error);
      return res.status(500).json({
        error: error?.message || 'Error executing code via virtual sandbox',
        timeMs: Date.now() - startTime,
      });
    }
  });

  // 5. General Gemini generateContent Endpoint (for AI Position Analysis, etc.)
  app.post('/api/gemini/generateContent', async (req, res) => {
    try {
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const { contents, model: requestedModel, config } = req.body;
      const model = sanitizeModel(requestedModel);

      let formattedContents: any = contents;
      if (Array.isArray(contents) && contents.length > 0 && contents[0].parts) {
        formattedContents = contents.map((c: any) => ({
          role: c.role || 'user',
          parts: c.parts.map((p: any) => (typeof p === 'string' ? { text: p } : p)),
        }));
      }

      const response = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: config || {},
      });

      return res.json({
        candidates: [
          {
            content: {
              parts: [{ text: response.text || '' }],
            },
          },
        ],
        text: response.text || '',
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/generateContent:', error);
      return res.status(500).json({
        error: error?.message || 'Error generating content via Gemini',
      });
    }
  });

  // 5. Live API WebSocket bridge (on /api/live)
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      clientWs.send(JSON.stringify({ error: 'Server does not have GEMINI_API_KEY configured' }));
      clientWs.close();
      return;
    }

    try {
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "Siz 'Smart Academy' platformasining jonli audio o'quv repetitorisiz.",
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (err) {
          console.error('Error handling live client message:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {
          /* ignore */
        }
      });
    } catch (err: any) {
      console.error('Live API connection error:', err);
      clientWs.send(JSON.stringify({ error: err?.message || 'Failed to start Live session' }));
      clientWs.close();
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Academy] Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
