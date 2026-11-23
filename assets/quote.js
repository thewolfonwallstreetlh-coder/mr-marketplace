/* =========================================================================
   Mr. Marketplace — adaptive shopping flow, qualification engine, results
   EDIT QCONFIG BEFORE GOING LIVE. Products and consent wording come from content.py.
   ========================================================================= */
const QCONFIG = {
  // Fallback contact shown if the server (Netlify functions) can't assign an agent
  specialistName: "Your Mr. Marketplace specialist",
  specialistTitle: "Licensed Health Insurance Specialist",
  callerNumber: "(727) 339-2891",   // dialed by "Call Mr. Marketplace"; never displayed
  callbackMinutes: 10,

  // Qualification
  minIncome: 60000,          // households below this income go to HealthCare.gov (they likely get large tax credits there)
  licensedStates: [],        // e.g. ["FL","TX","GA"]; empty = all states
  sendCategoryD: false,      // only used in fallback mode; the server decides when deployed

  // Fallback delivery if the server isn't deployed yet
  leadEmail: "YOUR-EMAIL@example.com",
  webhookUrl: "",

  endpoints: { rates: "/api/rates", lead: "/api/lead", status: "/api/status", coverage: "/api/coverage" }
};

/* 2024 ACS state median household income (U.S. Census Bureau, via KFF) */
const Q_MEDIAN={AL:66659,AK:95665,AZ:81486,AR:62106,CA:100149,CO:97113,CT:96049,DE:87534,DC:109707,FL:77735,GA:79991,HI:100745,ID:81166,IL:83211,IN:71959,IA:75501,KS:75514,KY:64526,LA:60986,ME:76442,MD:102905,MA:104828,MI:72389,MN:87117,MS:59127,MO:71589,MT:75340,NE:76376,NV:81134,NH:99782,NJ:104294,NM:67816,NY:85820,NC:73958,ND:77871,OH:72212,OK:66148,OR:85220,PA:77545,RI:83504,SC:72350,SD:76881,TN:71997,TX:79721,UT:96658,VT:82730,VA:92090,WA:99389,WV:60798,WI:77488,WY:75532};
const Q_NAMES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"Washington, D.C.",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
const Q_ZIP3=[[5,5,"NY"],[10,27,"MA"],[28,29,"RI"],[30,38,"NH"],[39,49,"ME"],[50,59,"VT"],[60,69,"CT"],[70,89,"NJ"],[100,149,"NY"],[150,196,"PA"],[197,199,"DE"],[200,205,"DC"],[206,219,"MD"],[220,246,"VA"],[247,268,"WV"],[270,289,"NC"],[290,299,"SC"],[300,319,"GA"],[320,349,"FL"],[350,369,"AL"],[370,385,"TN"],[386,397,"MS"],[398,399,"GA"],[400,427,"KY"],[430,459,"OH"],[460,479,"IN"],[480,499,"MI"],[500,528,"IA"],[530,549,"WI"],[550,567,"MN"],[569,569,"DC"],[570,577,"SD"],[580,588,"ND"],[590,599,"MT"],[600,629,"IL"],[630,658,"MO"],[660,679,"KS"],[680,693,"NE"],[700,714,"LA"],[716,729,"AR"],[730,749,"OK"],[750,799,"TX"],[800,816,"CO"],[820,831,"WY"],[832,838,"ID"],[840,847,"UT"],[850,865,"AZ"],[870,884,"NM"],[885,885,"TX"],[889,898,"NV"],[900,961,"CA"],[967,968,"HI"],[970,979,"OR"],[980,994,"WA"],[995,999,"AK"]];


