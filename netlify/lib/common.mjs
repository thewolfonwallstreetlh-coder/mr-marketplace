// Mr. Marketplace — shared server helpers (storage, config, scoring, routing, alerts)
import { getStore } from "@netlify/blobs";
/* 2024 ACS state median household income (U.S. Census Bureau, via KFF) */
export const MEDIAN={AL:66659,AK:95665,AZ:81486,AR:62106,CA:100149,CO:97113,CT:96049,DE:87534,DC:109707,FL:77735,GA:79991,HI:100745,ID:81166,IL:83211,IN:71959,IA:75501,KS:75514,KY:64526,LA:60986,ME:76442,MD:102905,MA:104828,MI:72389,MN:87117,MS:59127,MO:71589,MT:75340,NE:76376,NV:81134,NH:99782,NJ:104294,NM:67816,NY:85820,NC:73958,ND:77871,OH:72212,OK:66148,OR:85220,PA:77545,RI:83504,SC:72350,SD:76881,TN:71997,TX:79721,UT:96658,VT:82730,VA:92090,WA:99389,WV:60798,WI:77488,WY:75532};
export const NAMES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"Washington, D.C.",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
export const ZIP3=[[5,5,"NY"],[10,27,"MA"],[28,29,"RI"],[30,38,"NH"],[39,49,"ME"],[50,59,"VT"],[60,69,"CT"],[70,89,"NJ"],[100,149,"NY"],[150,196,"PA"],[197,199,"DE"],[200,205,"DC"],[206,219,"MD"],[220,246,"VA"],[247,268,"WV"],[270,289,"NC"],[290,299,"SC"],[300,319,"GA"],[320,349,"FL"],[350,369,"AL"],[370,385,"TN"],[386,397,"MS"],[398,399,"GA"],[400,427,"KY"],[430,459,"OH"],[460,479,"IN"],[480,499,"MI"],[500,528,"IA"],[530,549,"WI"],[550,567,"MN"],[569,569,"DC"],[570,577,"SD"],[580,588,"ND"],[590,599,"MT"],[600,629,"IL"],[630,658,"MO"],[660,679,"KS"],[680,693,"NE"],[700,714,"LA"],[716,729,"AR"],[730,749,"OK"],[750,799,"TX"],[800,816,"CO"],[820,831,"WY"],[832,838,"ID"],[840,847,"UT"],[850,865,"AZ"],[870,884,"NM"],[885,885,"TX"],[889,898,"NV"],[900,961,"CA"],[967,968,"HI"],[970,979,"OR"],[980,994,"WA"],[995,999,"AK"]];


