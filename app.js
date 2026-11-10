(function(){
const {P,MV,MP,EVO,AB,TN,FORMS}=JB;
const SH='https://play.pokemonshowdown.com/sprites/',PA='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/';
const SL=['HP','Atk','Def','SpA','SpD','Spe'],SC=['hp','atk','def','spa','spd','spe'];
const GR=[[1,151],[152,251],[252,386],[387,493],[494,649]],GN=['All','Gen I','Gen II','Gen III','Gen IV','Gen V'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=t=>t.replace(/^\*/,'').replace(/'/g,'’');
const nrm=s=>s.toLowerCase().replace(/\[.*?\]|\(.*?\)/g,'').replace(/[^a-z]/g,'');
const byN={},byS={};P.forEach(e=>{byN[e.n]=e;byS[e.s]=e});
// ---------- derived data
P.forEach(e=>{const g=e.st[0]||{},c=g.u||g.b||g.v||[];e.cur=c;e.bst=c.reduce((a,b)=>a+b,0);e.dl=g.v&&g.u?g.u.map((x,i)=>x-g.v[i]):[];
 e.types=[...e.t].map(c=>TN[c]);
 e.hay=(e.name+' #'+e.n+' '+e.types.join(' ')+' '+e.ab.map(a=>a.text).join(' ')+' '+e.ls.flatMap(l=>l.mv.map(m=>m[1])).join('|')).toLowerCase();
 e.chg=e.st.some(x=>x.u&&!(x.v&&x.v.join()==x.u.join()));e.tmf=e.tm.length>0;e.abf=e.ab.some(a=>a.text.includes('*'))});
const kids={},pred={};EVO.forEach(([f,t,m,mod,old])=>{(kids[f]=kids[f]||[]).push([t,m,mod,old]);pred[t]=f});
// ---------- sprites & pills
function img(e,big,sp){const id=sp||e.sp;const a=big?`${SH}gen5ani/${id}.gif`:`${SH}gen5/${id}.png`,b=big?`${PA}animated/${e.n}.gif`:`${PA}${e.n}.png`;
 return `<img class="${big?'big':'th'}" ${big?'':'loading="lazy"'} src="${a}" data-alt="${b}" alt="${esc(e.name)}" onerror="imgErr(this)">`}
window.imgErr=i=>{if(i.dataset.alt){i.src=i.dataset.alt;i.dataset.alt=''}else i.style.visibility='hidden'};
const pills=t=>[...t].map(c=>`<span class="ty ty-${TN[c]}">${TN[c]}</span>`).join('');
// ---------- moves
const pwr=x=>x==='var'?'var':x==null?'—':x;
const arrow=s=>{const m=s.split(' → ');return m.length>1?`${esc(m[0])} → <b>${esc(m[1])}</b>`:esc(s)};
function pw(raw){const ids=MP[raw.replace(/\*/g,'').trim()];if(!ids)return{h:'',d:'',c:0};const h=[],d=[];let c=0;
 ids.forEach(i=>{const m=MV[i],pre=ids.length>1?`<b>${esc(m.n)}:</b> `:'';
  if(m.new)h.push(`<span class="pw new">${m.u}<i>NEW</i></span>`);
  else if(m.u!=null&&m.u!==m.p){c=1;h.push(`<span class="pw ch"><s>${pwr(m.p)}</s><b>${m.u}</b></span>`)}else h.push(`<span class="pw">${pwr(m.p)}</span>`);
  const chips=(m.ch||[]).map(x=>`<span class="mc">${arrow(x)}</span>`).join('');
  if(m.ch||m.e)c=1;
  const t=chips+(m.e?esc(m.e):'')+(m.new?`<span class="rp">Replaces ${esc(m.r)}</span>`:'');
  if(t)d.push(pre+t)});
 return{h:h.join('<span class="pw"> / </span>'),d:d.length?`<small class="dt">${d.join('<br>')}</small>`:'',c}}
let Q='';
const hl=s=>{const t=s.toLowerCase(),i=Q.length>1?t.indexOf(Q):-1;return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+Q.length))+'</mark>'+esc(s.slice(i+Q.length))};
const mli=m=>{const p=pw(m[1]);return `<li class="${p.c?'chg':''}"><b>${m[0]}</b><span class="mn">${hl(m[1])}${p.d}</span>${p.h}</li>`};
// ---------- list view
const S={gen:0,type:'',chg:0,tm:0,ab:0,q:'',scroll:0};
function listHTML(){const r=P.filter(e=>(!S.gen||e.n>=GR[S.gen-1][0]&&e.n<=GR[S.gen-1][1])&&(!S.type||e.types.includes(S.type))&&(!S.chg||e.chg)&&(!S.tm||e.tmf)&&(!S.ab||e.abf)&&(!S.q||e.hay.includes(S.q)));
 return {n:r.length,h:r.length?r.map(e=>{const hit=S.q&&!e.name.toLowerCase().includes(S.q)&&S.q[0]!='#'?(e.ls.flatMap(l=>l.mv).find(m=>m[1].toLowerCase().includes(S.q))||null):null;
  return `<a class="row" href="#${e.s}">${img(e)}<span><span class="no">#${String(e.n).padStart(3,'0')}</span> <span class="nm">${esc(e.name)}</span><span>${pills(e.t)}</span>${hit?`<span class="hit">Lv ${hit[0]} · ${esc(hit[1].replace('*',''))}</span>`:''}</span>
  <span class="mini">${e.cur.map((x,i)=>`<i class="${e.dl[i]?'c':''}" title="${SL[i]}">${x}</i>`).join('')}</span></a>`}).join(''):'<div class="empty">No Pokémon match those filters.</div>'}}
function showList(){const app=document.getElementById('app');document.title='Pokémon JetBlack — Pokédex';
 app.innerHTML=`<div style="padding:22px 0 6px"><h1>Pokédex</h1><p class="sub" style="color:var(--mut);margin:4px 0 0">Stats, abilities, evolutions and learnsets for all 649 Pokémon in JetBlack</p></div>
 <div class="tools"><input id="q" type="search" placeholder="Search a Pokémon, #number, type, ability or move…" autocomplete="off" value="${esc(S.q)}"><div class="chips" id="chips">${GN.map((n,i)=>`<button class="chip${S.gen==i?' on':''}" data-g="${i}">${n}</button>`).join('')}
 <select id="ty"><option value="">All types</option>${Object.values(TN).map(t=>`<option${S.type==t?' selected':''}>${t}</option>`).join('')}</select>
 ${[['chg','Stat changes'],['tm','TM changes'],['ab','Ability changes']].map(([k,n])=>`<button class="chip${S[k]?' on':''}" data-f="${k}">${n}</button>`).join('')}<span id="cnt"></span></div></div><div id="list"></div>`;
 const draw=()=>{Q=S.q;const r=listHTML();document.getElementById('list').innerHTML=r.h;document.getElementById('cnt').textContent=r.n+' shown'};draw();
 let t;document.getElementById('q').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{S.q=e.target.value.trim().toLowerCase();draw()},120)};
 document.getElementById('ty').onchange=e=>{S.type=e.target.value;draw()};
 document.getElementById('chips').onclick=ev=>{const b=ev.target.closest('.chip');if(!b)return;if(b.dataset.g!==undefined){S.gen=+b.dataset.g;document.querySelectorAll('[data-g]').forEach(x=>x.classList.toggle('on',x==b))}else{S[b.dataset.f]^=1;b.classList.toggle('on')}draw()};
 window.scrollTo(0,S.scroll||0)}
