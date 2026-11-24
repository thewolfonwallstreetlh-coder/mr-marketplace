"""Mr. Marketplace: site settings and page content.
Edit SITE, then run:  python3 build.py
"""
import html, datetime
SITE = {
    "brand": "Mr. Marketplace",
    "domain": "https://mr-marketplace.netlify.app",   # your live address, no trailing slash (change when you buy a domain)
    "legal_name": "Joseph Frazier",   # change to your LLC name if you have one
    "operator": "Joseph Frazier",
    "phone": "(727) 339-2891",              # dialed by every "Call Mr. Marketplace" button; never shown on the site
    "phone_href": "+17273392891",
    "email": "president@mrmarketplace.co",
    "address": "",   # mailing address shown in the footer and contact page; leave empty to hide
    "hours": "Monday to Friday, 8am to 8pm ET · Saturday, 9am to 2pm ET",
    "advisor": "Joseph Frazier",                       # the licensed agent named on guide pages
    "advisor_title": "President & Senior Advisor",
    # Carriers you are appointed with: (display name, logo file). Get approved logo files from each
    # carrier's broker marketing portal and put them in assets/, e.g. "/assets/uhc.svg". Empty = elegant text wordmark.
    # Confirm the exact underwriting company names with your agency (Allstate sold parts of its health business in 2025).
    "offered_carriers": [("UnitedHealthcare", ""), ("Allstate Health", "")],
    # "Plans available through" strip on the homepage. Visitors see live Marketplace plans from EVERY insurance company
    # in their ZIP code; this list names major ones (plain text, no logos). Companies vary by area.
    "compare_carriers": ["Aetna CVS Health", "Ambetter", "Anthem", "Blue Cross Blue Shield", "Cigna", "Kaiser Permanente", "Molina", "Oscar", "UnitedHealthcare", "Wellpoint", "Florida Blue", "AmeriHealth Caritas", "Highmark", "Medica"],
    # Carriers whose plans you'll REVIEW (shown as plain text, clearly labeled; no logos, no implied affiliation)
    "reviewed_carriers": ["Blue Cross Blue Shield", "Aetna", "Cigna", "Humana", "Kaiser Permanente", "Ambetter", "Oscar", "Molina", "UnitedHealthcare", "Anthem", "Allstate Health", "Wellpoint"],
    "advisor_photo": "",  # e.g. "/assets/advisor.jpg" (professional portrait, 4:5 ratio)
    "advisor_bio": "Every review is handled by me personally, from the first call through every renewal. If your current plan is the right one, I'll tell you.",
    # Paste REAL reviews only, e.g. from your Google Business Profile: ("Review text", "First name L., City")
    "reviews": [],
    "google_reviews_url": "",
    "states_line": "Licensed in [list your states].",
    "ga4": "",            # e.g. G-XXXXXXX  (Google Analytics 4)
    "gsc": "",            # Google Search Console verification code
}
SITE["carriers"] = " and ".join(n for n,_ in SITE["offered_carriers"])
SITE["carrier_short"] = " & ".join(n for n,_ in SITE["offered_carriers"])
UPDATED = datetime.date.today().strftime("%B %Y")
E = html.escape

