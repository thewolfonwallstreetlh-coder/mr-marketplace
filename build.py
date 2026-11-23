#!/usr/bin/env python3
"""Builds the Mr. Marketplace site into ./dist.
Edit settings and page content in content.py, then run:  python3 build.py
"""
import json, os, shutil, datetime
from content import SITE, PRODUCTS, HOME_FAQ, PAGES, ABOUT, PRIVACY, TERMS, UPDATED, E, I, GLOSSARY, HELP, LICENSES, YEARLY
from content_es import SITE_ES, PRODUCT_ES, HOME_FAQ_ES, HOME_ES, GLOSSARY_ES, HELP_ES
from tools_content import TOOLS

I = dict(I)
I.update({
 "health":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/><path d="M12 9v5M9.5 11.5h5"/></svg>',
 "business":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0110 4h4a1.5 1.5 0 011.5 1.5V7M3 12.5h18"/></svg>',
 "dental":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7.5 3.5c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7s1 5.5 2.5 5.5 1.5-4 4-4 2.5 4 4 4 2-2.5 2.5-5.5 2-4 2-7c0-2.5-1.5-4.5-4-4.5-2 0-3 1-4.5 1s-2.5-1-4.5-1z"/></svg>',
 "supplemental":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
 "compass":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
 "people":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2.2.1 4 1.5 4.8 4.4"/></svg>',
 "shield":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10.5 11V9.5a1.5 1.5 0 013 0V11"/></svg>',
 "calendar":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
 "chev":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 4l4 4-4 4"/></svg>',
})
LOGO_DARK = '<img src="/assets/brand/logo-compact-dark.png" alt="{b}" width="1000" height="254">'
NAV = [("How it works","/#how"),("Self-employed","/health-insurance-for-self-employed/"),("Business owners","/small-business-health-insurance/"),
       ("Free tools","/tools/"),("Help center","/help/")]
NAV_ES = [("Cómo funciona","/es/#how"),("Herramientas gratuitas","/es/herramientas/"),("Glosario","/es/glosario/"),("Ayuda","/es/ayuda/")]
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">'

def org_schema():
    s = SITE
    return {"@type":"InsuranceAgency","@id":s["domain"]+"/#org","name":s["brand"],"url":s["domain"]+"/","logo":s["domain"]+"/assets/brand/logo-full-dark.png",
            "telephone":s["phone"],"email":s["email"],"areaServed":"US","description":"Compare Marketplace health insurance plans from every insurance company in your area, with help from a licensed professional."}

def faq_schema(faqs):
    return {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]}

def faq_html(faqs):
    return '<div class="faq">' + "".join(f'<details><summary>{E(q)}</summary><div class="a">{E(a)}</div></details>' for q,a in faqs) + "</div>"

LANG = {"v": "en"}
def L(en, es): return es if LANG["v"] == "es" else en
def CALL(): return L("Call Mr. Marketplace", "Llamar a Mr. Marketplace")
# English page <-> Spanish page (hreflang tags + the language switch in the header)
ALT = {"/": "/es/", "/help/": "/es/ayuda/", "/glossary/": "/es/glosario/", "/contact/": "/es/contacto/", "/trust/": "/es/transparencia/",
       "/tools/": "/es/herramientas/", "/status/": "/es/estado/"}
for _t in TOOLS: ALT[_t["en"]["slug"]] = _t["es"]["slug"]
ALT_ES = {v: k for k, v in ALT.items()}

def legal_html():
    s = SITE
    if LANG["v"] == "es":
        return (f"<p>{E(s['brand'])} es un sitio para comparar seguros médicos operado por {E(s['legal_name'])}, agente de seguros médicos con licencia. {E(SITE_ES['states_line'])} "
                f"{E(s['brand'])} no es una aseguradora ni un sitio del gobierno. Los planes mostrados son planes del Mercado ofrecidos por las aseguradoras de su área. Enviar una solicitud le conecta con un agente con licencia que le ayudará con sus opciones. "
                f"Es posible que su agente no pueda inscribirle en todos los planes mostrados. Puede inscribirse en cualquier plan del Mercado en CuidadoDeSalud.gov o en el mercado de seguros de su estado.</p>"
                f"<p>Los precios del Mercado son estimados según la información que ingrese; las primas finales, la elegibilidad y los créditos fiscales se determinan al inscribirse. Los ahorros no están garantizados. "
                f"Enviar una solicitud no es una solicitud de seguro. Sin afiliación ni respaldo de CuidadoDeSalud.gov, HealthCare.gov, CMS, Medicare ni ninguna agencia del gobierno. Los documentos legales oficiales están en inglés. {E(s['address'])}</p>")
    return (f"<p>{E(s['brand'])} is a health insurance shopping website operated by {E(s['legal_name'])}, a licensed health insurance agent. {E(s['states_line'])} "
            f"{E(s['brand'])} is not an insurance company and not a government website. Plans shown are Marketplace plans offered by the insurance companies in your area. Submitting a request connects you with a licensed agent who will help you with your options. "
            f"Your agent may not be able to enroll you in every plan shown. You can enroll in any Marketplace plan at HealthCare.gov or your state's insurance marketplace.</p>"
            f"<p>Marketplace prices are estimates based on the information you enter; final premiums, eligibility and tax credits are determined at enrollment. Savings are not guaranteed. "
            f"Submitting a request is not an application for insurance. Not affiliated with or endorsed by HealthCare.gov, CMS, Medicare or any government agency. {E(s['address'])}</p>")

