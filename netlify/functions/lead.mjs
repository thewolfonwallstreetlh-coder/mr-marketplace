// POST /api/lead
//  stage 1 (no id): create the lead from contact + basics, route it, alert (LEAD_DELIVERY=immediate), confirm by email
//  stage 2 ({id, token}): add qualification answers + rates, rescore, alert "qualified"
import { json, db, settings, qualify, route, bumpLoad, publicAgent, alert, confirm, stateFromZip, rid, body, ipOf, limit, tooMany, same, ID_RE, TOKEN_RE, str, oneOf, num, NAMES , loadAdvisors } from "../lib/common.mjs";

// Only known answer fields are kept, each with a type and length limit. Anything else is dropped.
const ANSWERS = { start: ["asap", "next", "later", "research"], work: ["self", "owner", "w2", "between", "other"], tobacco: ["yes", "no"], budget: ["500", "1000", "2000", "9999", "unsure"] };
function clean(a) {
  if (!a || typeof a !== "object") return {};
  const o = {};
  for (const [k, list] of Object.entries(ANSWERS)) if (a[k] != null) o[k] = oneOf(String(a[k]), list);
  for (const k of ["current_coverage", "current_premium", "current_carrier", "business_name", "employees", "renewal_month"]) if (a[k] != null) o[k] = str(a[k], 120);
  if (a.income != null) o.income = num(a.income, 0, 1e8);
  if (a.doctors != null) o.doctors = str(a.doctors, 300);
  if (a.prescriptions != null) o.prescriptions = oneOf(String(a.prescriptions), ["yes", "no", ""]);
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null));
}
const cleanRates = (r) => (r && typeof r === "object" ? { status: str(r.status, 20), count: num(r.count, 0, 5000), carriers: num(r.carriers, 0, 200), lowest: num(r.lowest, 0, 1e5), year: num(r.year, 2000, 2100) } : {});
const cleanTracking = (t) => { t = t && typeof t === "object" ? t : {}; const o = { seconds: num(t.seconds, 0, 86400) }; for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "referrer", "landing", "device"]) if (t[k]) o[k] = str(t[k], 200); return o; };
const cleanConsent = (c) => ({ given: c?.given === true, text: str(c?.text, 1000) });

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const cfg = settings(), store = db(), ip = ipOf(req, context);
  const b = await body(req);
  if (!b) return json({ ok: false, error: "bad_request" }, 400);
  const now = new Date().toISOString();

  /* ---------- stage 2: update an existing lead ---------- */
  if (b.id) {
    if (!(await limit(store, "lead2", ip, 30, 3600))) return tooMany();
    if (!ID_RE.test(String(b.id)) || !TOKEN_RE.test(String(b.token))) return json({ ok: false, error: "not_found" }, 404);
    const L = await store.get(`lead/${b.id}`, { type: "json" });
    if (!L || !same(L.token, b.token)) return json({ ok: false, error: "not_found" }, 404);
    if ((L.events || []).filter((e) => e.type === "qualified").length >= 5) return json({ ok: false, error: "too_many_updates" }, 429);
    L.answers = { ...L.answers, ...clean(b.answers) };
    if (b.rates) L.rates = cleanRates(b.rates);
    if (b.location?.county) L.location.county = str(b.location.county, 80);
    const secs = num(b.tracking?.seconds, 0, 86400); if (secs != null) L.tracking = { ...L.tracking, seconds: secs };
    const keep = (L.qualification?.flags || []).filter((f) => f === "duplicate");
    L.qualification = qualify(L, cfg, keep);
    L.qualification_status = "complete"; L.stage = 2; L.updated = now;
    L.events.push({ t: now, type: "qualified", category: L.qualification.category, score: L.qualification.score });
    const cat = L.qualification.category;
    if (cat === "D" && L.status !== "enrolled") { L.status = "lost"; L.lost_reason = L.qualification.below_target_income ? "Below target income" : "Not eligible"; }
    if (cat !== "D" && !L.agent) {
      const a = await route(L, cfg, store);
      if (a) { L.agent = { id: a.id, name: a.name, phone: a.phone, email: a.email || "", webhook: a.webhook || "", title: a.title || "" }; L.status = "assigned"; await bumpLoad(store, a.id, 1); }
    }
    await store.setJSON(`lead/${L.id}`, L);
    const firstAlert = cfg.delivery === "qualified";
    if (cat !== "D" || cfg.sendCategoryD) await alert(L, cfg, firstAlert ? "new_lead" : "qualified");
    if (firstAlert && cat !== "D") await confirm(L, cfg);
    return json({ ok: true, id: L.id, category: cat, score: L.qualification.score, agent: cat === "D" ? null : publicAgent(L.agent) });
  }

  /* ---------- stage 1: create ---------- */
  if (b.website || b.hp || b.company_url) return json({ ok: true, id: rid(8), token: rid(16), category: null, agent: null }); // bot trap: looks successful, saves nothing
  if (!(await limit(store, "lead1", ip, 6, 3600)) || !(await limit(store, "lead1d", ip, 15, 86400))) return tooMany();
  const c = b.contact || {};
  const digits = String(c.phone || "").replace(/\D/g, "");
  if (!str(c.first, 60) || !str(c.last, 60) || digits.length !== 10 || !/^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,24}$/i.test(String(c.email || ""))) return json({ ok: false, error: "invalid_contact" }, 400);
  if (!["call", "text", "email"].includes(c.preferred) || b.consents?.[c.preferred]?.given !== true) return json({ ok: false, error: "consent_required" }, 400);
  const zip = String(b.location?.zip || "").replace(/\D/g, "").slice(0, 5);
  if (!(await limit(store, "phone", digits, 4, 86400))) return tooMany();
  const L = {
    id: rid(8), token: rid(16), created: now, updated: now, status: "received", source: "web", stage: 1, qualification_status: "awaiting",
    language: oneOf(b.lang, ["en", "es"], "en"), form_version: str(b.form_version, 40), product: oneOf(b.product, ["health", "business", "dental", "supplemental"], "health"),
    contact: { first: str(c.first, 60), last: str(c.last, 60), phone: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`, email: str(c.email, 120).toLowerCase(), preferred: c.preferred },
    location: { zip, state: (() => { const st = str(b.location?.state, 2).toUpperCase(); return NAMES[st] ? st : stateFromZip(zip); })(), county: "", geo_ip: str(context?.geo?.subdivision?.code, 10) },
    household: { who: oneOf(b.household?.who, ["me", "couple", "kids", "family", "business"]), ages: (Array.isArray(b.household?.ages) ? b.household.ages : []).map((x) => num(x, 0, 120)).filter((x) => x != null).slice(0, 12), size: 0 },
    answers: clean(b.answers), rates: {}, tracking: cleanTracking(b.tracking),
    consents: {
      call: cleanConsent(b.consents?.call), text: cleanConsent(b.consents?.text), email: cleanConsent(b.consents?.email),
      disclosure: str(b.consents?.disclosure, 1500),
      version: str(b.consent_version, 40), server_time: now, ip,
      user_agent: str(req.headers.get("user-agent"), 300), page: str(b.consents?.page, 300), client_time: str(b.consents?.client_time, 40)
    },
    events: [{ t: now, type: "created", stage: 1 }], notes: [], tasks: [], calls: [], tags: [], plan_interest: [], policy: null
  };
  L.household.size = L.household.ages.length;
  const extra = [];
  const prev = await store.get(`phone/${digits}`, { type: "json" });
  let orig = null;
  if (prev && Date.now() - Date.parse(prev.t) < 30 * 864e5) { extra.push("duplicate"); L.duplicate_of = prev.id; orig = await store.get(`lead/${prev.id}`, { type: "json" }); }
  L.qualification = qualify(L, cfg, extra);
  const cat = L.qualification.category; // preliminary until stage 2
  if (cat !== "D") {
    await loadAdvisors(cfg, store);
    const a = (orig?.agent && cfg.agents.find((x) => x.id === orig.agent.id && x.active !== false)) || await route(L, cfg, store);
    if (a) { L.agent = { id: a.id, name: a.name, phone: a.phone, email: a.email || "", webhook: a.webhook || "", title: a.title || "" }; L.status = "assigned"; L.events.push({ t: now, type: "assigned", agent: a.id }); await bumpLoad(store, a.id, 1); }
  } else { L.status = "lost"; L.lost_reason = "Not eligible"; }
  L.tasks.push({ id: rid(4), title: `First contact: ${L.contact.preferred === "text" ? "text" : L.contact.preferred === "email" ? "email" : "call"} ${L.contact.first}`, due: new Date(Date.now() + 5 * 60000).toISOString(), done: false, auto: true });

  await store.setJSON(`lead/${L.id}`, L);
  await store.setJSON(`phone/${digits}`, { id: L.id, t: now });
  if (cfg.delivery !== "qualified" && cat !== "D") {
    await alert(L, cfg, L.duplicate_of ? "repeat_request" : "new_lead", L.duplicate_of ? { original_lead: L.duplicate_of } : {});
    await confirm(L, cfg);
  }
  return json({ ok: true, id: L.id, token: L.token, category: null, agent: cat === "D" ? null : publicAgent(L.agent) });
};
export const config = { path: "/api/lead" };
