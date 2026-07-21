(function(){
  /* -------- Build the spiral SVG -------- */
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("cycle-svg");
  if(svg){
    var cx=280, cy=280, turns=2.45, rMin=16, rMax=232, steps=260, d="";
    for(var i=0; i<=steps; i++){
      var t=i/steps, theta=t*turns*2*Math.PI;
      var r=rMin+(rMax-rMin)*t;
      var x=cx+r*Math.cos(theta-Math.PI/2), y=cy+r*Math.sin(theta-Math.PI/2);
      d+=(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)+" ";
    }
    var spiral=document.createElementNS(NS,"path");
    spiral.setAttribute("d",d); spiral.setAttribute("fill","none");
    spiral.setAttribute("stroke","#abaa70"); spiral.setAttribute("stroke-width","1.4");
    spiral.setAttribute("stroke-linecap","round"); spiral.setAttribute("class","draw");
    var rotor=document.createElementNS(NS,"g");
    rotor.setAttribute("class","spiral-rotor"); rotor.appendChild(spiral);
    svg.appendChild(rotor);
    spiral.style.setProperty("--len", spiral.getTotalLength());

    var corners=[225,315,45,135];
    corners.forEach(function(deg){
      var a=deg*Math.PI/180;
      var x1=cx+34*Math.cos(a), y1=cy+34*Math.sin(a);
      var x2=cx+252*Math.cos(a), y2=cy+252*Math.sin(a);
      var line=document.createElementNS(NS,"line");
      line.setAttribute("x1",x1); line.setAttribute("y1",y1);
      line.setAttribute("x2",x2); line.setAttribute("y2",y2);
      line.setAttribute("stroke","#abaa70"); line.setAttribute("stroke-width","0.8");
      line.setAttribute("opacity","0.5"); line.setAttribute("class","draw");
      svg.insertBefore(line,rotor);
      line.style.setProperty("--len", Math.hypot(x2-x1,y2-y1));
    });
    corners.forEach(function(deg,idx){
      var a=deg*Math.PI/180;
      var x=cx+252*Math.cos(a), y=cy+252*Math.sin(a);
      var ring=document.createElementNS(NS,"circle");
      ring.setAttribute("cx",x); ring.setAttribute("cy",y); ring.setAttribute("r","7");
      ring.setAttribute("fill","#473e0f"); ring.setAttribute("stroke","#abaa70");
      ring.setAttribute("stroke-width","1.2"); ring.setAttribute("class","node n"+(idx+1));
      svg.appendChild(ring);
      var dot=document.createElementNS(NS,"circle");
      dot.setAttribute("cx",x); dot.setAttribute("cy",y); dot.setAttribute("r","2.6");
      dot.setAttribute("fill","#efecdf"); dot.setAttribute("class","node n"+(idx+1));
      svg.appendChild(dot);
    });
    var centerDot=document.createElementNS(NS,"circle");
    centerDot.setAttribute("cx","280"); centerDot.setAttribute("cy","280");
    centerDot.setAttribute("r","2.5"); centerDot.setAttribute("fill","#efecdf");
    centerDot.setAttribute("class","node n1"); svg.appendChild(centerDot);

    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!prefersReduced){
      var rotorAngle=0, lastTime=null;
      function rotateSpiral(now){
        if(!rotor) return;
        if(lastTime===null) lastTime=now;
        rotorAngle=(rotorAngle+((now-lastTime)/1000)*14)%360;
        lastTime=now;
        try{ rotor.setAttribute("transform","rotate("+rotorAngle.toFixed(2)+" 280 280)"); }catch(e){}
        requestAnimationFrame(rotateSpiral);
      }
      setTimeout(function(){ requestAnimationFrame(rotateSpiral); }, 400);
    }
  }

  /* -------- TAB ROUTING -------- */
  var validTabs = ["home","about","gatherings","contact"];
  var tabs = document.querySelectorAll(".tab");

  function showTab(name){
    if(!name || validTabs.indexOf(name)===-1) name="home";
    tabs.forEach(function(t){ t.classList.remove("active"); });
    var target = document.querySelector('[data-tab-content="'+name+'"]');
    if(!target) return;
    target.classList.add("active");
    var reveals = target.querySelectorAll(".reveal, #cycle");
    reveals.forEach(function(r){ r.classList.remove("in-view"); });
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        reveals.forEach(function(r){ r.classList.add("in-view"); });
      });
    });
    document.querySelectorAll(".topnav .links a").forEach(function(a){
      a.classList.toggle("active", a.getAttribute("data-tab")===name);
    });
    try{ window.scrollTo({top:0,behavior:"smooth"}); }catch(_){ window.scrollTo(0,0); }
  }

  document.addEventListener("click", function(e){
    var el=e.target;
    while(el && el!==document.body){
      if(el.getAttribute && el.getAttribute("data-tab")){
        e.preventDefault();
        var tab=el.getAttribute("data-tab");
        showTab(tab);
        try{ history.pushState(null,"","#"+tab); }catch(_){}
        return;
      }
      el=el.parentElement;
    }
  }, false);

  document.addEventListener("touchend", function(e){
    var el=e.target;
    while(el && el!==document.body){
      if(el.getAttribute && el.getAttribute("data-tab")){
        e.preventDefault();
        var tab=el.getAttribute("data-tab");
        showTab(tab);
        try{ history.pushState(null,"","#"+tab); }catch(_){}
        return;
      }
      el=el.parentElement;
    }
  }, {passive:false});

  function handleHash(){
    var hash=(window.location.hash||"#home").slice(1);
    showTab(hash);
  }
  window.addEventListener("hashchange", handleHash);
  handleHash();

  /* -------- MOBILE NAV -------- */
  (function(){
    var toggle=document.querySelector('.nav-toggle');
    var links=document.getElementById('nav-links');
    if(!toggle||!links) return;
    function setOpen(open){
      toggle.classList.toggle('open',open);
      links.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded', open?'true':'false');
    }
    toggle.addEventListener('click', function(){ setOpen(!toggle.classList.contains('open')); });
    links.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    window.addEventListener('resize', function(){ if(window.innerWidth>880) setOpen(false); });
  })();

  /* -------- VOICES CAROUSEL -------- */
  (function(){
    var track=document.getElementById('voices-track');
    var dotsWrap=document.getElementById('voices-dots');
    if(!track||!dotsWrap) return;
    var slides=track.querySelectorAll('.voice.slide');
    var dots=dotsWrap.querySelectorAll('.dot');
    var current=0, timer=null, INTERVAL=7500;
    function goTo(i){
      current=(i+slides.length)%slides.length;
      track.style.transform='translateX(-'+(current*100)+'%)';
      dots.forEach(function(d,j){ d.classList.toggle('active',j===current); });
    }
    function start(){ stop(); timer=setInterval(function(){ goTo(current+1); }, INTERVAL); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    dots.forEach(function(d,i){ d.addEventListener('click', function(){ goTo(i); start(); }); });
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    var touchStartX=null;
    track.addEventListener('touchstart', function(e){ touchStartX=e.touches[0].clientX; stop(); },{passive:true});
    track.addEventListener('touchend', function(e){
      if(touchStartX===null) return;
      var dx=e.changedTouches[0].clientX-touchStartX;
      if(Math.abs(dx)>40){ goTo(current+(dx<0?1:-1)); }
      touchStartX=null; start();
    },{passive:true});
    start();
  })();

  /* -------- CONTACT FORM -------- */
  var form=document.getElementById("contact-form");
  var success=document.getElementById("form-success");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var name=form.querySelector('[name="name"]').value.trim();
      var email=form.querySelector('[name="email"]').value.trim();
      if(!name||!email){
        if(!name) form.querySelector('[name="name"]').focus();
        else form.querySelector('[name="email"]').focus();
        return;
      }
      var submitBtn=form.querySelector('[type="submit"]');
      var submitSpan=submitBtn ? submitBtn.querySelector("span") : null;
      if(submitBtn) submitBtn.disabled=true;
      if(submitSpan) submitSpan.textContent="Sending…";

      fetch("/api/contact",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:name,
          email:email,
          interest:(form.querySelector('[name="interest"]').value||"").trim()||null,
          message:(form.querySelector('[name="message"]').value||"").trim()||null
        })
      })
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.ok){
          form.style.display="none";
          success.classList.add("show");
        } else {
          if(submitBtn) submitBtn.disabled=false;
          if(submitSpan) submitSpan.textContent="Send message";
        }
      })
      .catch(function(){
        if(submitBtn) submitBtn.disabled=false;
        if(submitSpan) submitSpan.textContent="Send message";
      });
    });
  }

  /* -------- NAV SCROLL STATE -------- */
  (function(){
    var nav = document.querySelector('.topnav');
    if(!nav) return;
    function update(){ nav.classList.toggle('scrolled', window.scrollY > 60); }
    window.addEventListener('scroll', update, {passive:true});
    update();
  })();

  /* -------- HERO SOUND TOGGLE -------- */
  (function(){
    var btn     = document.getElementById('hero-sound');
    var vid     = document.querySelector('.hero-vid');
    if(!btn || !vid) return;
    var iconOff = btn.querySelector('.icon-sound-off');
    var iconOn  = btn.querySelector('.icon-sound-on');
    var label   = btn.querySelector('.hero-sound-label');
    btn.addEventListener('click', function(){
      vid.muted = !vid.muted;
      iconOff.style.display = vid.muted ? 'block' : 'none';
      iconOn.style.display  = vid.muted ? 'none'  : 'block';
      if(label) label.textContent = vid.muted ? 'Sound' : 'Mute';
    });
  })();

  /* -------- HERO EXPAND TOGGLE (mobile only) -------- */
  (function(){
    var btn = document.getElementById('hero-expand');
    var vid = document.querySelector('.hero-vid');
    if(!btn || !vid) return;
    var iconOpen  = btn.querySelector('.icon-expand-open');
    var iconClose = btn.querySelector('.icon-expand-close');
    var label     = btn.querySelector('.hero-expand-label');
    btn.addEventListener('click', function(){
      var expanded = vid.classList.toggle('expanded');
      iconOpen.style.display  = expanded ? 'none'  : 'block';
      iconClose.style.display = expanded ? 'block' : 'none';
      if(label) label.textContent = expanded ? 'Compact' : 'Full video';
    });
  })();

  /* -------- REGISTRATION MODAL -------- */
  (function(){
    var modal=document.getElementById("reg-modal");
    var closeBtn=document.getElementById("reg-close");
    var backdrop=document.getElementById("reg-backdrop");
    var regForm=document.getElementById("reg-form");
    var regSuccess=document.getElementById("reg-success");
    if(!modal) return;

    function openModal(){
      modal.classList.add("open");
      modal.removeAttribute("aria-hidden");
      document.body.style.overflow="hidden";
      setTimeout(function(){ if(closeBtn) closeBtn.focus(); }, 120);
    }
    function closeModal(){
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
    }

    // Wire all open-register triggers (hero button + gatherings link)
    document.getElementById("open-register") && document.getElementById("open-register").addEventListener("click", openModal);
    document.querySelectorAll(".js-open-register").forEach(function(el){
      el.addEventListener("click", function(e){ e.preventDefault(); openModal(); });
    });

    if(closeBtn) closeBtn.addEventListener("click", closeModal);
    if(backdrop) backdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", function(e){
      if(e.key==="Escape" && modal.classList.contains("open")) closeModal();
    });

    if(regForm){
      var regError=document.getElementById("reg-error");
      function showRegError(msg){
        if(regError){ regError.textContent=msg; regError.style.display="block"; }
      }
      function clearRegError(){
        if(regError){ regError.textContent=""; regError.style.display="none"; }
      }

      regForm.addEventListener("submit", function(e){
        e.preventDefault();
        clearRegError();
        var name=regForm.querySelector('[name="name"]').value.trim();
        var email=regForm.querySelector('[name="email"]').value.trim();
        var linkedin=regForm.querySelector('[name="linkedin"]').value.trim();
        if(!name||!email||!linkedin){
          if(!name) regForm.querySelector('[name="name"]').focus();
          else if(!email) regForm.querySelector('[name="email"]').focus();
          else regForm.querySelector('[name="linkedin"]').focus();
          return;
        }
        var submitBtn=regForm.querySelector('[type="submit"]');
        var submitSpan=submitBtn ? submitBtn.querySelector("span") : null;
        if(submitBtn) submitBtn.disabled=true;
        if(submitSpan) submitSpan.textContent="Sending…";

        fetch("/api/applications",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            retreat_slug:"retiro-una-2026",
            name:name,
            email:email,
            country:(regForm.querySelector('[name="country"]').value||"").trim()||null,
            profession:(regForm.querySelector('[name="profession"]').value||"").trim()||null,
            how_heard:regForm.querySelector('[name="source"]').value||null,
            social_media:linkedin,
            phone:(regForm.querySelector('[name="phone"]').value||"").trim()||null,
            q_draw:(regForm.querySelector('[name="q_draw"]').value||"").trim()||null,
            q_work_intersection:(regForm.querySelector('[name="q_work_intersection"]').value||"").trim()||null,
            q_responsible_participation:(regForm.querySelector('[name="q_responsible_participation"]').value||"").trim()||null,
            org_connection:regForm.querySelector('[name="org_connection"]').value||null,
            travel_availability:regForm.querySelector('[name="travel_availability"]').value||null,
            investment_comfort:regForm.querySelector('[name="investment_comfort"]').value||null
          })
        })
        .then(function(r){return r.json();})
        .then(function(data){
          if(data.ok){
            regForm.style.display="none";
            if(regSuccess) regSuccess.classList.add("show");
          } else {
            if(submitBtn) submitBtn.disabled=false;
            if(submitSpan) submitSpan.textContent="Submit application";
            showRegError(data.error||"Something went wrong. Please try again.");
          }
        })
        .catch(function(){
          if(submitBtn) submitBtn.disabled=false;
          if(submitSpan) submitSpan.textContent="Submit application";
          showRegError("Could not connect. Please try again.");
        });
      });
    }
  })();
})();