def head(title, desc, path, schema, noindex=False, extra_css=""):
    s = SITE; url = s["domain"] + path
    ga = (f'<script async src="https://www.googletagmanager.com/gtag/js?id={s["ga4"]}"></script>'
          f'<script src="/assets/ga.js" data-id="{E(s["ga4"])}" defer></script>') if s["ga4"] and not noindex else ""
    gsc = f'<meta name="google-site-verification" content="{s["gsc"]}">' if s["gsc"] else ""
    es = LANG["v"] == "es"; home_ = "/es/" if es else "/"
    nav = "".join(f'<a href="{h}">{n}</a>' for n,h in (NAV_ES if es else NAV))
    other = (ALT_ES.get(path) if es else ALT.get(path))
    hre = ""
    if other and not noindex:
        en_p, es_p = (other, path) if es else (path, other)
        hre = f'<link rel="alternate" hreflang="en" href="{s["domain"]}{en_p}"><link rel="alternate" hreflang="es" href="{s["domain"]}{es_p}"><link rel="alternate" hreflang="x-default" href="{s["domain"]}{en_p}">'
    toggle = f'<a class="lang" href="{other or ("/" if es else "/es/")}" hreflang="{"en" if es else "es"}" lang="{"en" if es else "es"}">{"English" if es else "Español"}</a>'
    cfg = json.dumps({**YEARLY, "lang": LANG["v"], "tel": s["phone_href"]})
    return f"""<!DOCTYPE html>
<html lang="{LANG['v']}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">{hre}<meta name="robots" content="{'noindex, nofollow' if noindex else 'index, follow, max-image-preview:large'}">
<meta property="og:type" content="website"><meta property="og:locale" content="{"es_US" if es else "en_US"}"><meta property="og:site_name" content="{E(s['brand'])}"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{s['domain']}/assets/brand/logo-full-dark.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b1f3a"><link rel="icon" href="/assets/brand/icon-48.png" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/icon-180.png">{gsc}
{FONTS}
<link rel="stylesheet" href="/assets/mm.css"><link rel="stylesheet" href="/assets/mascot.css">{extra_css}
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script><script type="application/json" id="mm-cfg">{cfg}</script>{ga}
</head>
<body>
<a class="skip" href="#main">{L("Skip to content","Saltar al contenido")}</a>
<header class="hd"><div class="container">
 <a class="brand" href="{home_}" aria-label="{E(s['brand'])} {L("home","inicio")}">{LOGO_DARK.format(b=E(s['brand']))}</a>
 <nav aria-label="{L("Primary","Principal")}">{nav}</nav>
 <div class="acts">{toggle}<a class="tel" href="tel:{s['phone_href']}">{CALL()}</a><a class="btn btn-navy btn-sm" href="{home_}#quote" data-quote>{L("See my rates","Ver mis tarifas")}</a>
 <button class="menu" aria-label="{L("Menu","Menú")}" aria-expanded="false"><span></span><span></span></button></div>
</div></header>
<main id="main">
"""

def foot(scripts=("mm.js","mascot.js")):
    s = SITE; y = datetime.date.today().year; es = LANG["v"] == "es"
    if es: scripts = ("i18n.js",) + tuple(scripts)
    sc = "".join(f'<script src="/assets/{x}" defer></script>' for x in scripts)
    tl = "".join(f'<a href="{t["es" if es else "en"]["slug"]}">{E(t["es" if es else "en"]["name"])}</a>' for t in TOOLS)
    if es:
        cols = f"""<div><h4>Herramientas gratuitas</h4>{tl}</div>
  <div><h4>Recursos</h4><a href="/es/#quote">Ver mis tarifas</a><a href="/es/ayuda/">Centro de ayuda</a><a href="/es/glosario/">Glosario de seguros</a><a href="/es/estado/">Ver mi solicitud</a><a href="/es/contacto/">Contáctenos</a></div>
  <div><h4>Empresa</h4><a href="/es/transparencia/">Licencias y transparencia</a><a href="/es/transparencia/#como-nos-pagan">Cómo nos pagan</a><a href="/privacy/" hreflang="en">Privacidad (en inglés)</a><a href="/terms/" hreflang="en">Términos (en inglés)</a><a href="/accessibility/" hreflang="en">Accesibilidad (en inglés)</a><a href="/" hreflang="en" lang="en">English</a></div>"""
        tag = "Planes reales. Precios reales. Profesionales con licencia."; hours = SITE_ES["hours"]
        bot = f'<span><a href="/privacy/">Privacidad</a><a href="/terms/">Términos</a><a href="/sitemap.xml">Mapa del sitio</a></span>'
    else:
        cols = f"""<div><h4>Coverage</h4><a href="/health-insurance-for-self-employed/">Self-employed</a><a href="/small-business-health-insurance/">Business owners</a><a href="/health-insurance-for-realtors/">Real estate</a><a href="/health-insurance-for-contractors/">Contractors</a><a href="/family-health-insurance/">Families</a></div>
  <div><h4>Free tools</h4>{tl}</div>
  <div><h4>Resources</h4><a href="/#quote">See my rates</a><a href="/help/">Help center</a><a href="/glossary/">Insurance glossary</a><a href="/status/">Check my request</a><a href="/contact/">Contact us</a><a href="/es/" hreflang="es" lang="es">Español</a></div>
  <div><h4>Company</h4><a href="/about/">About</a><a href="/trust/">Licensing &amp; transparency</a><a href="/trust/#how-we-are-paid">How we're paid</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/accessibility/">Accessibility</a><a href="/privacy/#do-not-sell">Do not sell or share my information</a></div>"""
        tag = "Real plans. Real prices. Licensed professionals."; hours = s["hours"]
        bot = f'<span><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/sitemap.xml">Sitemap</a></span>'
    return f"""</main>
<footer class="ft"><div class="container">
 <div class="g">
  <div><img class="logo" src="/assets/brand/logo-full-white.png" alt="{E(s['brand'])}" width="1200" height="348" loading="lazy"><p>{tag}</p><p style="margin-top:14px"><a href="tel:{s['phone_href']}" style="color:#fff">{CALL()}</a><br><a href="mailto:{s['email']}" style="color:#fff">{E(s['email'])}</a><br>{E(hours)}</p></div>
  {cols}
 </div>
 <div class="legal">{legal_html()}</div>
 <div class="bot"><span>&copy; {y} {E(s['brand'])}<a class="agent-in" href="/crm/" rel="nofollow">{L("Agent sign-in","Acceso para agentes")}</a></span>{bot}</div>
</div></footer>
{sc}
</body></html>"""

