const $=id=>document.getElementById(id);
const st={marks:{a:null,b:null,r:null},stage:"a",result:null,selected:new Set(),url:null};
const video=$("video"),overlay=$("overlay"),ctx=overlay.getContext("2d");

$("file").onchange=e=>{
  const f=e.target.files?.[0];
  if(!f)return;
  if(st.url)URL.revokeObjectURL(st.url);
  st.url=URL.createObjectURL(f);
  video.src=st.url;
  $("workspace").classList.remove("hidden");
  $("results").classList.add("hidden");
  $("chemistry").classList.add("hidden");
  clearMarks();
  video.onloadedmetadata=async()=>{
    await seek(0);
    resize();draw();
    $("status").textContent=`Vídeo carregado: ${video.duration.toFixed(2)} s`;
  };
};

window.onresize=()=>{resize();draw();};
$("start").onclick=()=>seek(0);
$("clear").onclick=clearMarks;
$("reset").onclick=()=>location.reload();

overlay.onclick=e=>{
  if(!video.videoWidth)return;
  const r=overlay.getBoundingClientRect();
  const p={
    x:(e.clientX-r.left)/r.width*video.videoWidth,
    y:(e.clientY-r.top)/r.height*video.videoHeight
  };
  if(st.stage==="a"){st.marks.a=p;st.stage="b"}
  else if(st.stage==="b"){st.marks.b=p;st.stage="r"}
  else{st.marks.r=p;st.stage="done"}
  updateSteps();draw();ready();
};

