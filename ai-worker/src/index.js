// JTN Endüstri Rehber – Claude aracı sunucusu (Cloudflare Worker)
// API anahtarı burada, Cloudflare'in gizli değişkenlerinde (ANTHROPIC_API_KEY) durur; uygulamaya hiç gitmez.
const MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 1600;
const MAX_SYSTEM = 120000;   // karakter
const MAX_MSG = 30000;       // karakter / mesaj
const MAX_TURNS = 20;
const MAX_IMAGES = 4;
const MAX_IMAGE_B64 = 6_000_000; // ~4.5 MB
const ALLOWED = ["https://kurnazrecep16-web.github.io", "capacitor://localhost", "http://localhost", "https://claude.ai"];

function cors(origin) {
  const ok = ALLOWED.some(a => origin === a || origin.startsWith(a + ":")) || /\.claudeusercontent\.com$/.test(origin) || /^https:\/\/[a-z0-9-]+\.claude\.ai$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-app",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { ...h, "content-type": "application/json; charset=utf-8" } });

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const h = cors(origin);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (req.method !== "POST") return json({ error: "method" }, 405, h);
    if (req.headers.get("x-app") !== "jtn-rehber") return json({ code: "forbidden" }, 403, h);

    if (env.LIMITER) {
      const ip = req.headers.get("cf-connecting-ip") || "x";
      const { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return json({ code: "rate_limited", message: "Çok sık soru soruldu. Bir dakika sonra tekrar deneyin." }, 429, h);
    }

    let body;
    try { body = await req.json(); } catch { return json({ code: "bad_request" }, 400, h); }
    const system = String(body.system || "").slice(0, MAX_SYSTEM);
    let msgs = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
    msgs = msgs.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
               .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MSG) }));
    // ardışık aynı rolleri birleştir, kullanıcıyla başla ve bitir
    const merged = [];
    for (const m of msgs) { const l = merged[merged.length - 1]; if (l && l.role === m.role) l.content += "\n\n" + m.content; else merged.push({ ...m }); }
    while (merged.length && merged[0].role !== "user") merged.shift();
    if (!merged.length || merged[merged.length - 1].role !== "user") return json({ code: "bad_request" }, 400, h);

    const imgs = (Array.isArray(body.images) ? body.images : []).slice(0, MAX_IMAGES)
      .filter(i => i && /^image\/(jpeg|png|webp|gif)$/.test(i.type) && typeof i.data === "string" && i.data.length < MAX_IMAGE_B64);
    const last = merged[merged.length - 1];
    const content = [...imgs.map(i => ({ type: "image", source: { type: "base64", media_type: i.type, data: i.data } })), { type: "text", text: last.content }];
    const messages = [...merged.slice(0, -1), { role: "user", content }];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: env.MODEL || MODEL,
        max_tokens: MAX_TOKENS,
        system: system ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }] : undefined,
        messages,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const code = r.status === 429 ? "rate_limited" : r.status === 400 ? "bad_request" : "unavailable";
      return json({ code, message: (d.error && d.error.message) || "Yapay zekâ şu an cevap veremiyor." }, r.status === 429 ? 429 : 502, h);
    }
    const text = (d.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    return json({ text, truncated: d.stop_reason === "max_tokens" }, 200, h);
  },
};