# ---------------------------------------------------------------- home
HOME_EN = {
 "eyebrow":"Health insurance, made clear","h1":"Your coverage. Your priorities. Your choices.",
 "lead":"See real plans and prices from every insurance company in your area, then get help from a licensed professional.",
 "cta":"Begin my review","how":"How it works","ticks":["Real plans and prices","Every insurance company","Licensed professionals","Never sold to other agents"],
 "loading":"Loading&hellip; If this doesn't load,","carriers":"Plans available<br>through","more":"and every other Marketplace insurance company in your area",
 "how_kick":"How it works","how_h":"Insurance should be easier to understand.","how_p":"Three steps from \"I need coverage\" to a clear answer.",
 "steps":[("Tell us about yourself","Your state, your household and how to reach you. It takes under a minute."),("Personalize your review","A few more questions, then real plans and monthly prices from every insurance company in your area."),("Talk to a licensed professional","A licensed professional calls or texts you to help you choose and enroll. Track your request online at any time.")],
 "tools_kick":"Shopping tools","tools_h":"Everything you need to choose with confidence.","tools_p":"The questions people struggle with most, answered before you enroll.","tools_cta":"Start comparing",
 "solve":[("dr","\u201cIs my doctor covered?\u201d","Doctor & hospital check","Search your doctors, specialists and hospitals and see which plans list them in network, using the data insurers report to HealthCare.gov."),
             ("rx","\u201cWill my medication be covered?\u201d","Prescription check","Add your prescriptions and see which plans cover them, with each plan's drug list one click away."),
             ("cost","\u201cWhat will I really pay?\u201d","True yearly cost","Premiums, deductibles and out-of-pocket limits combined into one estimated yearly cost for low, medium or high use."),
             ("cols","\u201cWhich plan is better?\u201d","Side-by-side comparison","Put up to three plans next to each other: costs, copays, network type, quality rating and your doctors."),
             ("book","\u201cWhat does that term mean?\u201d","Plain-English explanations","Tap any term for a clear definition, from coinsurance to out-of-pocket maximum. No jargon required."),
             ("coin","\u201cDo I qualify for savings?\u201d","Tax-credit estimate","Your estimated premium tax credit is applied to every price automatically, with a plain explanation of how it works."),
             ("people","\u201cI want someone to explain it.\u201d","A licensed professional","One licensed specialist reviews your options with you, verifies networks and prescriptions, and helps you enroll."),
             ("track","\u201cWhat happens next?\u201d","Track your request","Follow every step online, message your specialist and control how you're contacted.")],
 "free_kick":"Free calculators","free_h":"Answers in seconds, no sign-up required.",
 "fc":[("Your doctor","In network","ok"),("Tax credit applied","\u2212$412/mo","credit"),("Compared side by side","3 Gold plans","cmp")],"example":"Example",
 "stats":[("14","+","insurance companies"),("5","","free calculators"),("2"," min","to see your rates"),("0","$","cost to you")],
 "demo_kick":"See it in action","demo_h":"Your whole search, in one place.","demo_p":"No call center, no guesswork. Watch how it works.",
 "demo_steps":[("Real plans, real prices","Every Marketplace plan in your ZIP code, with your tax credit already applied."),("Your doctors, checked","See which plans include your doctors and prescriptions before you choose."),("The best value, first","Sort by what you'd actually pay in a year, not just the monthly premium.")],
 "demo_rows":[("Florida Blue","Gold PPO","$612","$7,344"),("Ambetter","Silver HMO","$488","$9,120"),("Oscar","Gold EPO","$574","$6,890"),("Aetna CVS Health","Bronze HMO","$341","$11,250")],
 "demo_lbl":["Monthly","Est. yearly","In network","Best value","Sorted by yearly cost"],
 "why_kick":"Why Mr. Marketplace","why_h":"Built like a financial platform. Run by people.",
 "feats":[("compass","Explore options","A guided shopping experience with real plans and prices where available."),("people","Personal assistance","One licensed professional handles everything, from your first question to enrollment."),("shield","Secure experience","Encrypted, never sold, and contact only in the ways you choose."),("health","Every carrier, side by side","Every Marketplace plan in your area, from every carrier, with real monthly prices.")],
 "shop_kick":"Shop coverage","shop_h":"What are you looking for?","shop_go":"Explore options",
 "diff_kick":"The difference","diff_h":"Same plans. Same premiums. Someone in your corner.","left_h":"Shopping on your own","left_s":"HealthCare.gov or a state exchange","right_s":"No added cost",
 "left":["Dozens of plans to compare yourself","Every doctor and prescription checked by hand","Tax treatment left to you","Nobody revisits your plan at renewal"],
 "right":["Real prices, narrowed to what fits","Doctors and prescriptions checked for you","Self-employed deductions and HSAs factored in","The same professional before every renewal"],
 "diff_fine":"Licensed agents are paid by the insurance company. For the same plan, your premium is the same whether you enroll on your own or through a licensed agent. HealthCare.gov lists all Marketplace plans available in your area.",
 "faq_kick":"Questions","faq_h":"Good to know before you start.","faq_p":"Prefer to talk?","faq_p2":", or ask our assistant in the corner.",
 "cta_h":"Your coverage. Your choices.","cta_p":"Begin your personalized coverage review today. It takes about two minutes.","cta_or":"or",
 "title":"Mr. Marketplace | Your Coverage. Your Priorities. Your Choices.","desc":"A more personalized way to shop for health insurance. See real plans and prices from every insurance company in your area and connect with a licensed professional.",
}
SEGS_EN = [("Self-employed","Founders, consultants & 1099","/health-insurance-for-self-employed/"),("Business owners","You and your team","/small-business-health-insurance/"),
           ("Real estate","Agents & brokers","/health-insurance-for-realtors/"),("Contractors","Owner-operators & trades","/health-insurance-for-contractors/"),("Families","Spouses & children","/family-health-insurance/")]