(function(){
const root=document.getElementById("quote"); if(!root) return;
const D=JSON.parse(document.getElementById("mm-data").textContent);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const usd=n=>n==null?"—":"$"+Math.round(n).toLocaleString();
const ARW='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const CHK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.5 8.5l3 3 6-7"/></svg>';
const LOCK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>';
const gt=(ev,p)=>{try{window.gtag&&gtag("event",ev,p||{})}catch(e){}};
const stateFromZip=z=>{const p=parseInt(String(z).slice(0,3),10);const r=Q_ZIP3.find(([a,b])=>p>=a&&p<=b);return r?r[2]:""};
const planYear=()=>{const d=new Date();return d.getMonth()>=9?d.getFullYear()+1:d.getFullYear()};
const target=()=>QCONFIG.minIncome||60000;
const t0=Date.now();
let S={who:"me",answers:{}}, step=0, flow=[];
const ES=document.documentElement.lang==="es";
const HC=ES?"https://www.cuidadodesalud.gov/es/":"https://www.healthcare.gov/", MC=ES?"https://es.medicare.gov/plan-compare":"https://www.medicare.gov/plan-compare";
const tr=s=>(window.mmT?window.mmT(s):s);
// States that run their own marketplace for 2027 (their plans aren't in the federal data): [name, plan finder]
const SBM={CA:["Covered California","https://www.coveredca.com/"],CO:["Connect for Health Colorado","https://connectforhealthco.com/"],CT:["Access Health CT","https://www.accesshealthct.com/"],DC:["DC Health Link","https://dchealthlink.com/"],GA:["Georgia Access","https://georgiaaccess.gov/"],ID:["Your Health Idaho","https://www.yourhealthidaho.org/"],IL:["Get Covered Illinois","https://getcovered.illinois.gov/"],KY:["kynect","https://kynect.ky.gov/"],ME:["CoverME.gov","https://www.coverme.gov/"],MD:["Maryland Health Connection","https://www.marylandhealthconnection.gov/"],MA:["Massachusetts Health Connector","https://www.mahealthconnector.org/"],MN:["MNsure","https://www.mnsure.org/"],NV:["Nevada Health Link","https://www.nevadahealthlink.com/"],NJ:["Get Covered New Jersey","https://nj.gov/getcoverednj/"],NM:["beWellnm","https://www.bewellnm.com/"],NY:["NY State of Health","https://nystateofhealth.ny.gov/"],OR:["Explore Health","https://explorehealthor.gov/"],PA:["Pennie","https://pennie.com/"],RI:["HealthSource RI","https://healthsourceri.com/"],VT:["Vermont Health Connect","https://portal.healthconnect.vermont.gov/"],VA:["Virginia's Insurance Marketplace","https://marketplace.virginia.gov/"],WA:["Washington Healthplanfinder","https://www.wahealthplanfinder.org/"]};
// Prefill from the free calculators (ZIP, ages, income) so visitors don't retype anything
try{const P=JSON.parse(sessionStorage.getItem("mm_prefill")||"null");if(P){sessionStorage.removeItem("mm_prefill");
  const a=(P.ages||[]).map(Number).filter(x=>x>=0&&x<65);
  if(/^\d{5}$/.test(P.zip||"")){S.zip=P.zip;S.state=stateFromZip(P.zip)}
  if(a.length){S.age=a[0];const sp=P.spouse||(P.who==="couple"||P.who==="family");if(sp&&a[1]>=18){S.sage=a[1]}const k=a.slice(sp?2:1);if(k.length){S.kids=Math.min(5,k.length);S.kidAges=k.slice(0,5)}
    S.who=P.who&&["me","couple","kids","family"].includes(P.who)?P.who:(sp?(k.length?"family":"couple"):(k.length?"kids":"me"))}
  if(P.income)S.income=Math.round(+P.income)||undefined;S.product="health"}}catch(e){}

/* ---------------- steps ---------------- */
// Stage 1 (lead delivered at the end of "contact"):  start -> about -> contact
// Stage 2 (secure qualification, updates the same lead): qualify -> income  (business: qualifyBiz)
const WHO=[["me","Just me"],["couple","Me + spouse"],["kids","Me + kids"],["family","My family"],["business","My business"]];
const STEP={
 start:{title:"Let's get started.",sub:"Tell us a little about yourself to begin your personalized coverage review.",btn:"Begin my review",
  html:()=>`<div class="f"><label for="q_st">What state do you live in?</label><select id="q_st"><option value="">Select your state</option>${Object.keys(Q_NAMES).map(k=>`<option value="${k}" ${S.state===k?"selected":""}>${Q_NAMES[k]}</option>`).join("")}</select></div>
   <div class="f"><label for="q_who">Who needs coverage?</label><select id="q_who"><option value="">Select household</option>${WHO.filter(([v])=>v!=="business"||D.products.some(p=>p.id==="business")).map(([v,t])=>`<option value="${v}" ${S.who===v?"selected":""}>${t}</option>`).join("")}</select></div>`,
  read:()=>{S.state=val("q_st");if(!S.state)return["q_st","Please select your state."];S.who=val("q_who");if(!S.who)return["q_who","Please choose who needs coverage."];
    S.product=S.who==="business"?"business":"health";setFlow();
    if(QCONFIG.licensedStates.length&&!QCONFIG.licensedStates.includes(S.state))return"STATE";}},
 about:{title:"A few quick details.",sub:"Prices depend on your ZIP code and the ages of everyone covered.",
  html:()=>`<div class="row"><div class="f"><label for="q_zip">ZIP code</label><input id="q_zip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(S.zip)}"></div>
    <div class="f"><label for="q_age">Your age</label><input id="q_age" type="number" inputmode="numeric" min="18" max="99" value="${esc(S.age)}"></div>
    ${/couple|family/.test(S.who)?`<div class="f"><label for="q_sage">Spouse's age</label><input id="q_sage" type="number" inputmode="numeric" value="${esc(S.sage)}"></div>`:""}</div>
   ${/kids|family/.test(S.who)?`<div class="f"><label for="q_kids">Children</label><select id="q_kids">${[1,2,3,4,5].map(n=>`<option ${+S.kids===n?"selected":""}>${n}</option>`).join("")}</select><div class="kids"></div></div>`:""}
   <div class="f"><span class="lb">When do you want coverage to start?</span>${pills("start",[["asap","As soon as possible"],["next","Next month"],["later","In 2 to 3 months"],["research","Just researching"]])}</div>`,
  bind:()=>{bindPills();const k=root.querySelector("#q_kids");if(k){k.onchange=kids;kids()}},
  read:()=>{S.zip=val("q_zip");if(!/^\d{5}$/.test(S.zip))return["q_zip","Please enter a 5-digit ZIP code."];
    const zs=stateFromZip(S.zip);if(zs&&zs!==S.state)return["q_zip",`That ZIP code isn't in ${Q_NAMES[S.state]}. Please check it or change your state.`];
    S.age=+val("q_age");if(!S.age||S.age<18||S.age>110)return["q_age","Please enter your age."];if(S.age>=65)return"MEDICARE";
    S.ages=[S.age];S.spouse=false;
    if(/couple|family/.test(S.who)){S.sage=+val("q_sage");if(!S.sage||S.sage<18)return["q_sage","Please enter your spouse's age."];if(S.sage<65){S.ages.push(S.sage);S.spouse=true}}
    if(/kids|family/.test(S.who)){S.kids=+val("q_kids");S.kidAges=[];for(const k of root.querySelectorAll(".kids input")){if(k.value===""||+k.value<0||+k.value>25)return[null,"Please enter each child's age."];S.kidAges.push(+k.value);S.ages.push(+k.value)}}
    if(!S.start)return[null,"Please choose when you want coverage to start."];}},
 aboutBiz:{title:"Tell us about your business.",sub:"Just the basics. Your specialist will take it from here.",
  html:()=>`<div class="row"><div class="f"><label for="q_bn">Business name</label><input id="q_bn" autocomplete="organization" value="${esc(S.biz)}"></div><div class="f" style="flex:.6"><label for="q_zip">ZIP code</label><input id="q_zip" inputmode="numeric" maxlength="5" value="${esc(S.zip)}"></div></div>
   <div class="row"><div class="f" style="flex:.5"><label for="q_age">Your age</label><input id="q_age" type="number" inputmode="numeric" value="${esc(S.age)}"></div>
   <div class="f"><span class="lb">People needing coverage, including you</span>${pills("emps",[["1","Just me"],["2-9","2 to 9"],["10-24","10 to 24"],["25-50","25 to 50"],["51+","51+"]])}</div></div>
   <div class="f"><span class="lb">When do you want coverage to start?</span>${pills("start",[["asap","As soon as possible"],["next","Next month"],["later","In 2 to 3 months"],["research","Just researching"]])}</div>`,
  bind:()=>bindPills(),
  read:()=>{S.biz=val("q_bn");if(!S.biz)return["q_bn","Please enter your business name."];S.zip=val("q_zip");if(!/^\d{5}$/.test(S.zip))return["q_zip","Please enter a 5-digit ZIP code."];
    const zs=stateFromZip(S.zip);if(zs&&zs!==S.state)return["q_zip",`That ZIP code isn't in ${Q_NAMES[S.state]}.`];
    S.age=+val("q_age");S.ages=S.age?[S.age]:[];if(!S.emps)return[null,"Please choose how many people need coverage."];if(!S.start)return[null,"Please choose a start date."];}},
 contact:{title:"Where can we reach you?",sub:"Your information goes to one licensed insurance professional, never to a list.",btn:"Continue",
  html:()=>`<div class="row"><div class="f"><label for="q_fn">First name</label><input id="q_fn" autocomplete="given-name" value="${esc(S.first)}"></div><div class="f"><label for="q_ln">Last name</label><input id="q_ln" autocomplete="family-name" value="${esc(S.last)}"></div></div>
   <div class="row"><div class="f"><label for="q_ph">Mobile phone</label><input id="q_ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555" value="${esc(S.phone)}"></div><div class="f"><label for="q_em">Email</label><input id="q_em" type="email" autocomplete="email" value="${esc(S.email)}"></div></div>
   <div class="f"><span class="lb">How would you like to hear from us?</span>${pills("pref",[["call","Call me"],["text","Text me"],["email","Email me"]])}</div>
   <input id="q_hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
   <p class="consent-line" id="t_consent">By tapping Continue, you agree that ${esc(D.brand)} and ${esc(D.operator)}, a licensed insurance agent, may contact you about your request by call, text or email at the number and email above, including by automated means. Consent isn't required to buy. Msg &amp; data rates may apply; reply STOP to opt out. <a href="${ES?"/privacy/":"/privacy/"}" target="_blank" rel="noopener">Privacy</a></p>
`,
  bind:()=>{bindPills();phoneInput("q_ph")},
  read:()=>{Object.assign(S,{first:val("q_fn"),last:val("q_ln"),phone:val("q_ph"),email:val("q_em"),hp:val("q_hp"),cCall:true,cText:true,cMail:true});
    if(!S.first||!S.last)return["q_fn","Please enter your full name."];
    if(S.phone.replace(/\D/g,"").length!==10)return["q_ph","Please enter a 10-digit mobile number."];
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email))return["q_em","Please enter a valid email address."];
    if(!S.pref)return[null,"Please choose how you'd like to hear from us."];
  }},
 qualify:{stage2:true,title:"Personalize your results.",sub:"A few more questions so your rates and your specialist's recommendations fit you.",
  html:()=>`<div class="f"><span class="lb">Which best describes your work?</span>${pills("work",[["self","Self-employed"],["owner","Business owner"],["w2","Employed (W-2)"],["between","Between jobs"],["other","Other"]])}</div>
   <div class="row"><div class="f"><label for="q_cov">Current coverage</label><select id="q_cov"><option value="">Select one</option>${["Through an employer","Through my own business","An individual plan I pay for","Marketplace (ACA) plan","COBRA","Not currently insured"].map(o=>`<option ${S.coverage===o?"selected":""}>${o}</option>`).join("")}</select></div>
   <div class="f cur" ${S.coverage==="Not currently insured"?"hidden":""}><label for="q_prem">Current monthly premium</label><select id="q_prem"><option value="">Select</option>${["Under $500","$500 to $1,000","$1,000 to $1,500","$1,500 to $2,500","More than $2,500","Not sure"].map(o=>`<option ${S.premium===o?"selected":""}>${o}</option>`).join("")}</select></div></div>
   <div class="f"><span class="lb">Monthly budget for coverage</span>${pills("budget",[["500","Under $500"],["1000","$500 to $1,000"],["2000","$1,000 to $2,000"],["9999","$2,000+"],["unsure","Not sure"]])}</div>
   <div class="f"><span class="lb">Has anyone to be covered used tobacco in the last 6 months?</span><div class="seg c2" data-k="tob">${[["no","No"],["yes","Yes"]].map(([v,t])=>`<button type="button" data-v="${v}" class="${S.tob===v?"on":""}">${t}</button>`).join("")}</div></div>`,
  bind:()=>{bindPills();segBind("tob");const c=root.querySelector("#q_cov");c.onchange=()=>root.querySelector(".cur").hidden=c.value==="Not currently insured"},
  read:()=>{if(!S.work)return[null,"Please choose what best describes your work."];S.coverage=val("q_cov");if(!S.coverage)return["q_cov","Please tell us how you're covered today."];
    S.premium=S.coverage==="Not currently insured"?"":val("q_prem");if(!S.budget)return[null,"Please choose a budget, or 'Not sure'."];if(!S.tob)return[null,"Please answer the tobacco question. It affects Marketplace prices."];}},
 income:{stage2:true,title:"Last step: your household income.",sub:"Used only to calculate any tax credit on your rates. Kept private and never shared.",btn:"See my rates",
  html:()=>`<div class="f"><label for="q_inc">Estimated household income for next year</label><div class="pre"><span>$</span><input id="q_inc" inputmode="numeric" placeholder="e.g. 250,000" value="${S.income?S.income.toLocaleString():""}"></div></div>`,
  bind:()=>moneyInput("q_inc"),
  read:()=>{S.income=+val("q_inc").replace(/\D/g,"");if(!S.income)return["q_inc","Please enter an estimate."];}},
 qualifyBiz:{stage2:true,title:"Personalize your review.",sub:"So your specialist can prepare before reaching out.",btn:"Finish",
  html:()=>`<div class="row"><div class="f"><label for="q_bcov">Current coverage</label><select id="q_bcov"><option value="">Select one</option>${["We offer coverage today","Employees buy their own","No coverage today"].map(o=>`<option ${S.coverage===o?"selected":""}>${o}</option>`).join("")}</select></div>
   <div class="f"><label for="q_ren">Renewal or start month</label><select id="q_ren"><option value="">Select</option>${["January","February","March","April","May","June","July","August","September","October","November","December","Not sure"].map(o=>`<option ${S.renewal===o?"selected":""}>${o}</option>`).join("")}</select></div></div>
   <div class="f"><span class="lb">Monthly budget per person</span>${pills("budget",[["500","Under $500"],["1000","$500 to $1,000"],["9999","$1,000+"],["unsure","Not sure"]])}</div>`,
  bind:()=>bindPills(),
  read:()=>{S.coverage=val("q_bcov");if(!S.coverage)return["q_bcov","Please choose your current coverage."];S.renewal=val("q_ren");if(!S.budget)return[null,"Please choose a budget, or 'Not sure'."];S.work="owner";}}
};
function setFlow(){flow=S.product==="business"?["start","aboutBiz","contact","qualifyBiz"]:["start","about","contact","qualify","income"]}
setFlow();

