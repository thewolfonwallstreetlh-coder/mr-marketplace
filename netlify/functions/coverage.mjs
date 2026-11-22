import { db, ipOf, limit, safeUrl, body } from "../lib/common.mjs";
// Mr. Marketplace: doctor, hospital and prescription checks against real Marketplace plan data (CMS Marketplace API)
//   GET  /api/coverage?action=providers&q=smith&zip=33139&type=Individual|Facility
//   GET  /api/coverage?action=drugs&q=lisinopril
//   GET  /api/coverage?action=plan&id=12345FL0010001&year=2027
//   POST /api/coverage {action:"check", npis:[], rxcuis:[], planids:[], year}
//   POST /api/coverage {action:"estimate", zip, ages:[], income, year, tobacco}  -> official tax-credit estimate (no contact info needed)
const API = "https://marketplace.api.healthcare.gov/api/v1";
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const arr = (d) => (d && (d.coverage || d["Provider & Drug Coverage"] || Object.values(d).find(Array.isArray))) || [];
const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const clean = (s, n = 60) => String(s || "").replace(/[^\w\s.,'&-]/g, "").trim().slice(0, n);

export default async (req, context) => {
  const _ip = ipOf(req, context);
  if (!(await limit(db(), "coverage", _ip, 400, 3600))) return json({ ok: false, reason: "rate_limited" }, 429);
  const key = process.env.CMS_API_KEY;
  if (!key) return json({ ok: false, reason: "not_configured" });
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("year")) || new Date().getFullYear();
  try {
    if (req.method === "GET") {
      const a = u.searchParams.get("action"), q = clean(u.searchParams.get("q"));
      if (a === "providers") {
        const zip = String(u.searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
        const type = u.searchParams.get("type") === "Facility" ? "Facility" : "Individual";
        if (q.length < 2 || zip.length !== 5) return json({ ok: false, reason: "bad_request" }, 400);
        const d = await get(`${API}/providers/search?apikey=${key}&year=${year}&zipcode=${zip}&type=${type}&q=${encodeURIComponent(q)}`);
        const list = ((d && d.providers) || []).slice(0, 12).map((x) => {
          const p = x.provider || {}, ad = x.address || {};
          return { npi: String(p.npi || ""), name: p.name || "", type: p.type || type, specialties: (p.specialties || []).slice(0, 2),
            facility_types: (p.facility_types || []).slice(0, 2), accepting: p.accepting || "",
            address: [ad.street_1, ad.city, ad.state].filter(Boolean).join(", "), distance: x.distance != null ? Math.round(x.distance * 10) / 10 : null };
        }).filter((p) => p.npi);
        return json({ ok: true, providers: list });
      }
      if (a === "drugs") {
        if (q.length < 3) return json({ ok: true, drugs: [] });
        const d = await get(`${API}/drugs/autocomplete?apikey=${key}&year=${year}&q=${encodeURIComponent(q)}`);
        const list = ((d && (d.drugs || (Array.isArray(d) ? d : []))) || []).slice(0, 12).map((x) => ({ rxcui: String(x.rxcui || ""), name: x.full_name || [x.name, x.strength, x.route].filter(Boolean).join(" ") })).filter((x) => x.rxcui);
        return json({ ok: true, drugs: list });
      }
      if (a === "plan") {
        const id = String(u.searchParams.get("id") || "").replace(/[^\w-]/g, "").slice(0, 20);
        const d = await get(`${API}/plans/${id}?apikey=${key}&year=${year}`);
        const p = d && (d.plan || d);
        if (!p || !p.id) return json({ ok: false, reason: "not_found" });
        const benefits = (p.benefits || []).filter((b) => b.covered !== false).map((b) => {
          const cs = (b.cost_sharings || []).find((c) => /in-?network/i.test(c.network_tier || "")) || (b.cost_sharings || [])[0] || {};
          return { name: b.name, cost: (cs.display_string || "").replace(/\s+/g, " ").trim(), limits: b.has_limits ? `${b.limit_quantity || ""} ${b.limit_unit || ""}`.trim() : "", note: (b.explanation || "").slice(0, 200) };
        }).filter((b) => b.cost);
        return json({ ok: true, id: p.id, benefits, network_url: safeUrl(p.network_url), formulary_url: safeUrl(p.formulary_url), benefits_url: safeUrl(p.benefits_url), brochure: safeUrl(p.brochure_url) });
      }
      return json({ ok: false, reason: "bad_request" }, 400);
    }
    if (req.method === "POST") {
      const b = (await body(req, 16384)) || {};
      if (b.action === "estimate") {
        const zip = String(b.zip || "").replace(/\D/g, "").slice(0, 5);
        const ages = (Array.isArray(b.ages) ? b.ages : []).slice(0, 12).map(Number).filter((a) => a >= 0 && a < 65);
        const income = Math.max(0, Math.min(1e8, Number(b.income) || 0)), yr = Number(b.year) || year;
        if (zip.length !== 5 || !ages.length) return json({ ok: false, reason: "bad_request" }, 400);
        const cr = await get(`${API}/counties/by/zip/${zip}?apikey=${key}&year=${yr}`);
        const c = cr && (cr.counties || [])[0];
        if (!c) return json({ ok: false, reason: "zip_not_found" });
        const tob = !!b.tobacco, spouse = !!b.spouse;
        const people = ages.map((age, i) => ({ age, aptc_eligible: true, uses_tobacco: tob && age >= 18, relationship: i === 0 ? "Self" : (i === 1 && spouse ? "Spouse" : "Child") }));
        const household = { income, people, has_married_couple: spouse };
        const place = { countyfips: c.fips, state: c.state, zipcode: zip };
        const post = (path, payload) => fetch(`${API}${path}?apikey=${key}&year=${yr}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const [fpl, est, plans] = await Promise.all([
          get(`${API}/households/pcfpl?apikey=${key}&year=${yr}&state=${c.state}&size=${ages.length}&income=${Math.round(income)}`),
          post("/households/eligibility/estimates", { household, place, market: "Individual", year: yr }),
          post("/plans/search", { household, place, market: "Individual", year: yr, order: "asc", sort: "premium", offset: 0 })
        ]);
        if (!plans) return json({ ok: false, reason: "state_exchange", state: c.state, county: c.name, pcfpl: fpl?.pc_fpl ?? null });
        const e = (est && est.estimates && est.estimates[0]) || {};
        const ps = (plans.plans || []).filter((p) => typeof p.premium === "number");
        const low = ps.slice().sort((a, b) => (a.premium_w_credit ?? a.premium) - (b.premium_w_credit ?? b.premium))[0];
        const credit = Math.max(Number(e.aptc) || 0, ...ps.map((p) => (p.premium_w_credit != null ? p.premium - p.premium_w_credit : 0)));
        return json({ ok: true, year: yr, state: c.state, county: c.name, pcfpl: fpl?.pc_fpl ?? null, credit: Math.round(credit * 100) / 100,
          csr: typeof e.csr === "string" ? e.csr.slice(0, 60) : "", medicaid: !!e.is_medicaid_chip, total_plans: plans.total || ps.length,
          lowest: low ? { premium: low.premium, after_credit: low.premium_w_credit ?? low.premium, metal: low.metal_level || "" } : null });
      }
      const npis = (b.npis || []).map(String).filter((x) => /^\d{10}$/.test(x)).slice(0, 10);
      const rx = (b.rxcuis || []).map(String).filter((x) => /^\d{1,10}$/.test(x)).slice(0, 10);
      const plans = (b.planids || []).map(String).filter((x) => /^[\w-]{3,20}$/.test(x)).slice(0, 300);
      const yr = Number(b.year) || year, out = {};
      if (!plans.length || (!npis.length && !rx.length)) return json({ ok: true, coverage: out });
      const chunks = []; for (let i = 0; i < plans.length; i += 30) chunks.push(plans.slice(i, i + 30));
      const jobs = [];
      for (const c of chunks) {
        if (npis.length) jobs.push(() => get(`${API}/providers/covered?apikey=${key}&year=${yr}&providerids=${npis.join(",")}&planids=${c.join(",")}`).then((d) => arr(d).forEach((x) => { ((out[x.plan_id] ||= { p: {}, d: {} }).p[String(x.npi)] = x.coverage); })));
        if (rx.length) jobs.push(() => get(`${API}/drugs/covered?apikey=${key}&year=${yr}&drugs=${rx.join(",")}&planids=${c.join(",")}`).then((d) => arr(d).forEach((x) => { ((out[x.plan_id] ||= { p: {}, d: {} }).d[String(x.rxcui)] = x.coverage); })));
      }
      for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map((f) => f()));
      return json({ ok: true, coverage: out });
    }
    return json({ error: "method" }, 405);
  } catch (e) { return json({ ok: false, reason: "upstream_error" }); }
};
export const config = { path: "/api/coverage" };
