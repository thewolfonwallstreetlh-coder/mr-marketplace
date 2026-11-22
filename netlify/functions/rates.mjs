import { db, ipOf, limit, safeUrl, body } from "../lib/common.mjs";
// Mr. Marketplace — real Marketplace rates from EVERY carrier in the customer's area
// Uses the CMS Marketplace API (the data behind HealthCare.gov Window Shop / Plan Compare).
// The API returns 10 plans per request, so this pages through all of them with `offset`.
// Set CMS_API_KEY in Netlify. Free key: https://developer.cms.gov/marketplace-api/key-request.html

const API = "https://marketplace.api.healthcare.gov/api/v1";
const PAGE = 10, MAX_PLANS = 300;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Key copays from the benefits included in search results
const BEN = { pcp: /primary care/i, spec: /specialist/i, generic: /generic drugs/i, er: /emergency room/i, urgent: /urgent care/i };
function copays(benefits) {
  const out = {};
  for (const [k, re] of Object.entries(BEN)) {
    const b = (benefits || []).find((x) => re.test(x.name || ""));
    const cs = b && (b.cost_sharings || []).find((c) => /in-?network/i.test(c.network_tier || "")) || (b && (b.cost_sharings || [])[0]);
    if (cs && cs.display_string) out[k] = cs.display_string.replace(/\s+/g, " ").trim();
  }
  return out;
}

// Pick the in-network amount that matches the household (individual vs family), preferring medical/combined costs
function pickCost(arr, family) {
  if (!Array.isArray(arr) || !arr.length) return null;
  const inNet = arr.filter((d) => !d.network_tier || /in-?network/i.test(d.network_tier) || d.network_tier === "In-Network");
  const pool = inNet.length ? inNet : arr;
  const wantFam = family ? /^family$/i : /^individual$/i;
  const score = (d) => (wantFam.test(d.family_cost || "") ? 4 : 0) + (/combined/i.test(d.type || "") ? 2 : /medical/i.test(d.type || "") ? 1 : 0);
  const best = pool.slice().sort((a, b) => score(b) - score(a))[0];
  return best && typeof best.amount === "number" ? best.amount : null;
}

export default async (req, context) => {
  const _ip = ipOf(req, context);
  if (!(await limit(db(), "rates", _ip, 40, 3600))) return json({ ok: false, reason: "rate_limited" }, 429);
  const key = process.env.CMS_API_KEY;
  // Status check: open https://yoursite.com/api/rates in a browser to confirm live plans are working
  if (req.method === "GET") {
    if (!key) return json({ live_plans: false, problem: "CMS_API_KEY is not set in Netlify > Site configuration > Environment variables. Add it, then redeploy." });
    const yr = new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const t = await fetch(`${API}/counties/by/zip/33139?apikey=${key}&year=${yr}`).catch(() => null);
    if (!t || t.status === 401 || t.status === 403) return json({ live_plans: false, problem: "CMS_API_KEY is set but was rejected. Check for typos, or request a new key (they expire)." });
    return json({ live_plans: t.ok, problem: t.ok ? null : `The Marketplace data service returned ${t.status}. Try again shortly.` });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!key) return json({ ok: false, reason: "not_configured" });

  const b = await body(req, 8192);
  if (!b) return json({ ok: false, reason: "bad_request" }, 400);
  const zip = String(b.zip || "").replace(/\D/g, "").slice(0, 5);
  const ages = (Array.isArray(b.ages) ? b.ages : []).slice(0, 12).map(Number).filter((a) => a >= 0 && a < 65);
  const income = Math.max(0, Number(b.income) || 0);
  const year = Number(b.year) || new Date().getFullYear();
  if (zip.length !== 5 || !ages.length) return json({ ok: false, reason: "bad_request" }, 400);
  const family = ages.length > 1;

  try {
    // 1) ZIP -> county
    const cr = await fetch(`${API}/counties/by/zip/${zip}?apikey=${key}&year=${year}`);
    if (!cr.ok) return json({ ok: false, reason: "zip_lookup_failed" });
    const counties = (await cr.json()).counties || [];
    if (!counties.length) return json({ ok: false, reason: "zip_not_found" });
    const c = counties[0];

    // 2) plan search, every page
    const tob = !!b.tobacco;
    const people = ages.map((age, i) => ({ age, aptc_eligible: true, uses_tobacco: tob && age >= 18, relationship: i === 0 ? "Self" : (i === 1 && b.spouse ? "Spouse" : "Child") }));
    const base = { household: { income, people, has_married_couple: !!b.spouse }, market: "Individual",
      place: { countyfips: c.fips, state: c.state, zipcode: zip }, year, order: "asc", sort: "premium" };
    const page = (offset) => fetch(`${API}/plans/search?apikey=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, offset }) })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);

    const first = await page(0);
    if (!first || !(first.plans || []).length) return json({ ok: false, reason: "state_exchange", state: c.state, county: c.name }); // state-run marketplaces aren't in this data
    const total = Math.min(first.total || (first.plans || []).length, MAX_PLANS);
    const offsets = []; for (let o = PAGE; o < total; o += PAGE) offsets.push(o);
    const rest = [];
    for (let i = 0; i < offsets.length; i += 8) rest.push(...await Promise.all(offsets.slice(i, i + 8).map(page))); // 8 at a time
    const raw = [first, ...rest].filter(Boolean).flatMap((d) => d.plans || []);

    const seen = new Set();
    const plans = raw.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id)).map((p) => ({
      id: p.id, name: p.name, issuer: p.issuer && p.issuer.name, metal: p.metal_level, type: p.type,
      premium: p.premium, premium_w_credit: p.premium_w_credit,
      deductible: pickCost(p.deductibles, family), moop: pickCost(p.moops, family),
      hsa: !!p.hsa_eligible, rating: p.quality_rating && p.quality_rating.available ? p.quality_rating.global_rating : null,
      national: !!p.has_national_network, brochure: safeUrl(p.brochure_url), benefits_url: safeUrl(p.benefits_url),
      network_url: safeUrl(p.network_url), formulary_url: safeUrl(p.formulary_url), copays: copays(p.benefits),
      credit: p.premium_w_credit != null && p.premium_w_credit < p.premium ? +(p.premium - p.premium_w_credit).toFixed(2) : 0
    }));
    const carriers = [...new Set(plans.map((p) => p.issuer).filter(Boolean))].sort();
    const credit = Math.max(0, ...plans.map((p) => p.credit || 0));
    return json({ ok: true, state: c.state, county: c.name, zip, year, total: first.total || plans.length, plans, carriers, credit, income_entered: income > 0 });
  } catch (e) {
    return json({ ok: false, reason: "upstream_error" });
  }
};

export const config = { path: "/api/rates" };