function clearMarks(){st.marks={a:null,b:null,r:null};st.stage="a";updateSteps();draw();ready();}
function updateSteps(){["sa","sb","sr"].forEach(x=>$(x).classList.remove("active"));if(st.stage==="a")$("sa").classList.add("active");if(st.stage==="b")$("sb").classList.add("active");if(st.stage==="r")$("sr").classList.add("active");}
function ready(){$("analyze").disabled=!(st.marks.a&&st.marks.b&&st.marks.r);}
function resize(){const r=video.getBoundingClientRect(),d=devicePixelRatio;overlay.width=Math.max(1,Math.round(r.width*d));overlay.height=Math.max(1,Math.round(r.height*d));}
function draw(){
  if(!video.videoWidth)return;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  const r=overlay.getBoundingClientRect(),d=devicePixelRatio,sx=r.width/video.videoWidth*d,sy=r.height/video.videoHeight*d;
  const mp=p=>({x:p.x*sx,y:p.y*sy});
  if(st.marks.a&&st.marks.b){
    const a=mp(st.marks.a),b=mp(st.marks.b);
    ctx.strokeStyle="#ffe66d";ctx.lineWidth=3*d;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  [[st.marks.a,"#ffe66d","A"],[st.marks.b,"#ffd166","B"],[st.marks.r,"#ff4d6d","R"]].forEach(([p,c,l])=>{
    if(!p)return;const q=mp(p);ctx.fillStyle=c;ctx.beginPath();ctx.arc(q.x,q.y,8*d,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font=`${14*d}px sans-serif`;ctx.fillText(l,q.x+10*d,q.y-8*d);
  });
}

function seek(t){
  return new Promise((res,rej)=>{
    const tt=Math.min(Math.max(0,t),Math.max(0,(video.duration||t)-.0001));
    const ok=()=>{clean();requestAnimationFrame(res)},bad=()=>{clean();rej(new Error("Falha ao acessar frame"))},
    clean=()=>{video.removeEventListener("seeked",ok);video.removeEventListener("error",bad)};
    video.addEventListener("seeked",ok,{once:true});
    video.addEventListener("error",bad,{once:true});
    video.currentTime=tt;
    if(Math.abs(video.currentTime-tt)<1e-5&&video.readyState>=2)setTimeout(ok,0);
  });
}
function frame(){const c=document.createElement("canvas");c.width=video.videoWidth;c.height=video.videoHeight;c.getContext("2d",{willReadFrequently:true}).drawImage(video,0,0,c.width,c.height);return c;}
function refColor(c,p,r=4){
  const g=c.getContext("2d",{willReadFrequently:true}),x=Math.max(0,Math.round(p.x-r)),y=Math.max(0,Math.round(p.y-r)),
  w=Math.min(c.width-x,2*r+1),h=Math.min(c.height-y,2*r+1),d=g.getImageData(x,y,w,h).data;
  let R=0,G=0,B=0,n=0;
  for(let i=0;i<d.length;i+=4){R+=d[i];G+=d[i+1];B+=d[i+2];n++}
  return{r:R/n,g:G/n,b:B/n};
}
function track(c,p,ref,rad=75,tol=95){
  const g=c.getContext("2d",{willReadFrequently:true}),L=Math.max(0,Math.round(p.x-rad)),T=Math.max(0,Math.round(p.y-rad)),
  R=Math.min(c.width-1,Math.round(p.x+rad)),B=Math.min(c.height-1,Math.round(p.y+rad)),w=R-L+1,h=B-T+1,d=g.getImageData(L,T,w,h).data;
  let sw=0,sx=0,sy=0;
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
    const i=(y*w+x)*4,dr=d[i]-ref.r,dg=d[i+1]-ref.g,db=d[i+2]-ref.b,dist=Math.hypot(dr,dg,db);
    if(dist<=tol){const ww=1/(1+dist);sw+=ww;sx+=(L+x)*ww;sy+=(T+y)*ww}
  }
  return sw>.001?{x:sx/sw,y:sy/sw}:{...p};
}

$("analyze").onclick=async()=>{
  const A=st.marks.a,B=st.marks.b,R=st.marks.r;
  let dist=parseFloat($("distance").value);
  if($("unit").value==="cm")dist/=100;
  if(!isFinite(dist)||dist<=0)return alert("Distância inválida.");

  const mpp=dist/Math.hypot(B.x-A.x,B.y-A.y);
  const fps=parseFloat($("fps").value),dt=1/fps,dur=Math.min(video.duration||0,10),N=Math.max(5,Math.floor(dur*fps));
  $("status").textContent="Analisando...";
  $("analyze").disabled=true;

  try{
    await seek(0);
    const ref=refColor(frame(),R);
    let p={...R},raw=[];
    for(let i=0;i<N;i++){
      await seek(i*dt);
      p=track(frame(),p,ref);
      raw.push({t:i*dt,x:p.x,y:p.y});
      if(i%5===0){$("status").textContent=`Analisando... ${Math.round((i+1)/N*100)}%`;await new Promise(r=>requestAnimationFrame(r));}
    }

    const phys=physics(raw,mpp);
    const chem=chemistry();
    st.result={...phys,chemistry:chem};

    renderPhysical(st.result);
    renderChemistry(chem);

    $("results").classList.remove("hidden");
    $("chemistry").classList.remove("hidden");
    $("results").scrollIntoView({behavior:"smooth"});
    $("status").textContent="Análise concluída.";
  }catch(e){
    alert(e.message);$("status").textContent="Falha na análise.";
  }finally{
    $("analyze").disabled=false;
  }
};

function ma(a,w=5){const r=Math.floor(w/2);return a.map((_,i)=>{let s=0,n=0;for(let j=Math.max(0,i-r);j<=Math.min(a.length-1,i+r);j++){s+=a[j];n++}return s/n})}
function deriv(t,y){return y.map((_,i)=>i===0?(y[1]-y[0])/(t[1]-t[0]):i===y.length-1?(y[i]-y[i-1])/(t[i]-t[i-1]):(y[i+1]-y[i-1])/(t[i+1]-t[i-1]))}

function physics(r,mpp){
  const tRaw=r.map(p=>p.t),x0=r[0].x,y0=r[0].y;
  const x=ma(r.map(p=>(p.x-x0)*mpp));
  const yr=r.map(p=>(y0-p.y)*mpp),min=Math.min(...yr),y=ma(yr.map(v=>v-min));
  const vx=ma(deriv(tRaw,x)),vy=ma(deriv(tRaw,y)),speed=vx.map((v,i)=>Math.hypot(v,vy[i]));
  const threshold=Math.max(0,parseFloat($("motionThreshold").value)||0);
  let launchIdx=speed.findIndex(v=>v>=threshold);
  if(launchIdx<0)launchIdx=0;
  const align=$("alignMotion").value==="yes";
  const t0=align?tRaw[launchIdx]:0;
  const t=tRaw.map(v=>Math.max(0,v-t0));

  const ax=ma(deriv(tRaw,vx)),ay=ma(deriv(tRaw,vy));
  const mg=parseFloat($("mass").value),m=isFinite(mg)&&mg>0?mg/1000:null,g=9.80665;

  let pts=t.map((tt,i)=>{
    const sp=Math.hypot(vx[i],vy[i]),ac=Math.hypot(ax[i],ay[i]);
    return{t:tt,xM:x[i],yM:y[i],speed:sp,accel:ac,force:m?m*ac:null,ke:m?0.5*m*sp*sp:null,pe:m?m*g*y[i]:null};
  });

  if(align)pts=pts.slice(launchIdx);

  const xs=pts.map(p=>p.xM),mh=Math.max(...pts.map(p=>p.yM)),mx=xs.reduce((a,b)=>a+b,0)/xs.length,
  sd=Math.sqrt(xs.reduce((s,v)=>s+(v-mx)**2,0)/xs.length);

  return{
    id:Date.now(),
    name:$("name").value||`Experimento ${new Date().toLocaleTimeString("pt-BR")}`,
    massGrams:m?mg:null,
    maxHeightM:mh,
    horizontalRangeM:Math.max(...xs)-Math.min(...xs),
    maxSpeedMs:Math.max(...pts.map(p=>p.speed)),
    maxAccelMs2:Math.max(...pts.map(p=>p.accel)),
    maxForceN:m?Math.max(...pts.map(p=>p.force)):null,
    maxKineticEnergyJ:m?Math.max(...pts.map(p=>p.ke)):null,
    maxPotentialEnergyJ:m?Math.max(...pts.map(p=>p.pe)):null,
    flightTimeS:pts.at(-1).t-pts[0].t,
    stabilityIndex:mh>1e-9?Math.max(0,Math.min(100,100*(1-sd/mh))):0,
    launchTimeOriginalS:tRaw[launchIdx],
    points:pts
  };
}

function chemistry(){
  const V=Math.max(0,parseFloat($("alcoholVolume").value)||0);
  const pct=Math.max(0,Math.min(100,parseFloat($("alcoholPercent").value)||0));
  const basis=$("alcoholBasis").value;
  const rhoEtOH=0.789; // g/mL, aproximado
  const MEtOH=46.06844; // g/mol
  const MCO2=44.0095; // g/mol
  const molarVolume25=24.465; // L/mol, ideal ~25 C e 1 atm

  let ethanolVolumeMl=null, ethanolMassG=0;

  if(basis==="vv"){
    ethanolVolumeMl=V*(pct/100);
    ethanolMassG=ethanolVolumeMl*rhoEtOH;
  }else{
    const rhoSolution=Math.max(0.1,parseFloat($("solutionDensity").value)||0.88);
    const solutionMassG=V*rhoSolution;
    ethanolMassG=solutionMassG*(pct/100);
    ethanolVolumeMl=ethanolMassG/rhoEtOH;
  }

  const ethanolMol=ethanolMassG/MEtOH;
  const co2Mol=2*ethanolMol;
  const co2MassG=co2Mol*MCO2;
  const co2VolumeL25=co2Mol*molarVolume25;
  const o2MolRequired=3*ethanolMol;

  return{
    solutionVolumeMl:V,
    alcoholPercent:pct,
    basis,
    ethanolVolumeMl,
    ethanolMassG,
    ethanolMol,
    co2Mol,
    co2MassG,
    co2VolumeL25,
    o2MolRequired,
    assumptions:{
      ethanolDensity:rhoEtOH,
      ethanolMolarMass:MEtOH,
      co2MolarMass:MCO2,
      molarVolume25
    }
  };
}

function f(v,d=2){return Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d})}