# ---------------------------------------------------------------- icons
I = {
 "arrow":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
 "check":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.5 8.5l3 3 6-7"/></svg>',
 "x":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
 "lock":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>',
 "phone":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>',
 "clock":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></svg>',
 "user":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5"/></svg>',
 "brief":'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="15" height="10.5" rx="2"/><path d="M7 6V4.5A1.5 1.5 0 018.5 3h3A1.5 1.5 0 0113 4.5V6M2.5 10.5h15"/></svg>',
 "person":'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="6.5" r="3"/><path d="M4 17c.9-3.2 3.2-5 6-5s5.1 1.8 6 5"/></svg>',
 "home":'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9.5L10 3.5l7 6M5 8v8.5h10V8"/><path d="M8.5 16.5v-4h3v4"/></svg>',
 "tool":'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12.5 3.5a4 4 0 00-4.9 5.1L3 13.2V17h3.8l4.6-4.6a4 4 0 005.1-4.9l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
 "family":'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6" r="2.3"/><circle cx="13.5" cy="6" r="2.3"/><path d="M2 16c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4M9.6 13.2c.8-.8 2-1.2 3.9-1.2 2.2 0 3.9 1.4 4.5 4"/></svg>',
 "doc":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 2h5l3 3v9H4z"/><path d="M9 2v3h3M6 9h4M6 11.5h4"/></svg>',
 "pulse":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.5 8h3l1.5-3.5 3 7L10.5 8h4"/></svg>',
 "pill":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.8" y="5.5" width="12.4" height="5" rx="2.5" transform="rotate(-35 8 8)"/><path d="M6.5 5.2l3.2 5.4"/></svg>',
 "net":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="3.5" r="1.8"/><circle cx="3.5" cy="12" r="1.8"/><circle cx="12.5" cy="12" r="1.8"/><path d="M7 5l-2.6 5.4M9 5l2.6 5.4M5.3 12h5.4"/></svg>',
 "dash":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h8"/></svg>',
 "tax":'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 13L13 3"/><circle cx="4.5" cy="4.5" r="1.8"/><circle cx="11.5" cy="11.5" r="1.8"/></svg>',
}

I.update({
 "dr":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6M17 14.5v4M15 16.5h4"/></svg>',
 "rx":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="9" width="17" height="6.5" rx="3.25" transform="rotate(-40 12 12.25)"/><path d="M9.5 9.2l5 5"/></svg>',
 "cost":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3M9 14h6"/></svg>',
 "cols":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4" width="7" height="16" rx="1.5"/><rect x="13.5" y="4" width="7" height="16" rx="1.5"/><path d="M6 8h2M16 8h2M6 12h2M16 12h2"/></svg>',
 "book":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 006.5 23H20v-5"/></svg>',
 "coin":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.7 2c1.6.3 2.7.9 2.7 2.1s-1.2 2.1-2.8 2.1c-1.2 0-2.2-.5-2.7-1.4M12 6.3v1.5M12 16.6v1.4"/></svg>',
 "track":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/></svg>',
})