import { createHmac, createHash, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";

export const json = (b, s = 200, extra = {}) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", ...extra } });

/* ---------- security helpers ---------- */
export const MAX_BODY = 32 * 1024;
// Read a JSON body with a hard size cap. Returns null if missing, too large or malformed.
export async function body(req, max = MAX_BODY) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > max) return null;
  try { const t = await req.text(); if (t.length > max) return null; const v = JSON.parse(t); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch { return null; }
}
export const ipOf = (req, context) => String(context?.ip || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 64);
// Constant-time string comparison (prevents timing attacks on passwords and tokens)
export function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = createHash("sha256").update(a).digest(), y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y) && a.length === b.length;
}
// Fixed-window rate limit stored in Blobs. Returns true if the request is allowed.
export async function limit(store, name, who, max, windowSec) {
  const slot = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl/${name}/${createHash("sha256").update(String(who)).digest("hex").slice(0, 24)}/${slot}`;
  try {
    const n = ((await store.get(key, { type: "json" })) || { n: 0 }).n + 1;
    await store.setJSON(key, { n, exp: (slot + 1) * windowSec * 1000 });
    return n <= max;
  } catch { return true; } // never lock people out because storage hiccupped
}
export const tooMany = () => json({ ok: false, error: "rate_limited" }, 429, { "retry-after": "600" });
export const ID_RE = /^[a-f0-9]{16}$/, TOKEN_RE = /^[a-f0-9]{32}$/;
export const str = (v, n = 300) => (typeof v === "string" || typeof v === "number" ? String(v) : "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, n);
export const oneOf = (v, list, d = "") => (list.includes(v) ? v : d);
export const num = (v, lo = 0, hi = 1e9) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
export const safeUrl = (u) => { try { const x = new URL(String(u)); return x.protocol === "https:" || x.protocol === "http:" ? x.href.slice(0, 500) : ""; } catch { return ""; } };
export const htmlEsc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (v) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, 200);
export const db = () => getStore({ name: "mm-leads", consistency: "strong" });
const env = (k, d = "") => (process.env[k] ?? d);

/* ---------- configuration (Netlify > Site configuration > Environment variables) ---------- */
export function settings() {
  let agents = [];
  try { agents = JSON.parse(env("AGENTS", "[]")); } catch { agents = []; }
  if (!agents.length) agents = [{ id: "owner", name: env("SPECIALIST_NAME", "Your Mr. Marketplace specialist"), phone: env("SPECIALIST_PHONE", "(727) 339-2891"), title: "Licensed Health Insurance Specialist", states: ["*"], products: ["*"], active: true }];
  return {
    agents, envAgents: agents.map((a) => ({ ...a })),
    licensedStates: env("LICENSED_STATES").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    minIncome: Number(env("INCOME_MINIMUM", "60000")) || 60000,   // households below this go to HealthCare.gov
    sendCategoryD: env("SEND_CATEGORY_D", "false") === "true",
    products: env("ENABLED_PRODUCTS", "health,business").split(",").map((s) => s.trim()),
    webhook: env("LEAD_WEBHOOK_URL"),
    priorityWebhook: env("PRIORITY_WEBHOOK_URL"),
    resendKey: env("RESEND_API_KEY"),
    alertEmail: env("ALERT_EMAIL"),
    alertFrom: env("ALERT_FROM", "Mr. Marketplace <onboarding@resend.dev>"),   // resend.dev works with no domain setup (alerts to your own Resend email only)
    adminPassword: env("AGENT_PASSWORD"),
    delivery: env("LEAD_DELIVERY", "immediate"),          // "immediate" = after contact info, "qualified" = after full qualification
    confirmEmail: env("SEND_CONFIRMATION_EMAIL", "true") === "true",
    siteUrl: env("URL", "")
  };
}

export const stateFromZip = (z) => { const p = parseInt(String(z).slice(0, 3), 10); const r = ZIP3.find(([a, b]) => p >= a && p <= b); return r ? r[2] : ""; };
export const target = (st, min) => min || 60000;
export const rid = (n = 12) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

/* ---------- qualification engine (authoritative copy of the browser version) ---------- */
const DISPOSABLE = /@(mailinator|guerrillamail|10minutemail|tempmail|temp-mail|yopmail|trashmail|sharklasers|getnada|throwaway|fakeinbox|dispostable)\./i;
export function qualify(L, cfg, extraFlags = []) {
  const flags = [...extraFlags];
  const d = (L.contact.phone || "").replace(/\D/g, "");
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d) || /^(\d)\1{9}$/.test(d) || d.slice(0, 3) === "555" || /^\d{3}5550[01]\d{2}$/.test(d)) flags.push("phone_invalid");
  if (DISPOSABLE.test(L.contact.email || "")) flags.push("email_disposable");
  if (flags.includes("duplicate")) flags.push();
  if ((L.tracking?.seconds ?? 99) < 15) flags.push("too_fast");
  const ages = L.household?.ages || [];
  const prod = !cfg.products.includes(L.product) ? 0 : (L.product !== "dental" && ages[0] >= 65 ? 0 : 100);
  const st = L.location.state;
  const geo = !st ? 60 : (cfg.licensedStates.length && !cfg.licensedStates.includes(st) ? 0 : 100);
  const a = L.answers || {};
  const timeline = { asap: 100, next: 90, later: 70, research: 35 }[a.start] ?? 60;
  let budget = 70; const low = L.rates?.lowest;
  if (a.budget && a.budget !== "unsure" && low != null) { const b = +a.budget; budget = b >= low ? 100 : b * 1.25 >= low ? 70 : 40; }
  else if (a.budget === "unsure") budget = 65; else if (a.budget) budget = 85;
  let engage = { call: 100, text: 85, email: 60 }[L.contact.preferred] ?? 60;
  if (a.doctors || a.prescriptions === "yes" || a.prescriptions === "no") engage = Math.min(100, engage + 5);
  const below = L.product === "health" && a.income && a.income < target(st, cfg.minIncome);
  let score = Math.round(.2 * prod + .2 * geo + .2 * timeline + .15 * budget + .25 * engage) - flags.filter((f) => !["repeat_24h", "duplicate"].includes(f)).length * 15;
  score = Math.max(0, Math.min(100, score));
  let category;
  if (prod === 0 || geo === 0 || below || (flags.includes("too_fast") && flags.includes("phone_invalid"))) category = "D";
  else if (score >= 80 && ["asap", "next"].includes(a.start) && L.contact.preferred !== "email" && !flags.length) category = "A";
  else if (score >= 60) category = "B"; else category = "C";
  if (flags.includes("phone_invalid") && category !== "D") category = "C";
  return { score, category, below_target_income: !!below, target_income: target(st, cfg.minIncome),
    breakdown: { product_eligibility: prod, geographic_eligibility: geo, coverage_timeline: timeline, budget_compatibility: budget, contact_engagement: engage }, flags };
}

/* ---------- routing: licensed state + product + workload ---------- */
export async function route(L, cfg, store) {
  await loadAdvisors(cfg, store);
  const fits = (list) => list.filter((a) => a.active !== false &&
    (a.states || ["*"]).some((s) => s === "*" || s.toUpperCase() === L.location.state) &&
    (a.products || ["*"]).some((p) => p === "*" || p === L.product));
  const paid = fits(cfg.agents.filter((a) => a.advisor));        // paying advisors licensed in this state get the lead
  const ok = paid.length ? paid : fits(cfg.agents.filter((a) => !a.advisor));   // otherwise it comes to you
  if (!ok.length) return null;
  let best = null, bestLoad = Infinity;
  for (const a of ok) {
    const load = (await store.get(`load/${a.id}`, { type: "json" }))?.open ?? 0;
    const adj = load / (a.weight || 1);
    if (adj < bestLoad) { best = a; bestLoad = adj; }
  }
  return best;
}
export async function bumpLoad(store, agentId, delta) {
  if (!agentId) return;
  const cur = (await store.get(`load/${agentId}`, { type: "json" })) || { open: 0 };
  cur.open = Math.max(0, (cur.open || 0) + delta);
  await store.setJSON(`load/${agentId}`, cur);
}
export const publicAgent = (a) => a ? { id: a.id, name: a.name, phone: a.phone, title: a.title || "Licensed Health Insurance Specialist" } : null;

/* ---------- alerts: webhook (Zapier/Make/GoHighLevel/Twilio) + optional email via Resend ---------- */
export function flatten(L, event) {
  const a = L.answers || {}, q = L.qualification || {};
  return {
    event: event || "new_lead", priority: ["new_lead", "qualified"].includes(event || "new_lead") && q.category === "A" && L.qualification_status === "complete" ? "A - CALL NOW" : (L.qualification_status === "complete" ? q.category : "awaiting qualification"), stage: L.qualification_status,
    lead_id: L.id, language: L.language === "es" ? "SPANISH" : "English", category: q.category, score: q.score, product: L.product, status: L.status,
    name: `${L.contact.first} ${L.contact.last}`, phone: L.contact.phone, email: L.contact.email, preferred_contact: L.contact.preferred,
    state: L.location.state, zip: L.location.zip, county: L.location.county, household_size: L.household?.size, ages: (L.household?.ages || []).join(", "),
    start: a.start, current_coverage: a.current_coverage, current_carrier: a.current_carrier, current_premium: a.current_premium,
    work: a.work, income: a.income, budget: a.budget, tobacco: a.tobacco, business: a.business_name, employees: a.employees, renewal: a.renewal_month,
    rates_shown: L.rates?.count, lowest_premium: L.rates?.lowest, flags: (q.flags || []).join(", "),
    consent_call: !!L.consents?.call?.given, consent_text: !!L.consents?.text?.given, consent_email: !!L.consents?.email?.given,
    agent: L.agent?.name || "", agent_phone: L.agent?.phone || "", created: L.created, dashboard: `${process.env.URL || ""}/crm/#leads/${L.id}`
  };
}