// ---------- detail view
const rx=f=>new RegExp(f.r,'i');
const pick=(arr,f)=>{if(!f)return arr;const r=arr.filter(x=>!x.label||rx(f).test(x.label));return r.length?r:arr};
function abilitiesH(e,f){const by={};pick(e.ab,f).forEach(a=>(by[a.label||'']=by[a.label||'']||[]).push(a.text));
 const h=Object.entries(by).map(([l,xs])=>(l?`<div class="form">${esc(l)}</div>`:'')+xs.flatMap(x=>x.split('/')).map(x=>{const s=x.includes('*'),n=x.replace(/\*/g,'').replace(/\[.*?\]/g,'').trim(),d=AB[nrm(n)];
  return `<div class="ab"><b>${esc(n)}</b>${s?'<span class="star">★ Made standard</span>':''}<p>${d?esc(d):''}</p></div>`}).join('')).join('');
 const nt=e.abn.filter(t=>t!='No change'&&!/is now a standard ability/i.test(t)).map(t=>`<div class="note">${esc(clean(t))}</div>`).join('');
 const std=e.abn.filter(t=>/is now a standard ability/i.test(t)).map(t=>`<div class="note">${esc(clean(t))}</div>`).join('');
 return h+std+nt}
function statsH(e,f){let gs=e.st;if(f){const m=e.st.filter(g=>g.label&&rx(f).test(g.label));if(m.length)gs=m}
 return gs.map(g=>{const cur=g.u||g.b||g.v;let h=g.label&&gs.length>1?`<div class="form">${esc(g.label)}</div>`:'';if(!cur)return h;
  h+=cur.map((x,i)=>{const dv=g.v&&g.u?x-g.v[i]:0;return `<div class="sr"><span class="sl">${SL[i]}</span><span class="sv">${x}</span><span class="tr"><b style="width:${Math.min(100,x/180*100)}%;background:var(--${SC[i]})"></b></span><span class="d ${dv>0?'u':'n'}">${dv?(dv>0?'+':'')+dv:''}</span></div>`}).join('');
  h+=`<div class="tot">Total ${cur.reduce((a,b)=>a+b,0)}${g.v&&g.u?` <small>(vanilla ${g.v.reduce((a,b)=>a+b,0)})</small>`:''}${g.nc?' · Unchanged':''}</div>`;
  if(g.ulabel)h+=`<div class="note">Updated values shown for: ${esc(g.ulabel)}</div>`;
  if(g.diff&&!(g.v&&g.u))h+=`<div class="note">${esc(g.diff)}</div>`;
  return h+(g.note||[]).map(t=>`<div class="note">${esc(clean(t))}</div>`).join('')}).join('')}
