/* Mr. Marketplace — shared page behavior */
(function(){
  const hd=document.querySelector(".hd");
  if(hd){const f=()=>hd.classList.toggle("solid",scrollY>8);addEventListener("scroll",f,{passive:true});f();
    const m=hd.querySelector(".menu"),n=hd.querySelector("nav");if(m)m.onclick=()=>{n.classList.toggle("open");m.setAttribute("aria-expanded",n.classList.contains("open"))};
    n&&n.addEventListener("click",e=>{if(e.target.closest("a"))n.classList.remove("open")});}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".up").forEach((el,i)=>{el.style.transitionDelay=(i%4)*60+"ms";io.observe(el)});
})();
/* Premium motion: count-ups, step line, product demo loop, card glow */
(function(){
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen=(els,fn,opt)=>{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){fn(e.target);o.unobserve(e.target)}}),opt||{threshold:.35});els.forEach(el=>o.observe(el))};
  // count-up numbers
  seen(document.querySelectorAll(".count"),el=>{const to=+el.dataset.to||0;if(calm||!to){el.textContent=to;return}const t0=performance.now(),d=1400;
    const tick=t=>{const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(tick)};el.textContent="0";requestAnimationFrame(tick)});
  // how-it-works line
  seen(document.querySelectorAll(".steps3"),el=>el.classList.add("in"));
  // product demo: cycles through 3 states while on screen
  const demo=document.querySelector(".demo"),lis=document.querySelectorAll(".demo-steps li");
  if(demo&&lis.length){let s=0,timer=null,vis=false;const DUR=4200;
    const set=n=>{s=n;demo.dataset.s=n;lis.forEach((li,i)=>{li.classList.toggle("on",i===n);li.style.setProperty("--dur",DUR+"ms");if(i===n){const x=li.querySelector("i");x.replaceWith(x.cloneNode(true))}})};
    const run=()=>{clearInterval(timer);if(calm)return;timer=setInterval(()=>{if(vis)set((s+1)%3)},DUR)};
    new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis&&!demo.dataset.s){set(0);run()}},{threshold:.3}).observe(demo);
    lis.forEach((li,i)=>li.addEventListener("click",()=>{set(i);run()}));
  }
  // cursor glow on calculator cards
  document.querySelectorAll(".tools-dark .tcard").forEach(c=>c.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect();c.style.setProperty("--mx",(e.clientX-r.left)+"px");c.style.setProperty("--my",(e.clientY-r.top)+"px")}));
})();

/* header dropdowns: keyboard, touch and a short close delay */
(()=>{const dds=document.querySelectorAll(".hd .dd");if(!dds.length)return;
const wide=()=>matchMedia("(min-width:1321px)").matches;
const close=x=>{x.classList.remove("on");const t=x.querySelector(".dd-t");t&&t.setAttribute("aria-expanded","false")};
dds.forEach(d=>{const t=d.querySelector(".dd-t");let tm;
 d.addEventListener("mouseenter",()=>{clearTimeout(tm);if(!wide())return;dds.forEach(o=>o!==d&&close(o));d.classList.add("on");t.setAttribute("aria-expanded","true")});
 d.addEventListener("mouseleave",()=>{tm=setTimeout(()=>close(d),140)});
 t.addEventListener("click",e=>{if(!wide())return;if(matchMedia("(hover:none)").matches&&!d.classList.contains("on")){e.preventDefault();dds.forEach(o=>o!==d&&close(o));d.classList.add("on");t.setAttribute("aria-expanded","true")}});
 d.addEventListener("keydown",e=>{if(e.key==="Escape"){close(d);t.focus()}});
 d.addEventListener("focusout",e=>{if(!d.contains(e.relatedTarget))close(d)});});
document.addEventListener("click",e=>{if(!e.target.closest(".hd .dd"))dds.forEach(close)});})();