def home(path="/", noindex=False):
    s = SITE; es = LANG["v"] == "es"; C = HOME_ES if es else HOME_EN; base = "/es/" if es else "/"
    prods = [p for p in PRODUCTS if p["enabled"]]
    pn = lambda p: PRODUCT_ES[p["id"]] if es else (p["name"], p["desc"])
    data = {"brand":s["brand"],"operator":s["operator"],"consent_version":s["consent_version"]+("-es" if es else ""),"phone":s["phone"],"specialist":s["advisor"],
            "products":[{"id":p["id"],"name":pn(p)[0],"desc":pn(p)[1],"icon":I.get(p["id"],I["health"])} for p in prods]}
    faqs = [f for f in (HOME_FAQ_ES if es else HOME_FAQ) if not f[0].startswith(("What is Mr", "¿Qué es Mr"))][:5]
    schema = {"@context":"https://schema.org","@graph":[org_schema(),{"@type":"WebSite","url":s["domain"]+base,"name":s["brand"],"inLanguage":LANG["v"]},faq_schema(faqs)]}
    tk = "es" if es else "en"
    tools = "".join(f'<a class="tcard up" href="{t[tk]["slug"]}"><div class="ic">{I[t["icon"]]}</div><b>{E(t[tk]["name"])}</b><span>{E(t[tk]["card"])}</span></a>' for t in TOOLS)
    segs = "" if es else f"""<section class="sec"><div class="container">
 <div class="sec-head up"><span class="kick">Who we serve</span><h2 class="h2">For people who buy their own coverage.</h2></div>
 <div class="segs">{''.join(f'<a class="up" href="{h}"><b>{t}</b><span>{d}</span></a>' for t,d,h in SEGS_EN)}</div>
</div></section>"""
    fc_html = "".join('<div class="fc fc%d"><span class="fi %s">%s</span><div><small>%s</small><b>%s</b></div><em>%s</em></div>' % (i+1, k, I["check"] if k == "ok" else ("$" if k == "credit" else I["cols"]), a, b, C["example"]) for i, (a, b, k) in enumerate(C["fc"]))
    stats_html = "".join('<div class="up"><b><span class="pre">%s</span><span class="count" data-to="%s">%s</span><span class="suf">%s</span></b><span>%s</span></div>' % ("$" if p == "$" else "", n, n, "" if p == "$" else p, t) for n, p, t in C["stats"])
    steps_html = "".join('<li data-s="%d"><b>%s</b><span>%s</span><i></i></li>' % (i, t, d) for i, (t, d) in enumerate(C["demo_steps"]))
    lb = C["demo_lbl"]
    rows_html = "".join('<div class="drow" style="--i:%d;--o:%d" data-o="%d"><div><small>%s</small><b>%s</b><span class="dnet">%s %s</span></div><div class="dnum"><small>%s</small><b>%s</b></div><div class="dnum yr"><small>%s</small><b>%s</b></div>%s</div>' % (i, o, o, a, p, I["check"], lb[2], lb[0], m, lb[1], y, ('<span class="dbest">%s</span>' % lb[3]) if o == 0 else "") for i, ((a, p, m, y), o) in enumerate(zip(C["demo_rows"], [1, 2, 0, 3])))
    body = f"""
<section class="hero dark"><div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div><div class="container">
 <div>
  <div class="eyebrow">{C['eyebrow']}</div>
  <h1>{C['h1']}</h1>
  <p class="lead">{C['lead']}</p>
  <div class="hero-acts"><a class="btn btn-navy" href="#quote" data-quote>{C['cta']} {I['arrow']}</a><a class="btn btn-line" href="#how">{C['how']}</a></div>
  <ul class="ticks">{''.join(f'<li>{I["check"]}{t}</li>' for t in C['ticks'])}</ul>
 </div>
 <div class="qwrap">
  <div class="fcards" aria-hidden="true">{fc_html}</div>
  <div class="qc" id="quote"><div class="qc-body"><h2>{L("Let's get started.","Comencemos.")}</h2><p class="sub">{C['loading']} <a href="tel:{s['phone_href']}">{CALL()}</a>.</p></div></div>
 </div>
</div></section>
<script type="application/json" id="mm-data">{json.dumps(data)}</script>

<div class="carriers"><div class="container">
 <div class="lbl">{C['carriers']}</div>
 <div class="marquee" aria-label="{E(', '.join(s['compare_carriers']))}"><div class="track">{''.join(f'<span>{E(n)}</span>' for n in s['compare_carriers']*2)}</div></div>
 <div class="more">{C['more']}</div>
</div></div>

<section class="sec" id="how"><div class="container">
 <div class="sec-head c up"><span class="kick">{C['how_kick']}</span><h2 class="h2">{C['how_h']}</h2><p>{C['how_p']}</p></div>
 <div class="steps3">{''.join(f'<div class="step up"><div class="n">{i+1}</div><h3>{t}</h3><p>{d}</p></div>' for i,(t,d) in enumerate(C['steps']))}</div>
</div></section>

<section class="stats"><div class="container">{stats_html}</div></section>

<section class="sec demo-sec"><div class="container demo-grid">
 <div class="up"><span class="kick">{C['demo_kick']}</span><h2 class="h2">{C['demo_h']}</h2><p class="demo-p">{C['demo_p']}</p>
  <ol class="demo-steps">{steps_html}</ol>
  <a class="btn btn-navy" href="#quote" data-quote>{C['cta']} {I['arrow']}</a></div>
 <div class="demo up" aria-hidden="true"><div class="dbar"><i></i><i></i><i></i><span>mrmarketplace.com</span></div>
  <div class="dbody"><div class="dhead"><b>52 {L("plans","planes")}</b><span class="dsort">{C["demo_lbl"][4]}</span></div>
   {rows_html}
  </div></div>
</div></section>

<section class="sec dark tools-dark"><div class="glow" aria-hidden="true"></div><div class="container">
 <div class="sec-head up"><span class="kick">{C['free_kick']}</span><h2 class="h2">{C['free_h']}</h2></div>
 <div class="tcards">{tools}</div>
</div></section>

<section class="sec" id="faq"><div class="container faq-wrap">
 <div class="up"><span class="kick">{C['faq_kick']}</span><h2 class="h2">{C['faq_h']}</h2><p style="margin-top:14px">{C['faq_p']} <a href="tel:{s['phone_href']}">{CALL()}</a>{C['faq_p2']}</p></div>
 <div class="up">{faq_html(faqs)}</div>
</div></section>

<section class="sec"><div class="container"><div class="cta up">
 <div><h2>{C['cta_h']}</h2><p>{C['cta_p']}</p></div>
 <div class="acts"><a class="btn btn-white" href="#quote" data-quote>{C['cta']} {I['arrow']}</a><a class="tel" href="tel:{s['phone_href']}">{C['cta_or']} {CALL()}</a></div>
</div></div></section>
"""
    return head(C["title"], C["desc"], path, schema, noindex=noindex) + body + foot(("mm.js","quote.js","mascot.js"))