PAGES = [
{
 "slug":"health-insurance-for-self-employed","crumb":"Self-employed",
 "title":"Health Insurance for Self-Employed Professionals | {brand}",
 "desc":"How self-employed professionals and 1099 earners can choose the right health plan, deduct premiums and avoid overpaying. Free review with a licensed advisor.",
 "h1":"Health insurance for the self-employed, done properly.",
 "lead":"When you work for yourself, you're the benefits department. Here's how to choose a plan that fits your income, your doctors and your taxes.",
 "sections":[
  ("Your options when you work for yourself",
   "<p>Without an employer plan, most self-employed people choose from a few routes: an individual or family plan bought directly or through the Marketplace, a spouse's employer plan, or, if you have employees, a small group plan or a health reimbursement arrangement through your business.</p><p>Each route treats premiums, networks and taxes differently. The right choice depends on your household, how much care you expect to use and how your business is structured, not just on which premium is lowest.</p>"),
  ("Deducting your premiums",
   "<p>If you're self-employed and not eligible for a plan subsidized by an employer (including a spouse's employer), you may be able to deduct the premiums you pay for yourself, your spouse and your dependents through the <strong>self-employed health insurance deduction</strong>. It's taken on your federal return rather than as an itemized deduction, so you can claim it even if you take the standard deduction.</p><div class='callout'>Tax rules have eligibility limits, including that the deduction can't exceed your net self-employment earnings. Confirm the details with your CPA or tax professional.</div>"),
  ("Pairing a plan with an HSA",
   "<p>An HSA-eligible high-deductible plan lets you put pre-tax money into a Health Savings Account. Contributions are deductible, growth is tax-free and withdrawals for qualified medical costs are tax-free. For high earners who rarely use care, this can be one of the most efficient ways to pay for coverage.</p><p>The trade-off is a higher deductible. We'll show you what a bad year would cost under each option so you can decide with real numbers.</p>"),
  ("Where self-employed people overpay",
   "<ul><li><strong>Auto-renewing every year</strong> without comparing. Rates and networks change annually.</li><li><strong>Paying for a network you don't use.</strong> A broad PPO can cost far more than a plan that still includes your doctors.</li><li><strong>Missing the tax angle.</strong> The deduction and HSA options can change which plan is actually cheapest.</li><li><strong>Staying on COBRA</strong> after leaving a job, often at full cost, without checking alternatives.</li></ul>"),
  ("When you can enroll",
   "<p>Individual plans are generally purchased during annual open enrollment, which typically runs from November 1 into January in most states. Outside that window you'll usually need a qualifying life event, such as losing other coverage, marriage, a new child or a move, to enroll within a limited special enrollment period.</p>"),
 ],
 "faqs":[
  ("Can I deduct health insurance if I'm self-employed?","Often, yes. Self-employed people who aren't eligible for an employer-subsidized plan can generally deduct premiums for themselves, their spouse and dependents, up to their net self-employment earnings. Your tax professional can confirm your eligibility."),
  ("Is an HSA plan a good idea for self-employed people?","It can be, especially if you're healthy and in a higher tax bracket. You trade a higher deductible for tax-advantaged savings. We compare both scenarios during your review."),
  ("Can I get coverage outside open enrollment?","Usually only with a qualifying life event, such as losing other coverage, getting married, having a baby or moving. Your advisor can tell you whether you qualify."),
 ]},
{
 "slug":"small-business-health-insurance","crumb":"Business owners",
 "title":"Small Business Health Insurance for Owners & Employees | {brand}",
 "desc":"Compare group health insurance, ICHRA and QSEHRA options for your small business. Free review of your current coverage by a licensed advisor.",
 "h1":"Health coverage for business owners and their teams.",
 "lead":"Whether you're covering yourself, your family or fifty employees, the structure you choose matters as much as the plan.",
 "sections":[
  ("Three ways to provide coverage",
   "<h3>Traditional group health plan</h3><p>The business chooses a plan and contributes toward premiums. Group plans can offer strong networks and predictable benefits, and employer contributions are generally tax-deductible. Insurers typically require a minimum employer contribution and minimum participation from eligible employees.</p><h3>ICHRA (Individual Coverage HRA)</h3><p>Instead of buying a group plan, the business reimburses employees tax-free for individual health insurance they choose themselves, up to an amount you set. ICHRA works for businesses of any size and lets you set different allowances for different employee classes.</p><h3>QSEHRA</h3><p>Designed for businesses with fewer than 50 full-time employees that don't offer a group plan. It reimburses employees for individual premiums and medical costs up to annual limits set by the IRS.</p>"),
  ("Owner-only and family businesses",
   "<p>If the business is just you, or you and a spouse, a group plan may not be available or may not make sense. In that case, an individual plan combined with the self-employed health insurance deduction is often the more efficient route. We'll walk through both.</p>"),
  ("What we look at for a business",
   "<ul><li>Number of eligible employees and how many already have coverage elsewhere</li><li>Your budget per employee and whether you want to cover dependents</li><li>Where your team lives, since networks are regional</li><li>Your renewal history and what's driving increases</li><li>Tax treatment for you as the owner, which can differ by entity type</li></ul><div class='callout'>Small group rules vary by state. In most states a small group is up to 50 employees, and a few states use 100. Your advisor will confirm the rules where you operate.</div>"),
  ("When renewal increases arrive",
   "<p>Group renewals often come with an increase and a short deadline. That's the best time for a second opinion. We can review your renewal, compare alternative plan designs and tell you whether switching structure, rather than just carriers, would save money.</p>"),
 ],
 "faqs":[
  ("How many employees do I need for a group health plan?","Many insurers will write a group plan for as few as one or two enrolled employees, depending on the state, though the owner alone usually doesn't qualify. Participation and contribution requirements also apply."),
  ("What is an ICHRA?","An Individual Coverage Health Reimbursement Arrangement lets a business reimburse employees tax-free for individual health insurance premiums, up to an amount the business sets, instead of offering a group plan."),
  ("Can you review our current group renewal?","Yes. Send us your renewal details and an advisor will compare it with alternatives and give you a clear recommendation before your deadline."),
 ]},
{
 "slug":"health-insurance-for-realtors","crumb":"Real estate",
 "title":"Health Insurance for Realtors & Real Estate Agents | {brand}",
 "desc":"Health insurance options for real estate agents and brokers who work as independent contractors. Compare plans, deductions and networks with a licensed advisor.",
 "h1":"Health insurance for real estate professionals.",
 "lead":"Most agents are independent contractors, which means your brokerage likely isn't providing your health plan. Here's how to get it right.",
 "sections":[
  ("Why agents buy their own coverage",
   "<p>Real estate agents are commonly classified as independent contractors. That gives you flexibility, but it usually means no employer health plan and no employer contribution. Your income can also swing from year to year, which affects which plan and which tax strategy makes the most sense.</p>"),
  ("Choosing a plan when income is variable",
   "<p>Commission income makes budgeting for premiums harder. A few principles help:</p><ul><li><strong>Plan for a bad year.</strong> Choose a plan whose out-of-pocket maximum you could absorb in your slowest year.</li><li><strong>Use the tax advantages.</strong> As a self-employed professional you may be able to deduct premiums, and an HSA-eligible plan lets you set aside pre-tax money in strong years.</li><li><strong>Match the network to your life.</strong> If you work across several counties, make sure your doctors and nearby hospitals are included.</li></ul>"),
  ("Teams and brokerages",
   "<p>If you lead a team or own a brokerage, you may be able to offer coverage through the business with a group plan or an ICHRA. These can be useful for recruiting and retaining agents. See our <a href='/small-business-health-insurance/'>business owner guide</a> for how each option works.</p>"),
  ("Association plans",
   "<p>Some professional associations offer or promote health plans to members. They can be worth comparing, but read the details: some are not full major medical coverage. We'll help you compare an association option side by side with standard plans.</p>"),
 ],
 "faqs":[
  ("Do real estate agents get health insurance through their brokerage?","Usually not. Because most agents are independent contractors, they typically buy their own individual or family plan, or get coverage through a spouse."),
  ("Can realtors deduct health insurance premiums?","Self-employed agents who aren't eligible for an employer-subsidized plan can generally deduct premiums for themselves and their family. Check with your tax professional."),
  ("What's the best plan for a realtor?","It depends on your income stability, household and doctors. Many agents do well with an HSA-eligible plan, but we compare options based on your situation."),
 ]},
{
 "slug":"health-insurance-for-contractors","crumb":"Contractors",
 "title":"Health Insurance for Contractors, Trades & Owner-Operators | {brand}",
 "desc":"Health insurance for general contractors, electricians, plumbers, locksmiths and other trade business owners. Free coverage review with a licensed advisor.",
 "h1":"Health insurance for contractors and the skilled trades.",
 "lead":"Your work is physical and your business depends on you. Your health plan should be chosen with that in mind.",
 "sections":[
  ("Who this is for",
   "<p>General contractors, electricians, plumbers, HVAC technicians, roofers, locksmiths, landscapers and other owner-operators, whether you work solo or run crews.</p>"),
  ("Health insurance and workers' comp are different",
   "<p>Workers' compensation covers injuries that happen on the job, and in many states business owners and sole proprietors are excluded from it or must opt in. Health insurance covers everything else: illness, off-the-job injuries, preventive care, prescriptions and your family. Most owners need both.</p><div class='callout'>If you're a sole proprietor, check whether you're personally covered by your workers' comp policy. Many owners assume they are and find out otherwise after an injury.</div>"),
  ("What matters most in a trade",
   "<ul><li><strong>Out-of-pocket maximum.</strong> In a physical job, a strong cap on your worst-case year matters more than a slightly lower premium.</li><li><strong>Urgent care and orthopedic access.</strong> Make sure the clinics and specialists near your job sites are in network.</li><li><strong>Coverage for your crew.</strong> If you have employees, a group plan or ICHRA can help you hire and keep good people.</li></ul>"),
  ("Using the business to pay for coverage",
   "<p>As a self-employed owner you may be able to deduct your own premiums. If you have W-2 employees, a group plan or a reimbursement arrangement can make coverage a deductible business expense. Your entity type matters, so we coordinate the recommendation with how your business is set up. See our <a href='/small-business-health-insurance/'>business owner guide</a> for details.</p>"),
 ],
 "faqs":[
  ("Does workers' comp cover me as the business owner?","Not always. In many states, owners and sole proprietors are exempt or must elect coverage. Health insurance is separate and covers injuries and illness outside work."),
  ("Can I get a group plan for my crew?","Often, yes, if you have eligible W-2 employees. Requirements vary by state and insurer. An ICHRA is another option if a group plan doesn't fit."),
  ("I'm a locksmith with no employees. What are my options?","Typically an individual or family plan, possibly HSA-eligible, with the self-employed health insurance deduction. We'll compare plans that include your doctors."),
 ]},
{
 "slug":"family-health-insurance","crumb":"Families",
 "title":"Family Health Insurance Plans for Professionals | {brand}",
 "desc":"Choose the right family health insurance plan: networks, pediatric care, deductibles and costs for spouses and children. Free review with a licensed advisor.",
 "h1":"Family health insurance, chosen around your family.",
 "lead":"Covering a spouse and children means more doctors, more prescriptions and more ways a plan can fall short. A review makes sure it doesn't.",
 "sections":[
  ("Start with your doctors",
   "<p>Before comparing premiums, list the pediatricians, specialists and hospitals your family relies on. Networks vary widely between plans, even from the same insurer. A plan that saves on premium but drops your children's pediatrician isn't a savings.</p>"),
  ("Family deductibles, explained",
   "<p>Family plans usually have an individual deductible for each person and a family deductible for the household. Depending on the plan, one family member's costs may count toward both. Understanding how your plan handles this changes what a year with a hospital visit actually costs.</p>"),
  ("Children up to age 26",
   "<p>Children can generally stay on a parent's plan until they turn 26, even if they're married, living elsewhere, in school or not financially dependent. If you have young adults on your plan, we'll confirm whether keeping them on is still the best value.</p>"),
  ("Life changes are enrollment windows",
   "<p>Marriage, a new baby, adoption or losing other coverage typically opens a special enrollment period. Acting within that window, often 60 days, lets you change plans outside open enrollment.</p>"),
 ],
 "faqs":[
  ("How long can my child stay on my health plan?","Generally until age 26, regardless of marriage, school enrollment or where they live."),
  ("Is it cheaper to put my spouse on a separate plan?","Sometimes, particularly when one spouse has access to employer coverage. We compare both arrangements during your review."),
  ("Can I add a newborn mid-year?","Yes. Having a baby typically opens a special enrollment period, usually 60 days, to add your child or change plans."),
 ]},
]


