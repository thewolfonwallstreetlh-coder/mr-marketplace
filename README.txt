MR. MARKETPLACE: SETUP GUIDE
=============================

WHAT'S IN HERE
  content.py              Your settings (name, phone, carriers, states) and all page text
  build.py                Builds the website into the dist folder. Run: python3 build.py
  assets/quote.js         The shopping flow + qualification engine (QCONFIG at the top)
  assets/mascot.js        Mr. Marketplace AI assistant
  netlify/functions/      Server: rates, leads, customer portal, agent CRM, AI assistant
  netlify/lib/common.mjs  Scoring rules, lead routing, alerts

GO LIVE: 5 STEPS
================
1. FILL IN YOUR DETAILS (these placeholders show on the live site until you replace them)
   content.py -> SITE:
     "legal_name" and "operator"  Your legal name or agency name (also used in the consent wording)
     "email"                      An inbox you check (currently hello@mrmarketplace.com)
     "address"                    Your business mailing address
     "states_line"                e.g. "Licensed in Florida, Georgia and Texas."
     "advisor"                    Your name (shown as "Reviewed by" on the guide pages)
     "domain"                     Your real domain, e.g. https://www.mrmarketplace.com
     "phone"                      Already set: (727) 339-2891. It is never shown; every button says "Call Mr. Marketplace".
   content.py -> LICENSES: one row per state, e.g. [("Florida", "W123456"), ("Georgia", "123456")]
   content_es.py -> SITE_ES "states_line" (Spanish), and SPANISH_SPEAKING_TEAM (False if nobody speaks Spanish)
   assets/quote.js -> QCONFIG.licensedStates: same states as LICENSED_STATES below, e.g. ["FL","GA","TX"]

2. PUT THE FOLDER ON GITHUB, THEN CONNECT IT TO NETLIFY
   a) Create a free GitHub account and a new private repository. Upload everything in this folder
      (drag the files into the repository page on github.com and click "Commit").
   b) Create a free Netlify account > "Add new site" > "Import an existing project" > GitHub > pick the repo.
      Netlify reads netlify.toml, runs "python3 build.py" and sets up the server functions automatically.
   Important: don't use Netlify's drag-and-drop deploy. It skips the server parts (leads, CRM, rates).

