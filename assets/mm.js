/* Mr. Marketplace — shared page behavior */
(function(){
  const hd=document.querySelector(".hd");
  if(hd){const f=()=>hd.classList.toggle("solid",scrollY>8);addEventListener("scroll",f,{passive:true});f();
    const m=hd.querySelector(".menu"),n=hd.querySelector("nav");if(m)m.onclick=()=>{n.classList.toggle("open");m.setAttribute("aria-expanded",n.classList.contains("open"))};
    n&&n.addEventListener("click",e=>{if(e.target.closest("a"))n.classList.remove("open")});}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".up").forEach((el,i)=>{el.style.transitionDelay=(i%4)*60+"ms";io.observe(el)});
})();
