/* Mr. Marketplace — AI assistant (concierge chat) */
(function(){
const MM = {
  endpoint: "/api/assistant",
  phone: (typeof QCONFIG!=="undefined"&&QCONFIG.callerNumber)||(()=>{try{return JSON.parse(document.getElementById("mm-cfg").textContent).tel}catch(e){return""}})()||"+17273392891",
  specialist: (typeof QCONFIG!=="undefined"&&QCONFIG.specialistName)||"your specialist",
  avatar: "/assets/mascot/avatar.jpg",
  portrait: "/assets/mascot/portrait.jpg"
};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- scripted backup answers (used if the AI endpoint is not configured) ---------- */
const FAQ=[
 [/how (does|do) (this|it|you) work|what (is|does) (this|the) (site|website)|what do you do/i,"Enter your ZIP code, who needs coverage and what you have today, then tap “See my rates.” You'll see real plans and monthly prices from the carriers in your area, and one licensed specialist will call to help you choose. [[RATES]]"],
 [/free|cost|charge|fee|pay you|how (are|do) you (get )?paid/i,"It costs you nothing. Licensed agents are paid by the insurance company, and for the same plan your premium is the same whether you enroll on your own or with us. [[RATES]]"],
 [/income|salary|why.*(money|earn)/i,"Your income is used only to estimate any premium tax credit, so the prices you see are accurate for your household. It's kept confidential and never sold."],
 [/spam|sold|sell|share|many calls|robocall|privacy/i,"Your request goes to one licensed Mr. Marketplace advisor in your state. It's never put on a lead list or passed around to other agents. Expect one call, not twenty."],
 [/doctor|hospital|network|pediatric|specialist i see/i,"Yes, you can check. After you see your rates, search your doctors and hospitals and every plan shows whether they're reported in network. You can do the same for prescriptions. Networks change, so your specialist will confirm before you enroll. [[RATES]]"],
 [/medicare|65|senior|retire/i,"Rates on this site are for people under 65. If you're 65 or older, Medicare.gov or 1-800-MEDICARE is the best place to compare your options."],
 [/carrier|compan(y|ies)|united|allstate|blue cross|aetna|cigna|humana|which insurance/i,"You'll see Marketplace plans from every insurance company in your area, side by side with real monthly prices. [[RATES]]"],
 [/government|official|healthcare\.gov|marketplace|obamacare|aca/i,"I'm not HealthCare.gov or a government site. Prices here come from the same Marketplace data, and a licensed specialist helps you choose, at no extra cost."],
 [/open enrollment|when can i|deadline|special enrollment|sign up|life event/i,"Open Enrollment for 2027 coverage on HealthCare.gov runs November 1, 2026 to January 15, 2027. Enroll by December 15 for coverage starting January 1. Outside that window, a life event like losing coverage, moving, marriage or a baby can open a 60-day Special Enrollment Period; our free checker at /tools/special-enrollment/ tells you if you qualify. [[RATES]]"],
 [/business|employee|group|ichra|qsehra|team/i,"If you own a business, choose “Business & employee coverage” in the form and your licensed specialist will walk you through your options personally. [[CALL]]"],
 [/self.?employed|1099|deduct|tax/i,"Self-employed people who aren't eligible for an employer-subsidized plan can often deduct their premiums, and HSA-eligible plans add more tax advantages. Your CPA can confirm the details for you. [[RATES]]"],
 [/hsa|health savings/i,"Since 2026, every Bronze and Catastrophic Marketplace plan works with a Health Savings Account. Contributions are tax-deductible, grow tax-free and come out tax-free for qualified medical costs. For 2027 you can contribute up to $4,500 for yourself or $9,000 for a family. Our HSA calculator at /tools/hsa-calculator/ shows your tax savings. [[RATES]]"],
 [/hmo|ppo|epo|difference between/i,"HMOs and EPOs keep you within a set network, often for a lower premium, and HMOs usually need referrals. PPOs cost more but let you see out-of-network providers at a higher share of the cost."],
 [/prescri|medication|drug|pharmacy/i,"After you see your rates, add your prescriptions and each plan shows whether it covers them, with the plan's full drug list one click away. Your specialist can double-check costs for you. [[RATES]]"],
 [/term|deductible|coinsurance|copay|out-of-pocket|premium mean/i,"Tap any ? next to a term on your results for a plain-English definition, or see the full glossary at /glossary/. The short version: premium is your monthly cost, the deductible is what you pay before the plan shares costs, and the out-of-pocket max is the most you'd pay in a year for covered in-network care."],
 [/bronze|silver|gold|platinum|metal/i,"Metal levels trade premium for out-of-pocket cost. Bronze has the lowest premium and highest costs when you use care; Platinum is the reverse. Gold is popular with families who see doctors often."],
 [/deductible|out.?of.?pocket|copay|coinsurance/i,"The deductible is what you pay before the plan starts sharing costs. The out-of-pocket maximum caps what you'd pay in a bad year, which is often the more important number to compare."],
 [/human|real person|talk to|agent|call me|speak/i,`Of course. ${MM.specialist} is a licensed specialist and can call you, or you can tap Call Mr. Marketplace below. [[CALL]]`],
 [/are you (a )?(bot|ai|robot|real)/i,"I'm an AI assistant. For anything specific to your situation, a licensed specialist will take it from here. [[CALL]]"],
 [/hi|hello|hey|good (morning|afternoon|evening)/i,"Hello, and welcome. Ask me anything about plans, prices or how the review works."]
];
const ESK=[[/c[oó]mo funciona|qu[eé] es (esto|este sitio)|qu[eé] hacen/i,0],[/gratis|cu[aá]nto cuesta|cobran|costo/i,1],[/m[eé]dico|doctor|hospital|red/i,"doctor"],[/aseguradora|compa[nñ][ií]a|cigna|aetna|blue|united/i,"carrier"],[/inscripci[oó]n|fecha|plazo|cu[aá]ndo puedo/i,"open enrollment"],[/independiente|deducir|impuesto|1099/i,"self-employed"],[/\bhsa\b|ahorros? para la salud/i,"hsa"],[/medicamento|receta|farmacia/i,"prescri"],[/deducible|coseguro|copago|prima|t[eé]rmino/i,"term"],[/ingreso/i,"income"],[/llamadas|vender|venden|privacidad/i,"many calls"],[/negocio|empresa|empleados/i,"business"],[/medicare|65/i,"medicare"],[/persona|agente|hablar/i,"real person"]];
const fallback=q=>{if(document.documentElement.lang==="es")for(const [re,k] of ESK)if(re.test(q)){const hit=typeof k==="number"?FAQ[k]:FAQ.find(([r])=>r.test(k));if(hit)return hit[1]}
  for(const [re,a] of FAQ)if(re.test(q))return a;return "Good question. That one is best answered for your exact situation, so the quickest route is to see your rates and let your specialist walk you through it. [[RATES]]"};

/* ---------- DOM ---------- */
const root=document.createElement("div");root.className="mm";
root.innerHTML=`
<button class="mm-launch" aria-label="Ask Mr. Marketplace, AI assistant" aria-expanded="false">
  <span class="mm-av"><img alt="" src="${MM.avatar}" width="44" height="44"></span>
  <span class="mm-lt"><b>Mr. Marketplace</b><small>Questions? Ask me</small></span>
</button>
<section class="mm-panel" role="dialog" aria-label="Mr. Marketplace, AI assistant" hidden>
  <header class="mm-head">
    <span class="mm-av sm"><img alt="" src="${MM.avatar}" width="40" height="40"></span>
    <div class="mm-id"><b>Mr. Marketplace</b><small><i></i>AI assistant</small></div>
    <button class="mm-x" aria-label="Close">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
  </header>
  <div class="mm-log" aria-live="polite">
    <div class="mm-hello">
      <img class="mm-portrait" alt="Mr. Marketplace" src="${MM.portrait}" width="112" height="112">
      <h3>Mr. Marketplace</h3>
      <p>Your guide to finding the right coverage. Ask about plans, prices, doctors or how the review works.</p>
    </div>
  </div>
  <form class="mm-in"><input placeholder="Ask a question" aria-label="Your question" maxlength="600" autocomplete="off">
    <button aria-label="Send"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 13V3M4 7l4-4 4 4"/></svg></button></form>
  <p class="mm-legal">AI assistant · General information, not advice. Please don't share medical or account details.</p>
</section>`;
document.body.appendChild(root);
const $=s=>root.querySelector(s);
const panel=$(".mm-panel"),log=$(".mm-log"),input=$(".mm-in input"),launch=$(".mm-launch");
let hist=[],busy=false;

function add(role,html){const d=document.createElement("div");d.className="mm-row "+role;
  d.innerHTML=(role==="bot"?`<img class="mm-mini" alt="" src="${MM.avatar}" width="28" height="28">`:"")+`<div class="mm-m">${html}</div>`;
  log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function actions(txt){
  let t=esc(txt).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>"),btns="";
  if(t.includes("[[RATES]]"))btns+=`<button class="mm-act" data-a="rates">See my rates</button>`;
  if(t.includes("[[CALL]]"))btns+=`<a class="mm-act ghost" href="tel:${MM.phone.replace(/[^\d+]/g,"")}">Call Mr. Marketplace</a>`;
  t=t.replace(/\s*\[\[(RATES|CALL)\]\]/g,"");
  return `<p>${t.replace(/\n+/g,"</p><p>")}</p>${btns?`<div class="mm-acts">${btns}</div>`:""}`;
}
function chips(list){log.querySelectorAll(".mm-chips").forEach(c=>c.remove());const d=document.createElement("div");d.className="mm-chips";
  d.innerHTML=list.map(c=>`<button type="button">${esc(c)}</button>`).join("");log.appendChild(d);log.scrollTop=log.scrollHeight;
  d.querySelectorAll("button").forEach(b=>b.onclick=()=>ask(b.textContent))}
const START=["How does this work?","Is it really free?","Why do you need my income?","Will I get a lot of calls?","Can I keep my doctors?","I own a business"];

async function ask(q){
  q=q.trim();if(!q||busy)return;busy=true;input.value="";log.querySelectorAll(".mm-chips").forEach(c=>c.remove());
  add("you",`<p>${esc(q)}</p>`);hist.push({role:"user",content:q});
  const typing=add("bot","<span class=\"mm-dots\"><i></i><i></i><i></i></span>");
  let reply="";const t0=Date.now();
  try{const r=await fetch(MM.endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({messages:hist,lang:document.documentElement.lang==="es"?"es":"en"})});
    if(r.ok){const d=await r.json();if(d.ok)reply=d.reply}}catch(e){}
  if(!reply)reply=fallback(q);
  await new Promise(r=>setTimeout(r,Math.max(0,650-(Date.now()-t0))));
  typing.remove();add("bot",actions(reply));hist.push({role:"assistant",content:reply});busy=false;
  if(hist.length===2)chips(["Which carriers do you show?","What's an HSA?","Talk to a person"]);
}
function open(){panel.hidden=false;root.classList.add("open");launch.setAttribute("aria-expanded","true");
  if(!hist.length&&!log.querySelector(".mm-row")){add("bot",actions("Good to meet you. I'm here to make sure you get the insurance you're looking for. Ask me anything, or see your rates in about two minutes. [[RATES]]"));chips(START);requestAnimationFrame(()=>{log.style.scrollBehavior="auto";log.scrollTop=0;log.style.scrollBehavior=""})}
  if(matchMedia("(pointer:fine)").matches)setTimeout(()=>input.focus({preventScroll:true}),250)}
function close(){panel.hidden=true;root.classList.remove("open");launch.setAttribute("aria-expanded","false");launch.focus({preventScroll:true})}
launch.onclick=()=>{hideHi();panel.hidden?open():close()};
// A friendly hello after a few seconds, once per visit (not on the CRM or private pages)
let hi=null;function hideHi(){if(hi){hi.classList.remove("show");setTimeout(()=>hi&&hi.remove(),300);hi=null}}
try{if(!sessionStorage.getItem("mm_hi")&&!/^\/(crm|status|es\/estado)/.test(location.pathname)){setTimeout(()=>{if(!panel.hidden||document.documentElement.classList.contains("qr-open"))return;
  sessionStorage.setItem("mm_hi","1");hi=document.createElement("div");hi.className="mm-hi";hi.setAttribute("role","status");
  hi.innerHTML=`<button type="button" class="x" aria-label="Close">×</button><b>Hi, I'm Mr. Marketplace.</b><span>Want to see real plans and prices for your ZIP code? It takes about two minutes.</span><div><button type="button" class="go">Show me my plans</button><button type="button" class="ask">I have a question</button></div>`;
  root.appendChild(hi);requestAnimationFrame(()=>hi&&hi.classList.add("show"));
  hi.querySelector(".x").onclick=hideHi;hi.querySelector(".ask").onclick=()=>{hideHi();open()};
  hi.querySelector(".go").onclick=()=>{hideHi();const q=document.getElementById("quote");if(q){q.scrollIntoView({behavior:"smooth",block:"center"});const f=q.querySelector("select,input");f&&setTimeout(()=>f.focus({preventScroll:true}),500)}else location.href=document.documentElement.lang==="es"?"/es/#quote":"/#quote"};
  setTimeout(hideHi,14000)},6500)}}catch(e){}
$(".mm-x").onclick=close;
$(".mm-in").onsubmit=e=>{e.preventDefault();ask(input.value)};
log.addEventListener("click",e=>{if(!e.target.closest('[data-a="rates"]'))return;close();
  const q=document.getElementById("quote");if(q){q.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>document.getElementById("q_zip")?.focus({preventScroll:true}),700)}else location.href=document.documentElement.lang==="es"?"/es/#quote":"/#quote"});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
})();