SITE["consent_version"] = "2026-11-v2"   # bump whenever you change the consent wording on the form

# ---------------------------------------------------------------- products
# Turn on ONLY the products you are licensed and appointed to sell.
PRODUCTS = [
    {"id": "health", "name": "Individual & family health", "desc": "Medical coverage for you, your spouse and your children.", "enabled": True},
    {"id": "business", "name": "Business & employee coverage", "desc": "Health coverage for you and your team.", "enabled": True},
    {"id": "dental", "name": "Dental & vision", "desc": "Standalone dental and vision plans.", "enabled": False},
    {"id": "supplemental", "name": "Supplemental coverage", "desc": "Accident, critical illness and hospital plans.", "enabled": False},
]

# ---------------------------------------------------------------- homepage questions
HOME_FAQ = [
 ("What is Mr. Marketplace?", "Mr. Marketplace is the easiest way to shop for health insurance and connect with a licensed professional. You tell us about yourself, see real Marketplace plans and prices from every insurance company in your area, and a licensed professional helps you choose."),
 ("Are the prices real?", "Yes. For individual and family health coverage in most states, prices come from the same federal Marketplace data that HealthCare.gov uses, based on the ages, ZIP code and income you enter. Final premiums are confirmed at enrollment."),
 ("Does it cost anything?", "No. Licensed agents are paid by the insurance company. For the same plan, your premium is the same whether you enroll on your own or with a licensed agent."),
 ("Will I get a flood of calls?", "No. Your request goes to one licensed Mr. Marketplace advisor in your state. It's never put on a lead list or passed around to multiple agents, and you choose how you'd like to be contacted."),
 ("Is this HealthCare.gov?", "No. Mr. Marketplace is not a government site and not an insurance company. HealthCare.gov lists every Marketplace plan in your area."),
 ("Do you help with Medicare?", "Not at this time. Our platform is for individuals, families and business owners under 65. If you're 65 or older, Medicare.gov is the best place to compare your options."),
]

