// Areas section: wild Pokémon, static encounters, items and marts grouped by location.
// Built at runtime from loc.js (which comes from the JetBlack location and item docs).
(function(){
const L=window.JBL;if(!L)return;
const X=()=>window.JBX;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>s.toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'');
const slug=s=>s.toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const ALIAS={challengerscave:'challengerscave',innerpinwheelforest:'pinwheelforest',driftveilmarket:'driftveilcity',trialchamber:'victoryroad',dreamyardbasement:'dreamyard'};
const first=s=>s.split(' · ')[0].split(' - ')[0].replace(/\(.*?\)/g,'').replace(/\*/g,'').replace(/[:.]+$/,'').trim();
const G={},order=[];
function grp(raw){const n=first(raw),k0=norm(n),k=ALIAS[k0]||k0;
 if(!G[k]){G[k]={k,slug:slug(n),name:n,subs:[],mons:new Set(),items:[],marts:[],stat:[],tr:[],post:true,wild:false};order.push(k)}return G[k]}
// wild encounters, in game order
const AG=L.A.map(a=>grp(a));
Object.entries(L.R).forEach(([n,rows])=>rows.forEach(r=>{const g=AG[r[0]];g.wild=true;g.mons.add(+n);if(!r[7])g.post=false;if(!g.subs.includes(r[0]))g.subs.push(r[0])}));
// items
(L.I||[]).forEach(o=>{const g=grp(o.w),rest=o.w.split(' - ').slice(1).join(' - ');
 g.items.push({i:o.i,k:o.k,n:[rest&&(o.w.startsWith('Inner ')?'':rest),o.w.startsWith('Inner ')?'Inner part':'',o.n].filter(Boolean).join(' · ')})});
Object.entries(L.M||{}).forEach(([c,list])=>{const g=grp(c),rest=c.split(' - ').slice(1).join(' · ');g.marts.push({label:/^Herb Vendor/.test(rest)?'Driftveil Market · '+rest:rest,list})});
// static encounters
Object.entries(L.S||{}).forEach(([n,s])=>{const t=(s.t[0]||'');if(/^Breed /i.test(t))return;const g=grp(t.replace(/\s+-\s+Unchanged.*$/i,'').replace(/\*+$/,''));
 const extra=s.t.slice(1).map(x=>x.replace(/^[-*]+\s*/,''));if(/^Unchanged/i.test(t.split(' - ')[1]||''))extra.unshift('Unchanged from vanilla');
 g.stat.push({n:+n,lvl:s.lvl,t:extra})});
// trainers (from the JetBlack trainer roster doc)
function secGroup(n){const s=n.replace(/\s+B?\d+F$/,''),fl=n.slice(s.length).trim();
 const m=s.match(/^(Striaton|Nacrene|Castelia|Nimbasa|Driftveil|Mistralton|Iccirus|Opelucid) Gym$/);if(m)return [m[1]+' City','Gym'];
 if(/^Castelia - Route 4/.test(s))return ['Route 4','Tunnel from Castelia'];
 if(/Big Stadium|Small court|Stadium Additional/i.test(s))return ['Big Stadium and Small Court',/^Post Game/i.test(s)?'Post-game':/Additional/.test(s)?'Additional trainers':''];
 if(/^Shopping Dis/i.test(s))return ['Shopping Mall Nine',''];
 if(/^Pokemon League Rematches/.test(s))return ['Pokemon League','Rematches'];
 const p=s.split(' - ');return [p[0],[p.slice(1).join(' - '),fl].filter(Boolean).join(' · ')]}
const TR=window.JBT;
if(TR)TR.S.forEach(sec=>{
 if(sec.n=='New Trainer Battles'){sec.T.forEach(t=>{const loc=((t.x||'').match(/Location:\s*([^·]+)/)||[])[1];const g=grp(loc?loc.trim():sec.n);g.tr.push({sub:'New trainer battle'+(t.s?` (${t.s})`:''),notes:[],T:[t]})});return}
 const [gn,sub]=secGroup(sec.n);grp(gn).tr.push({sub,notes:sec.notes,T:sec.T})});
// order: wild areas in game order, then the rest alphabetically
order.forEach(k=>G[k].subs.sort((a,b)=>a-b));
const wildOrder=[];AG.forEach(g=>{if(!wildOrder.includes(g))wildOrder.push(g)});
const rest=order.map(k=>G[k]).filter(g=>!g.wild).sort((a,b)=>a.name.localeCompare(b.name));
const LIST=[...wildOrder,...rest];LIST.forEach(g=>{if(!g.wild)g.post=false});
const BYSLUG={};LIST.forEach(g=>BYSLUG[g.slug]=g);
const href=i=>'#area/'+AG[i].slug;
const SPOT={'Grass':'Rustling grass','Dark grass':'Rustling grass','Surfing':'Rippling water','Fishing':'Rippling water','Land':'Dust cloud','Sand':'Dust cloud'};
const MO=['Grass','Dark grass','Land','Sand','Surfing','Fishing'];
const lv=(a,b)=>a==b?`Lv ${a}`:`Lv ${a}–${b}`;
const S={q:'',f:''};

function hay(g){const x=X();return (g.name+' '+[...g.mons].map(n=>x.byN[n].name).join(' ')+' '+g.items.map(i=>i.i).join(' ')+' '+g.marts.flatMap(m=>m.list.map(l=>l[0])).join(' ')+' '+g.stat.map(s=>x.byN[s.n].name).join(' ')+' '+g.tr.flatMap(e=>e.T.map(t=>t.t+' '+t.G.flatMap(q=>q.M.map(m=>m[0]+' '+m[1])).join(' '))).join(' ')).toLowerCase()}
const HAY=new Map();
function listPage(){const app=document.getElementById('app');document.title='Areas — Pokémon JetBlack';
 app.innerHTML=`<div style="padding:22px 0 6px"><h1>Areas</h1><p class="sub" style="color:var(--mut);margin:4px 0 0">Wild Pokémon, static encounters, items and shops for every location, in game order</p></div>
 <div class="tools"><input id="aq" type="search" placeholder="Search an area, or a Pokémon or item to see where it is…" autocomplete="off" value="${esc(S.q)}">
 <div class="chips" id="af">${[['','All'],['wild','Wild Pokémon'],['tr','Trainers'],['items','Items'],['shop','Shops'],['post','Post-game']].map(([k,n])=>`<button class="chip${S.f==k?' on':''}" data-k="${k}">${n}</button>`).join('')}<span id="acnt"></span></div></div><div id="alist" class="agrid"></div>`;
 const draw=()=>{const q=S.q,r=LIST.filter(g=>{if(S.f=='wild'&&!g.wild)return false;if(S.f=='items'&&!g.items.length)return false;if(S.f=='tr'&&!g.tr.length)return false;if(S.f=='shop'&&!g.marts.length)return false;if(S.f=='post'&&!g.post)return false;
   if(q){if(!HAY.has(g))HAY.set(g,hay(g));return HAY.get(g).includes(q)}return true});
  document.getElementById('acnt').textContent=r.length+' shown';
  document.getElementById('alist').innerHTML=r.length?r.map(g=>{const nm=g.mons.size,hit=q&&!g.name.toLowerCase().includes(q);
   return `<a class="ac" href="#area/${g.slug}"><b>${esc(g.name)}</b>${g.post?'<i>Post-game</i>':''}<span class="am2">${[nm?nm+' Pokémon':'',g.stat.length?g.stat.length+' static':'',ntr(g)?ntr(g)+' trainer'+(ntr(g)>1?'s':''):'',g.items.length?g.items.length+' item'+(g.items.length>1?'s':''):'',g.marts.length?'Shop':''].filter(Boolean).join(' · ')||'—'}</span>${hit?`<span class="hit">matches “${esc(q)}”</span>`:''}</a>`}).join(''):'<div class="empty">No areas match.</div>'};
 draw();let t;document.getElementById('aq').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{S.q=e.target.value.trim().toLowerCase();draw()},120)};
 document.getElementById('af').onclick=ev=>{const b=ev.target.closest('.chip');if(!b)return;S.f=b.dataset.k;document.querySelectorAll('#af .chip').forEach(x=>x.classList.toggle('on',x==b));draw()};
 window.scrollTo(0,0)}