/* ---------- the lead alert email ---------- */
const money = (v) => (v == null || v === "" || isNaN(Number(v))) ? v : "$" + Math.round(Number(v)).toLocaleString("en-US");
const nice = (v) => v === true ? "Yes" : v === false ? "No" : v;
const LABELS = {
  preferred_contact: { call: "Phone call", text: "Text message", email: "Email" },
  start: { asap: "As soon as possible", next: "Next month", later: "In 2 to 3 months", research: "Just researching" },
  work: { self: "Self-employed", owner: "Business owner", w2: "Employed (W-2)", between: "Between jobs", other: "Other" },
  budget: { "500": "Under $500/mo", "1000": "$500 to $1,000/mo", "2000": "$1,000 to $2,000/mo", "9999": "$2,000+/mo", unsure: "Not sure" },
  tobacco: { no: "No", yes: "Yes" } };
const lab = (k, v) => (LABELS[k] && LABELS[k][String(v)]) || v;
function leadEmailText(b, label) {
  return [`${label}: ${b.name}`, `Phone: ${b.phone}`, `Email: ${b.email}`, `Prefers: ${lab("preferred_contact", b.preferred_contact)}`, `Location: ${[b.zip, b.county, b.state].filter(Boolean).join(", ")}`, `Priority: ${b.priority}`, b.language === "SPANISH" ? "Speaks: Spanish" : "", `Open in CRM: ${b.dashboard}`].filter(Boolean).join("\n");
}
function leadEmailHtml(b, label, hot) {
  const tel = String(b.phone || "").replace(/\D/g, "");
  const btn = (href, text, primary) => `<a href="${htmlEsc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:10px;font:600 15px Arial,sans-serif;text-decoration:none;${primary ? "background:#0b1f3a;color:#ffffff" : "background:#ffffff;color:#0b1f3a;border:1px solid #c9d3e0"}">${text}</a>`;
  const can = (k) => b["consent_" + k];
  const buttons = [tel && can("call") ? btn("tel:+1" + tel, "📞 Call " + htmlEsc(b.phone), true) : "", tel && can("text") ? btn("sms:+1" + tel, "💬 Text", false) : "", b.email && can("email") ? btn("mailto:" + b.email, "✉️ Email", false) : "", b.dashboard && /^https:/.test(b.dashboard) ? btn(b.dashboard, "Open in CRM →", !(tel && can("call"))) : ""].join("");
  const facts = [
    ["Prefers", lab("preferred_contact", b.preferred_contact)], ["Location", [b.zip, b.county, b.state].filter(Boolean).join(", ")], ["Household", b.household_size ? `${b.household_size}${b.ages ? " (ages " + b.ages + ")" : ""}` : ""],
    ["Wants coverage", lab("start", b.start)], ["Covered today", b.current_coverage], ["Current carrier", b.current_carrier], ["Current premium", b.current_premium],
    ["Work", lab("work", b.work)], ["Household income", money(b.income)], ["Budget", lab("budget", b.budget)], ["Tobacco", lab("tobacco", b.tobacco)], ["Business", b.business], ["Employees", b.employees],
    ["Plans they saw", b.rates_shown], ["Lowest premium shown", money(b.lowest_premium)], ["Score", b.score != null ? `${b.score}/100 (category ${b.category || "-"})` : ""], ["Notes", b.flags], ["Assigned to", b.agent]
  ].filter(([, v]) => v !== "" && v != null).map(([k, v]) => `<tr><td style="padding:7px 0;color:#5b6b80;font:14px Arial,sans-serif;width:42%;vertical-align:top">${k}</td><td style="padding:7px 0;color:#0b1f3a;font:600 14px Arial,sans-serif">${htmlEsc(nice(v))}</td></tr>`).join("");
  const badge = hot ? '<span style="display:inline-block;background:#d93a2b;color:#fff;border-radius:999px;padding:4px 12px;font:700 12px Arial,sans-serif;letter-spacing:.04em">CALL NOW</span>' : `<span style="display:inline-block;background:#e8eef7;color:#1d5fa8;border-radius:999px;padding:4px 12px;font:700 12px Arial,sans-serif;letter-spacing:.04em">${htmlEsc(String(b.priority || "").toUpperCase())}</span>`;
  const es = b.language === "SPANISH" ? '<span style="display:inline-block;margin-left:6px;background:#fff4d6;color:#8a5a00;border-radius:999px;padding:4px 12px;font:700 12px Arial,sans-serif">SPEAKS SPANISH</span>' : "";
  return `<!doctype html><html><body style="margin:0;background:#f2f5f9;padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e1e7ef">
<tr><td style="background:#0b1f3a;padding:18px 24px;color:#ffffff;font:700 16px Arial,sans-serif;letter-spacing:.02em">MR.MARKETPLACE <span style="font-weight:400;color:#9fb1c8">· ${htmlEsc(label)}</span></td></tr>
<tr><td style="padding:24px 24px 8px">${badge}${es}
<div style="margin:14px 0 4px;color:#0b1f3a;font:700 26px Arial,sans-serif">${htmlEsc(b.name)}</div>
<div style="color:#5b6b80;font:15px Arial,sans-serif">${htmlEsc(b.phone || "")}${b.email ? " · " + htmlEsc(b.email) : ""}</div></td></tr>
<tr><td style="padding:16px 24px 8px">${buttons}</td></tr>
<tr><td style="padding:4px 24px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9eef4">${facts}</table></td></tr>
<tr><td style="padding:14px 24px;background:#f7f9fc;color:#8392a5;font:12px Arial,sans-serif">Lead ${htmlEsc(b.lead_id || "")} · ${htmlEsc(String(b.created || "").replace("T", " ").slice(0, 16))} UTC. Only contact this person the ways they agreed to.</td></tr>
</table></td></tr></table></body></html>`;
}
export async function alert(L, cfg, event = "new_lead", extra = {}) {
  const body = { ...flatten(L, event), ...extra };
  const urls = new Set([cfg.webhook, L.agent?.webhook].filter(Boolean));
  if (L.qualification?.category === "A" && L.qualification_status === "complete" && ["new_lead", "qualified"].includes(event) && cfg.priorityWebhook) urls.add(cfg.priorityWebhook);
  const jobs = [...urls].map((u) => fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {}));
  const to = [cfg.alertEmail, L.agent?.email].filter(Boolean);
  if (cfg.resendKey && to.length) {
    const hot = body.priority === "A - CALL NOW";
    const label = { new_lead: "New lead", qualified: "Lead finished qualifying", repeat_request: "Returning lead" }[event] || event.replace(/_/g, " ");
    const subject = oneLine(`${hot ? "🔥 CALL NOW: " : ""}${label}: ${body.name}, ${body.state}${body.language === "SPANISH" ? " (Spanish)" : ""}`);
    // one email per person, so a recipient Resend won't accept (e.g. before your domain is verified) never blocks yours
    for (const r of [...new Set(to.join(",").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean))])
      jobs.push(fetch("https://api.resend.com/emails", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${cfg.resendKey}` },
        body: JSON.stringify({ from: cfg.alertFrom, to: [r], subject, html: leadEmailHtml(body, label, hot), text: leadEmailText(body, label) }) }).catch(() => {}));
  }
  await Promise.all(jobs);
}

/* ---------- CRM authentication ----------
   Passwords are only sent once, to /api/agent/login, which returns a signed session token valid for 12 hours.
   Changing a password (or SESSION_SECRET) signs that person out everywhere.
   Passwords shorter than 12 characters are refused. Optional: CRM_ALLOWED_IPS=1.2.3.4,5.6.7.8 */
export const MIN_PW = 12, SESSION_HOURS = 12;
const pwHash = (pw) => createHash("sha256").update("mm-pw:" + pw).digest("hex").slice(0, 16);
const secret = (cfg) => process.env.SESSION_SECRET || createHash("sha256").update("mm-session:" + (cfg.adminPassword || "") + JSON.stringify((cfg.envAgents || cfg.agents).map((a) => a.password || ""))).digest("hex");
export function users(cfg) {
  const list = [];
  if (cfg.adminPassword && cfg.adminPassword.length >= MIN_PW) list.push({ role: "admin", id: "admin", name: process.env.ADMIN_NAME || "Admin", pw: cfg.adminPassword });
  for (const a of cfg.agents) {
    if (a.advisor) { if (a.pwh && a.active !== false) list.push({ role: "agent", id: a.id, name: a.name, email: a.email, pwh: a.pwh, pwv: a.pwv, advisor: true }); }
    else if (a.password && a.password.length >= MIN_PW && a.active !== false) list.push({ role: "agent", id: a.id, name: a.name, pw: a.password });
  }
  return list;
}
export function ipAllowed(ip) {
  const allow = (process.env.CRM_ALLOWED_IPS || "").split(",").map((x) => x.trim()).filter(Boolean);
  return !allow.length || allow.includes(ip);
}
export function checkPassword(cfg, pw, email) {
  if (email) {   // advisors sign in with email + password
    const e = String(email).trim().toLowerCase();
    const u = users(cfg).find((x) => x.advisor && (x.email || "").toLowerCase() === e);
    const ok = verifyPw(pw, u ? u.pwh : DUMMY_HASH);   // always do the slow check so timing doesn't reveal which emails exist
    return u && ok ? u : null;
  }
  let hit = null;
  for (const u of users(cfg)) if (!u.advisor && same(pw, u.pw) && !hit) hit = u; // check every user so timing doesn't reveal which one matched
  return hit;
}
const sessionTag = (u) => u.pwv || pwHash(u.pw);
export function issue(cfg, u) {
  const p = Buffer.from(JSON.stringify({ r: u.role, i: u.id, h: sessionTag(u), e: Date.now() + SESSION_HOURS * 36e5 })).toString("base64url");
  return p + "." + createHmac("sha256", secret(cfg)).update(p).digest("base64url");
}
export function who(req, cfg) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const [p, sig] = t.split(".");
  if (!p || !sig || t.length > 600) return null;
  if (!same(sig, createHmac("sha256", secret(cfg)).update(p).digest("base64url"))) return null;
  let d; try { d = JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
  if (!d || d.e < Date.now()) return null;
  const u = users(cfg).find((x) => x.id === d.i && x.role === d.r);
  if (!u || !same(sessionTag(u), d.h)) return null;
  return { role: u.role, id: u.id, name: u.name, advisor: !!u.advisor };
}
export const STATUSES = ["received", "assigned", "contacted", "quoting", "application", "enrolled", "lost"];
export const OPEN = (s) => !["enrolled", "lost"].includes(s);

/* ---------- customer confirmation email (Resend) ---------- */
export async function confirm(L, cfg) {
  if (!cfg.resendKey || !cfg.confirmEmail || !L.consents?.email?.given || !L.contact?.email) return;
  const link = htmlEsc(`${cfg.siteUrl}${L.language === "es" ? "/es/estado/" : "/status/"}?id=${encodeURIComponent(L.id)}&t=${encodeURIComponent(L.token)}`);
  const es = L.language === "es";
  const who = es ? (L.agent?.name ? `${L.agent.name}, profesional de seguros con licencia,` : "Un profesional de seguros con licencia") : (L.agent?.name ? `${L.agent.name}, a licensed insurance professional,` : "A licensed insurance professional");
  const how = es ? ({ text: "mensaje de texto", email: "correo electrónico" }[L.contact.preferred] || "teléfono") : (L.contact.preferred === "text" ? "text" : L.contact.preferred === "email" ? "email" : "phone");
  const html = es ? `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f1b2d;max-width:560px">
    <p>Hola, ${htmlEsc(L.contact.first)}:</p>
    <p>Gracias por comenzar su revisión de cobertura con Mr. Marketplace. Recibimos su solicitud. ${htmlEsc(who)} se comunicará con usted por ${how} en breve.</p>
    <p><a href="${link}" style="display:inline-block;background:#0b1f3a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Ver el estado de mi solicitud</a></p>
    <p style="font-size:12px;color:#6b7a8f">Mr. Marketplace le conecta con profesionales de seguros con licencia. No es CuidadoDeSalud.gov ni HealthCare.gov. Recibió este mensaje porque solicitó una revisión de cobertura y aceptó recibir correos electrónicos. Responda para darse de baja.</p></div>` : `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f1b2d;max-width:560px">
    <p>Hi ${htmlEsc(L.contact.first)},</p>
    <p>Thanks for starting your coverage review with Mr. Marketplace. Your request has been received. ${htmlEsc(who)} will reach out by ${how} shortly.</p>
    <p><a href="${link}" style="display:inline-block;background:#0b1f3a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Track your request</a></p>
    <p style="font-size:12px;color:#6b7a8f">Mr. Marketplace connects you with licensed insurance professionals. It is not HealthCare.gov. You received this because you requested a coverage review and agreed to email. Reply to opt out.</p></div>`;
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${cfg.resendKey}` },
    body: JSON.stringify({ from: cfg.alertFrom, to: [L.contact.email], subject: es ? "Su revisión de cobertura ha comenzado" : "Your coverage review has started", html }) }).catch(() => {});
}

