// JetBlack Dex AI helper: a Cloudflare Worker that answers a question using only the
// JetBlack records the website sends with it. Runs on the Workers AI free allocation.
//
// Request:  POST { q: "question", ctx: "JetBlack records picked by the site" }
// Response: { a: "answer" }  or  { error: "..." } with a 4xx/5xx status

const SYSTEM = `You are the helper for an unofficial Pokédex of "Pokémon JetBlack", a ROM hack of Pokémon Black.
JetBlack changes stats, moves, learnsets, wild encounters, trainers and items, so your general Pokémon knowledge is often WRONG for this game.

Rules:
- Answer ONLY with facts written in the DATA section. Never add levels, locations, moves, items, percentages or stats that are not in DATA.
- If DATA does not contain the answer, reply: "I couldn't find that in the JetBlack data." You may then say what DATA does cover.
- Copy numbers and names exactly as they appear in DATA.
- If DATA lists conditions (starter choice, season, post-game, rematch, badges), mention the ones that matter.
- "Suggested nature" entries are the site's own suggestion, not from the hack's docs. Say so if you use them.
- Keep answers short: a sentence or two, or a short list. Plain text, no tables.`;

const MAX_Q = 300;        // characters
const MAX_CTX = 16000;    // characters
const PER_MINUTE = 12;    // requests per visitor IP, best effort (per Worker instance)
const hits = new Map();

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Vary': 'Origin',
    ok,
  };
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const { ok, ...h } = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, h);
    if (!ok) return json({ error: 'Origin not allowed' }, 403, h);

    // simple per-IP rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now(), win = hits.get(ip) || [];
    const recent = win.filter(t => now - t < 60000);
    if (recent.length >= PER_MINUTE) return json({ error: 'Too many questions, wait a minute' }, 429, h);
    recent.push(now); hits.set(ip, recent);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, h); }
    const q = String(body.q || '').trim().slice(0, MAX_Q);
    const data = String(body.ctx || '').trim().slice(0, MAX_CTX);
    if (!q || !data) return json({ error: 'Missing question or data' }, 400, h);

    // identical question + data: serve from cache (saves the free allocation)
    const cache = caches.default;
    const key = new Request('https://jetblack-dex-cache/' + (await sha(q.toLowerCase() + '\n' + data)));
    const hit = await cache.match(key);
    if (hit) return json(await hit.json(), 200, h);

    try {
      const out = await env.AI.run(env.MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `DATA:\n${data}\n\nQUESTION: ${q}` },
        ],
        max_tokens: 400,
        temperature: 0,
      });
      const a = String(out && out.response || '').trim();
      if (!a) return json({ error: 'Empty answer' }, 502, h);
      const res = { a };
      ctx.waitUntil(cache.put(key, new Response(JSON.stringify(res), { headers: { 'Cache-Control': 'max-age=86400' } })));
      return json(res, 200, h);
    } catch (err) {
      // most often: the free daily allocation is used up
      return json({ error: 'AI unavailable' }, 503, h);
    }
  },
};