/* ---------------- helpers ---------------- */
const val=id=>{const e=root.querySelector("#"+id);return e?e.value.trim():""};
const chk=id=>{const e=root.querySelector("#"+id);return !!(e&&e.checked)};
function pills(k,opts){return `<div class="pills" data-k="${k}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${S[k]===v?"on":""}">${t}</button>`).join("")}</div>`}
function bindPills(){root.querySelectorAll(".pills").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>{g.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");S[g.dataset.k]=b.dataset.v}))}
function segBind(k){const g=root.querySelector(`[data-k="${k}"]`);g.querySelectorAll("button").forEach(b=>b.onclick=()=>{g.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");S[k]=b.dataset.v})}
function moneyInput(id){const i=root.querySelector("#"+id);i.addEventListener("input",()=>{const d=i.value.replace(/\D/g,"");i.value=d?Number(d).toLocaleString():""})}
function phoneInput(id){const i=root.querySelector("#"+id);i.addEventListener("input",()=>{const d=i.value.replace(/\D/g,"").replace(/^1/,"").slice(0,10);i.value=d.length>6?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:d.length>3?`(${d.slice(0,3)}) ${d.slice(3)}`:d})}
function kids(){const box=root.querySelector(".kids");if(!box)return;const n=root.querySelector(".f-kd").hidden?0:+root.querySelector("#q_kids").value;const cur=S.kidAges||[];
  box.innerHTML=Array.from({length:n},(_,i)=>`<input type="number" inputmode="numeric" min="0" max="25" placeholder="Child ${i+1} age" aria-label="Child ${i+1} age" value="${cur[i]??""}">`).join("")}

/* ---------------- render ---------------- */
function render(){
  const key=flow[step],st=STEP[key],last=step===flow.length-1;
  const btnTxt=st.btn||(last?"Finish":"Continue");
  const s2=st.stage2&&S.leadSent;
  root.innerHTML=`<div class="qc-top"><span>${s2?`${LOCK} Secure · `:""}Step <b>${step+1}</b> of ${flow.length}</span><div class="qc-bar">${flow.map((_,i)=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div></div>
   ${s2&&key===flow[3]?`<div class="qc-ok">${CHK}<span>Thanks, ${esc(S.first)}. Your request is in, and a licensed professional has it. Now let's personalize your results.</span></div>`:""}
   <div class="qc-body"><h2>${st.title}</h2>${st.sub?`<p class="sub">${st.sub}</p>`:""}<form novalidate>${st.html()}
   <div class="q-nav">${step&&!(st.stage2&&flow[step-1]==="contact")?'<button type="button" class="q-back">&larr; Back</button>':""}<button type="submit" class="q-go">${btnTxt} ${ARW}</button></div>
   <p class="q-err" role="alert"></p></form></div>
   <div class="qc-foot">${LOCK}<span>Secure and encrypted. Your information is never sold.</span></div>`;
  {const cl=root.querySelector(".consent-line");if(cl)root.querySelector(".q-nav").after(cl)}
  st.bind&&st.bind();
  root.querySelector("form").onsubmit=e=>{e.preventDefault();next()};
  const bk=root.querySelector(".q-back");if(bk)bk.onclick=()=>{step--;render()};
  gt("mm_step_view",{step:key});
}
function err(r){const[id,msg]=Array.isArray(r)?r:[null,r];root.querySelectorAll(".bad").forEach(x=>x.classList.remove("bad"));
  if(id){const el=root.querySelector("#"+id);if(el){el.classList.add("bad");el.focus()}}root.querySelector(".q-err").textContent=msg}
async function next(){
  const key=flow[step],st=STEP[key];
  if(st.read){const r=st.read();if(r==="MEDICARE")return exit("medicare");if(r==="STATE")return exit("state");if(r)return err(r)}
  gt("mm_step_complete",{step:key});
  if(key==="contact"&&!S.leadSent){const b=root.querySelector(".q-go");b.disabled=true;b.innerHTML='<span class="spin"></span> Sending…';await stage1();}
  if(step===flow.length-1)return submit();
  step++;render();if(innerWidth<900)root.scrollIntoView({behavior:"smooth",block:"start"});
}

function exit(kind){
  const msgs={medicare:["Medicare is the right place for you.","Coverage on Mr. Marketplace is for individuals and families under 65. Once you're eligible for Medicare, your options and protections work differently.",`<a class="q-go" style="text-decoration:none" href="${MC}" target="_blank" rel="noopener">Compare plans on Medicare.gov</a>`],
    state:[`We're not yet serving ${esc(Q_NAMES[S.state]||"your state")}.`,"Our licensed professionals can't help in your state yet, so we can't complete your request. Your state's official marketplace is the best place to compare plans in the meantime.",`<a class="q-go" style="text-decoration:none" href="${HC}" target="_blank" rel="noopener">Go to HealthCare.gov</a>`]};
  const[m1,m2,b]=msgs[kind];gt("mm_exit",{reason:kind});
  root.innerHTML=`<div class="qc-body q-msg"><h2>${m1}</h2><p>${m2}</p>${b}<p style="margin-top:14px"><button class="q-back" type="button">&larr; Change an answer</button></p></div>`;
  root.querySelector(".q-back").onclick=()=>render();
}

/* ---------------- qualification engine ---------------- */
const DISPOSABLE=/@(mailinator|guerrillamail|10minutemail|tempmail|temp-mail|yopmail|trashmail|sharklasers|getnada|throwaway|fakeinbox|dispostable)\./i;
function quality(){
  const f=[],d=S.phone.replace(/\D/g,"");
  if(!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)||/^(\d)\1{9}$/.test(d)||/^\d{3}5550[01]\d{2}$/.test(d)||d.slice(0,3)==="555")f.push("phone_invalid");
  if(DISPOSABLE.test(S.email))f.push("email_disposable");
  if((Date.now()-t0)/1000<15)f.push("too_fast");
  try{const seen=JSON.parse(localStorage.getItem("mm_sub")||"{}");if(seen[d]&&Date.now()-seen[d]<864e5)f.push("repeat_24h");seen[d]=Date.now();localStorage.setItem("mm_sub",JSON.stringify(seen))}catch(e){}
  return f;
}
function qualify(R){
  const flags=quality();
  const prod=(S.ages||[]).length&&S.age>=65?0:100;
  const geo=!S.state?60:(QCONFIG.licensedStates.length&&!QCONFIG.licensedStates.includes(S.state)?0:100);
  const timeline={asap:100,next:90,later:70,research:35}[S.start]??60;
  let budget=70;const low=R&&R.ok&&R.plans&&R.plans.length?Math.min(...R.plans.map(p=>p.premium_w_credit??p.premium)):null;
  if(S.budget&&S.budget!=="unsure"&&low!=null){const b=+S.budget;budget=b>=low?100:b*1.25>=low?70:40}else if(S.budget==="unsure")budget=65;else if(S.budget)budget=85;
  let engage={call:100,text:85,email:60}[S.pref]??60;if(["self","owner"].includes(S.work))engage=Math.min(100,engage+5);
  const below=S.product==="health"&&!!S.income&&S.income<target(S.state);
  let score=Math.round(.2*prod+.2*geo+.2*timeline+.15*budget+.25*engage)-flags.filter(x=>x!=="repeat_24h").length*15;score=Math.max(0,Math.min(100,score));
  let cat;
  if(prod===0||geo===0||below||flags.includes("too_fast")&&flags.includes("phone_invalid"))cat="D";
  else if(score>=80&&["asap","next"].includes(S.start)&&S.pref!=="email"&&!flags.length)cat="A";
  else if(score>=60)cat="B"; else cat="C";
  if(flags.includes("phone_invalid")&&cat!=="D")cat="C";
  return {score,category:cat,below_target_income:!!below,breakdown:{product_eligibility:prod,geographic_eligibility:geo,coverage_timeline:timeline,budget_compatibility:budget,contact_engagement:engage},flags,lowest_premium:low};
}

