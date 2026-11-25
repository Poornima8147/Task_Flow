import 'dotenv/config';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SUPABASE_URL = 'https://clxsjsheuxffzzhxychy.supabase.co';
const ALLOWED_PROXY_PREFIXES = ['/auth/v1', '/rest/v1'];
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'apikey',
  'authorization',
  'content-type',
  'prefer',
  'range',
  'x-client-info',
  'x-supabase-api-version',
];

function sanitizeSupabaseUrl(rawValue: string | undefined): string {
  if (!rawValue) return '';
  const firstToken = rawValue.trim().split(/\s+/)[0] || '';
  if (!firstToken) return '';
  try {
    const parsed = new URL(firstToken);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

function sanitizeSupabaseKey(rawValue: string | undefined): string {
  if (!rawValue) return '';
  return rawValue.trim().split(/\s+/)[0] || '';
}

function getSupabaseConfig() {
  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const rawKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl) || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = sanitizeSupabaseKey(rawKey);

  return {
    supabaseUrl,
    supabaseAnonKey,
    configured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}

async function startServer() {
  const app = express();
  const PORT =
    process.env.NODE_ENV === 'production'
      ? Number(process.env.PORT) || 3000
      : 3000;

  // Same-origin fallback proxy strictly pinned to the configured Supabase project origin
  // for /auth/v1/* and /rest/v1/* endpoints in case direct browser fetch is blocked.
  app.use(
    '/api/supabase',
    express.raw({type: '*/*', limit: '2mb'}),
    async (req, res) => {
      const {supabaseUrl} = getSupabaseConfig();
      const subPath = req.url || '/';

      const isAllowedPrefix = ALLOWED_PROXY_PREFIXES.some(
        (prefix) => subPath === prefix || subPath.startsWith(`${prefix}/`) || subPath.startsWith(`${prefix}?`),
      );
      if (!isAllowedPrefix || subPath.includes('..') || subPath.startsWith('//')) {
        res.status(403).json({error: 'Forbidden Supabase proxy path.'});
        return;
      }

      let targetUrl: URL;
      try {
        targetUrl = new URL(subPath, supabaseUrl);
        if (targetUrl.origin !== supabaseUrl) {
          res.status(403).json({error: 'Invalid proxy target origin.'});
          return;
        }
      } catch {
        res.status(400).json({error: 'Malformed proxy request path.'});
        return;
      }

      const forwardHeaders: Record<string, string> = {};
      for (const headerName of FORWARDED_REQUEST_HEADERS) {
        const value = req.headers[headerName];
        if (typeof value === 'string' && value.length > 0) {
          forwardHeaders[headerName] = value;
        }
      }

      const method = req.method.toUpperCase();
      const hasBody =
        method !== 'GET' &&
        method !== 'HEAD' &&
        Buffer.isBuffer(req.body) &&
        req.body.length > 0;

      try {
        const upstream = await fetch(targetUrl.toString(), {
          method,
          headers: forwardHeaders,
          body: hasBody ? new Uint8Array(req.body) : undefined,
        });

        const contentType = upstream.headers.get('content-type');
        const contentRange = upstream.headers.get('content-range');
        if (contentType) res.setHeader('Content-Type', contentType);
        if (contentRange) res.setHeader('Content-Range', contentRange);
        res.setHeader('Cache-Control', 'no-store');

        const responseBuffer = Buffer.from(await upstream.arrayBuffer());
        res.status(upstream.status).send(responseBuffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upstream connection failed';
        res.status(502).json({
          message: `Unable to reach Supabase service (${message}).`,
        });
      }
    },
  );

  app.use(express.json());

  // Exposes only the sanitized public Supabase URL and publishable key configured in environment secrets.
  // Never exposes service_role keys or other private secrets.
  app.get('/api/config', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(getSupabaseConfig());
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TaskFlow server:', err);
  process.exit(1);
});
