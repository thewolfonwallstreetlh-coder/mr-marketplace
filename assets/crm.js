/* Mr. Marketplace CRM (/crm/) */
(function(){
const root=document.getElementById("crm");if(!root)return;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const IC={today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
 pipe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4" width="4.5" height="16" rx="1.5"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.5"/><rect x="16" y="4" width="4.5" height="7" rx="1.5"/></svg>',
 leads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5M16 5.5a3 3 0 010 5.8M18 14.6c1.6.6 2.7 2.2 3.1 4.9"/></svg>',
 rep:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
 adv:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>'};
const STL={received:"New",assigned:"Assigned",contacted:"Contacted",quoting:"Quoting",application:"Application",enrolled:"Enrolled",lost:"Lost"};
const PROD={health:"Individual & family",business:"Business",dental:"Dental & vision",supplemental:"Supplemental"};
const START={asap:"As soon as possible",next:"Next month",later:"In 2–3 months",research:"Just researching"};
const BUD={"500":"Under $500","1000":"$500–$1,000","2000":"$1,000–$2,000","9999":"$2,000+",unsure:"Not sure"};
const WORK={self:"Self-employed",owner:"Business owner",w2:"Employed (W-2)",between:"Between jobs",other:"Other"};
const WHO={me:"Just me",couple:"Me + spouse",kids:"Me + kids",family:"Family",business:"Business"};
const OUT=["Connected – interested","Connected – quoting","Connected – not interested","Left voicemail","No answer","Call back later","Wrong number"];
let pw=(()=>{try{return sessionStorage.getItem("mm_tok")||""}catch(e){return""}})(),me=null,leads=[],view=location.hash.replace("#","").split("/")[0]||"today",known=new Set(),timer,open=null,tab="overview",sortK="created",sortD=-1;
const F={q:"",cat:"",status:"open",product:"",source:"",stage:""};
const api=(p,b)=>fetch(p,{method:b?"POST":"GET",headers:{authorization:"Bearer "+pw,"content-type":"application/json"},body:b?JSON.stringify(b):undefined}).then(r=>r.status===401?{ok:false,unauth:true}:r.json()).catch(()=>({ok:false}));
const ago=t=>{if(!t)return"";const s=(Date.now()-Date.parse(t))/1000;return s<60?"just now":s<3600?Math.floor(s/60)+"m ago":s<86400?Math.floor(s/3600)+"h ago":s<172800?"yesterday":new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"})};
const fdt=t=>t?new Date(t).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"";
const money=n=>n==null||isNaN(n)?"—":"$"+Math.round(n).toLocaleString();
const isOpen=l=>!["enrolled","lost"].includes(l.status);
const cat=l=>{const c=l.qualification_status==="awaiting"?"P":(l.qualification?.category||"B");return ["A","B","C","D","P"].includes(c)?c:"B"};
const catTitle={A:"A · ready now",B:"B · eligible",C:"C · needs info",D:"D · not eligible",P:"Awaiting qualification"};
const due=t=>t&&!t.done&&t.due&&Date.parse(t.due)<Date.now();
const today=t=>t&&t.due&&new Date(t.due).toDateString()===new Date().toDateString();
const byId=id=>leads.find(l=>l.id===id);
const ph=l=>(l.contact.phone||"").replace(/\D/g,"");
const fp=p=>{const d=String(p||"").replace(/\D/g,"").slice(-10);return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:p||""};
const can=(l,c)=>l.consents?.[c]?.given&&!l.consents?.[c]?.withdrawn;


/* ---------- Advisors (owner only): the $500/week program ---------- */
const AST={applied:["New application","aw"],approved:["Approved · awaiting payment",""],active:["Active","ok"],past_due:["Payment failed","od"],paused:["Paused",""],canceled:["Canceled",""],rejected:["Declined",""]};
let ADV=null;
async function vAdv(m){
  m.innerHTML=`<div class="advw"><div class="ph"><div><h1>Advisors</h1><p>Agents paying $500/week for CRM access and exclusive leads in their licensed states.</p></div><a class="btns" href="/agents/" target="_blank" rel="noopener" style="text-decoration:none">View join page ↗</a></div><div class="advb"><div class="empty">Loading…</div></div></div>`;
  const r=await api("/api/advisor/admin");if(!r.ok){m.querySelector(".advb").innerHTML='<div class="empty">Couldn\'t load advisors.</div>';return}
  ADV=r;drawAdv(m);
}
function drawAdv(m){
  const b=m.querySelector(".advb");if(!b)return;const S=ADV.setup,list=ADV.advisors;
  const miss=[!S.payment_link&&"<b>STRIPE_PAYMENT_LINK</b>: your $500/week Stripe Payment Link",!S.webhook&&"<b>STRIPE_WEBHOOK_SECRET</b>: so payments switch access on and off automatically",!S.alerts&&"<b>RESEND_API_KEY</b> and <b>ALERT_EMAIL</b>: so you're emailed about new applications"].filter(Boolean);
  const live=list.filter(a=>a.live),wk=live.length*500;
  const states={};live.forEach(a=>a.states.forEach(s=>(states[s]=(states[s]||0)+1)));
  const btn=(a,act,t,cls)=>`<button class="mini-btn ${cls||""}" data-adv="${esc(a.id)}" data-act="${act}">${t}</button>`;
  const acts=a=>{const x=[];
    if(a.status==="applied"){x.push(btn(a,"approve","Approve","navy"),btn(a,"reject","Decline"))}
    if(a.status==="approved"){x.push(btn(a,"welcome","Copy welcome message","navy"),btn(a,"activate","Mark paid (7 days)"))}
    if(a.status==="active"){if(!a.has_password)x.push(btn(a,"welcome","Copy welcome message","navy"));x.push(btn(a,"states","Edit states"),btn(a,"activate","Add 7 days"),btn(a,"pause","Pause"))}
    if(a.status==="past_due"){x.push(btn(a,"paylink","Copy payment link","navy"),btn(a,"pause","Pause"))}
    if(["paused","canceled"].includes(a.status)){x.push(btn(a,"resume","Resume","navy"),btn(a,"delete","Remove"))}
    if(a.status==="rejected"){x.push(btn(a,"approve","Approve"),btn(a,"delete","Remove"))}
    if(!a.npn_verified&&!["rejected","canceled"].includes(a.status))x.push(btn(a,"npn_verified","License checked"));
    return x.join(" ")};
  b.innerHTML=`${miss.length?`<div class="card advset"><h3>Finish setting up payments</h3><p>Add these in Netlify → Keys and secrets, then redeploy:</p><ul>${miss.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}
   <div class="kp advk"><div class="k"><span>Active advisors</span><b>${live.length}</b></div><div class="k"><span>Weekly revenue</span><b>$${wk.toLocaleString()}</b></div><div class="k"><span>New applications</span><b>${list.filter(a=>a.status==="applied").length}</b></div><div class="k"><span>Payment problems</span><b>${list.filter(a=>a.status==="past_due").length}</b></div><div class="k"><span>States covered</span><b>${Object.keys(states).length}</b></div></div>
   <div class="card"><div class="tblwrap"><table class="tbl advt"><thead><tr><th>Advisor</th><th>Status</th><th>States</th><th class="hm">NPN</th><th class="hm">Leads (7 days)</th><th class="hm">Paid through</th><th></th></tr></thead><tbody>
   ${list.map(a=>`<tr><td><b>${esc(a.name)}</b><br><small>${esc(a.email)} · ${esc(a.phone)}${a.languages?.includes("Spanish")?' · <span class="pill">Español</span>':""}</small></td>
     <td><span class="pill ${AST[a.status]?.[1]||""}">${esc(AST[a.status]?.[0]||a.status)}</span>${a.status==="active"&&!a.has_password?'<br><small>No password yet</small>':""}</td>
     <td>${esc((a.states||[]).join(", "))}</td>
     <td class="hm">${esc(a.npn)}${a.npn_verified?' <span class="pill ok">checked</span>':""}${a.ffm_registered?'<br><small>FFM registered</small>':'<br><small style="color:var(--bad)">Not FFM registered</small>'}</td>
     <td class="hm">${a.leads_7d}</td><td class="hm">${a.paid_through?esc(new Date(a.paid_through).toLocaleDateString(undefined,{month:"short",day:"numeric"})):"—"}</td>
     <td class="advacts">${acts(a)}</td></tr>`).join("")||'<tr><td colspan="7" class="empty">No applications yet. Share your join page with agents: <b>'+esc(location.origin)+'/agents/</b></td></tr>'}
   </tbody></table></div></div>
   <p class="advnote">Before approving, look up each agent's NPN on NIPR or their state insurance department to confirm the license is active in every state they listed. Leads go only to active, paid advisors licensed in the lead's state. If no advisor covers a state, the lead comes to you.</p>`;
  b.querySelectorAll("[data-act]").forEach(x=>x.onclick=()=>advAct(m,x.dataset.adv,x.dataset.act));
}
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand("copy")}catch(x){}a.remove();return ok}}
function welcome(a,invite){
  return `Hi ${a.first},

Welcome to Mr. Marketplace! You've been approved as a Mr. Marketplace advisor for ${a.states.join(", ")}.

1) Start your $500/week membership:
${a.pay_link||"(payment link coming separately)"}

2) Create your CRM password (link expires in 14 days):
${invite}

3) Sign in any time at ${location.origin}/crm/ with ${a.email}

Once your payment goes through, new leads in your licensed states come straight to your CRM and email. Each lead goes to one advisor only, so please reach out quickly and only in the ways each person agreed to.

Joseph Frazier
President, Mr. Marketplace`}
async function advAct(m,id,act){
  const a=ADV.advisors.find(x=>x.id===id);if(!a)return;
  const send=async body=>{const r=await api("/api/advisor/admin",{id,...body});if(!r.ok){toast(r.error==="states"?"Enter at least one valid state.":"Couldn't save that change.");return null}
    if(r.deleted)ADV.advisors=ADV.advisors.filter(x=>x.id!==id);else{const i=ADV.advisors.findIndex(x=>x.id===id);ADV.advisors[i]={...ADV.advisors[i],...r.advisor}}drawAdv(m);return r};
  if(act==="paylink"){if(!a.pay_link)return toast("Add STRIPE_PAYMENT_LINK in Netlify first.");return toast(await copy(a.pay_link)?"Payment link copied. Send it to "+a.first+".":"Couldn't copy.")}
  if(act==="welcome"||act==="approve"){const r=await send({action:act==="approve"?"approve":"invite"});if(!r)return;
    const link=r.invite_link;if(!link){toast("Approved.");return}
    const text=welcome({...a,...r.advisor},link);const ok=await copy(text);
    modal(`<h3>Send this to ${esc(a.first)}</h3><p style="font-size:13.5px;color:var(--mute);margin:-4px 0 12px">${ok?"Copied to your clipboard. ":""}Paste it into an email to ${esc(a.email)}. The setup link works once and expires in 14 days.</p><textarea readonly style="width:100%;height:280px;font:13px/1.5 var(--font);border:1px solid var(--line);border-radius:10px;padding:12px">${esc(text)}</textarea>`,()=>true,"Done");return}
  if(act==="states"){modal(`<h3>States for ${esc(a.name)}</h3><div class="frm"><div class="full"><label>Licensed states (2-letter codes, comma separated)<input name="s" value="${esc(a.states.join(", "))}"></label></div></div>`,async bg=>{const st=bg.querySelector('[name="s"]').value.toUpperCase().split(/[^A-Z]+/).filter(Boolean);return !!(await send({action:"states",states:st}))});return}
  if(act==="delete"){modal(`<h3>Remove ${esc(a.name)}?</h3><p style="font-size:14px;color:var(--body)">This deletes their advisor record and sign-in. Leads already assigned to them stay in your CRM. This can't be undone.</p>`,async()=>!!(await send({action:"delete"})),"Remove");return}
  if(act==="reject"){modal(`<h3>Decline ${esc(a.name)}?</h3><p style="font-size:14px;color:var(--body)">They won't be notified automatically.</p>`,async()=>!!(await send({action:"reject"})),"Decline");return}
  if(act==="pause"){modal(`<h3>Pause ${esc(a.name)}?</h3><p style="font-size:14px;color:var(--body)">They'll be signed out and stop receiving leads right away. Their Stripe subscription isn't canceled, so cancel it in Stripe too if they're leaving.</p>`,async()=>!!(await send({action:"pause"})),"Pause");return}
  const r=await send({action:act,days:7});if(r)toast(act==="activate"?`${a.first} is active for 7 more days.`:act==="npn_verified"?"Marked as license checked.":"Saved.");
}

/* ---------- auth ---------- */
function login(msg,email){
  root.innerHTML=`<div class="login"><img src="/assets/brand/logo-compact-dark.png" alt="Mr. Marketplace"><h1>Mr. Marketplace CRM</h1><p>Sign in to see your leads.</p>
   <form><input type="email" name="u" placeholder="Email (advisors)" autocomplete="username" value="${esc(email||"")}"><input type="password" name="p" placeholder="Password" autocomplete="current-password"><p class="e">${esc(msg||"")}</p><button>Sign in</button></form></div>`;
  root.querySelector(email?'[name="p"]':'[name="u"]').focus();
  root.querySelector("form").onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector("button");btn.disabled=true;btn.textContent="Signing in…";
    const em=e.target.u.value.trim();
    const r=await fetch("/api/agent/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:e.target.p.value,...(em?{email:em}:{})})}).then(async x=>{const j=await x.json().catch(()=>({}));return{...j,adv:j.status,status:x.status}}).catch(()=>({status:0}));
    e.target.p.value="";
    if(r.ok&&r.token){pw=r.token;try{sessionStorage.setItem("mm_tok",pw)}catch(x){}const m=await api("/api/agent/me");if(m.ok){me=m;return boot()}}
    const INACTIVE={approved:"You're approved. Your access starts as soon as your first weekly payment goes through.",past_due:"Your weekly payment didn't go through, so your access is paused. Update your payment to continue receiving leads.",paused:"Your access is paused. Please contact Mr. Marketplace.",canceled:"Your membership has ended. Contact Mr. Marketplace to restart it."};
    login(r.status===403&&r.error==="inactive"?(INACTIVE[r.adv]||"Your access isn't active right now."):r.status===429?"Too many attempts. Try again in 15 minutes.":r.status===401?(em?"Incorrect email or password.":"Incorrect password."):r.status===503?(r.detail||"Sign-in isn't set up yet."):"Can't reach the server. Is the site deployed on Netlify?",em)};
}
/* advisor creates a password from their invite link (#setup=...) */
async function setup(token){
  const c=await fetch("/api/advisor/setup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,check:true})}).then(r=>r.json()).catch(()=>({}));
  if(!c.ok){history.replaceState(null,"","/crm/");return login("That setup link has expired or was already used. Ask Mr. Marketplace for a new one.")}
  root.innerHTML=`<div class="login"><img src="/assets/brand/logo-compact-dark.png" alt="Mr. Marketplace"><h1>Welcome, ${esc(c.name)}</h1><p>Create the password you'll use to sign in as <b>${esc(c.email)}</b>.</p>
   <form><input type="password" name="p" placeholder="New password (12+ characters)" autocomplete="new-password" minlength="12" required><input type="password" name="c" placeholder="Type it again" autocomplete="new-password" required><p class="e"></p><button>Create password</button></form></div>`;
  const f=root.querySelector("form"),er=f.querySelector(".e");f.p.focus();
  f.onsubmit=async e=>{e.preventDefault();if(f.p.value.length<12){er.textContent="Use at least 12 characters.";return}if(f.p.value!==f.c.value){er.textContent="The two passwords don't match.";return}
    const b=f.querySelector("button");b.disabled=true;b.textContent="Saving…";
    const r=await fetch("/api/advisor/setup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password:f.p.value})}).then(r=>r.json()).catch(()=>({}));
    f.p.value=f.c.value="";history.replaceState(null,"","/crm/");
    if(!r.ok){er.textContent=r.error==="weak_password"?"Use at least 12 characters.":"Couldn't save. The link may have expired.";b.disabled=false;b.textContent="Create password";return}
    login(r.active?"Password created. Sign in below.":"Password created. You can sign in as soon as your first weekly payment goes through.",r.email)};
}
async function boot(){
  if(!me){const r=await api("/api/agent/me");if(!r.ok){try{sessionStorage.removeItem("mm_tok")}catch(e){}pw="";return login("")}me=r}
  root.innerHTML=`<div class="crm"><aside class="side"><img class="lg" src="/assets/brand/logo-compact-white.png" alt="Mr. Marketplace"><span class="live"><i></i>Live · updates every 20s</span>
    <nav>${[["today","Today"],["pipe","Pipeline"],["leads","Leads"],["rep","Reports"],...(me.me.role==="admin"?[["adv","Advisors"]]:[])].map(([k,t])=>`<button data-v="${k}">${IC[k]}<span>${t}</span>${k==="today"?'<span class="ct" hidden></span>':""}</button>`).join("")}</nav>
    <button class="add">+ Add lead</button>
    <div class="foot"><b>${esc(me.me.name)}</b>${me.me.role==="admin"?"Admin · all leads":me.me.advisor?"Advisor · your leads":"Agent · your leads"}<br><button data-a="notify">Enable alerts</button><button data-a="out">Sign out</button></div></aside>
    <main class="main"></main></div>`;
  root.querySelectorAll(".side nav button").forEach(b=>b.onclick=()=>go(b.dataset.v));
  root.querySelector(".add").onclick=addLead;
  root.querySelector('[data-a="out"]').onclick=()=>{try{sessionStorage.removeItem("mm_tok")}catch(e){}pw="";me=null;clearInterval(timer);login()};
  root.querySelector('[data-a="notify"]').onclick=()=>window.Notification&&Notification.requestPermission();
  await load(true);timer=setInterval(load,20000);
  const parts=location.hash.slice(1).split("/");if(parts[0]&&parts[0].length===16&&byId(parts[0])){go("today");drawer(parts[0])}else go(view);
  if(parts[1]&&byId(parts[1]))drawer(parts[1]);
}
function go(v){view=v;root.querySelectorAll(".side nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));history.replaceState(null,"","#"+v+(open?"/"+open:""));draw()}
async function load(first){
  const r=await api("/api/agent/leads");if(r.unauth){try{sessionStorage.removeItem("mm_tok")}catch(e){}pw="";me=null;clearInterval(timer);return login("Your session ended. Please sign in again.")}if(!r.ok)return;
  const fresh=r.leads.filter(l=>!known.has(l.id));leads=r.leads;
  if(!first&&fresh.length){
    const a=fresh.filter(l=>l.qualification_status==="complete"&&l.qualification?.category==="A");
    toast(`${fresh.length} new lead${fresh.length>1?"s":""} · ${fresh.map(l=>l.contact.first).join(", ")}`);beep();
    if(window.Notification&&Notification.permission==="granted")fresh.forEach(l=>new Notification(`New lead: ${l.contact.first} ${l.contact.last}`,{body:`${PROD[l.product]||""} · ${l.location.state} · prefers ${l.contact.preferred}`}));
  }
  leads.forEach(l=>known.add(l.id));
  const n=leads.filter(l=>isOpen(l)&&!l.first_contact&&cat(l)!=="D").length,ct=root.querySelector(".side .ct");if(ct){ct.hidden=!n;ct.textContent=n}
  document.title=(n?`(${n}) `:"")+"CRM | Mr. Marketplace";
  if(!document.querySelector(".md-bg"))draw();if(open&&byId(open))drawerBody();
}
function draw(){const m=root.querySelector(".main");if(!m)return;if(view==="adv"&&me.me.role!=="admin")view="today";if(view==="adv"){if(!m.querySelector(".advw"))vAdv(m);return}({today:vToday,pipe:vPipe,leads:vLeads,rep:vRep}[view]||vToday)(m)}

/* ---------- TODAY ---------- */
function vToday(m){
  const h=new Date().getHours(),hi=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const td=new Date().toDateString(),mo=new Date().getMonth(),yr=new Date().getFullYear();
  const waiting=leads.filter(l=>isOpen(l)&&!l.first_contact&&cat(l)!=="D").sort((a,b)=>({A:0,P:1,B:2,C:3}[cat(a)]-{A:0,P:1,B:2,C:3}[cat(b)])||a.created.localeCompare(b.created));
  const tasks=leads.flatMap(l=>(l.tasks||[]).filter(t=>!t.done).map(t=>({...t,l}))).filter(t=>!t.due||Date.parse(t.due)<new Date().setHours(23,59,59,999)).sort((a,b)=>(a.due||"").localeCompare(b.due||""));
  const overdue=tasks.filter(t=>due(t)).length;
  const enr=leads.filter(l=>l.status==="enrolled"&&l.policy&&new Date(l.policy.recorded||l.updated).getMonth()===mo&&new Date(l.policy.recorded||l.updated).getFullYear()===yr);
  const sp=leads.filter(l=>l.first_contact).map(l=>(Date.parse(l.first_contact)-Date.parse(l.created))/60000).sort((a,b)=>a-b);const med=sp.length?Math.round(sp[Math.floor(sp.length/2)]):null;
  m.innerHTML=`<div class="ph"><div><h1>${hi}, ${esc(me.me.name.split(" ")[0])}.</h1><p>${waiting.length?`${waiting.length} lead${waiting.length>1?"s":""} waiting for first contact.`:"Everyone's been contacted. Nice work."}</p></div><button class="btnp" data-add>+ Add lead</button></div>
   <div class="kp">
    <div class="k click" data-f="new"><span>New today</span><b>${leads.filter(l=>new Date(l.created).toDateString()===td).length}</b></div>
    <div class="k ${waiting.length?"warn":""}"><span>Awaiting first contact</span><b>${waiting.length}</b></div>
    <div class="k ${overdue?"warn":""}"><span>Tasks due / overdue</span><b>${tasks.length}<small>${overdue?overdue+" overdue":""}</small></b></div>
    <div class="k"><span>Median speed to contact</span><b>${med==null?"—":med}<small>${med==null?"":"min"}</small></b></div>
    <div class="k"><span>Open pipeline</span><b>${leads.filter(l=>isOpen(l)&&cat(l)!=="D").length}</b></div>
    <div class="k"><span>Enrolled this month</span><b>${enr.length}<small>${money(enr.reduce((a,l)=>a+(l.policy.premium||0),0))}/mo</small></b></div>
   </div>
   <div class="cols2">
    <div class="card"><h3>Contact now <small>Best leads first</small></h3>${waiting.slice(0,12).map(l=>row(l,`<span class="pill ${Date.now()-Date.parse(l.created)>5*60000?"od":""}">${ago(l.created)}</span><br>${can(l,"call")?`<a class="mini-btn navy" href="tel:${ph(l)}" data-stop>Call</a>`:can(l,"text")?`<a class="mini-btn navy" href="sms:${ph(l)}" data-stop>Text</a>`:`<a class="mini-btn navy" href="mailto:${esc(l.contact.email)}" data-stop>Email</a>`}`)).join("")||'<div class="empty">No one waiting. New leads appear here instantly.</div>'}</div>
    <div class="card"><h3>Tasks <small>Due today and overdue</small></h3>${tasks.slice(0,15).map(t=>`<div class="task"><input type="checkbox" data-t="${esc(t.id)}" data-l="${esc(t.l.id)}"><span><b>${esc(t.title)}</b><small data-open="${esc(t.l.id)}">${esc(t.l.contact.first)} ${esc(t.l.contact.last)} · ${t.due?(due(t)?`<span style="color:var(--bad)">overdue ${fdt(t.due)}</span>`:fdt(t.due)):"no due date"}</small></span></div>`).join("")||'<div class="empty">Nothing due. Add follow-ups from any lead.</div>'}</div>
   </div>
   <div class="card" style="margin-top:16px"><h3>Recently qualified <small>Finished the second stage</small></h3>${leads.filter(l=>l.qualification_status==="complete").sort((a,b)=>(b.updated||"").localeCompare(a.updated||"")).slice(0,6).map(l=>row(l,`${esc(STL[l.status])}<br><b style="color:var(--navy)">${esc(l.qualification?.score??"")}</b>`)).join("")||'<div class="empty">No qualified leads yet.</div>'}</div>`;
  bindRows(m);
  m.querySelector("[data-add]").onclick=addLead;
  m.querySelector('[data-f="new"]').onclick=()=>{F.status="";go("leads")};
  m.querySelectorAll("[data-t]").forEach(c=>c.onchange=async()=>{await upd(c.dataset.l,{task_done:{id:c.dataset.t,done:c.checked}})});
}
function row(l,right){return `<div class="row-l" data-open="${esc(l.id)}"><span class="badge c${cat(l)}" title="${catTitle[cat(l)]}">${cat(l)}</span><div><b>${esc(l.contact.first)} ${esc(l.contact.last)}</b><small>${esc(PROD[l.product]||l.product)} · ${esc(l.location.state)} ${esc(l.location.zip)} · prefers ${esc(l.contact.preferred)}${l.qualification_status==="awaiting"?' · <span class="pill aw">awaiting qualification</span>':""}${l.language==="es"?' · <span class="pill">Español</span>':""}</small></div><div class="r">${right||""}</div></div>`}
function bindRows(m){m.querySelectorAll("[data-open]").forEach(r=>r.onclick=e=>{if(e.target.closest("[data-stop],input"))return;drawer(r.dataset.open)});
  m.querySelectorAll("[data-stop]").forEach(a=>a.addEventListener("click",e=>{e.stopPropagation();const id=a.closest("[data-open]")?.dataset.open;if(id&&!byId(id).first_contact)upd(id,{contacted:true})}))}

/* ---------- PIPELINE ---------- */
function vPipe(m){
  const cols=["received","assigned","contacted","quoting","application","enrolled","lost"];
  const vis=leads.filter(l=>cat(l)!=="D"||l.status!=="lost");
  m.innerHTML=`<div class="ph"><div><h1>Pipeline</h1><p>Drag a card to move it. Dropping on Enrolled asks for the policy; on Lost, a reason.</p></div><button class="btnp" data-add>+ Add lead</button></div>
   <div class="pipe">${cols.map(c=>{const ls=vis.filter(l=>l.status===c).sort((a,b)=>b.created.localeCompare(a.created));const prem=ls.reduce((a,l)=>a+(l.policy?.premium||0),0);
     return `<div class="col" data-c="${c}"><h4>${STL[c]}<span>${ls.length}</span></h4>${c==="enrolled"&&prem?`<div class="sum">${money(prem)}/mo written</div>`:""}
      ${ls.slice(0,60).map(l=>`<div class="pc2" draggable="true" data-id="${esc(l.id)}"><div class="t"><span class="badge c${cat(l)}">${cat(l)}</span><b>${esc(l.contact.first)} ${esc(l.contact.last)}</b></div>
       <small>${esc(PROD[l.product]||l.product)} · ${esc(l.location.state)} · ${ago(l.updated||l.created)}${l.policy?` · ${money(l.policy.premium)}/mo`:""}</small>
       ${(l.tags||[]).length||(l.tasks||[]).some(due)?`<div class="tags">${(l.tasks||[]).some(due)?'<span class="pill od">task overdue</span>':""}${(l.tags||[]).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}</div>`:""}</div>`).join("")}</div>`}).join("")}</div>`;
  m.querySelector("[data-add]").onclick=addLead;
  let dragId=null;
  m.querySelectorAll(".pc2").forEach(c=>{c.onclick=()=>drawer(c.dataset.id);c.ondragstart=e=>{dragId=c.dataset.id;c.classList.add("drag");e.dataTransfer.effectAllowed="move"};c.ondragend=()=>c.classList.remove("drag")});
  m.querySelectorAll(".col").forEach(col=>{col.ondragover=e=>{e.preventDefault();col.classList.add("over")};col.ondragleave=()=>col.classList.remove("over");
    col.ondrop=async e=>{e.preventDefault();col.classList.remove("over");if(!dragId)return;const to=col.dataset.c,l=byId(dragId);if(!l||l.status===to)return;
      if(to==="enrolled")return policyModal(l);if(to==="lost")return lostModal(l);await upd(dragId,{status:to})}});
}

/* ---------- LEADS ---------- */
function vLeads(m){
  const srcs=[...new Set(leads.map(l=>l.source||"web"))];
  m.innerHTML=`<div class="ph"><div><h1>Leads</h1><p>${leads.length} total</p></div><div style="display:flex;gap:8px"><button class="btns" data-csv>Export CSV</button><button class="btnp" data-add>+ Add lead</button></div></div>
   <div class="filters"><input data-f="q" placeholder="Search name, phone, email, ZIP, tag" value="${esc(F.q)}">
    <select data-f="status"><option value="">Any status</option><option value="open">Open</option>${Object.entries(STL).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
    <select data-f="cat"><option value="">Any grade</option>${["A","B","C","D","P"].map(c=>`<option value="${c}">${catTitle[c]}</option>`).join("")}</select>
    <select data-f="product"><option value="">Any product</option>${Object.entries(PROD).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
    <select data-f="source"><option value="">Any source</option>${srcs.map(s=>`<option>${esc(s)}</option>`).join("")}</select></div>
   <div class="tblwrap"><table class="tbl"><thead><tr>${[["cat","Grade"],["name","Name"],["status","Status"],["product","Product","hm"],["state","State","hm"],["pref","Prefers","hm"],["agent","Agent","hm"],["created","Created"],["next","Next task","hm"]].map(([k,t,c])=>`<th data-s="${k}" class="${c||""}">${t}${sortK===k?(sortD>0?" ↑":" ↓"):""}</th>`).join("")}</tr></thead><tbody></tbody></table></div>`;
  m.querySelectorAll("[data-f]").forEach(i=>{i.value=F[i.dataset.f];i.oninput=()=>{F[i.dataset.f]=i.value;rows()}});
  m.querySelectorAll("th[data-s]").forEach(th=>th.onclick=()=>{sortD=sortK===th.dataset.s?-sortD:1;sortK=th.dataset.s;vLeads(m)});
  m.querySelector("[data-add]").onclick=addLead;m.querySelector("[data-csv]").onclick=csv;
  function rows(){
    const q=F.q.toLowerCase().trim();
    let ls=leads.filter(l=>(!F.status||(F.status==="open"?isOpen(l):l.status===F.status))&&(!F.cat||cat(l)===F.cat)&&(!F.product||l.product===F.product)&&(!F.source||(l.source||"web")===F.source)&&
      (!q||`${l.contact.first} ${l.contact.last} ${l.contact.email} ${l.location.zip} ${l.location.state} ${(l.tags||[]).join(" ")} ${l.answers?.business_name||""}`.toLowerCase().includes(q)||(q.replace(/\D/g,"").length>3&&ph(l).includes(q.replace(/\D/g,"")))));
    const nt=l=>(l.tasks||[]).filter(t=>!t.done&&t.due).sort((a,b)=>a.due.localeCompare(b.due))[0];
    const key={cat:l=>cat(l),name:l=>(l.contact.last+l.contact.first).toLowerCase(),status:l=>Object.keys(STL).indexOf(l.status),product:l=>l.product,state:l=>l.location.state,pref:l=>l.contact.preferred,agent:l=>l.agent?.name||"",created:l=>l.created,next:l=>nt(l)?.due||"9"}[sortK];
    ls.sort((a,b)=>{const x=key(a),y=key(b);return(x>y?1:x<y?-1:0)*sortD});
    m.querySelector("tbody").innerHTML=ls.map(l=>{const t=nt(l);return `<tr data-open="${esc(l.id)}"><td><span class="badge c${cat(l)}" title="${catTitle[cat(l)]}">${cat(l)}</span></td><td><b style="color:var(--ink)">${esc(l.contact.first)} ${esc(l.contact.last)}</b><br><small style="color:var(--mute)">${esc(fp(l.contact.phone))}</small></td>
      <td><span class="pill ${l.status==="enrolled"?"ok":""}">${STL[l.status]}</span>${l.language==="es"?' <span class="pill">ES</span>':""}${l.qualification_status==="awaiting"?' <span class="pill aw">stage 1</span>':""}</td><td class="hm">${esc(PROD[l.product]||l.product)}</td><td class="hm">${esc(l.location.state)}</td><td class="hm">${esc(l.contact.preferred)}</td><td class="hm">${esc(l.agent?.name||"—")}</td><td>${ago(l.created)}</td>
      <td class="hm">${t?`<span class="pill ${due(t)?"od":""}">${esc(t.title.slice(0,28))} · ${fdt(t.due)}</span>`:""}</td></tr>`}).join("")||`<tr><td colspan="9" class="empty">No leads match.</td></tr>`;
    m.querySelectorAll("tr[data-open]").forEach(r=>r.onclick=()=>drawer(r.dataset.open));
  }
  rows();
}

/* ---------- REPORTS ---------- */
function vRep(m){
  const days=+(sessionStorage.getItem("mm_rd")||30),since=Date.now()-days*864e5;
  const L=leads.filter(l=>Date.parse(l.created)>=since);
  const reached=l=>!!l.first_contact||["contacted","quoting","application","enrolled"].includes(l.status);
  const stages=[["Leads",L.length],["Qualified (stage 2)",L.filter(l=>l.qualification_status!=="awaiting").length],["Contacted",L.filter(reached).length],["Quoting",L.filter(l=>["quoting","application","enrolled"].includes(l.status)).length],["Application",L.filter(l=>["application","enrolled"].includes(l.status)).length],["Enrolled",L.filter(l=>l.status==="enrolled").length]];
  const mx=Math.max(1,stages[0][1]);
  const sp=L.filter(l=>l.first_contact).map(l=>(Date.parse(l.first_contact)-Date.parse(l.created))/60000).sort((a,b)=>a-b);
  const pct=(a,b)=>b?Math.round(a/b*100)+"%":"—";
  const grp=(fn)=>{const g={};L.forEach(l=>{const k=fn(l)||"—";(g[k]||=[]).push(l)});return Object.entries(g).sort((a,b)=>b[1].length-a[1].length)};
  const tbl=(title,rows)=>`<div class="card"><h3>${title}</h3><table class="rt"><tr><th></th><th>Leads</th><th>Contacted</th><th>Enrolled</th><th>Rate</th></tr>${rows.map(([k,ls])=>`<tr><td>${esc(k)}</td><td>${ls.length}</td><td>${ls.filter(reached).length}</td><td>${ls.filter(l=>l.status==="enrolled").length}</td><td>${pct(ls.filter(l=>l.status==="enrolled").length,ls.length)}</td></tr>`).join("")||'<tr><td colspan="5" class="empty">No data yet.</td></tr>'}</table></div>`;
  const pol=L.filter(l=>l.policy);const prem=pol.reduce((a,l)=>a+(l.policy.premium||0),0),comm=pol.reduce((a,l)=>a+(l.policy.commission||0),0);
  const dd=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return[d,leads.filter(l=>new Date(l.created).toDateString()===d.toDateString()).length]});const dmx=Math.max(1,...dd.map(x=>x[1]));
  m.innerHTML=`<div class="ph"><div><h1>Reports</h1><p>Where leads come from, how fast you reach them, and what turns into policies.</p></div><select class="btns" data-rd>${[7,30,90,365].map(d=>`<option value="${d}" ${d===days?"selected":""}>Last ${d} days</option>`).join("")}</select></div>
   <div class="kp">
    <div class="k"><span>Leads</span><b>${L.length}</b></div><div class="k"><span>Contact rate</span><b>${pct(stages[2][1],L.length)}</b></div>
    <div class="k"><span>Lead → policy</span><b>${pct(stages[5][1],L.length)}</b></div>
    <div class="k"><span>Median speed to contact</span><b>${sp.length?Math.round(sp[Math.floor(sp.length/2)]):"—"}<small>${sp.length?"min":""}</small></b></div>
    <div class="k"><span>Premium written</span><b>${money(prem)}<small>/mo</small></b></div><div class="k"><span>Commission recorded</span><b>${money(comm)}</b></div></div>
   <div class="cols2"><div class="card"><h3>Conversion funnel</h3><div class="funnel" style="padding:8px 0">${stages.map(([t,n])=>`<div><span>${t}</span><i style="width:${n/mx*100}%"></i><b>${n} <small style="color:var(--mute);font-weight:500">${pct(n,mx)}</small></b></div>`).join("")}</div></div>
    <div class="card"><h3>New leads, last 14 days</h3><div class="barsv">${dd.map(([d,n])=>`<div title="${n} leads"><span>${n||""}</span><i style="height:${n/dmx*120}px"></i>${d.getDate()}</div>`).join("")}</div></div></div>
   <div class="cols2" style="margin-top:16px">${tbl("By source",grp(l=>l.tracking?.utm_source||l.source||"Direct / web"))}${tbl("By grade",grp(l=>catTitle[cat(l)]))}</div>
   <div class="cols2" style="margin-top:16px">${tbl("By state",grp(l=>l.location.state))}${me.me.role==="admin"?tbl("By agent",grp(l=>l.agent?.name||"Unassigned")):tbl("By product",grp(l=>PROD[l.product]||l.product))}</div>`;
  m.querySelector("[data-rd]").onchange=e=>{sessionStorage.setItem("mm_rd",e.target.value);vRep(m)};
}

/* ---------- LEAD DRAWER ---------- */
function drawer(id){open=id;tab=tab||"overview";history.replaceState(null,"","#"+view+"/"+id);
  document.querySelectorAll(".dw,.dw-bg").forEach(x=>x.remove());
  const bg=document.createElement("div");bg.className="dw-bg";const d=document.createElement("aside");d.className="dw";document.body.append(bg,d);
  bg.onclick=closeDrawer;drawerBody();}
function closeDrawer(){open=null;document.querySelectorAll(".dw,.dw-bg").forEach(x=>x.remove());history.replaceState(null,"","#"+view)}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.querySelector(".md-bg"))closeDrawer()});
function drawerBody(){
  const d=document.querySelector(".dw"),l=byId(open);if(!d||!l)return;
  const q=l.qualification||{},a=l.answers||{},c=l.consents||{};
  const kv=[["Product",PROD[l.product]],["Household",[WHO[l.household?.who],(l.household?.ages||[]).length?`ages ${l.household.ages.join(", ")}`:""].filter(Boolean).join(" · ")],["Location",`${l.location.zip} ${l.location.county||""} ${l.location.state}`],["Coverage start",START[a.start]],
    ["Work",WORK[a.work]],["Current coverage",a.current_coverage],["Current premium",a.current_premium],["Budget",BUD[a.budget]],["Tobacco",a.tobacco],["Household income",a.income?money(a.income):""],
    ["Business",a.business_name],["Employees",a.employees],["Renewal month",a.renewal_month],["Plans they saw",l.rates?.count?`${l.rates.count} plans · ${l.rates.carriers||"?"} carriers · from ${money(l.rates.lowest)}/mo`:""],
    ["Language",l.language==="es"?"Spanish (call in Spanish)":""],["Phone",fp(l.contact.phone)],["Email",l.contact.email],["Prefers",l.contact.preferred],["Source",[l.source,l.tracking?.utm_source,l.tracking?.utm_campaign].filter(Boolean).join(" / ")]].filter(([,v])=>v);
  const tasks=(l.tasks||[]).slice().sort((x,y)=>(x.done-y.done)||(x.due||"").localeCompare(y.due||""));
  const T={
   overview:`${l.qualification_status==="awaiting"?'<div class="blk" style="background:#f7f4fd"><b style="color:#5b3fa8">Awaiting qualification.</b> <span style="font-size:14px">They gave contact details but haven\'t finished the second stage yet. Reach out now; you can collect the rest on the call.</span></div>':""}
    ${l.lost_reason&&l.status==="lost"?`<div class="blk"><b>Lost:</b> ${esc(l.lost_reason)}</div>`:""}
    ${l.policy?`<div class="blk" style="background:var(--ok-bg)"><h4 style="color:var(--ok)">Enrolled</h4><b>${esc(l.policy.carrier)} · ${esc(l.policy.plan)}</b><br><span style="font-size:14px">${money(l.policy.premium)}/mo · effective ${esc(l.policy.effective||"—")} · commission ${money(l.policy.commission)}${l.policy.number?` · #${esc(l.policy.number)}`:""}</span></div>`:""}
    <div class="blk"><h4>Tags</h4><div class="tagsed">${(l.tags||[]).map(t=>`<span class="pill">${esc(t)}<button data-rt="${esc(t)}">×</button></span>`).join("")}<input data-tag placeholder="+ add tag"></div></div>
    ${q.flags?.length?`<div class="blk"><h4>Data quality</h4>${q.flags.map(x=>`<span class="flag">${esc(x.replace(/_/g," "))}</span>`).join("")}</div>`:""}
    <div class="blk"><h4>Profile</h4><div class="kv">${kv.map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
    ${q.breakdown?`<div class="blk"><h4>Lead score ${q.score}${l.qualification_status==="awaiting"?" (preliminary)":""}</h4><div class="bars">${Object.entries(q.breakdown).map(([k,v])=>`<div><span>${k.replace(/_/g," ").replace(/^\w/,x=>x.toUpperCase())}</span><i><em style="width:${v}%"></em></i><b>${v}</b></div>`).join("")}</div></div>`:""}
    ${l.care_needs&&(l.care_needs.doctors.length||l.care_needs.drugs.length)?`<div class="blk"><h4>Their doctors &amp; prescriptions</h4>${l.care_needs.doctors.map(x=>`<div class="note"><b>Doctor/facility:</b> ${esc(x.name)}<small>NPI ${esc(x.id)}${x.detail?" · "+esc(x.detail):""}</small></div>`).join("")}${l.care_needs.drugs.map(x=>`<div class="note"><b>Rx:</b> ${esc(x.name)}<small>RxCUI ${esc(x.id)}</small></div>`).join("")}</div>`:""}
    ${(l.plan_interest||[]).length?`<div class="blk"><h4>Plans they asked about</h4>${l.plan_interest.map(p=>`<div class="note"><b>${esc(p.issuer)}</b> · ${esc(p.name)}<small>${esc(p.metal)} ${esc(p.type)} · ${money(p.premium)}/mo · deductible ${money(p.deductible)}</small></div>`).join("")}</div>`:""}`,
   activity:`<div class="blk"><h4>Log a call</h4><button class="btnp" data-logcall>Log call outcome</button></div>
    <div class="blk"><h4>Notes</h4>${(l.notes||[]).slice().reverse().map(n=>`<div class="note">${esc(n.text)}<small>${esc(n.by)} · ${fdt(n.t)}</small></div>`).join("")||'<p style="color:var(--mute);font-size:14px">No notes yet.</p>'}
     <form class="inl" data-form="note"><input name="v" placeholder="Add a private note"><button>Save</button></form></div>
    <div class="blk"><h4>Message the customer <span style="text-transform:none;letter-spacing:0;font-weight:500">(shows in their portal)</span></h4>
     ${(l.events||[]).filter(e=>e.type==="message"||e.type==="reply").map(e=>`<div class="note" style="${e.type==="reply"?"background:var(--sky)":""}"><b>${e.type==="reply"?"You":esc(l.contact.first)}:</b> ${esc(e.text)}<small>${fdt(e.t)}</small></div>`).join("")}
     <form class="inl" data-form="reply"><input name="v" placeholder="Write a reply"><button>Send</button></form></div>
    <div class="blk"><h4>Timeline</h4><div class="tl">${[...(l.events||[])].reverse().map(e=>`<div><span>${fdt(e.t)}</span><b style="font-weight:500">${esc((e.type||"").replace(/_/g," "))}${e.status?": "+esc(STL[e.status]||e.status):""}${e.outcome?": "+esc(e.outcome):""}${e.plan?": "+esc(e.plan):""}${e.text?`: “${esc(e.text)}”`:""}${e.category?`: grade ${esc(e.category)} (${esc(e.score)})`:""}${e.channel?": "+esc(e.channel):""}${e.by?` <span>· ${esc(e.by)}</span>`:""}</b></div>`).join("")}</div></div>`,
   tasks:`<div class="blk"><h4>Add a follow-up</h4><form class="inl" data-form="task"><input name="v" placeholder="e.g. Send Silver plan comparison"><input name="due" type="datetime-local"><button>Add</button></form>
     <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${[["In 1 hour",1],["Tomorrow 9am","t9"],["In 3 days",72],["Next week",168]].map(([t,v])=>`<button class="mini-btn" data-quick="${v}">${t}</button>`).join("")}</div></div>
    <div>${tasks.map(t=>`<div class="task ${t.done?"done":""}"><input type="checkbox" data-t="${esc(t.id)}" ${t.done?"checked":""}><span><b>${esc(t.title)}</b><small>${t.due?(due(t)?`<span style="color:var(--bad)">overdue · ${fdt(t.due)}</span>`:fdt(t.due)):"No due date"}${t.auto?" · automatic":""}</small></span><button class="mini-btn" data-dt="${esc(t.id)}">Delete</button></div>`).join("")||'<div class="empty">No tasks.</div>'}</div>`,
   policy:`<div class="blk"><h4>${l.policy?"Policy on file":"Record a sale"}</h4><form class="frm" data-form="policy">
     <div><label>Carrier<input name="carrier" value="${esc(l.policy?.carrier||"")}" required></label></div><div><label>Plan<input name="plan" value="${esc(l.policy?.plan||"")}"></label></div>
     <div><label>Coverage type<select name="type">${["Marketplace (ACA)","Group","Other"].map(o=>`<option ${l.policy?.type===o?"selected":""}>${o}</option>`).join("")}</select></label></div><div><label>Monthly premium<input name="premium" type="number" step="0.01" value="${l.policy?.premium||""}"></label></div>
     <div><label>Effective date<input name="effective" type="date" value="${esc(l.policy?.effective||"")}"></label></div><div><label>Members covered<input name="members" type="number" value="${l.policy?.members||l.household?.size||""}"></label></div>
     <div><label>Commission (expected)<input name="commission" type="number" step="0.01" value="${l.policy?.commission||""}"></label></div><div><label>Policy / application #<input name="number" value="${esc(l.policy?.number||"")}"></label></div>
     <div class="full"><button class="btnp">${l.policy?"Update policy":"Save & mark enrolled"}</button></div></form></div>`,
   consent:`<div class="blk"><h4>Permissions</h4>${["call","text","email"].map(k=>`<p style="font-size:14px;margin:6px 0"><b>${k}:</b> ${c[k]?.given?'<span class="pill ok">given</span>':'<span class="pill">not given</span>'}${c[k]?.withdrawn?` <span class="pill od">withdrawn ${fdt(c[k].withdrawn)}</span>`:""}${c[k]?.text?`<br><span style="color:var(--mute);font-size:13px">“${esc(c[k].text)}”</span>`:""}</p>`).join("")}</div>
    ${c.disclosure?`<div class="blk"><h4>Disclosure shown</h4><p style="font-size:13.5px">${esc(c.disclosure)}</p></div>`:""}
    <div class="blk"><h4>Record</h4><div class="kv"><div><span>Form version</span><b>${esc(c.version)}</b></div><div><span>Server time</span><b>${fdt(c.server_time)}</b></div><div><span>IP address</span><b>${esc(c.ip||"—")}</b></div><div><span>Recorded by</span><b>${esc(c.recorded_by||"Website form")}</b></div><div style="grid-column:1/-1"><span>Browser</span><b style="font-size:12.5px">${esc(c.user_agent||"—")}</b></div></div></div>`
  };
  const tabs=[["overview","Overview"],["activity","Activity"],["tasks",`Tasks${(l.tasks||[]).filter(t=>!t.done).length?` (${(l.tasks||[]).filter(t=>!t.done).length})`:""}`],["policy","Policy"],["consent","Consent"]];
  d.innerHTML=`<div class="dw-h"><span class="badge c${cat(l)}" title="${catTitle[cat(l)]}">${cat(l)}</span><div><h2>${esc(l.contact.first)} ${esc(l.contact.last)}</h2><div class="sub">${catTitle[cat(l)]} · score ${q.score??"—"} · ${ago(l.created)} · ${esc(l.agent?.name||"Unassigned")}${l.duplicate_of?` · <a href="#" data-dup="${esc(l.duplicate_of)}">repeat request</a>`:""}</div></div><button class="x" aria-label="Close">×</button></div>
   <div class="dw-a">${can(l,"call")?`<a class="navy" href="tel:${ph(l)}" data-c>Call ${esc(fp(l.contact.phone))}</a>`:""}${can(l,"text")?`<a href="sms:${ph(l)}" data-c>Text</a>`:""}${can(l,"email")?`<a href="mailto:${esc(l.contact.email)}" data-c>Email</a>`:""}
    <button data-logcall>Log call</button>${!l.first_contact?'<button data-mark>Mark contacted</button>':`<span class="pill ok">Contacted ${ago(l.first_contact)}</span>`}
    <span class="sp"></span>${me.me.role==="admin"?`<select data-agent><option value="">Reassign…</option>${me.agents.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select>`:""}
    <select data-status>${me.statuses.map(s=>`<option value="${s}" ${s===l.status?"selected":""}>${STL[s]}</option>`).join("")}</select></div>
   <div class="tabs">${tabs.map(([k,t])=>`<button data-tab="${k}" class="${tab===k?"on":""}">${t}</button>`).join("")}</div>
   <div class="dw-b">${T[tab]}</div>`;
  d.querySelector(".x").onclick=closeDrawer;
  d.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;drawerBody()});
  d.querySelector("[data-status]").onchange=e=>{const v=e.target.value;if(v==="enrolled")return policyModal(l);if(v==="lost")return lostModal(l);upd(l.id,{status:v})};
  const ag=d.querySelector("[data-agent]");if(ag)ag.onchange=e=>e.target.value&&upd(l.id,{agentId:e.target.value});
  const mk=d.querySelector("[data-mark]");if(mk)mk.onclick=()=>upd(l.id,{contacted:true});
  d.querySelectorAll("[data-c]").forEach(x=>x.addEventListener("click",()=>{if(!l.first_contact)upd(l.id,{contacted:true})}));
  d.querySelectorAll("[data-logcall]").forEach(b=>b.onclick=()=>callModal(l));
  const dp=d.querySelector("[data-dup]");if(dp)dp.onclick=e=>{e.preventDefault();drawer(dp.dataset.dup)};
  const ti=d.querySelector("[data-tag]");if(ti)ti.onkeydown=e=>{if(e.key==="Enter"&&ti.value.trim()){e.preventDefault();upd(l.id,{tags:[...(l.tags||[]),ti.value.trim()]})}};
  d.querySelectorAll("[data-rt]").forEach(b=>b.onclick=()=>upd(l.id,{tags:(l.tags||[]).filter(t=>t!==b.dataset.rt)}));
  d.querySelectorAll("[data-t]").forEach(cb=>cb.onchange=()=>upd(l.id,{task_done:{id:cb.dataset.t,done:cb.checked}}));
  d.querySelectorAll("[data-dt]").forEach(b=>b.onclick=()=>upd(l.id,{task_delete:b.dataset.dt}));
  d.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>{const f=d.querySelector('[data-form="task"]');const v=b.dataset.quick;const t=new Date();if(v==="t9"){t.setDate(t.getDate()+1);t.setHours(9,0,0,0)}else t.setTime(t.getTime()+(+v)*36e5);
    f.due.value=new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,16);if(!f.v.value)f.v.value=`Follow up with ${l.contact.first}`;f.v.focus()});
  d.querySelectorAll("[data-form]").forEach(f=>f.onsubmit=e=>{e.preventDefault();const k=f.dataset.form;
    if(k==="note"||k==="reply"){const v=f.v.value.trim();if(v)upd(l.id,{[k]:v})}
    else if(k==="task"){const v=f.v.value.trim();if(v)upd(l.id,{task_add:{title:v,due:f.due.value?new Date(f.due.value).toISOString():""}})}
    else if(k==="policy"){const o=Object.fromEntries(new FormData(f));if(!o.carrier)return;upd(l.id,{policy:o})}});
}
async function upd(id,body){const r=await api("/api/agent/leads",{id,...body});if(r.ok){const i=leads.findIndex(x=>x.id===id);if(i>-1)leads[i]=r.lead;draw();if(open===id)drawerBody()}else toast("Couldn't save. Check your connection.");return r}