ABOUT = f"""<h2>Insurance should be easier to understand.</h2><p>Shopping for coverage usually means a maze of plan names, a dozen phone calls, and your number passed around to agents you never asked to hear from. {E(SITE['brand'])} was built to replace that with a clear, private shopping experience and one licensed professional who works with you from the first question to enrollment, and every renewal after.</p>
<h2>How it works</h2><ul><li><strong>Tell us what you need.</strong> A short, personalized assessment that adapts to your answers.</li><li><strong>See every option.</strong> Real Marketplace plans and prices from every insurance company in your area.</li><li><strong>Let a licensed professional handle the rest.</strong> We call or text you, answer your questions and take care of enrollment.</li></ul>
<h2 id="how-we-are-paid">How we're paid</h2><p>Using {E(SITE['brand'])} is free. If you enroll through your licensed agent, the insurance company pays a commission. Commissions are built into plan pricing and don't increase your premium. The plans you see are Marketplace plans from the insurance companies in your area. You can also enroll in any Marketplace plan directly at HealthCare.gov or your state's marketplace.</p>
<h2>Licensing</h2><p>{E(SITE['brand'])} is operated by {E(SITE['legal_name'])}, a licensed health insurance agent. {E(SITE['states_line'])}</p>
<h2>Contact</h2><p><a href="tel:{SITE['phone_href']}">Call Mr. Marketplace</a><br>Email: <a href="mailto:{SITE['email']}">{E(SITE['email'])}</a><br>{E(SITE['hours'])}{('<br>' + E(SITE['address'])) if SITE['address'] else ''}</p>"""

