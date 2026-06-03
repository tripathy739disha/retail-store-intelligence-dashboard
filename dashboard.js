// dashboard.js
(function(){
  // ---------- Date/Time ----------
  const dt = document.getElementById('datetime');
  function tick(){
    const d = new Date();
    dt.textContent = d.toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  setInterval(tick,1000); tick();

  // ---------- Sidebar ----------
  const sb = document.getElementById('sidebar');
  document.getElementById('toggleSidebar').onclick = ()=>{
    if(window.innerWidth<=720) sb.classList.toggle('open');
    else sb.classList.toggle('collapsed');
  };
  document.querySelectorAll('.nav-item').forEach(n=>{
    n.onclick = e=>{
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
      n.classList.add('active');
      toast(`Switched to ${n.textContent.trim()}`);
    };
  });

  // ---------- Count-up KPI ----------
  document.querySelectorAll('.kpi-value').forEach(el=>{
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1400; const start = performance.now();
    function step(t){
      const p = Math.min((t-start)/dur,1);
      const v = Math.floor(target * (1-Math.pow(1-p,3)));
      el.textContent = v.toLocaleString() + (p===1?suffix:'');
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // ---------- Toast ----------
  const tw = document.getElementById('toastWrap');
  function toast(msg){
    const el = document.createElement('div');
    el.className='toast'; el.textContent=msg;
    tw.appendChild(el);
    setTimeout(()=>{el.style.opacity=0;el.style.transform='translateX(120%)';setTimeout(()=>el.remove(),300)},2800);
  }

  // ---------- Video / Upload ----------
  const dz = document.getElementById('dropzone');
  const fi = document.getElementById('fileInput');
  document.getElementById('uploadBtn').onclick = ()=>fi.click();
  fi.onchange = ()=>{ if(fi.files[0]) toast(`Loaded: ${fi.files[0].name}`); };
  ['dragenter','dragover'].forEach(e=>dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(e=>dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop',ev=>{ if(ev.dataTransfer.files[0]) toast(`Video dropped: ${ev.dataTransfer.files[0].name}`); });

  const bar = document.getElementById('barFill');
  const procStatus = document.getElementById('procStatus');
  const results = document.getElementById('results');
  let procTimer = null;
  document.getElementById('analyzeBtn').onclick = ()=>{
    if(procTimer) return;
    results.hidden = true; bar.style.width='0%'; let p=0;
    procStatus.textContent='Initializing YOLO model…';
    const steps=['Detecting persons…','Tracking IDs…','Assigning zones…','Generating heatmap…','Finalizing analytics…'];
    procTimer = setInterval(()=>{
      p += 4 + Math.random()*6;
      if(p>=100){ p=100; clearInterval(procTimer); procTimer=null; procStatus.textContent='Analysis Complete ✓'; results.hidden=false; toast('Demo analysis complete'); }
      else procStatus.textContent = steps[Math.min(Math.floor(p/22),steps.length-1)];
      bar.style.width = p+'%';
    },220);
  };
  document.getElementById('stopBtn').onclick = ()=>{
    if(procTimer){ clearInterval(procTimer); procTimer=null; procStatus.textContent='Stopped'; bar.style.width='0%'; toast('Analysis stopped'); }
  };

  // ---------- Alerts ----------
  const alertList = document.getElementById('alertList');
  const activeEl = document.getElementById('activeCount');
  const resolvedEl = document.getElementById('resolvedCount');
  let active=0, resolved=0;
  const samples = [
    ['HIGH','Restricted Area Access Detected'],
    ['MEDIUM','Checkout Congestion Detected'],
    ['LOW','Store Entrance Crowd Forming'],
    ['HIGH','Camera View Obstruction Detected'],
    ['MEDIUM','Unusual Group Gathering Detected'],
    ['LOW','Extended Customer Dwell Time'],
  ];
  function addAlert(sev,desc){
    const time = new Date().toLocaleTimeString();
    const el = document.createElement('div');
    el.className='alert';
    el.innerHTML = `
      <div class="alert-top">
        <span class="sev sev-${sev}">${sev}</span>
        <span class="alert-time">${time}</span>
      </div>
      <div class="alert-desc">${desc}</div>
      <div class="alert-actions">
        <button data-a="notify">Notify Staff</button>
        <button data-a="escalate">Escalate</button>
        <button data-a="resolve">Mark Resolved</button>
        <button data-a="report">Generate Report</button>
      </div>`;
    alertList.prepend(el);
    active++; activeEl.textContent=active;
    el.querySelectorAll('button').forEach(b=>{
      b.onclick = ()=>{
        const a = b.dataset.a;
        if(a==='notify') toast('Staff Notification Sent');
        if(a==='escalate') toast('Incident Escalated');
        if(a==='report') toast('Incident Report Generated');
        if(a==='resolve'){
          if(!el.classList.contains('resolved')){
            el.classList.add('resolved');
            active--; resolved++;
            activeEl.textContent=active; resolvedEl.textContent=resolved;
            toast('Alert Resolved Successfully');
          }
        }
      };
    });
    while(alertList.children.length>10) alertList.lastChild.remove();
  }
  // seed
  samples.slice(0,4).forEach(s=>addAlert(s[0],s[1]));
  setInterval(()=>{ const s=samples[Math.floor(Math.random()*samples.length)]; addAlert(s[0],s[1]); }, 6000);

  // ---------- Charts ----------
  function drawChart(id, fn){
    const c = document.getElementById(id);
    const dpr = window.devicePixelRatio||1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w*dpr; c.height = h*dpr;
    const ctx = c.getContext('2d'); ctx.scale(dpr,dpr);
    fn(ctx,w,h);
  }
  function axis(ctx,w,h,pad){
    ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
    for(let i=0;i<5;i++){ const y = pad + (h-pad*2)*i/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
  }

  function lineChart(id,data,labels,color){
    drawChart(id,(ctx,w,h)=>{
      const pad=30; axis(ctx,w,h,pad);
      const max=Math.max(...data)*1.15;
      const grad=ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0,color+'aa'); grad.addColorStop(1,color+'00');
      ctx.beginPath();
      data.forEach((v,i)=>{
        const x=pad+(w-pad*2)*i/(data.length-1);
        const y=h-pad-(h-pad*2)*v/max;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      });
      ctx.lineTo(w-pad,h-pad); ctx.lineTo(pad,h-pad); ctx.closePath();
      ctx.fillStyle=grad; ctx.fill();
      ctx.beginPath();
      data.forEach((v,i)=>{
        const x=pad+(w-pad*2)*i/(data.length-1);
        const y=h-pad-(h-pad*2)*v/max;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      });
      ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.stroke();
      ctx.fillStyle=color;
      data.forEach((v,i)=>{
        const x=pad+(w-pad*2)*i/(data.length-1);
        const y=h-pad-(h-pad*2)*v/max;
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
      });
      ctx.fillStyle='rgba(200,190,230,.7)'; ctx.font='10px Inter';
      labels.forEach((l,i)=>{
        const x=pad+(w-pad*2)*i/(labels.length-1);
        ctx.fillText(l,x-10,h-10);
      });
    });
  }

  function barChart(id,data,labels,color){
    drawChart(id,(ctx,w,h)=>{
      const pad=30; axis(ctx,w,h,pad);
      const max=Math.max(...data)*1.2;
      const bw=(w-pad*2)/data.length-10;
      data.forEach((v,i)=>{
        const x=pad+i*((w-pad*2)/data.length)+5;
        const bh=(h-pad*2)*v/max;
        const y=h-pad-bh;
        const g=ctx.createLinearGradient(0,y,0,h-pad);
        g.addColorStop(0,color); g.addColorStop(1,color+'55');
        ctx.fillStyle=g;
        roundRect(ctx,x,y,bw,bh,6); ctx.fill();
        ctx.fillStyle='rgba(200,190,230,.7)'; ctx.font='10px Inter';
        ctx.fillText(labels[i],x,h-10);
      });
    });
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function renderCharts(){
    lineChart('chartFootfall',[12,18,25,40,55,72,88,95,80,68,52,38],
      ['8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p'],'#a855f7');
    barChart('chartZones',[82,64,91,55,73,40],
      ['Entr','Chk','Cos','Skin','Frag','Prem'],'#facc15');
    barChart('chartDwell',[15,32,48,28,12,6],
      ['<2m','2-5','5-10','10-20','20-30','30+'],'#8b5cf6');
    lineChart('chartTrend',[820,940,1100,1050,1240,1380,1238],
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],'#facc15');
  }
  renderCharts();
  window.addEventListener('resize',()=>setTimeout(renderCharts,100));

  // ---------- Reports ----------
  const reports = [
    {t:'Daily Retail Report',s:'Footfall, conversion, and zone performance summary for today.'},
    {t:'Weekly Retail Report',s:'7-day visitor trends, dwell time and peak occupancy comparison.'},
    {t:'Monthly Retail Report',s:'Month-over-month performance and zone-level engagement metrics.'},
    {t:'Security Incident Report',s:'All flagged events, resolutions, and risk assessments.'},
    {t:'Occupancy Report',s:'Hourly occupancy curve and threshold breaches across cameras.'},
    {t:'Dwell Time Report',s:'Customer dwell distribution by zone and time window.'},
    {t:'Heatmap Report',s:'Spatial heatmap exports and high-traffic cluster analysis.'},
  ];
  const rg = document.getElementById('reportsGrid');
  reports.forEach(r=>{
    const stamp = new Date(Date.now()-Math.random()*86400000*3).toLocaleString();
    const el = document.createElement('div');
    el.className='report-card';
    el.innerHTML = `
      <h4>${r.t}</h4>
      <div class="meta">Generated: ${stamp}</div>
      <span class="status">READY</span>
      <div class="sum">${r.s}</div>
      <div class="report-actions">
        <button data-a="view">View</button>
        <button data-a="pdf">PDF</button>
        <button data-a="csv">CSV</button>
      </div>`;
    el.querySelectorAll('button').forEach(b=>{
      b.onclick = ()=>{
        const a=b.dataset.a;
        if(a==='view') toast(`${r.t}: opening preview`);
        if(a==='pdf') toast(`${r.t}: PDF export queued`);
        if(a==='csv') toast(`${r.t}: CSV export queued`);
      };
    });
    rg.appendChild(el);
  });

  // ---------- Activity feed ----------
  const feed = document.getElementById('activityFeed');
  const events = [
    ['👤','Person Entered Store'],
    ['🚪','Person Exited Store'],
    ['🛒','Queue Formed at Checkout'],
    ['⚠','Alert Triggered'],
    ['🔥','Heatmap Generated'],
    ['📄','Report Generated'],
    ['📊','Occupancy Updated'],
    ['🎥','New Camera Feed Connected'],
  ];
  function addFeed(){
    const e = events[Math.floor(Math.random()*events.length)];
    const el = document.createElement('div');
    el.className='feed-item';
    el.innerHTML = `<div class="fi-ico">${e[0]}</div><div>${e[1]}</div><div class="fi-time">${new Date().toLocaleTimeString()}</div>`;
    feed.prepend(el);
    while(feed.children.length>15) feed.lastChild.remove();
  }
  for(let i=0;i<6;i++) addFeed();
  setInterval(addFeed, 3500);

  // welcome
  setTimeout(()=>toast('Welcome to RetailSense — Demo Mode'),500);
})();