function monRow(e,r){const x=X(),[,m,lo,hi,p,s,n]=r;
 return `<a class="mrw${s?' sp':''}" href="#${e.s}">${x.img(e)}<span class="mn"><span class="no">#${String(e.n).padStart(3,'0')}</span> <b>${esc(e.name)}</b></span><span class="ll">${lv(lo,hi)}</span><span class="lp">${p}%</span><span class="ln">${s?`<b title="Only in ${SPOT[m].toLowerCase()}">★ ${SPOT[m]}</b>`:''}${n?`<em>${esc(n)}</em>`:''}</span></a>`}
function wildH(g){const x=X(),by={};
 g.subs.forEach(i=>{by[i]={}});
 Object.entries(L.R).forEach(([n,rows])=>rows.forEach(r=>{if(by[r[0]]){(by[r[0]][r[1]]=by[r[0]][r[1]]||[]).push([x.byN[n],r])}}));
 return g.subs.map(i=>{const full=L.A[i],sub=full.includes(' · ')?full.split(' · ').slice(1).join(' · '):full.includes(' - ')&&norm(full.split(' - ')[0])==norm(g.name)?full.split(' - ').slice(1).join(' - '):(norm(full)==norm(g.name)?'':full);
  const meths=Object.keys(by[i]).sort((a,b)=>MO.indexOf(a)-MO.indexOf(b));
  return `<div class="asub">${sub?`<h3>${esc(sub)}</h3>`:''}${meths.map(m=>`<div class="am3"><div class="mh2">${m}</div>${by[i][m].sort((p,q)=>p[1][5]-q[1][5]||q[1][4]-p[1][4]).map(([e,r])=>monRow(e,r)).join('')}</div>`).join('')}</div>`}).join('')}