/* ---------------- submit ---------------- */
let RES=null, LEAD=null;
async function stage1(){
  // Stage 1: deliver the lead immediately with contact + basics
  const Q=qualify(null);S.q=Q;
  if(S.hp){S.leadSent=true;LEAD={ok:true,id:null};return}
  LEAD=await sendLead(null,Q,1);S.leadSent=true;
  gt("generate_lead",{stage:1,product:S.product});
}
async function getRates(){
  if(SBM[S.state])return{ok:false,reason:"state_exchange",state:S.state};
  for(let attempt=0;attempt<2;attempt++){
    try{const c=new AbortController(),to=setTimeout(()=>c.abort(),35000);
      const r=await fetch(QCONFIG.endpoints.rates,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({zip:S.zip,ages:S.ages,spouse:S.spouse,income:S.income,tobacco:S.tob==="yes",year:planYear()}),signal:c.signal});
      clearTimeout(to);const R=r.ok?await r.json():{ok:false,reason:"unavailable"};
      if(R.ok||R.reason==="state_exchange"||R.reason==="not_configured"||R.reason==="zip_not_found")return R}catch(e){}
  }
  return{ok:false,reason:"unavailable"};
}
async function submit(){
  const b=root.querySelector(".q-go");b.disabled=true;b.innerHTML=`<span class="spin"></span> ${S.product==="health"?"Finding every plan in "+esc(S.zip)+"…":"Finishing…"}`;
  const R=S.product==="health"?await getRates():{ok:false,reason:"not_requested"};
  RES=R;const Q=qualify(R);S.q=Q;
  if(!S.hp){const upd=await sendLead(R,Q,2);if(upd&&upd.ok)LEAD={...LEAD,...upd,id:LEAD&&LEAD.id||upd.id,token:LEAD&&LEAD.token||upd.token};}
  gt("mm_qualified",{lead_category:(LEAD&&LEAD.category)||Q.category,value:Q.score,product:S.product});
  results(R,LEAD||{ok:true,id:null});
}
function payload(R,Q,stage){
  const p=new URLSearchParams(location.search);
  return {stage,lang:ES?"es":"en",form_version:"mm-2026-11b",consent_version:D.consent_version,product:S.product,
   contact:{first:S.first,last:S.last,phone:S.phone,email:S.email,preferred:S.pref},
   consents:(()=>{const t=(document.getElementById("t_consent")?.textContent||"").replace(/\s*(Privacy|Privacidad)$/,"").trim()||S.consentText||"";if(t)S.consentText=t;const g={given:true,text:t};return{call:g,text:g,email:g,disclosure:"Shown directly above the Continue button",client_time:new Date().toISOString(),page:location.href,user_agent:navigator.userAgent}})(),
   location:{zip:S.zip,state:S.state,county:(R&&R.county)||""},
   household:{who:S.who,ages:S.ages,size:S.ages.length},
   answers:{start:S.start,work:S.work||"",current_coverage:S.coverage||"",current_premium:S.premium||"",income:S.income||null,budget:S.budget||"",tobacco:S.tob||"",
            business_name:S.biz||"",employees:S.emps||"",renewal_month:S.renewal||""},
   qualification:Q,
   rates:R?{status:R.ok?"shown":(R.reason||"n/a"),count:R.ok?R.plans.length:0,carriers:R.ok?(R.carriers||[]).length:0,lowest:Q.lowest_premium,year:R.year||null}:{},
   tracking:{utm_source:p.get("utm_source")||"",utm_medium:p.get("utm_medium")||"",utm_campaign:p.get("utm_campaign")||"",gclid:p.get("gclid")||"",referrer:document.referrer,seconds:Math.round((Date.now()-t0)/1000)}};
}
async function sendLead(R,Q,stage){
  const body=payload(R,Q,stage);
  if(stage===2&&LEAD&&LEAD.id){body.id=LEAD.id;body.token=LEAD.token}
  if(!(stage===2&&LEAD&&LEAD.fallback)){
    try{const r=await fetch(QCONFIG.endpoints.lead,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      if(r.ok){const d=await r.json();if(d.ok){if(d.id&&d.token){try{localStorage.setItem("mm_req",JSON.stringify({id:d.id,t:d.token}))}catch(e){}}return d}}}catch(e){}
  }
  // Fallback when the server isn't deployed: email/webhook straight from the browser
  const flat={_subject:`${stage===1?"NEW LEAD (awaiting qualification)":`QUALIFIED [${Q.category}] score ${Q.score}`}: ${S.first} ${S.last} (${S.state})`,stage,category:stage===2?Q.category:"pending",score:Q.score,product:S.product,
    name:`${S.first} ${S.last}`,phone:S.phone,email:S.email,preferred_contact:S.pref,state:S.state,zip:S.zip,household:S.who,ages:(S.ages||[]).join(", "),start:S.start,
    work:S.work,current_coverage:S.coverage,current_premium:S.premium,budget:S.budget,tobacco:S.tob,income:S.income,business:S.biz,employees:S.emps,renewal:S.renewal,
    flags:Q.flags.join(", "),consent_call:S.cCall,consent_text:S.cText,consent_email:S.cMail,consent_version:D.consent_version,submitted:new Date().toISOString(),_template:"table",_captcha:"false"};
  if(stage===2&&Q.category==="D"&&!QCONFIG.sendCategoryD)return{ok:true,category:"D",fallback:true};
  const jobs=[];
  if(QCONFIG.leadEmail&&!QCONFIG.leadEmail.startsWith("YOUR-"))jobs.push(fetch("https://formsubmit.co/ajax/"+encodeURIComponent(QCONFIG.leadEmail),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(flat)}).catch(()=>{}));
  if(QCONFIG.webhookUrl)jobs.push(fetch(QCONFIG.webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(flat)}).catch(()=>{}));
  if(!jobs.length)console.warn("[TEST MODE] No server, leadEmail or webhookUrl configured. Lead:",flat);
  await Promise.all(jobs);return{ok:true,id:null,category:stage===2?Q.category:null,fallback:true};
}