function evoCard(n,cur){const e=byN[n];return `<a class="ec${n==cur?' cur':''}" href="#${e.s}">${img(e)}<span class="no">#${String(e.n).padStart(3,'0')}</span><span class="nm">${esc(e.name)}</span><span>${pills(e.t)}</span></a>`}
function evoTree(n,cur){const k=kids[n]||[];return `<div class="en">${evoCard(n,cur)}${k.length?`<div class="ek">${k.map(([t,m,mod,old])=>`<div class="eb"><div class="ea"><span>→</span><small>${esc(m)}${mod?`<i>JetBlack change</i><s>Vanilla: ${esc(old)}</s>`:''}</small></div>${evoTree(t,cur)}</div>`).join('')}</div>`:''}</div>`}
function evoH(e){let r=e.n;while(pred[r])r=pred[r];return (kids[r]||[]).length?`<div class="evo">${evoTree(r,e.n)}</div>`:'<div class="note">This Pokémon does not evolve.</div>'}
function tmH(e){return e.tm.map(t=>{const m=t.match(/(TM|HM)\s*(\d+)\s+(.+?)\s+via\s+(?:TM|HM)\s*(?:\((.+?)\))?/i);return m?`<div class="tm"><b>${m[1].toUpperCase()}${m[2]}</b><span>${esc(m[3])}</span>${pw(m[3]).h}${m[4]?`<em>${esc(m[4])}</em>`:''}</div>`:`<div class="note">${esc(t)}</div>`}).join('')}
function learnH(e,f){return pick(e.ls,f).map(l=>(l.label?`<div class="form">${esc(l.label)}</div>`:'')+l.notes.map(t=>`<div class="note">${esc(t)}</div>`).join('')+`<ul class="mv">${l.mv.map(mli).join('')}</ul>`).join('')}
function detailHTML(e,fi){const fs=FORMS[e.n],f=fs?fs[fi||0]:null,ty=f?f.t:e.t,sp=f?f.sp:null,pv=byN[e.n-1],nx=byN[e.n+1];
 const tabs=fs?`<div class="tabs">${fs.map((x,i)=>`<button class="chip${i==(fi||0)?' on':''}" data-f="${i}">${esc(x.l)}</button>`).join('')}</div>`:'';
 const st=statsH(e,f),bst=(()=>{const gs=f?e.st.filter(g=>g.label&&rx(f).test(g.label)):e.st;const g=(gs[0]||e.st[0])||{},c=g.u||g.b||g.v;return c?c.reduce((a,b)=>a+b,0):null})();
 return `<div class="nav"><a href="#">← All Pokémon</a><span>${pv?`<a href="#${pv.s}">‹ #${pv.n} ${esc(pv.name)}</a>`:''}${pv&&nx?' &nbsp;·&nbsp; ':''}${nx?`<a href="#${nx.s}">#${nx.n} ${esc(nx.name)} ›</a>`:''}</span></div>
 <section class="hero"><div class="pic">${img(e,1,sp)}</div><div><div class="no">#${String(e.n).padStart(3,'0')}</div><h1>${esc(e.name)}</h1><div class="pills">${pills(ty)}</div>${bst?`<div class="note">Base stat total: <b style="color:var(--ink)">${bst}</b></div>`:''}${tabs}</div></section>
 <section class="card"><h2>Abilities</h2>${abilitiesH(e,f)||'<div class="note">No ability data.</div>'}</section>
 <section class="card"><h2>Base stats</h2>${st||'<div class="note">No stat data.</div>'}</section>
 <section class="card"><h2>Evolution</h2>${evoH(e)}</section>
 ${e.tm.length?`<section class="card"><h2>TM / HM changes</h2>${tmH(e)}</section>`:''}
 ${e.notes.length?`<section class="card"><h2>Notes</h2>${e.notes.map(t=>`<div class="note">${esc(clean(t))}</div>`).join('')}</section>`:''}
 <section class="card"><h2>Level-up learnset</h2><div class="leg">Power: <s>vanilla</s> → JetBlack · highlighted rows were changed · NEW = added from a later generation</div>${learnH(e,f)||'<div class="note">No learnset listed.</div>'}</section>`}
let cur=null,fi=0;
function showDetail(e){S.scroll=S.scroll;cur=e;fi=0;Q='';const app=document.getElementById('app');document.title=e.name+' — Pokémon JetBlack';
 const draw=()=>{app.innerHTML=detailHTML(e,fi);app.querySelectorAll('.tabs [data-f]').forEach(b=>b.onclick=()=>{fi=+b.dataset.f;draw()})};draw();window.scrollTo(0,0)}
function route(){const h=decodeURIComponent(location.hash.slice(1)).toLowerCase();const e=byS[h]||(/^\d+$/.test(h)&&byN[+h]);if(e)showDetail(e);else showList()}
window.addEventListener('hashchange',()=>{if(!location.hash||location.hash=='#')route();else{if(document.getElementById('list'))S.scroll=window.scrollY;route()}});
document.getElementById('theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=d=='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('jb-theme',n)}catch(e){}};
window.JBtest={detailHTML,listHTML,byS,byN,P,pw};
route();
})();
