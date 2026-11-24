// Mr. Marketplace CRM API (Authorization: Bearer <password>)
// POST /api/agent/login   -> {password} -> {token}  (5 wrong attempts per 15 min per IP = locked out)
// GET  /api/agent/me      -> signed-in user, statuses, agents
// GET  /api/agent/leads   -> leads (admin: all, agent: own)
// POST /api/agent/leads   -> {create:{...}} add a lead by hand, or {id, ...actions} update one
import { json, db, settings, who, STATUSES, OPEN, bumpLoad, alert, rid, stateFromZip, qualify, body, ipOf, limit, tooMany, checkPassword, issue, ipAllowed, users, ID_RE, str, oneOf, num, NAMES, MIN_PW, SESSION_HOURS, loadAdvisors, listAdvisors, verifyPw } from "../lib/common.mjs";

const s = (v, n = 300) => str(v, n);
const PREF = ["call", "text", "email"], CATS = ["A", "B", "C", "D"];

export default async (req, context) => {
  const cfg = settings(), store = db(), ip = ipOf(req, context), u = new URL(req.url), now = new Date().toISOString();
  if (!ipAllowed(ip)) return json({ ok: false, error: "unauthorized" }, 401);
  await loadAdvisors(cfg, store);

  if (u.pathname.endsWith("/login")) {
    if (req.method !== "POST") return json({ ok: false }, 405);
    if (!users(cfg).length) return json({ ok: false, error: "not_configured", detail: `Set AGENT_PASSWORD (at least ${MIN_PW} characters) in Netlify.` }, 503);
    const fails = `fail/${ip}`;
    const rec = (await store.get(`rl/login/${fails}`, { type: "json" })) || { n: 0, t: 0 };
    if (rec.n >= 5 && Date.now() - rec.t < 15 * 60000) return tooMany();
    const b = await body(req, 2048);
    const email = b && typeof b.email === "string" ? b.email.trim().slice(0, 120) : "";
    const user = b && typeof b.password === "string" ? checkPassword(cfg, b.password, email) : null;
    if (!user && email && typeof b?.password === "string") {   // right password but access paused (unpaid, paused or canceled)?
      const adv = (await listAdvisors(store)).find((a) => (a.email || "").toLowerCase() === email.toLowerCase());
      if (adv && adv.pwh && verifyPw(b.password, adv.pwh)) return json({ ok: false, error: "inactive", status: adv.status }, 403);
    }
    if (!user) {
      await store.setJSON(`rl/login/${fails}`, { n: Date.now() - rec.t < 15 * 60000 ? rec.n + 1 : 1, t: Date.now() });
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); // slow down guessing
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    await store.delete(`rl/login/${fails}`).catch(() => {});
    await store.setJSON(`audit/${Date.now()}-${rid(3)}`, { t: now, type: "login", user: user.id, ip, ua: str(req.headers.get("user-agent"), 200) });
    return json({ ok: true, token: issue(cfg, user), expires_in_hours: SESSION_HOURS });
  }

  const me = who(req, cfg);
  if (!me) return json({ ok: false, error: "unauthorized" }, 401);
  if (!(await limit(store, "crm", me.id, 600, 600))) return tooMany();
  if (u.pathname.endsWith("/me")) return json({ ok: true, me, statuses: STATUSES, agents: cfg.agents.filter((a) => a.active !== false).map((a) => ({ id: a.id, name: a.name, advisor: !!a.advisor })) });

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "lead/" });
    const all = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    const mine = me.role === "admin" ? all : all.filter((l) => l.agent?.id === me.id);
    mine.sort((a, b) => b.created.localeCompare(a.created));
    return json({ ok: true, leads: mine.slice(0, 2000).map(({ token, ...l }) => l) });
  }
  if (req.method !== "POST") return json({ ok: false }, 405);
  const b = await body(req);
  if (!b) return json({ ok: false, error: "bad_request" }, 400);

  /* ---------- add a lead by hand (referral, phone-in, event) ---------- */
  if (b.create) {
    const c = b.create, zip = s(c.zip, 5);
    const a = me.role === "admin" ? (cfg.agents.find((x) => x.id === c.agentId) || cfg.agents[0]) : cfg.agents.find((x) => x.id === me.id);
    const L = { id: rid(8), token: rid(16), created: now, updated: now, status: a ? "assigned" : "received", source: s(c.source || "manual", 40), stage: 2, qualification_status: "manual",
      product: oneOf(c.product, ["health", "business", "dental", "supplemental"], "health"),
      contact: { first: s(c.first, 60), last: s(c.last, 60), phone: s(c.phone, 20), email: s(c.email, 120), preferred: oneOf(c.preferred, PREF, "call") },
      location: { zip: zip.replace(/\D/g, ""), state: (() => { const st = s(c.state, 2).toUpperCase(); return NAMES[st] ? st : stateFromZip(zip); })(), county: "" },
      household: { who: "", ages: (c.ages || "").toString().split(/[,\s]+/).map(Number).filter((x) => x >= 0 && x < 120), size: 0 },
      answers: { start: oneOf(c.start, ["asap", "next", "later", "research"]), current_coverage: s(c.current_coverage), budget: s(c.budget), business_name: s(c.business_name) },
      rates: {}, tracking: { source: "manual" },
      consents: { call: { given: !!c.consent_call, text: "Recorded by agent: " + s(c.consent_note, 300) }, text: { given: !!c.consent_text }, email: { given: !!c.consent_email }, version: "manual", server_time: now, ip: "", user_agent: "", recorded_by: me.name },
      events: [{ t: now, type: "created", by: me.name, source: c.source || "manual" }], notes: c.note ? [{ t: now, by: me.name, text: s(c.note, 2000) }] : [], tasks: [], calls: [], tags: Array.isArray(c.tags) ? c.tags.slice(0, 10).map((t) => s(t, 30)) : [], plan_interest: [], policy: null,
      agent: a ? { id: a.id, name: a.name, phone: a.phone, email: a.email || "", webhook: a.webhook || "", title: a.title || "" } : null };
    L.household.size = L.household.ages.length;
    L.qualification = { ...qualify(L, cfg), category: oneOf(c.category, CATS, "B") };
    if (!L.contact.first || !L.contact.phone) return json({ ok: false, error: "name_and_phone_required" }, 400);
    await store.setJSON(`lead/${L.id}`, L);
    if (a) await bumpLoad(store, a.id, 1);
    const { token, ...out } = L; return json({ ok: true, lead: out });
  }

  /* ---------- update ---------- */
  if (!ID_RE.test(String(b.id))) return json({ ok: false, error: "not_found" }, 404);
  const L = await store.get(`lead/${b.id}`, { type: "json" });
  if (!L || (me.role !== "admin" && L.agent?.id !== me.id)) return json({ ok: false, error: "not_found" }, 404);
  L.tasks ||= []; L.calls ||= []; L.tags ||= []; L.notes ||= [];
  const ev = (o) => L.events.push({ t: now, by: me.name, ...o });

  if (b.status && STATUSES.includes(b.status) && b.status !== L.status) {
    if (OPEN(L.status) && !OPEN(b.status)) await bumpLoad(store, L.agent?.id, -1);
    if (!OPEN(L.status) && OPEN(b.status)) await bumpLoad(store, L.agent?.id, 1);
    L.status = b.status; ev({ type: "status", status: b.status });
    if (b.status === "lost") L.lost_reason = s(b.lost_reason || L.lost_reason || "Not specified", 120);
    if (["contacted", "quoting", "application", "enrolled"].includes(b.status) && !L.first_contact) L.first_contact = now;
  }
  if (b.contacted && !L.first_contact) { L.first_contact = now; ev({ type: "contacted" }); if (["received", "assigned"].includes(L.status)) L.status = "contacted"; }
  if (b.note) L.notes.push({ t: now, by: me.name, text: s(b.note, 2000) });
  if (b.reply) ev({ type: "reply", text: s(b.reply, 1000) });
  if (b.call) {
    L.calls.push({ t: now, by: me.name, outcome: s(b.call.outcome, 40), notes: s(b.call.notes, 1000), direction: b.call.direction === "in" ? "in" : "out" });
    ev({ type: "call", outcome: s(b.call.outcome, 40) });
    if (!L.first_contact && !/no answer|voicemail|wrong/i.test(b.call.outcome || "")) { L.first_contact = now; if (["received", "assigned"].includes(L.status)) L.status = "contacted"; }
  }
  if (L.notes.length > 500 || L.tasks.length > 300 || (L.events || []).length > 2000) return json({ ok: false, error: "lead_full" }, 400);
  if (b.task_add) { L.tasks.push({ id: rid(4), title: s(b.task_add.title, 160), due: s(b.task_add.due, 40), done: false, by: me.name }); ev({ type: "task_added", text: s(b.task_add.title, 160) }); }
  if (b.task_done) { const t = L.tasks.find((x) => x.id === b.task_done.id); if (t) { t.done = !!b.task_done.done; t.done_at = t.done ? now : null; } }
  if (b.task_delete) L.tasks = L.tasks.filter((x) => x.id !== b.task_delete);
  if (Array.isArray(b.tags)) L.tags = b.tags.slice(0, 15).map((t) => s(t, 30)).filter(Boolean);
  if (b.contact && typeof b.contact === "object") for (const k of ["first", "last", "phone", "email"]) if (b.contact[k] != null) L.contact[k] = s(b.contact[k], k === "email" ? 120 : 60);
  if (b.policy) {
    L.policy = { carrier: s(b.policy.carrier, 80), plan: s(b.policy.plan, 120), type: s(b.policy.type, 40), premium: num(b.policy.premium, 0, 1e6) || 0,
      effective: s(b.policy.effective, 20), members: num(b.policy.members, 0, 50), commission: num(b.policy.commission, 0, 1e7) || 0, number: s(b.policy.number, 40), recorded: now };
    if (L.status !== "enrolled") { if (OPEN(L.status)) await bumpLoad(store, L.agent?.id, -1); L.status = "enrolled"; }
    ev({ type: "policy", text: `${L.policy.carrier} ${L.policy.plan}` });
  }
  if (b.agentId && me.role === "admin") {
    const a = cfg.agents.find((x) => x.id === b.agentId);
    if (a) { if (OPEN(L.status)) { await bumpLoad(store, L.agent?.id, -1); await bumpLoad(store, a.id, 1); }
      L.agent = { id: a.id, name: a.name, phone: a.phone, email: a.email || "", webhook: a.webhook || "", title: a.title || "" };
      if (L.status === "received") L.status = "assigned"; ev({ type: "reassigned", agent: a.name }); await alert(L, cfg, "reassigned"); }
  }
  L.updated = now;
  await store.setJSON(`lead/${L.id}`, L);
  const { token, ...out } = L;
  return json({ ok: true, lead: out });
};
export const config = { path: ["/api/agent/login", "/api/agent/me", "/api/agent/leads"] };
