/* Mr. Marketplace advisor application (/agents/) */
(function(){
const f=document.getElementById("agt-form");if(!f)return;
const er=f.querySelector(".agt-err"),btn=f.querySelector('button[type="submit"]');
f.addEventListener("input",()=>{er.textContent=""});f.addEventListener("change",()=>{er.textContent=""});
const MSG={first:"your first name",last:"your last name",email:"a valid email",phone:"a 10-digit phone number",npn:"your NPN (numbers only)",states:"at least one licensed state",agree:"your agreement to the terms"};
f.addEventListener("submit",async e=>{
  e.preventDefault();er.textContent="";
  const v=n=>(f.elements[n]?.value||"").trim(),all=n=>[...f.querySelectorAll(`[name="${n}"]:checked`)].map(x=>x.value);
  const d={first:v("first"),last:v("last"),email:v("email"),phone:v("phone"),npn:v("npn").replace(/\D/g,""),states:all("states"),
    ffm:(f.querySelector('[name="ffm"]:checked')||{}).value==="yes",languages:all("languages"),experience:v("experience"),note:v("note"),website:v("website"),agree:f.elements.agree.checked};
  const miss=[];if(!d.first)miss.push("first");if(!d.last)miss.push("last");if(!/^\S+@\S+\.\S+$/.test(d.email))miss.push("email");
  if(d.phone.replace(/\D/g,"").replace(/^1(?=\d{10}$)/,"").length!==10)miss.push("phone");if(d.npn.length<3)miss.push("npn");if(!d.states.length)miss.push("states");if(!d.agree)miss.push("agree");
  if(miss.length){er.textContent="Please add "+miss.map(k=>MSG[k]).join(", ")+".";return}
  btn.disabled=true;btn.textContent="Sending…";
  const r=await fetch("/api/advisor/apply",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}).then(async x=>({s:x.status,...(await x.json().catch(()=>({})))})).catch(()=>({s:0}));
  if(r.ok){f.hidden=true;f.parentElement.querySelector(".agt-done").hidden=false;f.parentElement.scrollIntoView({behavior:"smooth",block:"start"});return}
  btn.disabled=false;btn.textContent="Submit application";
  er.textContent=r.s===429?"Too many attempts. Please try again in an hour.":r.fields?"Please add "+r.fields.map(k=>MSG[k]||k).join(", ")+".":"Something went wrong. Please try again, or call Mr. Marketplace.";
});
})();
