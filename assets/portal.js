/* Mr. Marketplace — customer portal (/status/) */
(function(){
const el=document.getElementById("portal"); if(!el) return;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CHK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.5 8.5l3 3 6-7"/></svg>';
const TRACK=["Request received","Specialist assigned","Contacted","Options reviewed","Application","Enrolled"];
const q=new URLSearchParams(location.search);let id=q.get("id"),t=q.get("t");
if(!id){try{const s=JSON.parse(localStorage.getItem("mm_req")||"null");if(s){id=s.id;t=s.t}}catch(e){}}
const TEL=(()=>{try{return JSON.parse(document.getElementById("mm-cfg").textContent).tel||""}catch(e){return""}})().replace(/[^\d+]/g,"");
const api=(b)=>fetch("/api/status"+(b?"":`?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`),b?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,token:t,...b})}:{}).then(r=>r.json()).catch(()=>({ok:false}));

if(!id||!t){el.innerHTML=`<div class="panel" style="max-width:640px;margin:40px auto;text-align:center;padding:40px"><h3>Find your request</h3><p>Use the private link from your confirmation screen or email to see your request. Lost it? Tap <a href="tel:${esc(TEL)}">Call Mr. Marketplace</a> and we'll help.</p><p style="margin-top:18px"><a class="btn btn-navy" href="${document.documentElement.lang==="es"?"/es/#quote":"/#quote"}">Start a new request</a></p></div>`;return}

function draw(V){
  if(!V.ok){el.innerHTML=`<div class="panel" style="max-width:640px;margin:40px auto;text-align:center;padding:40px"><h3>We couldn't find that request.</h3><p>The link may be incomplete. Please use the link from your confirmation, or start a new request.</p><p style="margin-top:18px"><a class="btn btn-navy" href="${document.documentElement.lang==="es"?"/es/#quote":"/#quote"}">Start a new request</a></p></div>`;return}
  const step=V.step<0?-1:Math.min(V.step,5),ag=V.agent,ini=ag?ag.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase():"";
  el.innerHTML=`
  <div class="qr-hd"><div><div class="meta" style="font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)">Request ${esc(V.id.toUpperCase())} · ${new Date(V.created).toLocaleDateString(undefined,{month:"long",day:"numeric"})}</div>
   <h2 style="font-size:clamp(30px,3.4vw,44px);color:var(--navy);letter-spacing:-.03em;margin:8px 0 10px">${V.status==="enrolled"?`You're enrolled, ${esc(V.first)}.`:`Hi ${esc(V.first)}, your insurance search is underway.`}</h2>
   <p>${ag?`${esc(ag.name)} is reviewing your information and will reach out by your preferred method.`:"Your request has been received."}</p></div>
   ${ag?`<div class="agent"><div class="who"><span class="av">${esc(ini)}</span><div><b>${esc(ag.name)}</b><small>${esc(ag.title)}</small></div></div><div class="acts"><a href="tel:${esc(ag.phone.replace(/\D/g,""))}">Call Mr. Marketplace</a><a href="sms:${esc(ag.phone.replace(/\D/g,""))}" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.25)">Text</a></div></div>`:""}</div>
  ${step<0?`<div class="panel"><h3>This request is closed.</h3><p>If you still need help with coverage, start a new request or call us.</p></div>`:""}<div class="track" ${step<0?"hidden":""}>${TRACK.map((x,i)=>`<div class="${i<step?"done":i===step?"done now":""}">${x}</div>`).join("")}</div>
  <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:18px" class="pgrid">
   <div>
    <div class="panel"><h3>Questions for your specialist</h3><div class="thread" style="display:grid;gap:8px;margin:12px 0">${V.messages.map(m=>`<div style="justify-self:${m.from==="you"?"end":"start"};max-width:85%;background:${m.from==="you"?"var(--navy)":"var(--bg-2)"};color:${m.from==="you"?"#fff":"var(--ink)"};border-radius:12px;padding:10px 14px;font-size:14.5px">${esc(m.text)}<div style="font-size:11px;opacity:.65;margin-top:3px">${new Date(m.t).toLocaleString()}</div></div>`).join("")||'<p style="color:var(--mute);font-size:14px">No messages yet.</p>'}</div>
     <form class="msg" style="display:flex;gap:8px"><div class="f" style="margin:0"><input name="m" placeholder="Ask a question" maxlength="1000"></div><button class="btn btn-navy" style="height:50px">Send</button></form></div>
   </div>
   <div>
    <div class="panel"><h3>How we contact you</h3><p>Choose your preferred method.</p><div class="pills" style="margin-top:12px">${[["call","Call"],["text","Text"],["email","Email"]].map(([v,x])=>`<button type="button" data-p="${v}" class="${V.preferred===v?"on":""}">${x}</button>`).join("")}</div></div>
    <div class="panel"><h3>Your permissions</h3><p>You can withdraw any permission at any time.</p>
     ${["call","text","email"].map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid var(--line-2);font-size:14.5px"><span>${{call:"Phone calls",text:"Text messages",email:"Email"}[c]}: <b style="color:${V.consents[c]?"var(--ok)":"var(--mute)"}">${V.consents[c]?"Allowed":"Off"}</b></span>${V.consents[c]?`<button type="button" class="btn btn-line btn-sm" data-w="${c}">Withdraw</button>`:""}</div>`).join("")}</div>
    ${V.plan_interest.length?`<div class="panel"><h3>Plans you asked about</h3>${V.plan_interest.map(p=>`<p style="padding:8px 0;border-top:1px solid var(--line-2);font-size:14.5px"><b>${esc(p.issuer)}</b><br>${esc(p.name)}</p>`).join("")}</div>`:""}
   </div>
  </div>`;
  el.querySelector(".msg").onsubmit=async e=>{e.preventDefault();const v=e.target.m.value.trim();if(v)draw(await api({type:"message",text:v}))};
  el.querySelectorAll("[data-p]").forEach(b=>b.onclick=async()=>draw(await api({type:"contact_pref",preferred:b.dataset.p})));
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=async()=>{if(confirm("Withdraw this permission? We'll stop contacting you this way."))draw(await api({type:"withdraw_consent",channel:b.dataset.w}))});
}
const st=document.createElement("style");st.textContent="@media(max-width:860px){.pgrid{grid-template-columns:1fr!important}}";document.head.appendChild(st);
el.innerHTML='<p style="text-align:center;color:var(--mute);padding:60px">Loading your request…</p>';
api().then(draw);
})();