3. ADD ENVIRONMENT VARIABLES (Netlify > Site configuration > Environment variables), then redeploy.
   Minimum to be fully working:
     CMS_API_KEY      REQUIRED for real plans on your site. Free: developer.cms.gov/marketplace-api/key-request.html
     AGENT_PASSWORD   your CRM admin password, 12+ characters (20+ random is better)
     AGENTS           [{"id":"me","name":"Your Name","phone":"(727) 339-2891","email":"you@yourdomain.com","states":["FL"],"products":["*"],"password":"a-different-20-character-password"}]
     LICENSED_STATES  e.g. FL,GA,TX
     RESEND_API_KEY + ALERT_EMAIL + ALERT_FROM   so new leads are emailed to you instantly (resend.com, free tier)
   Optional: ANTHROPIC_API_KEY (makes Mr. Marketplace's chat fully AI), LEAD_WEBHOOK_URL / PRIORITY_WEBHOOK_URL (text alerts via Zapier).

4. CONNECT YOUR DOMAIN (Netlify > Domain management > Add a domain). HTTPS turns on automatically.

5. TEST, THEN LAUNCH
   First open yoursite.com/api/rates in your browser. It must say "live_plans": true. If it says false,
   it tells you exactly what to fix (almost always: CMS_API_KEY missing or mistyped, then redeploy).
   Submit a test request in English and in Spanish, open yoursite.com/crm/ (or the tiny "Agent sign-in"
   link in the footer), confirm the lead and the email alert arrived, open the customer's "track your
   request" link, reply from the CRM, and try each calculator at /tools/.
   Then submit the sitemap (yoursite.com/sitemap.xml) in Google Search Console.

ALL ENVIRONMENT VARIABLES (Netlify > Site configuration > Environment variables)
   CMS_API_KEY          Free key: https://developer.cms.gov/marketplace-api/key-request.html
                        (renews every 60 days by email; paste in the new one)
   AGENT_PASSWORD       Admin password for the CRM at /crm/ (sees every lead). At least 12 characters (the CRM
                        refuses shorter ones); use 20+ random characters from a password manager.
   SESSION_SECRET       Optional. Any long random string. Changing it signs everyone out of the CRM instantly.
   CRM_ALLOWED_IPS      Optional. Comma-separated IP addresses; if set, the CRM only works from those (e.g. your office).
   ASSISTANT_DAILY_CAP  Optional. Max Mr. Marketplace AI replies per day across the whole site (default 1500),
                        so nobody can run up your AI bill.
   LICENSED_STATES      e.g. FL,GA,TX  (blank = all states)
   AGENTS               Your agents, as JSON. Example:
     [{"id":"me","name":"Your Name","phone":"(305) 555-0101","email":"you@x.com",
       "states":["FL","GA"],"products":["health","business"],"password":"their-own-20+-character-password",
       "webhook":"https://hooks.zapier.com/... (optional, their personal alerts)"}]
     Leads route to an agent licensed in the customer's state for that product,
     balancing workload. Agents log in to /crm/ with their own password and see only their leads.
   LEAD_WEBHOOK_URL     Zapier / Make / GoHighLevel webhook that receives every lead.
   PRIORITY_WEBHOOK_URL Webhook for A-priority leads only. Point it at an SMS step (e.g. Zapier + Twilio)
                        so your phone buzzes within seconds: the 5-minute rule.
   RESEND_API_KEY + ALERT_EMAIL   Optional email alerts (resend.com). ALERT_FROM must be a verified sender.
   INCOME_MINIMUM       Default 60000. Households under this income are sent to HealthCare.gov (not sent to you).
   SEND_CATEGORY_D      "true" to also alert on D leads (default false; they're still saved)
   ENABLED_PRODUCTS     Default health,business
   LEAD_DELIVERY        "immediate" (default): the lead reaches you the moment they enter name/phone/email,
                        before the qualification questions. "qualified": only after they finish stage 2.
   SEND_CONFIRMATION_EMAIL  "true" (default) emails the customer a confirmation + portal link (needs Resend).
   ANTHROPIC_API_KEY    Makes Mr. Marketplace fully AI-powered (optional; built-in answers work without it)

TEST BEFORE ADS
   Submit a test lead, open /crm/, confirm the alert reached your phone/email, open the customer
   "track your request" link, reply from the CRM and check it shows in their portal.

FREE CALCULATORS (/tools/ and /es/herramientas/), no contact info needed, all lead into the quote form pre-filled:
   Tax credit estimator (official Marketplace data), self-employed deduction, HSA savings,
   "Is my plan still the best?" renewal checker, and special enrollment (life event) checker.
   UPDATE EVERY FALL: the YEARLY block in content.py (coverage year, open enrollment dates, HSA limits,
   tax-credit percentages, Social Security wage base). Everything on the site reads from it.

SPANISH SITE (/es/)
   Spanish homepage + quote form, results, status page, calculators, help center, glossary, contact and
   transparency pages, with an English/Español switch in the header and hreflang tags for Google.
   Spanish leads are tagged "Español" in the CRM and alerts, get a Spanish confirmation email, and the
   AI assistant answers in Spanish. Their consent is saved in the exact Spanish wording (version ends "-es").
   BEFORE LAUNCH: have a bilingual compliance reviewer approve the Spanish consent wording (assets/i18n.js).
   If no one on your team speaks Spanish, set SPANISH_SPEAKING_TEAM = False in content_es.py.
   Privacy policy and terms stay in English (linked as "en inglés") until your attorney approves translations.

SHOPPING TOOLS (all use the same free CMS_API_KEY; nothing else to set up)
   Doctor & hospital check, prescription check, side-by-side compare (up to 3), yearly cost
   estimate, plan details with copays + documents, tax-credit estimate, plain-English "?" tips.
   The doctors and drugs a customer searches show on their lead in your CRM.
   New pages: /help/, /glossary/, /trust/ (fill in LICENSES in content.py), /contact/, /accessibility/.

YOUR CRM  (www.yoursite.com/crm/ , bookmark it on your phone too)
   Hidden from consumers: it's only linked by the small "Agent sign-in" text next to the copyright
   in the footer, it's password-protected, and search engines are told not to index it.
   Today      Who to contact right now (best leads first), tasks due/overdue, speed-to-contact.
   Pipeline   Drag leads across New > Assigned > Contacted > Quoting > Application > Enrolled / Lost.
   Leads      Search, filter, sort, export to CSV.
   Lead page  Click-to-call/text/email (only for permissions they gave), log calls with outcomes,
              follow-up tasks, notes, tags, portal messages, policy + commission, full consent record.
   Add lead   Enter referrals and phone-ins yourself. Record only permissions the person actually gave.
   Reports    Funnel, contact rate, lead-to-policy rate, premium and commission, by source/state/grade/agent.
   Alerts     Leave the CRM open: it checks every 20 seconds, chimes, and shows a desktop notification
              (click "Enable alerts" once). Leads marked "awaiting qualification" gave contact info but
              haven't finished the second stage: call them anyway.
   Storage    Leads live in Netlify Blobs on your site. Export a CSV weekly as a backup.

LEAD CATEGORIES
   A  Eligible, ready (coverage in 0-1 month), wants a call/text, clean data  -> priority alert
   B  Eligible, researching or later timeline                              -> normal alert
   C  Needs clarification or data-quality flags                            -> normal alert, flagged
   D  Outside licensed states, 65+, or below target income                 -> shown alternatives, not sent
   Data-quality flags: invalid phone, disposable email, completed too fast (bot), repeat within 30 days.

COMPLIANCE CHECKLIST (have a regulatory attorney review before launch)
   - Consent wording on the form (content.py consent_version; bump it whenever wording changes)
   - Every consent is stored with the exact text, form version, time, IP and browser
   - Customers can withdraw call/text/email permission in their portal; honor STOP replies too
   - If you help with Federally Facilitated Marketplace enrollments, follow CMS consent rules
     (documented consent, kept at least 10 years). Export CSVs regularly as a backup.
   - Privacy policy and terms (/privacy/, /terms/) are templates: have counsel finalize them.

SCALING LATER
   Leads are stored in Netlify Blobs, which is fine for thousands of leads. When volume grows,
   move storage to PostgreSQL and connect a CRM (Salesforce/HubSpot) using the same webhook payload.


SECURITY (what's built in)
   CRM login     Password is sent once and swapped for a signed 12-hour session; it's never stored in the browser.
                 5 wrong passwords from one address = locked out 15 minutes. Passwords under 12 characters are refused.
                 Changing someone's password in AGENTS signs them out everywhere. Agents only see their own leads.
                 Every sign-in is logged (time, IP, browser) in storage under audit/.
   Spam & abuse  Per-visitor limits: 6 lead submissions/hour (15/day), 4/day per phone number, 40 rate searches/hour,
                 40 AI messages/hour plus a daily site-wide AI cap. Hidden bot-trap field. Requests over 32 KB are refused.
   Data          Every field is checked and trimmed on the server; unknown fields are thrown away. Status links use a
                 random 128-bit key. Plan document links must be real http(s) links.
   Browser       Strict Content-Security-Policy (no injected or inline scripts can run), no embedding in other sites,
                 HSTS, no camera/mic/location access. Everything shown in the CRM and portal is escaped.
                 CSV exports neutralize spreadsheet formulas.
   Secrets       All keys (CMS, Anthropic, Resend, webhooks) live only in Netlify environment variables, never in the site code.

SECURITY CHECKLIST FOR YOU
   - Turn on two-factor authentication on your Netlify, GitHub, domain registrar and email accounts. Those are the
     real keys to the site; someone with your Netlify login could change anything.
   - Use a password manager. Give each agent their own password. Remove agents from AGENTS when they leave.
   - Export a CSV backup weekly and store it somewhere encrypted. Lead data is sensitive personal information.
   - If you add a third-party script (chat, pixel, scheduler), add its domain to the Content-Security-Policy in netlify.toml.
   - Optional extra bot protection for heavy ad traffic: Cloudflare Turnstile (free) on the form.


REAL PLANS ON YOUR SITE
   30 states (including Florida, Texas, North Carolina, Ohio, Arizona, Tennessee) show every real plan and
   price right on your site. 21 states + DC run their own marketplace (including California, Georgia,
   New York, New Jersey, Pennsylvania, Illinois, Virginia, Oregon); their plans aren't in the federal data,
   so shoppers there get a button to their state's official plan finder and their lead still comes to you.

CONTACT PERMISSION
   There are no checkboxes. One short line under the Continue button explains that tapping it lets you
   contact them by call, text or email. That sentence is your legal permission to call and text, and it's
   saved word for word with every lead. Keep it there.