function renderPhysical(r){
  let ms=[
    ["Altura máxima",f(r.maxHeightM)+" m"],
    ["Alcance",f(r.horizontalRangeM)+" m"],
    ["Velocidade máxima",f(r.maxSpeedMs)+" m/s"],
    ["Aceleração máxima",f(r.maxAccelMs2)+" m/s²"],
    ["Tempo analisado",f(r.flightTimeS)+" s"],
    ["Estabilidade",f(r.stabilityIndex)+"%"],
    ["Início detectado",f(r.launchTimeOriginalS)+" s"]
  ];

  if(r.massGrams){
    ms.push(
      ["Força máxima",f(r.maxForceN)+" N"],
      ["Energia cinética máx.",f(r.maxKineticEnergyJ,3)+" J"],
      ["Energia potencial máx.",f(r.maxPotentialEnergyJ,3)+" J"]
    );
    $("massCharts").classList.remove("hidden");
  }else $("massCharts").classList.add("hidden");

  $("metrics").innerHTML=ms.map(x=>`<div class="metric">${x[0]}<strong>${x[1]}</strong></div>`).join("");
  const p=r.points;
  chart($("traj"),[{name:"",p:p.map(q=>({x:q.xM,y:q.yM}))}],"x (m)","altura (m)");
  chart($("height"),[{name:"",p:p.map(q=>({x:q.t,y:q.yM}))}],"tempo (s)","altura (m)");
  chart($("speed"),[{name:"",p:p.map(q=>({x:q.t,y:q.speed}))}],"tempo (s)","m/s");
  chart($("accel"),[{name:"",p:p.map(q=>({x:q.t,y:q.accel}))}],"tempo (s)","m/s²");
  if(r.massGrams){
    chart($("force"),[{name:"",p:p.map(q=>({x:q.t,y:q.force}))}],"tempo (s)","N");
    chart($("ke"),[{name:"",p:p.map(q=>({x:q.t,y:q.ke}))}],"tempo (s)","J");
    chart($("pe"),[{name:"",p:p.map(q=>({x:q.t,y:q.pe}))}],"tempo (s)","J");
  }
}