PRIVACY = f"""<p><em>Last updated {UPDATED}. Have this policy reviewed by your attorney before publishing.</em></p>
<h2>Information we collect</h2><p>When you use {E(SITE['brand'])} we collect the information you provide, such as your name, phone number, email, ZIP code, household ages, current coverage, desired start date, budget, approximate household income, and any doctors or prescription needs you choose to share. We also record technical information such as IP address, browser type, pages visited and referring website.</p>
<h2>Consent records</h2><p>When you agree to be contacted, we keep a record of the exact wording you agreed to, the version of the form, the date and time, your IP address and your browser. You give separate permission for phone calls, text messages and email. We keep these records as required by law.</p>
<h2>How we use it</h2><p>We use your information to show you available plans, contact you in the ways you chose, help you apply for coverage if you decide to, and improve our service.</p>
<h2 id="do-not-sell">How your request is shared</h2><p>Your request is assigned to one licensed Mr. Marketplace advisor in your state. Advisors are licensed insurance agents who work with Mr. Marketplace and pay a membership fee to use our platform and receive requests. We never give your request to more than one advisor, and we never sell or rent your information to lead buyers, marketing lists or data brokers. We share it only with the advisor assigned to help you, the insurance companies you choose to apply with, service providers that help us operate (such as secure hosting, email and phone systems), and as required by law.</p>
<h2>Your choices</h2><p>You can withdraw consent, update your information, or ask us to access or delete it at any time by emailing <a href="mailto:{SITE['email']}">{E(SITE['email'])}</a> or by tapping <a href="tel:{SITE['phone_href']}">Call Mr. Marketplace</a>. Reply STOP to any text message to stop texts.</p>
<h2>Security</h2><p>Information is encrypted in transit and at rest, and access is limited to people who need it to serve you.</p>
<h2>Contact</h2><p>{E(SITE['legal_name'])}{(', ' + E(SITE['address'])) if SITE['address'] else ''}</p>"""

TERMS = f"""<p><em>Last updated {UPDATED}. Have these terms reviewed by your attorney before publishing.</em></p>
<h2>About this site</h2><p>{E(SITE['brand'])} is a health insurance shopping website operated by {E(SITE['legal_name'])}, a licensed health insurance agent. It is not a government website and not an insurance company. Content is general information, not tax, legal or medical advice.</p>
<h2>Prices and availability</h2><p>Prices shown for Marketplace plans are estimates based on the information you enter and public Marketplace data. Final premiums, eligibility and tax credits are determined at enrollment. Plan availability and benefits vary by state and household. Savings are not guaranteed.</p>
<h2>Plans shown</h2><p>Plans shown are Marketplace plans offered by the insurance companies in your area, using public Marketplace data. Your licensed agent may not be able to enroll you in every plan shown. You can enroll in any Marketplace plan at HealthCare.gov or your state's insurance marketplace.</p>
<h2>Communications</h2><p>By submitting a request and giving consent, you agree to be contacted in the ways you selected. Consent is not a condition of purchase, and you can withdraw it at any time.</p>
<h2>Contact</h2><p><a href="mailto:{SITE['email']}">{E(SITE['email'])}</a> · <a href="tel:{SITE['phone_href']}">Call Mr. Marketplace</a></p>"""