# ---------------------------------------------------------------- guide pages
def landing(p):
    s = SITE; path = f"/{p['slug']}/"
    title = p["title"].format(brand=s["brand"])
    ids = [h.lower().replace("'", "").replace(" ", "-").replace(",", "") for h,_ in p["sections"]]
    schema = {"@context":"https://schema.org","@graph":[org_schema(),
      {"@type":"WebPage","url":s["domain"]+path,"name":title,"description":p["desc"],"dateModified":datetime.date.today().isoformat(),
       "reviewedBy":{"@type":"Person","name":s["advisor"],"jobTitle":s["advisor_title"]}},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":s["domain"]+"/"},{"@type":"ListItem","position":2,"name":p["crumb"],"item":s["domain"]+path}]},
      faq_schema(p["faqs"])]}
    ini = "".join(w[0] for w in s["advisor"].split())[:2].upper()
    prose = "".join(f'<h2 id="{i}">{E(h)}</h2>{b}' for i,(h,b) in zip(ids,p["sections"]))
    toc = "".join(f'<a href="#{i}">{E(h)}</a>' for i,(h,_) in zip(ids,p["sections"]))
    body = f"""
<section class="phero"><div class="container">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>{E(p['crumb'])}</nav>
 <h1>{E(p['h1'])}</h1><p class="lead">{E(p['lead'])}</p>
 <div class="acts"><a class="btn btn-navy" href="/#quote">See my rates {I['arrow']}</a><a class="btn btn-line" href="tel:{s['phone_href']}">{CALL()}</a></div>
 <div class="byline"><span class="av">{E(ini)}</span><span>Reviewed by <b>{E(s['advisor'])}</b>, {E(s['advisor_title'].lower())} · Updated {UPDATED}</span></div>
</div></section>
<div class="container"><div class="article">
 <article class="prose">{prose}</article>
 <aside class="aside">
  <div class="aside-card"><h3>See your options in two minutes.</h3><p>Real plans and prices, plus one licensed professional to help you choose.</p>
  <a class="btn btn-white" href="/#quote">See my rates</a>
  <ul><li>{I['check']}No cost, no obligation</li><li>{I['check']}Never sold to other agents</li><li>{I['check']}Every Marketplace carrier</li></ul></div>
  <nav class="toc"><h4>On this page</h4>{toc}<a href="#faq">Common questions</a></nav>
 </aside>
</div></div>
<section class="sec gray" id="faq"><div class="container faq-wrap">
 <div><span class="kick">Common questions</span><h2 class="h2">{E(p['crumb'])}, answered.</h2></div>
 {faq_html(p['faqs'])}
</div></section>
<section class="sec"><div class="container"><div class="cta">
 <div><h2>Insurance made easier.</h2><p>Compare real plans and talk to a licensed professional.</p></div>
 <div class="acts"><a class="btn btn-white" href="/#quote">Explore my insurance options {I['arrow']}</a><a class="tel" href="tel:{s['phone_href']}">or {CALL()}</a></div>
</div></div></section>
"""
    return path, head(title, p["desc"], path, schema) + body + foot()

def simple(path, title, desc, h1, lead, content, noindex=False, scripts=("mm.js","mascot.js"), extra_css="", crumbs=None, extra_schema=None):
    s = SITE; base = L("/", "/es/")
    schema = {"@context":"https://schema.org","@graph":[org_schema(),{"@type":"WebPage","url":s["domain"]+path,"name":title,"inLanguage":LANG["v"]}] + (extra_schema or [])}
    trail = "".join(f'<a href="{h}">{E(t)}</a><span>/</span>' for t,h in (crumbs or []))
    hero = f'<section class="phero"><div class="container"><nav class="crumbs" aria-label="Breadcrumb"><a href="{base}">{L("Home","Inicio")}</a><span>/</span>{trail}{E(h1)}</nav><h1>{E(h1)}</h1><p class="lead">{E(lead)}</p></div></section>' if h1 else ""
    return head(title, desc, path, schema, noindex=noindex, extra_css=extra_css) + hero + content + foot(scripts)