/* ---------- modals ---------- */
function modal(html,onSave,okText){const bg=document.createElement("div");bg.className="md-bg";bg.innerHTML=`<div class="md">${html}<div class="act">${okText==="Done"?"":'<button class="btns" data-x>Cancel</button>'}<button class="btnp" data-ok>${okText||"Save"}</button></div></div>`;
  document.body.appendChild(bg);const close=()=>bg.remove();const cx=bg.querySelector("[data-x]");if(cx)cx.onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
  bg.querySelector("[data-ok]").onclick=async()=>{const ok=await onSave(bg);if(ok!==false)close()};const f=bg.querySelector("input,select,textarea");f&&f.focus();return bg}
function callModal(l){modal(`<h3>Log a call with ${esc(l.contact.first)}</h3><div class="frm"><div class="full"><label>Outcome<select name="o">${OUT.map(o=>`<option>${o}</option>`).join("")}</select></label></div>
  <div><label>Direction<select name="dir"><option value="out">Outbound</option><option value="in">Inbound</option></select></label></div><div><label>Move to stage<select name="st"><option value="">Keep ${STL[l.status]}</option>${["contacted","quoting","application"].map(s=>`<option value="${s}">${STL[s]}</option>`).join("")}</select></label></div>
  <div class="full"><label>Notes<textarea name="n" placeholder="What did you talk about?"></textarea></label></div>
  <div class="full"><label>Follow-up task (optional)<input name="ft" placeholder="e.g. Call back with Gold options"></label></div><div class="full"><label>Follow-up due<input name="fd" type="datetime-local"></label></div></div>`,
  async bg=>{const g=n=>bg.querySelector(`[name=${n}]`).value;const body={call:{outcome:g("o"),notes:g("n"),direction:g("dir")}};if(g("st"))body.status=g("st");
    if(g("ft"))body.task_add={title:g("ft"),due:g("fd")?new Date(g("fd")).toISOString():""};await upd(l.id,body)})}
