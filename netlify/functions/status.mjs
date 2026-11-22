// GET /api/status?id=&t=  — customer portal view
// POST /api/status {id, token, type: plan_interest|care_needs|message|contact_pref|withdraw_consent, ...}
import { json, db, settings, alert, STATUSES, body, ipOf, limit, tooMany, same, ID_RE, TOKEN_RE, str, num } from "../lib/common.mjs";

const view = (L) => ({
  ok: true, id: L.id, first: L.contact.first, product: L.product, created: L.created, status: L.status,
  step: L.status === "lost" ? -1 : Math.max(0, STATUSES.indexOf(L.status)), category: L.qualification?.category,
  agent: L.agent ? { name: L.agent.name, phone: L.agent.phone, title: L.agent.title || "Licensed Health Insurance Specialist" } : null,
  preferred: L.contact.preferred, plan_interest: L.plan_interest || [],
  consents: { call: !!L.consents.call?.given && !L.consents.call?.withdrawn, text: !!L.consents.text?.given && !L.consents.text?.withdrawn, email: !!L.consents.email?.given && !L.consents.email?.withdrawn },
  messages: (L.events || []).filter((e) => e.type === "message" || e.type === "reply").map((e) => ({ t: e.t, from: e.type === "reply" ? "agent" : "you", text: e.text }))
});

export default async (req, context) => {
  const store = db(), cfg = settings(), ip = ipOf(req, context);
  if (!(await limit(store, "status", ip, 120, 3600))) return tooMany();
  if (req.method === "GET") {
    const u = new URL(req.url); const id = String(u.searchParams.get("id") || ""), t = String(u.searchParams.get("t") || "");
    if (!ID_RE.test(id) || !TOKEN_RE.test(t)) return json({ ok: false, error: "not_found" }, 404);
    const L = await store.get(`lead/${id}`, { type: "json" });
    if (!L || !same(L.token, t)) return json({ ok: false, error: "not_found" }, 404);
    return json(view(L));
  }
  if (req.method !== "POST") return json({ ok: false }, 405);
  const b = await body(req);
  if (!b || !ID_RE.test(String(b.id)) || !TOKEN_RE.test(String(b.token))) return json({ ok: false, error: "not_found" }, 404);
  if (!(await limit(store, "statuspost", b.id, 40, 3600))) return tooMany();
  const L = await store.get(`lead/${b.id}`, { type: "json" });
  if (!L || !same(L.token, b.token)) return json({ ok: false, error: "not_found" }, 404);
  if ((L.events || []).length > 1500) return json({ ok: false, error: "lead_full" }, 400);
  const now = new Date().toISOString(); let ev = null;
  if (b.type === "plan_interest" && b.plan && typeof b.plan === "object") {
    const p = b.plan, plan = { t: now, id: str(p.id, 20), name: str(p.name, 160), issuer: str(p.issuer, 120), metal: str(p.metal, 30), type: str(p.type, 10), premium: num(p.premium, 0, 1e5), deductible: num(p.deductible, 0, 1e6) };
    L.plan_interest = [...(L.plan_interest || []), plan].slice(-10); ev = { type: "plan_interest", plan: `${plan.issuer} ${plan.name}` }; }
  else if (b.type === "care_needs") { const cl = (a) => (Array.isArray(a) ? a : []).slice(0, 10).filter((x) => x && typeof x === "object").map((x) => ({ id: str(x.id, 12).replace(/\D/g, ""), name: str(x.name, 120), detail: str(x.detail, 120) }));
    L.care_needs = { doctors: cl(b.doctors), drugs: cl(b.drugs), t: now }; ev = { type: "care_needs", text: [...L.care_needs.doctors, ...L.care_needs.drugs].map((x) => x.name).join(", ") }; }
  else if (b.type === "message" && str(b.text, 1000)) { ev = { type: "message", text: str(b.text, 1000) }; }
  else if (b.type === "contact_pref" && ["call", "text", "email"].includes(b.preferred)) { L.contact.preferred = b.preferred; ev = { type: "contact_pref", preferred: b.preferred }; }
  else if (b.type === "withdraw_consent" && ["call", "text", "email"].includes(b.channel)) { if (L.consents[b.channel]) L.consents[b.channel].withdrawn = now; ev = { type: "consent_withdrawn", channel: b.channel }; }
  else return json({ ok: false, error: "bad_type" }, 400);
  L.events.push({ t: now, ...ev }); L.updated = now;
  await store.setJSON(`lead/${L.id}`, L);
  await alert(L, cfg, ev.type, { detail: JSON.stringify(ev) });
  return json(view(L));
};
export const config = { path: "/api/status" };