# ---------------------------------------------------------------- licensing (shown on /trust/)
# One row per state you're licensed in: (state, license number). Leave [ ] placeholders until filled in.
LICENSES = [("[State]", "[License #]")]

# ---------------------------------------------------------------- glossary (/glossary/)
GLOSSARY = [
 ("Premium", "The amount you pay each month to keep your plan active, whether or not you use care."),
 ("Deductible", "What you pay for covered services each year before your plan starts sharing costs. Many plans cover preventive care, and sometimes doctor visits and generic drugs, before you meet the deductible."),
 ("Out-of-pocket maximum", "The most you'll pay in a year for covered, in-network care. It includes your deductible, copays and coinsurance, but not your premiums. Once you reach it, the plan pays 100% of covered in-network care for the rest of the year."),
 ("Copay", "A fixed dollar amount you pay for a covered service, such as $30 for a primary care visit."),
 ("Coinsurance", "Your share of the cost of a covered service as a percentage, such as 20%. It usually applies after you've met your deductible."),
 ("Metal levels", "Marketplace plans are grouped as Bronze, Silver, Gold and Platinum based on how you and the plan split costs. Bronze has the lowest premiums and highest costs when you get care; Platinum is the opposite. The level is about cost sharing, not the quality of care."),
 ("Expanded Bronze", "A Bronze plan that covers at least one major service, such as some doctor visits, before the deductible."),
 ("Catastrophic plan", "A low-premium, very-high-deductible plan available to people under 30 or those with a hardship exemption. It covers preventive care and a few primary care visits before the deductible."),
 ("Network", "The doctors, hospitals, pharmacies and other providers a plan contracts with. Using in-network providers costs much less, and some plans don't cover out-of-network care at all except in emergencies."),
 ("HMO", "Health Maintenance Organization. Usually covers care only from in-network providers (except emergencies) and often requires a referral from your primary care doctor to see a specialist."),
 ("PPO", "Preferred Provider Organization. Covers in-network care at the lowest cost and also pays part of the cost for out-of-network providers, usually without referrals."),
 ("EPO", "Exclusive Provider Organization. Covers in-network care only (except emergencies), usually without requiring referrals."),
 ("POS", "Point of Service. A mix of HMO and PPO features: you typically need referrals, but some out-of-network care is covered."),
 ("Formulary", "A plan's list of covered prescription drugs, usually grouped into tiers that determine what you pay."),
 ("Prior authorization", "Approval your plan requires before it will cover certain services or drugs."),
 ("HSA (Health Savings Account)", "A tax-advantaged account you can open with an HSA-eligible plan. Money goes in pre-tax, grows tax-free, and comes out tax-free for qualified medical costs."),
 ("Premium tax credit", "A tax credit that lowers your monthly premium for a Marketplace plan. The amount depends on your expected household income for the coverage year, your household size, and the cost of a benchmark Silver plan in your area. It's reconciled on your federal tax return."),
 ("Cost-sharing reductions", "Extra savings that lower deductibles, copays and out-of-pocket maximums for eligible lower-income households. They're only available on Silver plans."),
 ("Benchmark plan", "The second-lowest-cost Silver plan in your area. It's used to calculate the size of your premium tax credit."),
 ("Modified Adjusted Gross Income (MAGI)", "The income figure the Marketplace uses to determine tax credits. For most people it's close to adjusted gross income from their tax return, with a few items added back."),
 ("Open Enrollment", "The yearly period when anyone can sign up for or change a Marketplace plan. Outside it, you need a qualifying life event."),
 ("Special Enrollment Period", "A window outside Open Enrollment to get coverage after a qualifying life event, such as losing other coverage, moving, marriage or having a baby."),
 ("Summary of Benefits and Coverage (SBC)", "A standardized document every plan must provide that explains costs and coverage in a consistent format, so plans are easier to compare."),
 ("Licensed insurance agent", "A professional licensed by your state to sell and explain insurance. Agents helping with Marketplace enrollment must also be registered with the Marketplace."),
]