def write(path, content):
    out = "dist/index.html" if path == "/" else os.path.join("dist", path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(content)

def main():
    shutil.rmtree("dist", ignore_errors=True)
    shutil.copytree("assets", "dist/assets", ignore=shutil.ignore_patterns("styles.css","home.css","home.js","site.js","funnel.js"))
    s = SITE; urls = ["/"]
    write("/", home())
    LANG["v"] = "en"
    write("/get-started/", home("/get-started/", noindex=True))
    for p in PAGES:
        path, c = landing(p); write(path, c); urls.append(path)
    write("/about/", simple("/about/", f"About {s['brand']} | A Smarter Way to Find Your Insurance", f"About {s['brand']}: compare Marketplace health plans from every insurance company, with a licensed professional.", f"About {s['brand']}", "A smarter way to find your insurance.", f'<div class="container"><div class="prose narrow" style="padding:72px 0 104px">{ABOUT}</div></div>')); urls.append("/about/")
    write("/privacy/", simple("/privacy/", f"Privacy Policy | {s['brand']}", "How we collect, use and protect your information.", "Privacy policy", "Your information is used to help you, and is never sold.", f'<div class="container"><div class="prose narrow" style="padding:72px 0 104px">{PRIVACY}</div></div>')); urls.append("/privacy/")
    write("/terms/", simple("/terms/", f"Terms of Use | {s['brand']}", "Terms of use for this website.", "Terms of use", "The terms that apply when you use this website.", f'<div class="container"><div class="prose narrow" style="padding:72px 0 104px">{TERMS}</div></div>')); urls.append("/terms/")
    gl = "".join(f'<div class="gt" id="{E(t.split(" (")[0].lower().replace(" ","-"))}"><dt>{E(t)}</dt><dd>{E(d)}</dd></div>' for t,d in sorted(GLOSSARY))
    glsch = {"@context":"https://schema.org","@type":"DefinedTermSet","name":"Health insurance glossary","hasDefinedTerm":[{"@type":"DefinedTerm","name":t,"description":d} for t,d in GLOSSARY]}
    write("/glossary/", simple("/glossary/", f"Health Insurance Glossary: Plain-English Definitions | {s['brand']}", "Plain-English definitions of health insurance terms: premium, deductible, out-of-pocket maximum, coinsurance, HMO vs PPO, tax credits and more.", "Health insurance glossary", "The words you'll see when you shop, explained in plain English.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px"><dl class="gloss">{gl}</dl><p class="cta-line">Ready to see real plans? <a href="/#quote">Begin your review</a>.</p></div></div><script type="application/ld+json">{json.dumps(glsch)}</script>')); urls.append("/glossary/")
    hp = "".join(f'<h2 id="{E(h.lower().replace(" ","-").replace(",",""))}">{E(h)}</h2>{faq_html(q)}' for h,q in HELP)
    hsch = faq_schema([x for _,q in HELP for x in q])
    hnav = "".join(f'<a href="#{E(h.lower().replace(" ","-").replace(",",""))}">{E(h)}</a>' for h,_ in HELP)
    write("/help/", simple("/help/", f"Help Center | {s['brand']}", "Answers about comparing health plans, checking doctors and prescriptions, tax credits and working with a licensed specialist.", "Help center", "Answers to common questions about shopping, costs and coverage.", f'<div class="container"><div class="helpw" style="padding:56px 0 96px"><nav class="hnav">{hnav}<a href="/glossary/">Glossary</a><a href="/contact/">Contact us</a></nav><div>{hp}<div class="helpbox"><h3>Still have a question?</h3><p><a href="tel:{s["phone_href"]}">{CALL()}</a> ({E(s["hours"])}), email <a href="mailto:{s["email"]}">{E(s["email"])}</a>, or ask Mr. Marketplace in the corner.</p></div></div></div></div><script type="application/ld+json">{json.dumps(hsch)}</script>')); urls.append("/help/")
    lic = "".join(f'<tr><td>{E(a)}</td><td>{E(b)}</td></tr>' for a,b in LICENSES)
    trust = f"""<p>{E(s['brand'])} is built to be transparent about who we are, how we're paid and where our information comes from.</p>
<h2 id="who">Who operates this site</h2><p>{E(s['brand'])} is run by {E(s['legal_name'])}, a licensed health insurance agent. You can verify any agent's license through your state's department of insurance or the National Insurance Producer Registry at <a href="https://nipr.com/" target="_blank" rel="noopener">nipr.com</a>.</p>
<table class="lic"><tr><th>State</th><th>License number</th></tr>{lic}</table>
<h2 id="not-government">We are not the government</h2><p>{E(s['brand'])} is not HealthCare.gov, not a government agency and not an insurance company. You can always shop and enroll on your own at <a href="https://www.healthcare.gov/" target="_blank" rel="noopener">HealthCare.gov</a> or your state's official marketplace.</p>
<h2 id="data">Where our information comes from</h2><p>Plans, prices, benefits, provider networks and drug lists come from the federal Marketplace data published by the Centers for Medicare &amp; Medicaid Services (the data behind HealthCare.gov), as reported by each insurance company. Networks and drug lists change during the year and can be incomplete, so always confirm with your doctor and the plan before enrolling. Your specialist can verify them for you.</p>
<h2 id="how-we-are-paid">How we're paid</h2><p>Using {E(s['brand'])} is free. If you enroll through your licensed agent, the insurance company pays the agent a commission. Commissions are built into plan pricing, so your premium for the same plan is the same whether you enroll on your own or through an agent. We show plans from every insurance company available in your area, sorted the way you choose, not by commission. Your agent may not be appointed with every insurance company; if you prefer a plan your agent can't enroll you in, they'll tell you how to enroll in it directly.</p>
<h2 id="privacy">How we protect your information</h2><ul><li>Every page is encrypted (HTTPS).</li><li>Your request goes to one licensed professional and is never sold or shared with other agents or lead buyers.</li><li>You choose how we contact you and can withdraw permission at any time from your request page.</li><li>Every permission you give is recorded with the exact wording you agreed to, so there's a clear record.</li></ul><p>Read the full <a href="/privacy/">privacy policy</a>.</p>
<h2 id="standards">Our standards</h2><ul><li>No guaranteed-savings claims. Real prices, shown as reported.</li><li>No pressure. You decide whether and when to enroll.</li><li>Guides are reviewed by a licensed professional and dated.</li><li>We'll tell you if your current plan is already the right one.</li></ul>
<h2 id="contact">Questions or complaints</h2><p><a href="tel:{s['phone_href']}">{CALL()}</a> or email <a href="mailto:{s['email']}">{E(s['email'])}</a>. You may also contact your state's department of insurance.</p>"""
    write("/trust/", simple("/trust/", f"Licensing & Transparency | {s['brand']}", f"Who operates {s['brand']}, licensing, how we're paid, where our plan data comes from and how we protect your information.", "Licensing & transparency", "Who we are, how we're paid and where our information comes from.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px">{trust}</div></div>')); urls.append("/trust/")
    acc = f"""<p>{E(s['brand'])} is committed to making this website usable by everyone, including people with disabilities. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.</p><h2>What we do</h2><ul><li>Text and controls are designed for readable contrast and can be enlarged.</li><li>Forms work with a keyboard and screen readers, with labels and clear error messages.</li><li>Pages respect reduced-motion settings.</li></ul><h2>Need help or found a problem?</h2><p>If anything on this site is hard to use, tap <a href="tel:{s['phone_href']}">{CALL()}</a> and a licensed professional will help you by phone, or email <a href="mailto:{s['email']}">{E(s['email'])}</a> so we can fix it.</p>"""
    write("/accessibility/", simple("/accessibility/", f"Accessibility | {s['brand']}", "Our commitment to an accessible website.", "Accessibility", "Everyone should be able to shop for coverage.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px">{acc}</div></div>')); urls.append("/accessibility/")
    con = f"""<div class="cgrid"><div class="cc"><h3>Call</h3><p><a class="btn btn-navy btn-sm" href="tel:{s['phone_href']}">{CALL()}</a><br><small>{E(s['hours'])}</small></p></div><div class="cc"><h3>Email</h3><p><a href="mailto:{s['email']}">{E(s['email'])}</a><br><small>We reply within one business day.</small></p></div><div class="cc"><h3>Already submitted a request?</h3><p>Use the <b>Track your request</b> link in your confirmation email to message your specialist directly.</p></div><div class="cc"><h3>Mailing address</h3><p>{E(s['address'])}</p></div></div><p style="margin-top:28px">Want to see your options first? <a href="/#quote">Begin your review</a>. It takes about two minutes.</p>"""
    write("/contact/", simple("/contact/", f"Contact Us | {s['brand']}", f"Contact {s['brand']} by phone or email.", "Contact us", "Real people, licensed professionals.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px">{con}</div></div>')); urls.append("/contact/")
    # ---------- free calculators (English + Spanish) ----------
    for lg in ("en", "es"):
        LANG["v"] = lg; es = lg == "es"
        hub = "/es/herramientas/" if es else "/tools/"
        cards = "".join(f'<a class="tcard" href="{t[lg]["slug"]}"><div class="ic">{I[t["icon"]]}</div><b>{E(t[lg]["name"])}</b><span>{E(t[lg]["card"])}</span></a>' for t in TOOLS)
        write(hub, simple(hub, L("Free Health Insurance Calculators | Mr. Marketplace","Calculadoras gratuitas de seguro médico | Mr. Marketplace"),
            L("Free calculators for people who buy their own health insurance: premium tax credit, self-employed deduction, HSA savings, renewal checker and special enrollment.","Calculadoras gratuitas para quienes compran su propio seguro médico: crédito fiscal, deducción para independientes, ahorros con HSA, comparación de renovación e inscripción especial."),
            L("Free health insurance calculators","Calculadoras gratuitas de seguro médico"), L("Real answers in seconds. No sign-up, no phone number required.","Respuestas reales en segundos. Sin registrarse y sin dar su teléfono."),
            f'<div class="container"><div class="tcards" style="padding:56px 0 96px">{cards}</div></div>')); urls.append(hub)
        for t in TOOLS:
            c = t[lg]; ids = [f"s{i}" for i in range(len(c["sections"]))]
            prose = "".join(f'<h2 id="{i}">{E(h)}</h2>{b}' for i,(h,b) in zip(ids, c["sections"]))
            others = "".join(f'<a href="{o[lg]["slug"]}">{E(o[lg]["name"])} →</a>' for o in TOOLS if o is not t)
            app = "sep" if t["key"] == "sep" else t["key"]
            body = f"""<div class="container"><div class="tool-wrap">
 <div class="tool-card"><div class="tool-app" data-tool="{app}"><p class="ld">{L("Loading calculator…","Cargando calculadora…")}</p></div><div class="tool-out" aria-live="polite"></div>
  <p class="tool-note">{L("Free and private. Nothing you enter here is saved or shared.","Gratis y privado. Nada de lo que ingrese aquí se guarda ni se comparte.")}</p></div>
 <aside class="tool-side"><h3>{L("More free tools","Más herramientas gratuitas")}</h3>{others}<div class="aside-card" style="margin-top:22px"><h3>{L("Rather have someone run the numbers?","¿Prefiere que alguien haga los cálculos?")}</h3><p>{L("A licensed professional can do it with you, free.","Un profesional con licencia puede hacerlo con usted, gratis.")}</p><a class="btn btn-white" href="{L('/','/es/')}#quote">{L("Begin my review","Comenzar mi revisión")}</a></div></aside>
</div>
<div class="article" style="padding-top:8px"><article class="prose">{prose}<h2>{L("Common questions","Preguntas frecuentes")}</h2>{faq_html(c["faqs"])}<p class="fine-print" style="margin-top:28px">{L(f"Figures for {YEARLY['year']} coverage. Educational estimates, not tax or legal advice. Updated {UPDATED}.", f"Cifras para la cobertura de {YEARLY['year']}. Estimaciones educativas, no asesoría fiscal ni legal.")}</p></article></div></div>"""
            app_schema = {"@type":"WebApplication","name":c["name"],"url":s["domain"]+c["slug"],"applicationCategory":"FinanceApplication","operatingSystem":"Any","inLanguage":lg,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
            write(c["slug"], simple(c["slug"], c["title"], c["desc"], c["h1"], c["lead"], body, scripts=("mm.js","tools.js","mascot.js"),
                  crumbs=[(L("Free tools","Herramientas"), hub)], extra_schema=[app_schema, faq_schema(c["faqs"])])); urls.append(c["slug"])
    # ---------- Spanish pages ----------
    LANG["v"] = "es"
    write("/es/", home("/es/")); urls.append("/es/")
    gl = "".join(f'<div class="gt"><dt>{E(t)}</dt><dd>{E(d)}</dd></div>' for t,d in GLOSSARY_ES)
    write("/es/glosario/", simple("/es/glosario/", "Glosario de seguros médicos en español | Mr. Marketplace", "Definiciones sencillas de términos de seguros médicos: prima, deducible, máximo de gastos de bolsillo, coseguro, HMO y PPO, crédito fiscal y más.", "Glosario de seguros médicos", "Las palabras que verá al comparar planes, explicadas de forma sencilla.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px"><dl class="gloss">{gl}</dl><p class="cta-line">¿Listo para ver planes reales? <a href="/es/#quote">Comience su revisión</a>.</p></div></div>')); urls.append("/es/glosario/")
    slug = lambda h: h.lower().replace(" ","-").replace(",","").replace("é","e").replace("á","a").replace("í","i").replace("ó","o").replace("ú","u")
    hp = "".join(f'<h2 id="{slug(h)}">{E(h)}</h2>{faq_html(q)}' for h,q in HELP_ES)
    hnav = "".join(f'<a href="#{slug(h)}">{E(h)}</a>' for h,_ in HELP_ES)
    write("/es/ayuda/", simple("/es/ayuda/", "Centro de ayuda | Mr. Marketplace", "Respuestas sobre cómo comparar planes médicos, revisar médicos y medicamentos, créditos fiscales y trabajar con un especialista con licencia.", "Centro de ayuda", "Respuestas a preguntas comunes sobre compras, costos y cobertura.", f'<div class="container"><div class="helpw" style="padding:56px 0 96px"><nav class="hnav">{hnav}<a href="/es/glosario/">Glosario</a><a href="/es/contacto/">Contáctenos</a></nav><div>{hp}<div class="helpbox"><h3>¿Tiene otra pregunta?</h3><p><a href="tel:{s["phone_href"]}">{CALL()}</a> ({E(SITE_ES["hours"])}), escriba a <a href="mailto:{s["email"]}">{E(s["email"])}</a> o pregunte a Mr. Marketplace en la esquina.</p></div></div></div></div>', extra_schema=[faq_schema([x for _,q in HELP_ES for x in q])])); urls.append("/es/ayuda/")
    lic_es = "".join(f'<tr><td>{E(a)}</td><td>{E(b)}</td></tr>' for a,b in LICENSES)
    trust_es = f"""<p>{E(s['brand'])} es transparente sobre quiénes somos, cómo nos pagan y de dónde proviene nuestra información.</p>
<h2 id="quien">Quién opera este sitio</h2><p>{E(s['brand'])} es operado por {E(s['legal_name'])}, agente de seguros médicos con licencia. Puede verificar la licencia de cualquier agente en el departamento de seguros de su estado o en el Registro Nacional de Productores de Seguros en <a href="https://nipr.com/" target="_blank" rel="noopener">nipr.com</a>.</p>
<table class="lic"><tr><th>Estado</th><th>Número de licencia</th></tr>{lic_es}</table>
<h2 id="no-gobierno">No somos el gobierno</h2><p>{E(s['brand'])} no es CuidadoDeSalud.gov, ni una agencia del gobierno, ni una aseguradora. Siempre puede comparar e inscribirse por su cuenta en <a href="https://www.cuidadodesalud.gov/es/" target="_blank" rel="noopener">CuidadoDeSalud.gov</a> o en el mercado oficial de su estado.</p>
<h2 id="datos">De dónde proviene nuestra información</h2><p>Los planes, precios, beneficios, redes de proveedores y listas de medicamentos provienen de los datos federales del Mercado publicados por los Centros de Servicios de Medicare y Medicaid (los datos detrás de CuidadoDeSalud.gov), según lo informa cada aseguradora. Las redes y listas cambian durante el año y pueden estar incompletas; confirme siempre con su médico y el plan antes de inscribirse.</p>
<h2 id="como-nos-pagan">Cómo nos pagan</h2><p>Usar {E(s['brand'])} es gratis. Si se inscribe con su agente con licencia, la aseguradora le paga una comisión al agente. Las comisiones ya están incluidas en el precio de los planes, así que su prima para el mismo plan es igual si se inscribe por su cuenta o con un agente. Mostramos planes de todas las aseguradoras disponibles en su área, ordenados como usted elija, no por comisión. Es posible que su agente no esté autorizado con todas las aseguradoras; si prefiere un plan en el que su agente no puede inscribirle, le dirá cómo inscribirse directamente.</p>
<h2 id="privacidad">Cómo protegemos su información</h2><ul><li>Todas las páginas están cifradas (HTTPS).</li><li>Su solicitud va a un solo profesional con licencia y nunca se vende ni se comparte con otros agentes.</li><li>Usted elige cómo le contactamos y puede retirar su permiso en cualquier momento.</li><li>Cada permiso queda registrado con el texto exacto que aceptó.</li></ul><p>La <a href="/privacy/" hreflang="en">política de privacidad</a> oficial está en inglés.</p>
<h2 id="contacto">Preguntas o quejas</h2><p><a href="tel:{s['phone_href']}">{CALL()}</a> o escriba a <a href="mailto:{s['email']}">{E(s['email'])}</a>. También puede comunicarse con el departamento de seguros de su estado.</p>"""
    write("/es/transparencia/", simple("/es/transparencia/", f"Licencias y transparencia | {s['brand']}", f"Quién opera {s['brand']}, licencias, cómo nos pagan, de dónde provienen los datos de los planes y cómo protegemos su información.", "Licencias y transparencia", "Quiénes somos, cómo nos pagan y de dónde proviene nuestra información.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px">{trust_es}</div></div>')); urls.append("/es/transparencia/")
    con_es = f"""<div class="cgrid"><div class="cc"><h3>Llámenos</h3><p><a class="btn btn-navy btn-sm" href="tel:{s['phone_href']}">{CALL()}</a><br><small>{E(SITE_ES['hours'])}</small></p></div><div class="cc"><h3>Correo electrónico</h3><p><a href="mailto:{s['email']}">{E(s['email'])}</a><br><small>Respondemos en un día hábil.</small></p></div><div class="cc"><h3>¿Ya envió una solicitud?</h3><p>Use el enlace <b>Ver el estado de mi solicitud</b> de su correo de confirmación para escribirle directamente a su especialista.</p></div><div class="cc"><h3>Dirección postal</h3><p>{E(s['address'])}</p></div></div><p style="margin-top:28px">¿Quiere ver sus opciones primero? <a href="/es/#quote">Comience su revisión</a>. Toma unos dos minutos.</p>"""
    write("/es/contacto/", simple("/es/contacto/", f"Contáctenos | {s['brand']}", f"Comuníquese con {s['brand']} por teléfono o correo electrónico.", "Contáctenos", "Personas reales, profesionales con licencia.", f'<div class="container"><div class="prose narrow" style="padding:56px 0 96px">{con_es}</div></div>')); urls.append("/es/contacto/")
    write("/es/estado/", simple("/es/estado/", f"Su solicitud | {s['brand']}", "Vea el estado de su solicitud de seguro.", "", "", '<div class="container" style="padding:48px 20px 96px"><div id="portal"></div></div>', noindex=True, scripts=("mm.js","portal.js","mascot.js")))
    LANG["v"] = "en"
    write("/status/", simple("/status/", f"Your Request | {s['brand']}", "Check the status of your insurance request.", "", "", '<div class="container" style="padding:48px 20px 96px"><div id="portal"></div></div>', noindex=True, scripts=("mm.js","portal.js","mascot.js")))
    write("/crm/", simple("/crm/", f"CRM | {s['brand']}", "Agent CRM.", "", "", '<div id="crm"></div>', noindex=True, scripts=("crm.js",), extra_css='<link rel="stylesheet" href="/assets/crm.css">'))
    write("/agent/", '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/crm/"><a href="/crm/">Open the CRM</a>')
    today = datetime.date.today().isoformat()
    open("dist/sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{s['domain']}{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    open("dist/robots.txt","w").write(f"User-agent: *\nAllow: /\nDisallow: /status/\nDisallow: /es/estado/\n\nSitemap: {s['domain']}/sitemap.xml\n")
    print("Built", len(urls)+5, "pages into ./dist")

if __name__ == "__main__":
    main()