/* ---------------- results ---------------- */
const TRACK=["Request received","Specialist assigned","Contacted","Options reviewed","Application","Enrolled"];
function results(R,L){
  const v=document.createElement("div");v.className="qr";v.setAttribute("role","dialog");v.setAttribute("aria-modal","true");v.setAttribute("aria-label","Your insurance options");
  const ag=(L&&L.agent)||{name:QCONFIG.specialistName,phone:QCONFIG.callerNumber,title:QCONFIG.specialistTitle};
  const ini=ag.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const cat=(L&&L.category)||S.q.category;S.q.category=cat;const isD=cat==="D", rates=R.ok&&R.plans&&R.plans.length;
  const outOfArea=isD&&!S.q.below_target_income;
  const carriers=rates?(R.carriers&&R.carriers.length?R.carriers:[...new Set(R.plans.map(p=>p.issuer).filter(Boolean))].sort()):[];
  const when={call:`will call you within about ${QCONFIG.callbackMinutes} minutes`,text:"will text you shortly",email:"will email you shortly"}[S.pref];
  const portal=L&&L.id?`${ES?"/es/estado/":"/status/"}?id=${encodeURIComponent(L.id)}&t=${encodeURIComponent(L.token)}`:"";
  const head=outOfArea
    ?`<h2>We're not able to complete this request.</h2><p>Our licensed professionals can't help with this request in ${esc(Q_NAMES[S.state]||"your area")} yet${rates?", but you can still compare the Marketplace plans below":""}. For every plan available to you, visit <a href="${HC}" target="_blank" rel="noopener">HealthCare.gov</a> or your state's official marketplace.</p>`
    :isD
    ?`<h2>${rates?R.plans.length+" plans available to you.":"Here are your next steps."}</h2><p>Based on your household income, you may qualify for premium tax credits that are only available through the official Marketplace. You can enroll with these savings at <a href="${HC}" target="_blank" rel="noopener">HealthCare.gov</a>.</p>`
    :rates?`<h2>${R.plans.length} plans from ${carriers.length} carrier${carriers.length>1?"s":""}.</h2><p>Every Marketplace plan available in ${esc(R.county||"your area")}. ${esc(ag.name)}, a licensed insurance professional, ${when}.${portal?` <a href="${portal}">Track your request</a>.`:""}</p>`
    :`<h2>Your insurance search has started.</h2><p>Your information has been received. ${esc(ag.name)}, a licensed insurance professional, ${when}.${portal?` You can <a href="${portal}">track your request</a> at any time.`:""}</p>`;
  const agentCard=isD?"":`<div class="agent"><div class="who"><span class="av">${esc(ini)}</span><div><b>${esc(ag.name)}</b><small>${esc(ag.title||QCONFIG.specialistTitle)}</small></div></div>
     <div class="acts"><a href="tel:${(ag.phone||QCONFIG.callerNumber||"").replace(/[^\d+]/g,"")}">Call Mr. Marketplace</a></div></div>`;
  const track=isD?"":`<div class="track">${TRACK.map((t,i)=>{const cur=L&&L.agent?1:0;return `<div class="${i<cur?"done":i===cur?"done now":""}">${t}</div>`}).join("")}</div>`;
  let list="";
  if(rates){const metals=[...new Set(R.plans.map(p=>p.metal))];
    const credit=!isD&&R.credit>0?`<div class="credit"><b>Estimated tax credit: ${usd(R.credit)}/mo</b> is already subtracted from the prices below. ${tip("credit","How tax credits work")}</div>`
      :!isD&&R.income_entered?`<div class="credit none">Based on the income you entered, these are full prices without a premium tax credit. ${tip("credit","How tax credits work")}</div>`:"";
    list=`${credit}<div class="tools">
      <div class="tool"><h3>${QI.doc} Your doctors &amp; hospitals</h3><p>See which plans include them in network.</p><div class="sel" data-sel="doc"></div>
        <div class="srch"><div class="seg2"><button type="button" class="on" data-pt="Individual">Doctor</button><button type="button" data-pt="Facility">Hospital / facility</button></div>
        <input type="search" data-q="doc" placeholder="Search by name, e.g. Smith" autocomplete="off" aria-label="Search doctors and hospitals"><div class="sug" data-sug="doc"></div></div></div>
      <div class="tool"><h3>${QI.rx} Your prescriptions</h3><p>See which plans cover them.</p><div class="sel" data-sel="rx"></div>
        <div class="srch"><input type="search" data-q="rx" placeholder="Drug name, e.g. atorvastatin" autocomplete="off" aria-label="Search prescriptions"><div class="sug" data-sug="rx"></div></div></div>
      <div class="tool"><h3>${QI.cost} Your expected care ${tip("use","How the yearly estimate works")}</h3><p>We estimate a full year of cost for every plan.</p>
        <div class="seg3">${[["low","Low","Checkups, a few visits"],["med","Medium","Regular visits, prescriptions"],["high","High","Surgery or hospital stay"]].map(([v,t,d])=>`<button type="button" data-use="${v}" class="${USE===v?"on":""}"><b>${t}</b><small>${d}</small></button>`).join("")}</div></div>
     </div>
     <div class="qr-bar"><div class="chips"><button class="on" data-m="all">All plans <span>${R.plans.length}</span></button>${["Bronze","Expanded Bronze","Silver","Gold","Platinum","Catastrophic"].filter(m=>metals.includes(m)).map(m=>`<button data-m="${m}">${m}</button>`).join("")}<button data-h="1">HSA eligible</button><button data-cv="1" hidden>Covers my doctors &amp; drugs</button></div>
     <div style="display:flex;gap:10px;flex-wrap:wrap"><label class="sort">Carrier <select class="car"><option value="">All carriers (${carriers.length})</option>${carriers.map(c=>`<option>${esc(c)}</option>`).join("")}</select></label><label class="sort">Sort <select class="srt"><option value="year">Lowest yearly estimate</option><option value="premium" selected>Lowest premium</option><option value="deductible">Lowest deductible</option><option value="moop">Lowest out-of-pocket max</option><option value="rating">Highest rated</option></select></label></div></div>
     <div class="legend"><b>New to insurance terms?</b> <span>Premium ${tip("premium")}</span><span>Deductible ${tip("deductible")}</span><span>Out-of-pocket max ${tip("moop")}</span><span>Metal levels ${tip("metal")}</span><span>HMO / PPO / EPO ${tip("network")}</span><span>HSA ${tip("hsa")}</span> <a href="/glossary/" target="_blank">Full glossary ↗</a></div>
     <div class="plans"></div>
     <div class="cmp-tray" hidden><span></span><button type="button" class="cmp-clear">Clear</button><button type="button" class="cmp-go">Compare side by side</button></div>
     <p class="qr-fine">Prices, benefits, provider networks and drug lists come from the HealthCare.gov Marketplace for ${R.year} coverage, as reported by each insurance company, based on the ages, ZIP code and income you entered. Networks and drug lists can change and are sometimes incomplete: always confirm with the doctor's office and the plan before enrolling. Your licensed specialist can verify them for you. Final premiums are confirmed at enrollment.</p>`;
  } else if(S.product==="health"){
    const st=R.state||S.state, sb=SBM[st];
    if(R.reason==="state_exchange"&&sb){
      list=`<div class="panel live"><h3>See every real plan in ${esc(Q_NAMES[st]||st)}.</h3><p>${esc(Q_NAMES[st]||st)} runs its own official marketplace, ${esc(sb[0])}. Its plan finder shows every plan and real price for your ZIP code, including any tax credit.</p><p style="margin-top:16px"><a class="btn btn-navy" href="${sb[1]}" target="_blank" rel="noopener">See plans on ${esc(sb[0])} ↗</a></p>${isD?"":`<p class="fine" style="margin-top:14px">${esc(ag.name)} will still reach out to help you compare and enroll, at no cost.</p>`}</div>`;
    } else {
      list=`<div class="panel live"><h3>We couldn't load live plans just now.</h3><p>Your information is saved. Try again, or see every real plan for your ZIP code on the official Marketplace.</p><p style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-navy" data-retry>Try again</button><a class="btn btn-line" href="${HC}${ES?"":"see-plans/"}" target="_blank" rel="noopener">See plans on HealthCare.gov ↗</a></p></div>`;
    }
  } else if(S.product==="business"){
    list=`<div class="panel"><h3>What happens next</h3><p>${esc(ag.name)} will review coverage options for ${esc(S.biz)} and walk you through costs and next steps${S.renewal&&S.renewal!=="Not sure"?` ahead of your ${esc(S.renewal)} date`:""}.</p></div>`;
  }
  v.innerHTML=`<div class="qr-top"><a href="/"><img src="/assets/brand/logo-horizontal-dark.png" alt="${esc(D.brand)}"></a><button class="qr-x" type="button">Edit details</button></div>
   <div class="qr-main"><div class="qr-hd"><div><div class="meta">${esc(S.product==="business"?S.biz:`${S.ages.length} ${S.ages.length>1?"people":"person"} · ZIP ${S.zip}`)}${R.county?" · "+esc(R.county):""}</div>${head}</div>${agentCard}</div>${track}${list}</div>`;
  document.body.appendChild(v);document.documentElement.classList.add("qr-open");
  v.querySelector(".qr-x").onclick=()=>{v.remove();document.documentElement.classList.remove("qr-open")};
  if(rates)bindPlans(v,R);
  const rt=v.querySelector("[data-retry]");if(rt)rt.onclick=async()=>{rt.disabled=true;rt.textContent=tr("Loading…");const R2=await getRates();v.remove();document.documentElement.classList.remove("qr-open");results(R2,L)};
}