# ---------------------------------------------------------------- help center (/help/)
HELP = [
 ("Shopping and comparing", [
  ("How do I compare plans?", "After you see your rates, check up to three plans and select Compare side by side. You'll see premiums, deductibles, out-of-pocket maximums, copays, network type and an estimated yearly cost next to each other."),
  ("What does the yearly cost estimate mean?", "It adds 12 months of premium to an estimate of what you'd pay for care. Choose Low, Medium or High expected use. It's a guide for comparing plans, not a quote; your actual costs depend on the care you receive."),
  ("Which metal level is right for me?", "If you rarely use care, a Bronze plan's low premium may cost less over the year. If you see doctors often, take regular prescriptions or expect a procedure, Gold or Silver often costs less in total. The yearly estimate helps you see the difference."),
  ("Are these all the plans available?", "We show the Marketplace plans reported for your ZIP code on HealthCare.gov. In states that run their own marketplace, live prices aren't available here and your specialist reviews options with you directly."),
 ]),
 ("Doctors and prescriptions", [
  ("How do I check if my doctor is in network?", "On your results, search for your doctor or hospital under Your doctors & hospitals. Each plan then shows whether that provider is reported in network."),
  ("Why does a plan say 'not reported'?", "The insurance company didn't report that provider or drug for that plan to HealthCare.gov. It doesn't mean it isn't covered. Your specialist can verify it directly."),
  ("Can I rely on the network results?", "They come from the data insurance companies report to HealthCare.gov, but networks change. Before enrolling, confirm with your doctor's office and the plan. Your licensed specialist can do this for you."),
  ("How do I check my prescriptions?", "Search for each drug under Your prescriptions. Plans show whether it's on their drug list. Select Plan details for the plan's drug list and copays."),
 ]),
 ("Costs, income and tax credits", [
  ("What income should I enter?", "Your best estimate of your household's income for the coverage year, the figure the Marketplace calls MAGI. If you're self-employed, that's generally your net business income after expenses."),
  ("Why don't I see a tax credit?", "Based on the income and household you entered, you may not qualify for a premium tax credit. Eligibility depends on income, household size and local prices. Your specialist can review it with you."),
  ("What happens if my income changes?", "Tax credits are reconciled on your tax return. If your income changes during the year, update your Marketplace application so your credit stays accurate."),
 ]),
 ("Working with your specialist", [
  ("What does my specialist do?", "A licensed insurance professional answers your questions, verifies doctors and prescriptions, explains costs and helps you enroll, then checks in before renewal."),
  ("Does it cost more to use an agent?", "No. For the same plan, your premium is the same whether you enroll on your own or through a licensed agent. Agents are paid by the insurance company."),
  ("How do I check on my request?", "Use the Track your request link on your results or in your confirmation email. You can message your specialist, change how you'd like to be contacted, or withdraw permission at any time."),
  ("Can I enroll on my own?", "Yes. You can always enroll directly at HealthCare.gov or your state's official marketplace."),
 ]),
]

# ---------------------------------------------------------------- yearly figures used by the calculators
# UPDATE EVERY FALL. Sources: IRS Rev. Proc. 2026-24 (HSA), Rev. Proc. 2026-26 (tax credit %), SSA (wage base), CMS (open enrollment).
YEARLY = {
  "year": 2027,                      # coverage year being shopped
  "oe_start": "2026-11-01",          # HealthCare.gov Open Enrollment start
  "oe_jan1": "2026-12-15",           # enroll by this date for coverage starting January 1
  "oe_end": "2027-01-15",            # HealthCare.gov Open Enrollment end (state-run marketplaces may differ)
  "hsa_self": 4500, "hsa_family": 9000, "hsa_catchup": 1000,
  "pct_min": 2.15, "pct_max": 10.22, # share of income expected toward the benchmark plan, 2027
  "ss_wage_base": 192300,            # Social Security wage base, 2027
}