function lostModal(l){modal(`<h3>Mark ${esc(l.contact.first)} as lost</h3><div class="frm"><div class="full"><label>Reason<select name="r">${["Not interested","Went with another agent","Bought elsewhere","Couldn't reach","Not eligible","Price","Other"].map(o=>`<option>${o}</option>`).join("")}</select></label></div></div>`,
  async bg=>{await upd(l.id,{status:"lost",lost_reason:bg.querySelector("[name=r]").value})});draw()}
function policyModal(l){modal(`<h3>Record ${esc(l.contact.first)}'s policy</h3><div class="frm">
  <div><label>Carrier<input name="carrier" required></label></div><div><label>Plan<input name="plan"></label></div>
  <div><label>Coverage type<select name="type"><option>Marketplace (ACA)</option><option>Group</option><option>Other</option></select></label></div><div><label>Monthly premium<input name="premium" type="number" step="0.01"></label></div>
  <div><label>Effective date<input name="effective" type="date"></label></div><div><label>Commission (expected)<input name="commission" type="number" step="0.01"></label></div>
  <div class="full"><label>Policy / application #<input name="number"></label></div></div>`,
  async bg=>{const o=Object.fromEntries([...bg.querySelectorAll("input,select")].map(i=>[i.name,i.value]));if(!o.carrier){toast("Carrier is required.");return false}o.members=l.household?.size||"";await upd(l.id,{policy:o})});draw()}
