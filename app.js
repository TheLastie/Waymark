(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  const STORAGE_KEY = 'waymark-network-v1';
  const places = [
    { id: 'home', name: 'Дом у парка', x: 112, y: 438 },
    { id: 'square', name: 'Площадь двух фонтанов', x: 278, y: 330 },
    { id: 'clinic', name: 'Поликлиника № 2', x: 860, y: 154 },
    { id: 'library', name: 'Городская библиотека', x: 704, y: 420 },
    { id: 'crossing', name: 'Светофор на проспекте', x: 504, y: 266 },
    { id: 'market', name: 'Рынок у остановки', x: 392, y: 498 },
    { id: 'garden', name: 'Тихий сквер', x: 737, y: 282 },
    { id: 'bridge', name: 'Переход через ручей', x: 500, y: 522 }
  ];
  const baseEdges = [
    { id:'e1',a:'home',b:'square',km:.42,surface:'smooth',slope:2,curb:0,steps:false,crossing:'none',lit:true,verified:true,note:'' },
    { id:'e2',a:'square',b:'crossing',km:.38,surface:'pavers',slope:4,curb:4,steps:false,crossing:'marked',lit:true,verified:true,note:'' },
    { id:'e3',a:'crossing',b:'clinic',km:.71,surface:'rough',slope:9,curb:7,steps:false,crossing:'uncontrolled',lit:true,verified:false,note:'Краткий путь пересекает широкий въезд; переход стоит проверить на месте.' },
    { id:'e4',a:'square',b:'market',km:.46,surface:'rough',slope:8,curb:7,steps:false,crossing:'none',lit:false,verified:false,note:'Край тротуара требует проверки.' },
    { id:'e5',a:'market',b:'bridge',km:.34,surface:'smooth',slope:5,curb:2,steps:false,crossing:'marked',lit:false,verified:false,note:'' },
    { id:'e6',a:'bridge',b:'library',km:.58,surface:'smooth',slope:3,curb:0,steps:false,crossing:'signal',lit:true,verified:true,note:'' },
    { id:'e7',a:'library',b:'garden',km:.52,surface:'pavers',slope:5,curb:3,steps:false,crossing:'marked',lit:true,verified:true,note:'' },
    { id:'e8',a:'garden',b:'clinic',km:.39,surface:'smooth',slope:2,curb:0,steps:false,crossing:'none',lit:true,verified:true,note:'' },
    { id:'e9',a:'crossing',b:'garden',km:.45,surface:'smooth',slope:6,curb:5,steps:false,crossing:'uncontrolled',lit:true,verified:false,note:'Нерегулируемый переход у въезда во двор.' },
    { id:'e10',a:'square',b:'library',km:.08,surface:'gravel',slope:2,curb:0,steps:true,crossing:'none',lit:false,verified:true,note:'Короткая лестница через старый сад.' },
    { id:'e11',a:'home',b:'market',km:.91,surface:'smooth',slope:1,curb:0,steps:false,crossing:'signal',lit:true,verified:false,note:'' },
    { id:'e12',a:'market',b:'library',km:.79,surface:'pavers',slope:4,curb:0,steps:false,crossing:'marked',lit:true,verified:false,note:'' },
    { id:'e13',a:'square',b:'garden',km:.88,surface:'rough',slope:10,curb:9,steps:false,crossing:'none',lit:true,verified:false,note:'Крутой уклон на подъёме к скверу.' },
    { id:'e14',a:'bridge',b:'garden',km:.63,surface:'smooth',slope:2,curb:0,steps:false,crossing:'marked',lit:false,verified:true,note:'' },
    { id:'e15',a:'crossing',b:'library',km:.74,surface:'pavers',slope:3,curb:2,steps:false,crossing:'signal',lit:true,verified:true,note:'' },
    { id:'e16',a:'garden',b:'clinic',km:.48,surface:'gravel',slope:7,curb:4,steps:false,crossing:'none',lit:false,verified:false,note:'' }
  ];
  const profileNames = { wheelchair:'Кресло-коляска', walker:'Опора / ходунки', stroller:'Коляска с ребёнком', walking:'Пешком' };
  const issueText = (edge, profile) => {
    const out=[];
    if(edge.steps && profile!=='walking') out.push('ступени');
    if(edge.slope>=10) out.push(`уклон ${edge.slope}%`);
    if(edge.curb>=5) out.push(`бордюр ${edge.curb} см`);
    if(edge.crossing==='uncontrolled') out.push('переход без светофора');
    if(!edge.verified) out.push('данные не проверены');
    if(edge.note) out.push(edge.note);
    return out;
  };

  let edges = loadNetwork();
  let selectedEdge = null;
  let chosenMode = 'balanced';
  let lastRoutes = {};
  const nodesById = Object.fromEntries(places.map(p=>[p.id,p]));

  function loadNetwork(){
    try{ const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(Array.isArray(saved) && saved.length===baseEdges.length) return saved; }catch{}
    return structuredClone(baseEdges);
  }
  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(edges)); }
  function esc(value){ return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function svg(tag, attrs={}){ const el=document.createElementNS(svgNS,tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v); return el; }
  function initPlaces(){
    for(const id of ['startSelect','endSelect']){
      const select=$(id); select.innerHTML=places.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    }
    $('startSelect').value='home'; $('endSelect').value='clinic';
  }
  function profile(){ return document.querySelector('input[name="profile"]:checked')?.value || 'wheelchair'; }
  function eligible(edge,p){
    if(p==='wheelchair' && edge.steps) return false;
    if(p==='wheelchair' && edge.slope>14) return false;
    if(p==='walker' && edge.steps) return false;
    if(p==='stroller' && edge.steps) return false;
    return true;
  }
  function penalty(edge,mode,p){
    let n=0;
    if(edge.surface==='rough') n+=p==='wheelchair'?1.6:.7;
    if(edge.surface==='gravel') n+=p==='wheelchair'?1.25:.55;
    n+=edge.slope*(p==='wheelchair'?.025:.012);
    n+=edge.curb*(p==='wheelchair'?.09:.025);
    if(edge.crossing==='uncontrolled') n+=p==='wheelchair'?.85:.35;
    if(!edge.lit) n+=.18;
    if(!edge.verified) n+=mode==='verified'?3.2:mode==='balanced'?.48:.08;
    if(edge.steps && p==='walking') n+=.25;
    return n;
  }
  function findRoute(start,end,mode,p){
    const dist=Object.fromEntries(places.map(n=>[n.id,Infinity]));
    const prev={}; const done=new Set(); dist[start]=0;
    while(done.size<places.length){
      let at=null, best=Infinity;
      for(const id of Object.keys(dist)) if(!done.has(id)&&dist[id]<best){at=id;best=dist[id];}
      if(at===null||at===end) break;
      done.add(at);
      for(const edge of edges){
        if(!eligible(edge,p)||edge.a!==at&&edge.b!==at) continue;
        const to=edge.a===at?edge.b:edge.a;
        const weight=edge.km+(mode==='short'?0:penalty(edge,mode,p));
        if(dist[to]>best+weight){dist[to]=best+weight;prev[to]={id:at,edge};}
      }
    }
    if(!Number.isFinite(dist[end])) return null;
    const route=[]; let cursor=end;
    while(cursor!==start){const step=prev[cursor]; if(!step)return null;route.unshift(step.edge);cursor=step.id;}
    return {edges:route, nodes:[start,...route.map(e=>e.a===cursor?e.b:(e.a===start?e.b:e.a))], km:route.reduce((sum,e)=>sum+e.km,0), cost:dist[end]};
  }
  function setStatus(text,kind='ok'){ $('routeStatus').textContent=text; $('routeStatusMark').style.background=kind==='warn'?'var(--amber)':kind==='bad'?'var(--coral)':'var(--green)'; }
  function refresh(){
    const p=profile(), start=$('startSelect').value, end=$('endSelect').value;
    lastRoutes={balanced:findRoute(start,end,'balanced',p),short:findRoute(start,end,'short',p),verified:findRoute(start,end,'verified',p)};
    const route=lastRoutes[chosenMode];
    renderMap(route,start,end);
    $('routeCount').textContent=`${Object.values(lastRoutes).filter(Boolean).length} / 3 варианта`;
    if(!route){setStatus('Путь не найден','bad');$('routeDistance').textContent='—';$('routeMinutes').textContent='';$('routeExplanation').textContent=`Для профиля «${profileNames[p]}» между этими местами нет подходящего пути. Попробуйте другой профиль или точки.`;$('barrierCount').textContent='0';$('unknownCount').textContent='0';renderIssues([]);return;}
    const pathIssues=route.edges.flatMap(e=>issueText(e,p));
    const barriers=route.edges.filter(e=>e.steps||e.slope>=10||e.curb>=5||e.crossing==='uncontrolled').length;
    const unknown=route.edges.filter(e=>!e.verified).length;
    $('routeDistance').textContent=route.km.toFixed(2);
    $('routeMinutes').textContent=`≈ ${Math.max(1,Math.round(route.km*13))} мин пешком`;
    $('barrierCount').textContent=String(barriers);
    $('unknownCount').textContent=String(unknown);
    const summaries={balanced:'Учитывает состояние покрытия, уклон, бордюры и качество переходов. Непроверенные места получают дополнительный вес.',short:'Минимальная длина пути. Перед выходом посмотрите на бордюры и непроверенные участки вдоль линии.',verified:'Сильнее избегает участков без полевой проверки. Если данных мало, маршрут может стать длиннее.'};
    $('routeExplanation').textContent=summaries[chosenMode];
    setStatus(unknown?'Есть непроверенные места':'Все участки подтверждены',unknown?'warn':'ok');
    renderIssues(route.edges);
  }
  function renderMap(route,start,end){
    const street=$('streetLayer'), routeLayer=$('routeLayer'), glow=$('routeGlowLayer'), nodes=$('nodeLayer');
    street.replaceChildren();routeLayer.replaceChildren();glow.replaceChildren();nodes.replaceChildren();
    const routeSet=new Set((route?.edges||[]).map(e=>e.id));
    for(const edge of edges){
      const a=nodesById[edge.a],b=nodesById[edge.b];
      const group=svg('g');
      const d=`M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      const color=edge.steps?'var(--coral)':!edge.verified?'var(--amber)':'var(--green)';
      const line=svg('path',{d,class:'street-edge',stroke:color,'data-selected':String(edge.id===selectedEdge),'aria-hidden':'true'});
      const hit=svg('path',{d,class:'street-hit',tabindex:'0',role:'button','aria-label':`${a.name} — ${b.name}, ${edge.km.toFixed(2)} километра. ${edge.verified?'Проверено':'Нужна проверка'}`});
      hit.addEventListener('click',()=>selectEdge(edge.id));
      hit.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectEdge(edge.id);}});
      group.append(line,hit);street.append(group);
    }
    if(route){
      const d=route.edges.map((e,i)=>{const a=nodesById[e.a],b=nodesById[e.b];return `${i?'L':'M'} ${a.x} ${a.y} L ${b.x} ${b.y}`;}).join(' ');
      const shadow=svg('path',{d,class:'route-line',opacity:'.16',style:'stroke-width:17'});
      const path=svg('path',{d,class:`route-line ${chosenMode==='short'?'short':chosenMode==='verified'?'verified':''}`});
      glow.append(shadow);routeLayer.append(path);
    }
    for(const place of places){
      const state=place.id===start?'start':place.id===end?'end':'';
      const g=svg('g',{class:`map-node ${state}`,transform:`translate(${place.x} ${place.y})`});
      const c=svg('circle',{r:'15'});const t=svg('text',{y:'4','text-anchor':'middle'});t.textContent=place.id===start?'A':place.id===end?'B':'';
      const label=svg('text',{x:'19',y:'-17'});label.textContent=place.name;
      g.append(c,t,label);nodes.append(g);
    }
  }
  function renderIssues(pathEdges){
    const unique=new Map();
    for(const edge of edges){const issues=issueText(edge,profile()); if(issues.length) unique.set(edge.id,{edge,issues});}
    const items=[...unique.values()];
    $('noteTotal').textContent=String(items.length);
    $('emptyIssues').hidden=items.length>0;
    $('issueList').innerHTML=items.slice(0,6).map(({edge,issues})=>{
      const a=nodesById[edge.a],b=nodesById[edge.b],onPath=pathEdges.some(e=>e.id===edge.id);
      return `<button class="issue-item" type="button" data-edge="${edge.id}" aria-label="Участок ${esc(a.name)} — ${esc(b.name)}. ${esc(issues.join(', '))}"><i></i><span><b>${esc(a.name)} — ${esc(b.name)}</b><br>${esc(issues.join(' · '))}</span><small>${onPath?'В ПУТИ':'ОТМЕТКА'}</small></button>`;
    }).join('');
    $('issueList').querySelectorAll('[data-edge]').forEach(b=>b.addEventListener('click',()=>selectEdge(b.dataset.edge)));
  }
  function selectEdge(id){
    selectedEdge=id;const edge=edges.find(e=>e.id===id);if(!edge)return;
    $('inspectorTitle').textContent=`${nodesById[edge.a].name} — ${nodesById[edge.b].name}`;
    $('segmentState').textContent=edge.verified?'ЗАПИСЬ ПРОВЕРЕНА':'НУЖНА ПРОВЕРКА';
    $('inspectorIntro').textContent=`${edge.km.toFixed(2)} км · Укажите, что встретит человек на участке.`;
    $('surfaceInput').value=edge.surface;$('slopeInput').value=edge.slope;$('curbInput').value=edge.curb;
    $('stepsInput').checked=edge.steps;$('crossingInput').value=edge.crossing;$('litInput').checked=edge.lit;$('verifiedInput').checked=edge.verified;$('noteInput').value=edge.note||'';
    $('inspectorForm').hidden=false;$('formFeedback').textContent='Изменения сохраняются только в этом браузере.';
    refresh();
  }
  function saveSelected(){
    if(!selectedEdge)return;const edge=edges.find(e=>e.id===selectedEdge);if(!edge)return;
    edge.surface=$('surfaceInput').value;edge.slope=Number($('slopeInput').value)||0;edge.curb=Number($('curbInput').value)||0;edge.steps=$('stepsInput').checked;edge.crossing=$('crossingInput').value;edge.lit=$('litInput').checked;edge.verified=$('verifiedInput').checked;edge.note=$('noteInput').value.trim();
    save();$('formFeedback').textContent='Участок обновлён. Отчёт готов к скачиванию.';refresh();
  }
  function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function report(){
    const p=profile(),route=lastRoutes[chosenMode];
    const payload={product:'Waymark',formatVersion:1,generatedAt:new Date().toISOString(),dataNotice:'Демонстрационная схема улиц. Не является официальной навигацией или проверенной картой доступности.',profile:p,from:nodesById[$('startSelect').value].name,to:nodesById[$('endSelect').value].name,routeMode:chosenMode,route:route?{distanceKm:Number(route.km.toFixed(2)),estimatedWalkingMinutes:Math.round(route.km*13),segments:route.edges.map(edgeRecord)}:null,observations:edges.filter(e=>issueText(e,p).length).map(edgeRecord)};
    download('waymark-route-report.json',JSON.stringify(payload,null,2),'application/json');
  }
  function edgeRecord(e){return {from:nodesById[e.a].name,to:nodesById[e.b].name,distanceKm:e.km,surface:e.surface,slopePercent:e.slope,curbCm:e.curb,steps:e.steps,crossing:e.crossing,lit:e.lit,fieldVerified:e.verified,note:e.note||''};}
  function csv(){const rows=[['Откуда','Куда','км','Покрытие','Уклон %','Бордюр см','Ступени','Переход','Освещение','Проверено','Заметка'],...edges.map(e=>[nodesById[e.a].name,nodesById[e.b].name,e.km,e.surface,e.slope,e.curb,e.steps?'да':'нет',e.crossing,e.lit?'да':'нет',e.verified?'да':'нет',e.note])];const quote=v=>`"${String(v).replaceAll('"','""')}"`;download('waymark-street-notes.csv','\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
  function exportNetwork(){download('waymark-local-map.json',JSON.stringify({product:'Waymark',formatVersion:1,illustrativeSample:true,places,edges},null,2),'application/json');}
  function importNetwork(file){const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result));const incoming=parsed.edges;if(!Array.isArray(incoming)||incoming.length!==baseEdges.length||incoming.some(e=>!baseEdges.some(b=>b.id===e.id)))throw new Error();edges=baseEdges.map(base=>({...base,...incoming.find(e=>e.id===base.id)}));save();refresh();$('appStatus').textContent='Карта загружена в этот браузер.';}catch{$('appStatus').textContent='Не удалось открыть файл карты. Выберите JSON, созданный Waymark.';}};reader.readAsText(file);}
  initPlaces();
  $('startSelect').addEventListener('change',refresh);$('endSelect').addEventListener('change',refresh);
  $('swapPoints').addEventListener('click',()=>{const start=$('startSelect').value;$('startSelect').value=$('endSelect').value;$('endSelect').value=start;refresh();});
  document.querySelectorAll('input[name="profile"]').forEach(el=>el.addEventListener('change',refresh));
  document.querySelectorAll('.route-tab').forEach(el=>el.addEventListener('click',()=>{chosenMode=el.dataset.mode;document.querySelectorAll('.route-tab').forEach(tab=>{const active=tab===el;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));});refresh();}));
  ['surfaceInput','slopeInput','curbInput','stepsInput','crossingInput','litInput','verifiedInput','noteInput'].forEach(id=>$(id).addEventListener('input',saveSelected));
  $('resetMap').addEventListener('click',()=>{edges=structuredClone(baseEdges);selectedEdge=null;localStorage.removeItem(STORAGE_KEY);$('inspectorForm').hidden=true;$('inspectorTitle').textContent='Нажмите линию на карте';$('segmentState').textContent='';refresh();$('appStatus').textContent='Вернули демонстрационную схему.';});
  $('exportReport').addEventListener('click',report);$('exportNetwork').addEventListener('click',exportNetwork);$('exportCsv').addEventListener('click',csv);
  $('networkFile').addEventListener('change',ev=>{if(ev.target.files[0])importNetwork(ev.target.files[0]);ev.target.value='';});
  refresh();
})();