function statH(g){const x=X();return g.stat.map(s=>{const e=x.byN[s.n];return `<a class="mrw" href="#${e.s}">${x.img(e)}<span class="mn"><span class="no">#${String(e.n).padStart(3,'0')}</span> <b>${esc(e.name)}</b></span><span class="ll">${s.lvl?'Lv '+s.lvl:''}</span><span class="lp"></span><span class="ln"><em>${s.t.map(esc).join(' · ')}</em></span></a>`}).join('')}
function itemsH(g){const by={};g.items.forEach(o=>(by[o.k]=by[o.k]||[]).push(o));
 return ['Ground item','Gift','Hidden item'].filter(k=>by[k]).map(k=>`<div class="am3"><div class="mh2">${k}${by[k].length>1?'s':''}</div>${by[k].map(o=>`<div class="irw"><b>${esc(o.i)}</b>${o.n?`<em>${esc(o.n)}</em>`:''}</div>`).join('')}</div>`).join('')}
function martsH(g){return g.marts.map(m=>`<div class="am3"><div class="mh2">${m.label?esc(m.label):'Second mart clerk'}</div><div class="stock">${m.list.map(([n,v])=>`<span class="chip2${v?' van':''}" title="${v?'Vanilla stock, unchanged':'Added or changed by JetBlack'}">${esc(n)}</span>`).join('')}</div></div>`).join('')+
 `<p class="note">Shaded items are vanilla stock. The others were added or changed by JetBlack. ${(L.MP||[]).map(esc).join('. ')}.</p>`}