/* ---------- paid advisors ($500/week) ----------
   Stored in Blobs as advisor/<id>. Only "active" advisors whose payment is current get leads or can sign in. */
export const ADV_STATUSES = ["applied", "approved", "active", "past_due", "paused", "canceled", "rejected"];
export const ADV_ID_RE = /^[a-f0-9]{12}$/;
export const hashPw = (pw) => { const salt = randomBytes(16).toString("hex"); return salt + ":" + scryptSync(pw, salt, 32).toString("hex"); };
export function verifyPw(pw, stored) {
  const [salt, h] = String(stored || "").split(":");
  if (!salt || !h) return false;
  try { return timingSafeEqual(Buffer.from(h, "hex"), scryptSync(String(pw), salt, 32)); } catch { return false; }
}
const DUMMY_HASH = "00000000000000000000000000000000:" + "0".repeat(64);
export const advisorLive = (a, now = Date.now()) => !!a && a.status === "active" && (!a.paid_through || Date.parse(a.paid_through) > now);
export async function listAdvisors(store) {
  const { blobs } = await store.list({ prefix: "advisor/" });
  return (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
}
export async function loadAdvisors(cfg, store) {
  if (cfg._adv) return cfg;
  cfg._adv = true;
  try {
    for (const a of await listAdvisors(store)) cfg.agents.push({ id: a.id, name: a.name, phone: a.phone, email: a.email, title: "Licensed Mr. Marketplace Advisor",
      states: a.states || [], products: ["*"], active: advisorLive(a), advisor: true, pwh: a.pwh, pwv: a.pwv });
  } catch {}
  return cfg;
}
export async function notifyOwner(cfg, subject, lines) {
  if (!cfg.resendKey || !cfg.alertEmail) return;
  const html = `<div style="font:15px/1.6 Arial,sans-serif;color:#1c2733">${lines.map((l) => `<p style="margin:0 0 8px">${htmlEsc(l)}</p>`).join("")}</div>`;
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${cfg.resendKey}` },
    body: JSON.stringify({ from: cfg.alertFrom, to: cfg.alertEmail.split(",").map((x) => x.trim()).filter(Boolean), subject: oneLine(subject), html, text: lines.join("\n") }) }).catch(() => {});
}
