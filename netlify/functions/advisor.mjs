// Mr. Marketplace advisor program ($500/week): applications, approval, payment and sign-in setup
// POST /api/advisor/apply   public application form on /agents/
// POST /api/advisor/setup   advisor sets their CRM password from the invite link
// GET  /api/advisor/admin   owner: list advisors          (CRM admin session)
// POST /api/advisor/admin   owner: approve / activate / pause / states ...
// POST /api/advisor/stripe  Stripe webhook (checkout + weekly invoices)
import { createHmac } from "node:crypto";
import { json, db, settings, who, body, ipOf, limit, tooMany, rid, str, NAMES, MIN_PW, same, ipAllowed,
  loadAdvisors, listAdvisors, hashPw, advisorLive, notifyOwner, ADV_ID_RE } from "../lib/common.mjs";

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,180}\.[a-z]{2,24}$/i;
const PRICE_TEXT = "$500/week";
const key = (id) => `advisor/${id}`;
const pub = ({ pwh, pwv, invite, ...a }) => ({ ...a, has_password: !!pwh, invite_pending: !!invite });
const site = (req, cfg) => (cfg.siteUrl || new URL(req.url).origin).replace(/\/$/, "");
const payLink = (a) => {
  const base = process.env.STRIPE_PAYMENT_LINK || "";
  if (!/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(base)) return "";
  const u = new URL(base); u.searchParams.set("client_reference_id", a.id); if (a.email) u.searchParams.set("prefilled_email", a.email);
  return u.href;
};
const log = (a, type, extra = {}) => { (a.history ||= []).push({ t: new Date().toISOString(), type, ...extra }); if (a.history.length > 200) a.history = a.history.slice(-200); };