function addLead(){modal(`<h3>Add a lead</h3><p style="font-size:13.5px;color:var(--mute);margin:-6px 0 14px">For referrals, phone-ins and events. Only record permissions the person actually gave you.</p><div class="frm">
  <div><label>First name<input name="first"></label></div><div><label>Last name<input name="last"></label></div><div><label>Phone<input name="phone" type="tel"></label></div><div><label>Email<input name="email" type="email"></label></div>
  <div><label>ZIP<input name="zip" maxlength="5"></label></div><div><label>Ages (comma separated)<input name="ages" placeholder="42, 40, 9"></label></div>
  <div><label>Product<select name="product"><option value="health">Individual & family</option><option value="business">Business</option></select></label></div><div><label>Source<select name="source"><option>Referral</option><option>Phone-in</option><option>Event</option><option>Existing client</option><option>Other</option></select></label></div>
  <div><label>Grade<select name="category"><option value="A">A · ready now</option><option value="B" selected>B · eligible</option><option value="C">C · needs info</option></select></label></div><div><label>Prefers<select name="preferred"><option value="call">Call</option><option value="text">Text</option><option value="email">Email</option></select></label></div>
  ${me.me.role==="admin"?`<div class="full"><label>Assign to<select name="agentId">${me.agents.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select></label></div>`:""}
  <label class="chk"><input type="checkbox" name="consent_call">OK to call</label><label class="chk"><input type="checkbox" name="consent_text">OK to text</label><label class="chk"><input type="checkbox" name="consent_email">OK to email</label>
  <div class="full"><label>How was permission given?<input name="consent_note" placeholder="e.g. Asked me to call during referral intro on 11/22"></label></div>
  <div class="full"><label>Note<textarea name="note"></textarea></label></div></div>`,
  async bg=>{const o={};bg.querySelectorAll("input,select,textarea").forEach(i=>o[i.name]=i.type==="checkbox"?i.checked:i.value.trim());
    if(!o.first||!o.phone){toast("First name and phone are required.");return false}
    const r=await api("/api/agent/leads",{create:o});if(!r.ok){toast("Couldn't add the lead.");return false}leads.unshift(r.lead);known.add(r.lead.id);draw();drawer(r.lead.id)})}

/* ---------- utils ---------- */
function csv(){
  const cols=["created","language","grade","score","stage","status","source","product","first","last","phone","email","preferred","state","zip","ages","start","work","current_coverage","current_premium","budget","tobacco","income","business","employees","agent","first_contact","calls","open_tasks","tags","policy_carrier","policy_plan","policy_premium","policy_effective","commission","lost_reason","consent_call","consent_text","consent_email","consent_version","ip"];
  const rows=leads.map(l=>[l.created,l.language||"en",cat(l),l.qualification?.score,l.qualification_status,l.status,l.source||"web",l.product,l.contact.first,l.contact.last,l.contact.phone,l.contact.email,l.contact.preferred,l.location.state,l.location.zip,(l.household?.ages||[]).join(" "),l.answers?.start,l.answers?.work,l.answers?.current_coverage,l.answers?.current_premium,l.answers?.budget,l.answers?.tobacco,l.answers?.income,l.answers?.business_name,l.answers?.employees,l.agent?.name,l.first_contact,(l.calls||[]).length,(l.tasks||[]).filter(t=>!t.done).length,(l.tags||[]).join("; "),l.policy?.carrier,l.policy?.plan,l.policy?.premium,l.policy?.effective,l.policy?.commission,l.lost_reason,!!l.consents?.call?.given,!!l.consents?.text?.given,!!l.consents?.email?.given,l.consents?.version,l.consents?.ip]);
  const cell=v=>{let x=String(v??"");if(/^[=+\-@\t\r]/.test(x))x="'"+x;return `"${x.replace(/"/g,'""')}"`};
  const s=[cols,...rows].map(r=>r.map(cell).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([s],{type:"text/csv"}));a.download=`mr-marketplace-leads-${new Date().toISOString().slice(0,10)}.csv`;a.click();
}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),5000)}
function beep(){try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.5);o.start();o.stop(c.currentTime+.5)}catch(e){}}
const SETUP=(location.hash.match(/^#setup=([a-f0-9]{32})$/)||[])[1];
SETUP?setup(SETUP):pw?boot():login();
})();