const ntr=g=>g.tr.reduce((a,e)=>a+e.T.length,0);
const PKN=()=>{if(PKN.m)return PKN.m;const m={};X().P.forEach(e=>{m[norm(e.name)]=e});m.kangaskhan=X().byN[115];return PKN.m=m};
const pk=n=>PKN()[norm(n.replace(/-[A-Z]$/,''))];
function trainersH(g){const x=X();
 return g.tr.map(e=>`${e.sub?`<h3 class="tsub">${esc(e.sub)}</h3>`:''}${e.notes.map(n=>`<p class="note">${esc(n)}</p>`).join('')}<div class="tgrid">${e.T.map(t=>`<div class="tc${t.b?' boss':''}"><div class="th2"><b>${esc(t.t)}</b>${t.c?`<span class="tcnd">${esc(t.c)}</span>`:''}${t.s&&!/^(Main Campaign|Post-Game)$/.test(t.s)?`<span class="tcnd">${esc(t.s)}</span>`:''}</div>${t.x?`<div class="note">${esc(t.x)}</div>`:''}
  ${t.G.map(q=>`${q.c?`<div class="mh2">${esc(q.c)}</div>`:''}${q.M.map(([nm,it,l,ab,mv])=>{const ps=nm.split('/').map(n=>[n,pk(n)]),e0=ps[0][1];
   return `<div class="tmr">${e0?x.img(e0):'<span></span>'}<div><div>${ps.map(([n,e])=>e?`<a href="#${e.s}"><b>${esc(n)}</b></a>`:`<b>${esc(n)}</b>`).join(' / ')} <span class="tl">${l?'Lv '+l:''}</span>${it?` <span class="ti">@ ${esc(it)}</span>`:''}</div>${ab||mv?`<div class="tmv">${ab?`<i>${esc(ab)}</i>`:''}${ab&&mv?' · ':''}${esc(mv)}</div>`:''}</div></div>`}).join('')}`).join('')}</div>`).join('')}</div>`).join('')}
function detailPage(g){const app=document.getElementById('app');document.title=g.name+' — Pokémon JetBlack';const i=LIST.indexOf(g),pv=LIST[i-1],nx=LIST[i+1];
 const ns=g.mons.size;
 app.innerHTML=`<div class="nav"><a href="#areas">← All areas</a><span>${pv?`<a href="#area/${pv.slug}">‹ ${esc(pv.name)}</a>`:''}${pv&&nx?' &nbsp;·&nbsp; ':''}${nx?`<a href="#area/${nx.slug}">${esc(nx.name)} ›</a>`:''}</span></div>
 <section class="hero" style="padding:20px 22px"><div><h1>${esc(g.name)}</h1><div class="note">${[ns?ns+' wild Pokémon':'',g.stat.length?g.stat.length+' static encounter'+(g.stat.length>1?'s':''):'',ntr(g)?ntr(g)+' trainer'+(ntr(g)>1?'s':''):'',g.items.length?g.items.length+' item'+(g.items.length>1?'s':''):'',g.marts.length?'shop':''].filter(Boolean).join(' · ')||'No encounters or items listed'}${g.post?' · Post-game':''}</div></div></section>
 ${g.wild?`<section class="card"><h2>Wild Pokémon</h2><div class="leg">★ = only found in rustling grass, rippling water or dust clouds (the special spots). Chance is out of that spot's own encounter table.</div>${wildH(g)}</section>`:''}
 ${g.stat.length?`<section class="card"><h2>Static encounters</h2>${statH(g)}</section>`:''}
 ${g.tr.length?`<section class="card"><h2>Trainers</h2><div class="leg">${esc((TR.N||[])[0]||'')} Bold names are key battles.</div>${trainersH(g)}</section>`:''}
 ${g.items.length?`<section class="card"><h2>Items</h2><div class="leg">Only items JetBlack moved or changed are listed. Anything else is where it is in vanilla Black.</div>${itemsH(g)}</section>`:''}
 ${g.marts.length?`<section class="card"><h2>Shops</h2>${martsH(g)}</section>`:''}
 ${!g.wild&&!g.stat.length&&!g.tr.length&&!g.items.length&&!g.marts.length?'<section class="card"><div class="note">Nothing listed for this area.</div></section>':''}`;
 window.scrollTo(0,0)}

window.JBArea={href,
 route(h){const on=/^areas?($|\/)/.test(h);document.querySelectorAll('.tnav a').forEach(a=>a.classList.toggle('on',a.dataset.t==(on?'a':'p')));
  if(!on)return false;
  if(h=='areas'||h=='area'||h=='area/')listPage();
  else{const g=BYSLUG[h.slice(5).replace(/\/$/,'')];if(g)detailPage(g);else listPage()}
  return true},
 groups:LIST};
})();