export default async (req, context) => {
  const cfg = settings(), store = db(), ip = ipOf(req, context), u = new URL(req.url), path = u.pathname, now = new Date().toISOString();

  /* ---------- Stripe webhook ---------- */
  if (path.endsWith("/stripe")) {
    if (req.method !== "POST") return json({ ok: false }, 405);
    const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!whsec) return json({ ok: false, error: "not_configured" }, 503);
    const raw = await req.text();
    if (raw.length > 512 * 1024) return json({ ok: false }, 413);
    const sig = req.headers.get("stripe-signature") || "";
    const v1 = [];
    let t = 0;
    for (const p of sig.split(",")) { const [k, v] = p.split("="); if (k === "t") t = Number(v); if (k === "v1" && v) v1.push(v); }
    const expect = createHmac("sha256", whsec).update(`${t}.${raw}`).digest("hex");
    if (!t || Math.abs(Date.now() / 1000 - t) > 300 || !v1.some((x) => same(x, expect))) return json({ ok: false, error: "bad_signature" }, 400);
    let ev; try { ev = JSON.parse(raw); } catch { return json({ ok: false }, 400); }
    if (!ev?.id || await store.get(`stripeevt/${ev.id}`)) return json({ ok: true, duplicate: true });
    await store.setJSON(`stripeevt/${ev.id}`, { t: now, type: ev.type });
    const o = ev.data?.object || {};
    let a = null;
    if (ev.type === "checkout.session.completed" && ADV_ID_RE.test(o.client_reference_id || "")) a = await store.get(key(o.client_reference_id), { type: "json" });
    if (!a && o.customer) { const m = await store.get(`stripecust/${o.customer}`, { type: "json" }); if (m?.id) a = await store.get(key(m.id), { type: "json" }); }
    if (!a) return json({ ok: true, ignored: true });
    const before = a.status, week = 8 * 864e5;   // 7 days + 1 day of grace
    if (ev.type === "checkout.session.completed") {
      a.stripe_customer = o.customer || a.stripe_customer; a.stripe_subscription = o.subscription || a.stripe_subscription;
      if (o.customer) await store.setJSON(`stripecust/${o.customer}`, { id: a.id });
      if (["approved", "past_due", "active", "canceled"].includes(a.status)) { a.status = "active"; a.paid_through = new Date(Date.now() + week).toISOString(); }
      log(a, "paid", { amount: o.amount_total ?? null });
    } else if (ev.type === "invoice.paid" || ev.type === "invoice.payment_succeeded") {
      const end = (o.lines?.data?.[0]?.period?.end || 0) * 1000;
      const until = Math.max(Date.parse(a.paid_through || 0) || 0, end ? end + 864e5 : Date.now() + week);
      a.paid_through = new Date(until).toISOString();
      if (["approved", "past_due", "active"].includes(a.status)) a.status = "active";
      log(a, "renewed", { amount: o.amount_paid ?? null });
    } else if (ev.type === "invoice.payment_failed") {
      if (a.status === "active") a.status = "past_due";
      log(a, "payment_failed");
    } else if (ev.type === "customer.subscription.deleted") {
      if (!["rejected", "paused"].includes(a.status)) a.status = "canceled";
      log(a, "subscription_canceled");
    } else if (ev.type === "customer.subscription.updated" && ["past_due", "unpaid"].includes(o.status)) {
      if (a.status === "active") a.status = "past_due";
      log(a, "subscription_" + o.status);
    } else return json({ ok: true, ignored: true });
    a.updated = now;
    await store.setJSON(key(a.id), a);
    if (before !== a.status) await notifyOwner(cfg, `Advisor ${a.name}: ${before} → ${a.status}`, [`${a.name} (${a.email}) is now ${a.status}.`, `Paid through: ${a.paid_through || "-"}`]);
    return json({ ok: true });
  }

  if (req.method === "OPTIONS") return json({ ok: true });

  /* ---------- public application ---------- */
  if (path.endsWith("/apply")) {
    if (req.method !== "POST") return json({ ok: false }, 405);
    if (!(await limit(store, "apply", ip, 5, 3600))) return tooMany();
    const b = await body(req, 8192);
    if (!b) return json({ ok: false, error: "bad_request" }, 400);
    if (b.website) return json({ ok: true });   // honeypot
    const first = str(b.first, 60), last = str(b.last, 60), email = str(b.email, 120).toLowerCase(), phone = str(b.phone, 20).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    const npn = str(b.npn, 12).replace(/\D/g, ""), states = [...new Set((Array.isArray(b.states) ? b.states : []).map((x) => str(x, 2).toUpperCase()).filter((x) => NAMES[x]))];
    const bad = [];
    if (!first) bad.push("first"); if (!last) bad.push("last"); if (!EMAIL_RE.test(email)) bad.push("email"); if (phone.length !== 10) bad.push("phone");
    if (npn.length < 3 || npn.length > 10) bad.push("npn"); if (!states.length) bad.push("states"); if (b.agree !== true) bad.push("agree");
    if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 400);
    const all = await listAdvisors(store);
    if (all.some((a) => a.email === email && a.status !== "rejected")) return json({ ok: true });   // already applied; don't reveal
    const a = { id: rid(6), created: now, updated: now, status: "applied", name: `${first} ${last}`, first, last, email, phone: `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`,
      npn, states, ffm_registered: b.ffm === true, languages: (Array.isArray(b.languages) ? b.languages : []).filter((x) => ["English", "Spanish"].includes(x)),
      experience: str(b.experience, 40), note: str(b.note, 600), terms_version: "advisor-2026-11", terms_accepted_at: now, ip, history: [] };
    log(a, "applied");
    await store.setJSON(key(a.id), a);
    await notifyOwner(cfg, `New advisor application: ${a.name} (${states.join(", ")})`, [`${a.name} applied to become a Mr. Marketplace advisor.`, `Email: ${email} · Phone: ${a.phone}`, `NPN: ${npn} · States: ${states.join(", ")}`, `FFM registered: ${a.ffm_registered ? "Yes" : "No"}`, `Review it in your CRM under Advisors: ${site(req, cfg)}/crm/#advisors`]);
    return json({ ok: true });
  }

  /* ---------- advisor sets their password from the invite link ---------- */
  if (path.endsWith("/setup")) {
    if (req.method !== "POST") return json({ ok: false }, 405);
    if (!(await limit(store, "setup", ip, 10, 3600))) return tooMany();
    const b = await body(req, 2048);
    const token = str(b?.token, 64);
    if (!/^[a-f0-9]{32}$/.test(token)) return json({ ok: false, error: "invalid_link" }, 400);
    const ref = await store.get(`invite/${token}`, { type: "json" });
    const a = ref?.id ? await store.get(key(ref.id), { type: "json" }) : null;
    if (!a || a.invite !== token || Date.parse(ref.exp) < Date.now()) return json({ ok: false, error: "invalid_link" }, 400);
    if (b.check) return json({ ok: true, name: a.first, email: a.email });
    const pw = typeof b.password === "string" ? b.password : "";
    if (pw.length < MIN_PW || pw.length > 200) return json({ ok: false, error: "weak_password", min: MIN_PW }, 400);
    a.pwh = hashPw(pw); a.pwv = rid(8); delete a.invite; a.updated = now; log(a, "password_set");
    await store.setJSON(key(a.id), a); await store.delete(`invite/${token}`).catch(() => {});
    return json({ ok: true, email: a.email, active: advisorLive(a) });
  }

  /* ---------- owner controls (admin CRM session) ---------- */
  if (path.endsWith("/admin")) {
    if (!ipAllowed(ip)) return json({ ok: false, error: "unauthorized" }, 401);
    await loadAdvisors(cfg, store);
    const me = who(req, cfg);
    if (!me || me.role !== "admin") return json({ ok: false, error: "unauthorized" }, 401);
    if (!(await limit(store, "advadmin", me.id, 300, 600))) return tooMany();
    const setup = { payment_link: !!payLink({ id: "000000000000" }), webhook: !!process.env.STRIPE_WEBHOOK_SECRET, alerts: !!(cfg.resendKey && cfg.alertEmail), price: PRICE_TEXT };
    if (req.method === "GET") {
      const advisors = await listAdvisors(store);
      const { blobs } = await store.list({ prefix: "lead/" });
      const since = Date.now() - 7 * 864e5, counts = {};
      for (const l of (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean))
        if (l.agent?.id && Date.parse(l.created) > since) counts[l.agent.id] = (counts[l.agent.id] || 0) + 1;
      advisors.sort((x, y) => (y.created || "").localeCompare(x.created || ""));
      return json({ ok: true, setup, advisors: advisors.map((a) => ({ ...pub(a), live: advisorLive(a), leads_7d: counts[a.id] || 0, pay_link: payLink(a) })) });
    }
    if (req.method !== "POST") return json({ ok: false }, 405);
    const b = await body(req, 8192);
    if (!b || !ADV_ID_RE.test(b.id || "")) return json({ ok: false, error: "bad_request" }, 400);
    const a = await store.get(key(b.id), { type: "json" });
    if (!a) return json({ ok: false, error: "not_found" }, 404);
    const act = b.action;
    let invite = "";
    const newInvite = async () => {
      if (a.invite) await store.delete(`invite/${a.invite}`).catch(() => {});
      a.invite = rid(16); invite = `${site(req, cfg)}/crm/#setup=${a.invite}`;
      await store.setJSON(`invite/${a.invite}`, { id: a.id, exp: new Date(Date.now() + 14 * 864e5).toISOString() });
    };
    if (act === "approve") { if (!["applied", "rejected"].includes(a.status)) return json({ ok: false, error: "bad_state" }, 409); a.status = "approved"; if (!a.pwh) await newInvite(); }
    else if (act === "invite") { await newInvite(); }
    else if (act === "activate") { a.status = "active"; const days = Math.min(Math.max(Number(b.days) || 7, 1), 365); a.paid_through = new Date(Math.max(Date.now(), Date.parse(a.paid_through || 0) || 0) + days * 864e5).toISOString(); }
    else if (act === "pause") a.status = "paused";
    else if (act === "resume") a.status = advisorLive({ ...a, status: "active" }) ? "active" : "approved";
    else if (act === "cancel") a.status = "canceled";
    else if (act === "reject") a.status = "rejected";
    else if (act === "states") { const st = [...new Set((Array.isArray(b.states) ? b.states : []).map((x) => str(x, 2).toUpperCase()).filter((x) => NAMES[x]))]; if (!st.length) return json({ ok: false, error: "states" }, 400); a.states = st; }
    else if (act === "email") { const e = str(b.email, 120).toLowerCase(); if (!EMAIL_RE.test(e)) return json({ ok: false, error: "email" }, 400); a.email = e; }
    else if (act === "npn_verified") { a.npn_verified = now; }
    else if (act === "delete") { if (a.invite) await store.delete(`invite/${a.invite}`).catch(() => {}); await store.delete(key(a.id)); return json({ ok: true, deleted: true }); }
    else return json({ ok: false, error: "bad_action" }, 400);
    log(a, act, { by: me.name }); a.updated = now;
    await store.setJSON(key(a.id), a);
    return json({ ok: true, advisor: { ...pub(a), live: advisorLive(a), pay_link: payLink(a) }, invite_link: invite });
  }
  return json({ ok: false, error: "not_found" }, 404);
};

export const config = { path: ["/api/advisor/apply", "/api/advisor/setup", "/api/advisor/admin", "/api/advisor/stripe"] };