function renderChemistry(c){
  const basisLabel=c.basis==="vv"?"% v/v":"% m/m";
  const cards=[
    ["Solução alcoólica",`${f(c.solutionVolumeMl)} mL`,`${f(c.alcoholPercent,1)} ${basisLabel}`],
    ["Etanol equivalente",`${f(c.ethanolVolumeMl,3)} mL`,"volume equivalente estimado"],
    ["Massa de etanol",`${f(c.ethanolMassG,3)} g`,"teórica"],
    ["Quantidade de etanol",`${f(c.ethanolMol,5)} mol`,"teórica"],
    ["O₂ necessário",`${f(c.o2MolRequired,5)} mol`,"estequiométrico"],
    ["CO₂ máximo teórico",`${f(c.co2Mol,5)} mol`,"combustão completa"],
    ["Massa de CO₂",`${f(c.co2MassG,3)} g`,"máximo teórico"],
    ["Volume ideal de CO₂",`${f(c.co2VolumeL25,3)} L`,"aprox. 25 °C e 1 atm"]
  ];

  $("chemMetrics").innerHTML=cards.map(x=>`<div class="metric">${x[0]}<strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");

  // fluxo visual simples, em escala molar
  const pts=[
    {x:0,y:c.ethanolMol},
    {x:1,y:c.co2Mol},
    {x:2,y:c.o2MolRequired}
  ];
  categoryChart($("chemFlow"),
    ["Etanol","CO₂","O₂ necessário"],
    [c.ethanolMol,c.co2Mol,c.o2MolRequired],
    "mol"
  );
}

function chart(c,series,xl,yl){
  const W=c.clientWidth||900,H=c.clientHeight||270,d=devicePixelRatio;c.width=W*d;c.height=H*d;
  const g=c.getContext("2d");g.scale(d,d);g.clearRect(0,0,W,H);
  const all=series.flatMap(s=>s.p);if(all.length<2)return;
  let xmin=Math.min(...all.map(p=>p.x)),xmax=Math.max(...all.map(p=>p.x)),ymin=Math.min(...all.map(p=>p.y)),ymax=Math.max(...all.map(p=>p.y));
  if(xmax===xmin)xmax=xmin+1;if(ymax===ymin)ymax=ymin+1;
  const P={l:55,r:15,t:18,b:42},pw=W-P.l-P.r,ph=H-P.t-P.b;
  g.strokeStyle="#d6dde8";g.fillStyle="#667085";g.font="12px sans-serif";
  for(let i=0;i<=5;i++){
    const x=P.l+i/5*pw,y=P.t+i/5*ph;
    g.beginPath();g.moveTo(x,P.t);g.lineTo(x,P.t+ph);g.stroke();
    g.beginPath();g.moveTo(P.l,y);g.lineTo(P.l+pw,y);g.stroke();
    g.fillText(f(xmin+i/5*(xmax-xmin)),x-10,H-20);
    g.fillText(f(ymax-i/5*(ymax-ymin)),4,y+4);
  }
  const colors=["#2251d1","#d97706","#0a7a45","#7c3aed"];
  series.forEach((s,k)=>{
    g.strokeStyle=colors[k%colors.length];g.lineWidth=2.5;g.beginPath();
    s.p.forEach((p,i)=>{const x=P.l+(p.x-xmin)/(xmax-xmin)*pw,y=P.t+ph-(p.y-ymin)/(ymax-ymin)*ph;i?g.lineTo(x,y):g.moveTo(x,y)});
    g.stroke();
    if(s.name){g.fillStyle=colors[k%colors.length];g.fillText(s.name,P.l+k*125,12)}
  });
  g.fillStyle="#344054";g.fillText(xl,P.l+pw/2-25,H-5);
  g.save();g.translate(12,P.t+ph/2);g.rotate(-Math.PI/2);g.fillText(yl,0,0);g.restore();
}

function categoryChart(c,labels,values,yl){
  const W=c.clientWidth||900,H=c.clientHeight||270,d=devicePixelRatio;c.width=W*d;c.height=H*d;
  const g=c.getContext("2d");g.scale(d,d);g.clearRect(0,0,W,H);
  const max=Math.max(...values,1e-9);
  const P={l:55,r:15,t:20,b:45},pw=W-P.l-P.r,ph=H-P.t-P.b;
  const barW=pw/(labels.length*2);
  const colors=["#2251d1","#d97706","#0a7a45"];
  values.forEach((v,i)=>{
    const x=P.l+(i+.5)*pw/labels.length-barW/2;
    const h=v/max*ph;
    g.fillStyle=colors[i%colors.length];
    g.fillRect(x,P.t+ph-h,barW,h);
    g.fillStyle="#172033";g.font="12px sans-serif";
    g.fillText(labels[i],x-5,H-18);
    g.fillText(f(v,5),x-2,P.t+ph-h-6);
  });
  g.strokeStyle="#d6dde8";g.beginPath();g.moveTo(P.l,P.t);g.lineTo(P.l,P.t+ph);g.lineTo(P.l+pw,P.t+ph);g.stroke();
  g.save();g.translate(12,P.t+ph/2);g.rotate(-Math.PI/2);g.fillStyle="#344054";g.fillText(yl,0,0);g.restore();
}

$("save").onclick=()=>{
  if(!st.result)return;
  let a=load();
  a.unshift(st.result);
  localStorage.setItem("rml_v2",JSON.stringify(a.slice(0,30)));
  saved();
  alert("Experimento salvo.");
};

function load(){try{return JSON.parse(localStorage.getItem("rml_v2")||"[]")}catch{return[]}}

function saved(){
  const a=load();
  $("saved").innerHTML=a.length?a.map(e=>`
    <div class="savedRow">
      <input type="checkbox" data-id="${e.id}">
      <div>
        <strong>${e.name}</strong><br>
        <small>
          Solução ${f(e.chemistry?.solutionVolumeMl||0)} mL • CO₂ ${f(e.chemistry?.co2MassG||0,3)} g •
          Altura ${f(e.maxHeightM)} m • Vel. ${f(e.maxSpeedMs)} m/s
        </small>
      </div>
      <button data-del="${e.id}">Excluir</button>
    </div>`).join(""):`<p class="hint">Nenhum experimento salvo.</p>`;

  $("saved").querySelectorAll("[data-id]").forEach(x=>x.onchange=()=>{
    const id=+x.dataset.id;
    if(x.checked){
      if(st.selected.size>=3){x.checked=false;return alert("Máximo de 3 experimentos.");}
      st.selected.add(id);
    }else st.selected.delete(id);
    compare();
  });

  $("saved").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{
    localStorage.setItem("rml_v2",JSON.stringify(load().filter(e=>e.id!==+b.dataset.del)));
    st.selected.delete(+b.dataset.del);
    saved();
  });
  compare();
}

function compare(){
  const a=load().filter(e=>st.selected.has(e.id));
  if(a.length<2){$("compare").classList.add("hidden");return}
  $("compare").classList.remove("hidden");

  chart($("cmpHeight"),a.map(e=>({name:e.name,p:e.points.map(q=>({x:q.t,y:q.yM}))})),"tempo (s)","altura (m)");
  chart($("cmpSpeed"),a.map(e=>({name:e.name,p:e.points.map(q=>({x:q.t,y:q.speed}))})),"tempo (s)","m/s");
  chart($("cmpAccel"),a.map(e=>({name:e.name,p:e.points.map(q=>({x:q.t,y:q.accel}))})),"tempo (s)","m/s²");

  scatterChart($("cmpCo2Height"),a.map(e=>({name:e.name,x:e.chemistry?.co2MassG||0,y:e.maxHeightM})),"CO₂ teórico (g)","altura máxima (m)");
  scatterChart($("cmpCo2Speed"),a.map(e=>({name:e.name,x:e.chemistry?.co2MassG||0,y:e.maxSpeedMs})),"CO₂ teórico (g)","velocidade máxima (m/s)");
  scatterChart($("cmpCo2Accel"),a.map(e=>({name:e.name,x:e.chemistry?.co2MassG||0,y:e.maxAccelMs2})),"CO₂ teórico (g)","aceleração máxima (m/s²)");
  scatterChart($("cmpVolHeight"),a.map(e=>({name:e.name,x:e.chemistry?.solutionVolumeMl||0,y:e.maxHeightM})),"volume da solução (mL)","altura máxima (m)");
}

function scatterChart(c,pts,xl,yl){
  const W=c.clientWidth||900,H=c.clientHeight||270,d=devicePixelRatio;c.width=W*d;c.height=H*d;
  const g=c.getContext("2d");g.scale(d,d);g.clearRect(0,0,W,H);
  let xmin=Math.min(...pts.map(p=>p.x)),xmax=Math.max(...pts.map(p=>p.x)),ymin=Math.min(...pts.map(p=>p.y)),ymax=Math.max(...pts.map(p=>p.y));
  if(xmax===xmin){xmin-=.5;xmax+=.5} if(ymax===ymin){ymin-=.5;ymax+=.5}
  const P={l:55,r:15,t:25,b:45},pw=W-P.l-P.r,ph=H-P.t-P.b;
  g.strokeStyle="#d6dde8";g.fillStyle="#667085";g.font="12px sans-serif";
  for(let i=0;i<=5;i++){
    const x=P.l+i/5*pw,y=P.t+i/5*ph;
    g.beginPath();g.moveTo(x,P.t);g.lineTo(x,P.t+ph);g.stroke();
    g.beginPath();g.moveTo(P.l,y);g.lineTo(P.l+pw,y);g.stroke();
    g.fillText(f(xmin+i/5*(xmax-xmin)),x-10,H-20);
    g.fillText(f(ymax-i/5*(ymax-ymin)),4,y+4);
  }
  const colors=["#2251d1","#d97706","#0a7a45","#7c3aed"];
  pts.forEach((p,i)=>{
    const x=P.l+(p.x-xmin)/(xmax-xmin)*pw,y=P.t+ph-(p.y-ymin)/(ymax-ymin)*ph;
    g.fillStyle=colors[i%colors.length];g.beginPath();g.arc(x,y,6,0,Math.PI*2);g.fill();
    g.fillStyle="#172033";g.fillText(p.name,x+8,y-8);
  });
  g.fillStyle="#344054";g.fillText(xl,P.l+pw/2-40,H-5);
  g.save();g.translate(12,P.t+ph/2);g.rotate(-Math.PI/2);g.fillText(yl,0,0);g.restore();
}

saved();