/* ---------------- plain-English glossary ---------------- */
const GL={
 premium:["Monthly premium","What you pay every month to keep the plan, whether or not you use care. Prices shown already subtract any tax credit you qualify for."],
 deductible:["Deductible","What you pay for covered care each year before the plan starts sharing costs. Many plans cover preventive care and some visits before the deductible."],
 moop:["Out-of-pocket maximum","The most you'll pay for covered, in-network care in a year (deductible + copays + coinsurance). After you hit it, the plan pays 100%. Premiums don't count toward it."],
 copay:["Copay","A fixed amount you pay for a service, like $30 for a doctor visit."],
 coins:["Coinsurance","Your share of a bill as a percentage, like 20%, usually after you meet the deductible."],
 metal:["Metal levels","Bronze: lowest premiums, highest costs when you get care. Silver: in the middle. Gold and Platinum: higher premiums, lower costs when you use care. Metal level is about how costs are split, not the quality of care."],
 network:["HMO, PPO, EPO, POS","HMO and EPO plans generally cover only in-network care (except emergencies); HMOs often require a referral for specialists. PPO plans also pay something for out-of-network care. POS plans mix both. Always check your doctors."],
 hsa:["HSA eligible","These plans let you open a Health Savings Account: tax-advantaged money you can set aside for medical costs."],
 credit:["Premium tax credit","A tax credit that lowers your monthly premium. The amount depends on your estimated household income for the coverage year and the cost of a benchmark Silver plan in your area. It's applied directly to your premium and reconciled on your tax return, so report income changes during the year. Your specialist can walk you through it."],
 use:["Yearly cost estimate","12 months of premium plus estimated out-of-pocket costs. Low: about $500 of care. Medium: about $5,000 of care (you pay up to the deductible, then about 20%). High: a major event, so you reach the out-of-pocket maximum. Real costs depend on your care and the plan's copays."],
 network_status:["In network","\"In network\" means the insurance company reported to HealthCare.gov that this doctor or facility is part of the plan's network. Networks change, so confirm with the office before enrolling."]
};
function tip(k,label){return `<button type="button" class="tip" data-tip="${k}" aria-label="${esc(label||GL[k][0])}">?</button>`}
document.addEventListener("click",e=>{const b=e.target.closest(".tip");document.querySelectorAll(".tipbox").forEach(x=>x.remove());if(!b)return;e.preventDefault();e.stopPropagation();
  const g=GL[b.dataset.tip];if(!g)return;const t=document.createElement("div");t.className="tipbox";t.setAttribute("role","tooltip");t.innerHTML=`<b>${esc(g[0])}</b>${esc(g[1])}`;document.body.appendChild(t);
  const r=b.getBoundingClientRect(),w=Math.min(320,innerWidth-24);t.style.width=w+"px";t.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+"px";
  const top=r.bottom+8;t.style.top=(top+t.offsetHeight>innerHeight?r.top-t.offsetHeight-8:top)+"px"},true);
