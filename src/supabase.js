import {createClient} from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://clxsjsheuxffzzhxychy.supabase.co';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedClient = null;
/** @type {Promise<import('@supabase/supabase-js').SupabaseClient | null> | null} */
let initPromise = null;
/** @type {string} */
let activeSupabaseOrigin = DEFAULT_SUPABASE_URL;

/**
 * Sanitizes a Supabase project URL by stripping accidental trailing text
 * (e.g., copied UI labels like "Copy name") and normalizing to the URL origin.
 * @param {string | undefined | null} value
 * @returns {string}
 */
export function sanitizeSupabaseUrl(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  const firstToken = value.trim().split(/\s+/)[0] || '';
  if (!firstToken) {
    return '';
  }
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

/**
 * Sanitizes a Supabase publishable/anon key by stripping stray whitespace or copied labels.
 * @param {string | undefined | null} value
 * @returns {string}
 */
function sanitizeSupabaseKey(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.trim().split(/\s+/)[0] || '';
}

/**
 * Resilient fetch wrapper for Supabase Auth and PostgREST requests.
 * Attempts direct browser fetch first; if a network/CORS/DNS error ("Failed to fetch")
 * prevents direct access to Supabase, retries transparently via the same-origin /api/supabase proxy.
 * @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
async function resilientSupabaseFetch(input, init) {
  const requestUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    const firstAttemptInput = input instanceof Request ? input.clone() : input;
    return await fetch(firstAttemptInput, init);
  } catch (networkError) {
    if (activeSupabaseOrigin && requestUrl.startsWith(activeSupabaseOrigin)) {
      const parsed = new URL(requestUrl);
      const proxyPath = `/api/supabase${parsed.pathname}${parsed.search}`;

      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      let body = init?.body;
      if (body === undefined && input instanceof Request && input.method !== 'GET' && input.method !== 'HEAD') {
        body = await input.clone().arrayBuffer();
      }

      return await fetch(proxyPath, {
        method: init?.method ?? (input instanceof Request ? input.method : 'GET'),
        headers,
        body,
        signal: init?.signal,
      });
    }
    throw networkError;
  }
}

/**
 * Initializes and returns the shared Supabase client using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Falls back to runtime environment variables exposed via /api/config when secrets are injected at runtime.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient | null>}
 */
export async function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    let url = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
    let anonKey = sanitizeSupabaseKey(
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );

    if (!url || !anonKey) {
      try {
        const response = await fetch('/api/config', {
          headers: {Accept: 'application/json'},
        });
        if (response.ok) {
          const data = await response.json();
          if (!url && data.supabaseUrl) {
            url = sanitizeSupabaseUrl(String(data.supabaseUrl));
          }
          if (!anonKey && data.supabaseAnonKey) {
            anonKey = sanitizeSupabaseKey(String(data.supabaseAnonKey));
          }
        }
      } catch (err) {
        console.error('[TaskFlow] Failed to load runtime /api/config:', err);
      }
    }

    if (!url) {
      url = DEFAULT_SUPABASE_URL;
    }

    if (!url || !anonKey) {
      initPromise = null;
      return null;
    }

    activeSupabaseOrigin = url;

    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: resilientSupabaseFetch,
      },
    });

    return cachedClient;
  })();

  return initPromise;
}

export function resetSupabaseClientCache() {
  cachedClient = null;
  initPromise = null;
}