const QI={doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6M17 14.5v4M15 16.5h4"/></svg>',
 rx:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="9" width="17" height="6.5" rx="3.25" transform="rotate(-40 12 12.25)"/><path d="M9.5 9.2l5 5"/></svg>',
 cost:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3M9 14h6"/></svg>'};

/* ---------------- shopping tools ---------------- */
let filt="all",sort="premium",hsa=false,car="",onlyCv=false,USE="med";
const MY={doc:[],rx:[]},CV={},CMP=[];let cvBusy=false,careT=null;
const yearCost=p=>{const prem=(p.premium_w_credit??p.premium)*12,d=p.deductible??0,m=p.moop??d;
  const care=USE==="low"?500:USE==="med"?5000:1e9;const oop=USE==="high"?m:Math.min(m,Math.min(care,d)+0.2*Math.max(0,care-d));return prem+oop};
function bindPlans(v,R){
  v.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{if(b.dataset.h){hsa=!hsa;b.classList.toggle("on",hsa)}else if(b.dataset.cv){onlyCv=!onlyCv;b.classList.toggle("on",onlyCv)}else{v.querySelectorAll(".chips [data-m]").forEach(x=>x.classList.remove("on"));b.classList.add("on");filt=b.dataset.m}list(v,R)});
  v.querySelector("select.srt").onchange=e=>{sort=e.target.value;list(v,R)};v.querySelector("select.car").onchange=e=>{car=e.target.value;list(v,R)};
  v.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>{USE=b.dataset.use;v.querySelectorAll("[data-use]").forEach(x=>x.classList.toggle("on",x===b));list(v,R)});
  let ptype="Individual";v.querySelectorAll("[data-pt]").forEach(b=>b.onclick=()=>{ptype=b.dataset.pt;v.querySelectorAll("[data-pt]").forEach(x=>x.classList.toggle("on",x===b));const i=v.querySelector('[data-q="doc"]');i.placeholder=ptype==="Facility"?"Hospital or facility name":"Search by name, e.g. Smith";i.dispatchEvent(new Event("input"))});
  const search=(k)=>{const inp=v.querySelector(`[data-q="${k}"]`),sug=v.querySelector(`[data-sug="${k}"]`);let t,seq=0;
    inp.oninput=()=>{clearTimeout(t);const q=inp.value.trim();if(q.length<(k==="rx"?3:2)){sug.innerHTML="";return}
      t=setTimeout(async()=>{const my=++seq;sug.innerHTML='<div class="ld">Searching…</div>';
        const url=k==="doc"?`${QCONFIG.endpoints.coverage}?action=providers&type=${ptype}&zip=${S.zip}&year=${R.year}&q=${encodeURIComponent(q)}`:`${QCONFIG.endpoints.coverage}?action=drugs&year=${R.year}&q=${encodeURIComponent(q)}`;
        const d=await fetch(url).then(r=>r.json()).catch(()=>({}));if(my!==seq)return;
        const items=k==="doc"?(d.providers||[]).map(p=>({id:p.npi,name:p.name,detail:[(p.specialties||[])[0]||(p.facility_types||[])[0],p.address,p.distance!=null?p.distance+" mi":""].filter(Boolean).join(" · ")})):(d.drugs||[]).map(x=>({id:x.rxcui,name:x.name,detail:""}));
        sug.innerHTML=items.length?items.map((x,i)=>`<button type="button" data-i="${i}"><b>${esc(x.name)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:""}</button>`).join(""):`<div class="ld">${d.ok===false?"Search isn't available right now. Your specialist can check this for you.":"No matches. Try another spelling."}</div>`;
        sug.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const x=items[+b.dataset.i];if(!MY[k].some(y=>y.id===x.id)&&MY[k].length<10)MY[k].push(x);inp.value="";sug.innerHTML="";chips(v,R);check(v,R)})},300)}};
  search("doc");search("rx");
  v.querySelector(".cmp-clear").onclick=()=>{CMP.length=0;list(v,R)};v.querySelector(".cmp-go").onclick=()=>compare(R);
  chips(v,R);list(v,R);
}
function chips(v,R){["doc","rx"].forEach(k=>{const el=v.querySelector(`[data-sel="${k}"]`);el.innerHTML=MY[k].map(x=>`<span class="ch">${esc(x.name.length>38?x.name.slice(0,36)+"…":x.name)}<button type="button" data-rm="${esc(x.id)}" aria-label="Remove ${esc(x.name)}">×</button></span>`).join("");
  el.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{MY[k]=MY[k].filter(x=>x.id!==b.dataset.rm);chips(v,R);check(v,R)})});
  v.querySelector("[data-cv]").hidden=!(MY.doc.length||MY.rx.length);if(!(MY.doc.length||MY.rx.length))onlyCv=false}
async function check(v,R){
  clearTimeout(careT);careT=setTimeout(()=>event({type:"care_needs",doctors:MY.doc,drugs:MY.rx}),2500);
  if(!MY.doc.length&&!MY.rx.length){list(v,R);return}
  cvBusy=true;list(v,R);
  const d=await fetch(QCONFIG.endpoints.coverage,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"check",year:R.year,npis:MY.doc.map(x=>x.id),rxcuis:MY.rx.map(x=>x.id),planids:R.plans.map(p=>p.id)})}).then(r=>r.json()).catch(()=>({}));
  Object.keys(CV).forEach(k=>delete CV[k]);Object.assign(CV,d.coverage||{});cvBusy=false;list(v,R);
}
const cvOf=(p)=>{const c=CV[p.id]||{p:{},d:{}};const st=x=>x==="Covered"||x==="GenericCovered"?"y":x==="NotCovered"?"n":"u";
  return [...MY.doc.map(x=>({x,k:"doc",s:st(c.p[x.id]),g:false})),...MY.rx.map(x=>({x,k:"rx",s:st(c.d[x.id]),g:c.d[x.id]==="GenericCovered"}))]};
const allCv=p=>cvOf(p).every(i=>i.s==="y");
function list(v,R){
  const pr=p=>p.premium_w_credit??p.premium,has=MY.doc.length||MY.rx.length;
  let ps=R.plans.filter(p=>(filt==="all"||p.metal===filt)&&(!hsa||p.hsa)&&(!car||p.issuer===car)&&(!onlyCv||allCv(p)));
  const k={year:yearCost,premium:pr,deductible:p=>p.deductible??1e9,moop:p=>p.moop??1e9,rating:p=>-(p.rating||0)}[sort];ps=ps.slice().sort((a,b)=>k(a)-k(b));
  const el=v.querySelector(".plans"),cp=p=>p.copays||{};
  el.innerHTML=ps.length?ps.map((p,i)=>{const cv=has?cvOf(p):[];return `<article class="pc" style="animation-delay:${Math.min(i,10)*35}ms"><div><div class="iss">${esc(p.issuer)}</div><h3>${esc(p.name)}</h3>
    <div class="tags"><span class="mt-${esc((p.metal||"").split(" ").pop().toLowerCase())}">${esc(p.metal)}</span><span>${esc(p.type)}</span>${p.hsa?"<span>HSA eligible</span>":""}${p.rating?`<span title="HealthCare.gov quality rating">${"★".repeat(p.rating)}${"☆".repeat(5-p.rating)}</span>`:""}</div></div>
    <div class="n"><span>Deductible</span><b>${usd(p.deductible)}</b></div><div class="n"><span>Out-of-pocket max</span><b>${usd(p.moop)}</b></div>
    <div class="p"><span>Monthly premium</span><b>${usd(pr(p))}</b>${p.premium_w_credit!=null&&p.premium_w_credit<p.premium?`<s>${usd(p.premium)}</s>`:""}<small class="yr">Est. ${usd(yearCost(p))}/yr</small></div>
    ${has?`<div class="cvrow">${cvBusy&&!CV[p.id]?'<span class="cv u">Checking your doctors and prescriptions…</span>':cv.map(i=>`<span class="cv ${i.s}">${i.s==="y"?"✓":i.s==="n"?"✕":"?"} ${esc(i.x.name.split(/[,(]/)[0].slice(0,34))} <em>${i.k==="doc"?(i.s==="y"?"in network":i.s==="n"?"not in network":"not reported"):(i.s==="y"?(i.g?"generic covered":"covered"):i.s==="n"?"not covered":"not reported")}</em></span>`).join("")}</div>`:""}
    <div class="pfoot"><span class="mini">${cp(p).pcp?`Primary care: <b>${esc(cp(p).pcp)}</b>`:""}${cp(p).generic?` · Generic drugs: <b>${esc(cp(p).generic)}</b>`:""}</span>
     <span class="acts2"><label class="cmpk"><input type="checkbox" data-cmp="${esc(p.id)}" ${CMP.includes(p.id)?"checked":""}> Compare</label><button type="button" class="det" data-det="${esc(p.id)}">Plan details</button>${S.q.category!=="D"?`<button class="ask" data-id="${esc(p.id)}">Ask about this plan</button>`:""}</span></div>
    <div class="pdet" data-pdet="${esc(p.id)}" hidden></div></article>`}).join(""):`<p style="padding:30px;text-align:center;color:var(--mute)">No plans match these filters.</p>`;
  el.querySelectorAll(".ask").forEach(b=>b.onclick=async()=>{const p=R.plans.find(x=>x.id===b.dataset.id);b.disabled=true;b.textContent="Sent to your specialist ✓";
    await event({type:"plan_interest",plan:{id:p.id,name:p.name,issuer:p.issuer,metal:p.metal,type:p.type,premium:pr(p),deductible:p.deductible}})});
  el.querySelectorAll("[data-cmp]").forEach(c=>c.onchange=()=>{const id=c.dataset.cmp;if(c.checked){if(CMP.length>=3){c.checked=false;return alert(tr("You can compare up to 3 plans at a time."))}CMP.push(id)}else CMP.splice(CMP.indexOf(id),1);tray(v)});
  el.querySelectorAll("[data-det]").forEach(b=>b.onclick=()=>details(v,R,b.dataset.det,b));
  tray(v);
}
function tray(v){const t=v.querySelector(".cmp-tray");t.hidden=!CMP.length;t.querySelector("span").textContent=`${CMP.length} plan${CMP.length>1?"s":""} selected${CMP.length<2?" · pick at least 2":""}`;t.querySelector(".cmp-go").disabled=CMP.length<2}
const DET={};
async function details(v,R,id,btn){
  const box=v.querySelector(`[data-pdet="${CSS.escape(id)}"]`);if(!box)return;if(!box.hidden){box.hidden=true;btn.textContent="Plan details";return}
  box.hidden=false;btn.textContent="Hide details";const p=R.plans.find(x=>x.id===id);
  const links=d=>[[d.benefits_url||p.benefits_url,"Summary of benefits"],[d.network_url||p.network_url,"Provider directory"],[d.formulary_url||p.formulary_url,"Covered drug list"],[d.brochure||p.brochure,"Plan brochure"]].filter(x=>x[0]).map(([u,t])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${t} ↗</a>`).join("");
  const base=Object.entries({pcp:"Primary care visit",spec:"Specialist visit",urgent:"Urgent care",er:"Emergency room",generic:"Generic drugs"}).filter(([k])=>(p.copays||{})[k]).map(([k,t])=>`<div><span>${t}</span><b>${esc(p.copays[k])}</b></div>`).join("");
  const draw=(d,more)=>{box.innerHTML=`<div class="dgrid">${base}${more||""}</div><p class="gl">What these mean: <span>Copay ${tip("copay")}</span> <span>Coinsurance ${tip("coins")}</span></p><div class="dlinks">${links(d||{})}</div>`};
  draw(DET[id]);if(DET[id])return;box.insertAdjacentHTML("beforeend",'<p class="ld">Loading full benefits…</p>');
  const d=await fetch(`${QCONFIG.endpoints.coverage}?action=plan&year=${R.year}&id=${encodeURIComponent(id)}`).then(r=>r.json()).catch(()=>({}));
  if(d.ok){DET[id]=d;const shown=/primary care|specialist|urgent|emergency room|generic drugs/i;const more=d.benefits.filter(b=>!shown.test(b.name)).slice(0,24).map(b=>`<div><span>${esc(b.name)}</span><b>${esc(b.cost)}</b></div>`).join("");draw(d,more)}else draw({});
}
function compare(R){
  const ps=CMP.map(id=>R.plans.find(p=>p.id===id)).filter(Boolean),pr=p=>p.premium_w_credit??p.premium,has=MY.doc.length||MY.rx.length;
  const low=(f)=>{const vals=ps.map(f).filter(x=>x!=null);return vals.length>1&&new Set(vals).size>1?Math.min(...vals):null};
  const row=(t,f,best,fmt=usd,k)=>`<tr><th>${t}${k?" "+tip(k):""}</th>${ps.map(p=>{const x=f(p);return `<td class="${best&&x!=null&&x===best?"best":""}">${x==null||x===""?"—":fmt(x)}</td>`}).join("")}</tr>`;
  const txt=x=>esc(x);
  const m=document.createElement("div");m.className="cmp-bg";
  m.innerHTML=`<div class="cmp" role="dialog" aria-modal="true" aria-label="Compare plans"><div class="cmp-h"><h3>Compare plans</h3><button type="button" class="cmp-x" aria-label="Close">×</button></div><div class="cmp-b"><table>
   <tr><th></th>${ps.map(p=>`<td><small>${esc(p.issuer)}</small><b>${esc(p.name)}</b><span class="mt-${esc((p.metal||"").split(" ").pop().toLowerCase())} tg">${esc(p.metal)}</span></td>`).join("")}</tr>
   ${row("Monthly premium",pr,low(pr),usd,"premium")}${R.credit>0?row("Tax credit applied",p=>p.credit||0,null):""}
   ${row(`Est. yearly cost (${{low:"low",med:"medium",high:"high"}[USE]} use)`,yearCost,low(yearCost),usd,"use")}
   ${row("Deductible",p=>p.deductible,low(p=>p.deductible),usd,"deductible")}${row("Out-of-pocket max",p=>p.moop,low(p=>p.moop),usd,"moop")}
   ${row("Network type",p=>p.type,null,txt,"network")}${row("Primary care",p=>(p.copays||{}).pcp,null,txt,"copay")}${row("Specialist",p=>(p.copays||{}).spec,null,txt)}
   ${row("Urgent care",p=>(p.copays||{}).urgent,null,txt)}${row("Emergency room",p=>(p.copays||{}).er,null,txt)}${row("Generic drugs",p=>(p.copays||{}).generic,null,txt)}
   ${row("HSA eligible",p=>p.hsa?"Yes":"No",null,txt,"hsa")}${row("Quality rating",p=>p.rating?"★".repeat(p.rating)+"☆".repeat(5-p.rating):"Not rated",null,txt)}
   ${has?`<tr><th>Your doctors &amp; drugs</th>${ps.map(p=>`<td>${cvOf(p).map(i=>`<div class="cv ${i.s}">${i.s==="y"?"✓":i.s==="n"?"✕":"?"} ${esc(i.x.name.split(/[,(]/)[0].slice(0,30))}</div>`).join("")}</td>`).join("")}</tr>`:""}
   <tr><th>Documents</th>${ps.map(p=>`<td class="lk">${[[p.benefits_url,"Summary of benefits"],[p.network_url,"Provider directory"],[p.formulary_url,"Drug list"]].filter(x=>x[0]).map(([u,t])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${t} ↗</a>`).join("")||"—"}</td>`).join("")}</tr>
   ${S.q.category!=="D"?`<tr><th></th>${ps.map(p=>`<td><button class="ask" data-id="${esc(p.id)}">Ask about this plan</button></td>`).join("")}</tr>`:""}
  </table></div></div>`;
  document.body.appendChild(m);const close=()=>m.remove();m.querySelector(".cmp-x").onclick=close;m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll(".ask").forEach(b=>b.onclick=async()=>{const p=R.plans.find(x=>x.id===b.dataset.id);b.disabled=true;b.textContent="Sent ✓";await event({type:"plan_interest",plan:{id:p.id,name:p.name,issuer:p.issuer,metal:p.metal,type:p.type,premium:pr(p),deductible:p.deductible}})});
}
async function event(ev){
  if(LEAD&&LEAD.id){try{await fetch(QCONFIG.endpoints.status,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:LEAD.id,token:LEAD.token,...ev})});return}catch(e){}}
  const flat={_subject:`${ev.type.toUpperCase()}: ${S.first} ${S.last}`,name:`${S.first} ${S.last}`,phone:S.phone,email:S.email,detail:JSON.stringify(ev),_template:"table",_captcha:"false"};
  if(QCONFIG.leadEmail&&!QCONFIG.leadEmail.startsWith("YOUR-"))fetch("https://formsubmit.co/ajax/"+encodeURIComponent(QCONFIG.leadEmail),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(flat)}).catch(()=>{});
  if(QCONFIG.webhookUrl)fetch(QCONFIG.webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(flat)}).catch(()=>{});
  if(!QCONFIG.webhookUrl&&QCONFIG.leadEmail.startsWith("YOUR-"))console.warn("[TEST MODE] event",flat);
}
/* ---------------- entry points ---------------- */
document.querySelectorAll("[data-product]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.product==="business"){S.who="business";S.product="business";setFlow()}step=0;render();root.scrollIntoView({behavior:"smooth",block:"center"})}));
document.querySelectorAll('a[data-quote],a[href="#quote"],a[href="/#quote"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();root.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>root.querySelector("select,input,button")?.focus({preventScroll:true}),600)}));
render();
if(/get-started|#quote/.test(location.pathname+location.hash))setTimeout(()=>root.scrollIntoView({block:"center"}),200);
})();
