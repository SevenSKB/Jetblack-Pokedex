// "Ask the Dex": a rule-based helper that answers only from the JetBlack data on this site.
// It never generates text on its own: every answer is assembled from data.js / loc.js.
(function(){
const X=window.JBX;if(!X)return;
const {P,MV,MP,EVO,AB,TN,FORMS,LC,byN,kids,pred,natureOf,mult,ORD,AN,NL,SL,esc,pick}=X;
const N=s=>String(s).toLowerCase().replace(/♀/g,' f').replace(/♂/g,' m').replace(/['’.]/g,'').replace(/é/g,'e');
const K=s=>N(s).replace(/[^a-z0-9]/g,'');
const link=e=>`<a href="#${e.s}">${esc(e.name)}</a>`;
const lv=(a,b)=>a==b?`Lv ${a}`:`Lv ${a}–${b}`;
const SPOT={'Grass':'rustling grass','Dark grass':'rustling grass','Surfing':'rippling water','Fishing':'rippling water','Land':'dust cloud','Sand':'dust cloud'};
const TYN=Object.fromEntries(Object.entries(TN).map(([k,v])=>[v.toLowerCase(),k]));

// ---------- indexes
const PK={},MOVE={},ABIL={},AREA={},ITEM={};
P.forEach(e=>{PK[K(e.name)]=e});
PK.kangaskhan=byN[115];PK.nidoranfemale=byN[29];PK.nidoranmale=byN[32];PK.mrmime=byN[122];
Object.keys(MP).forEach(m=>{MOVE[K(m)]=m});
const MSTOP=new Set(['return','round','present','charge','rest','wish','block','attract','growth','struggle','endure','assist','disable','transform','conversion','snatch','spite','protect','reflect','trick','teleport','swagger','camouflage','facade','memento','mimic','captivate','covet','embargo','recycle','refresh','retaliate','revenge','safeguard','punishment','frustration','torment','imprison','ingrain','grudge','feint','flail','bounce','acupressure','pluck','switcheroo','sketch','thief']);
P.forEach(e=>e.ab.forEach(a=>a.text.split('/').forEach(x=>{const n=x.replace(/\*/g,'').replace(/\[.*?\]/g,'').trim();if(n)ABIL[K(n)]=n})));
const AREAN={};LC.A.forEach((a,i)=>{const base=a.split(' · ')[0];[a,base,base.split(' - ')[0]].forEach(k=>{const kk=K(k);(AREA[kk]=AREA[kk]||new Set()).add(i);AREAN[kk]=AREAN[kk]||k})});
// distinctive one-word area names ("lostlorn", "pinwheel") also count
LC.A.forEach((a,i)=>{const w=K(a.split(' ')[0]);if(/^(lostlorn|pinwheel|dreamyard|wellspring|chargestone|mistralton|celestial|dragonspiral|challengers|undella|driftveil|relic|iccirus|striaton|victory|marvellous)$/.test(w)){(AREA[w]=AREA[w]||new Set()).add(i);AREAN[w]=AREAN[w]||a.split(' ')[0]}});
(LC.I||[]).forEach(o=>{ITEM[K(o.i)]=o.i});Object.values(LC.M||{}).forEach(l=>l.forEach(([n])=>{ITEM[K(n)]=n}));
// abilities that are also move names (e.g. Damp is not, but "Pressure" vs nothing) are resolved by intent below

const STOP=new Set('where what which when does learn learns level nature natures best stats stat find catch evolve evolves evolution ability abilities weak weakness moves move route type types this that with from have about there their would could should pokemon show tell good base speed attack defense special list give info into many much most more than what whats where wheres whos tells the and for can get got does doing best area areas wild found location locations encounter encounters spawn spawns rate rates chance chances percent item items buy sell mart shop much price learnset moveset movepool who hello hey thanks thank help please know knows grass grasses rustling shaking dust cloud clouds surf surfing fish fishing water dark rod spot spots special'.split(' '));
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return d[b.length]}

function parse(q){const toks=N(q).split(/[^a-z0-9]+/).filter(Boolean),used=new Array(toks.length).fill(false);
 const r={pk:[],mv:[],ab:[],area:[],item:[],type:[],fuzzy:[]};
 const add=(arr,v)=>{if(!arr.includes(v))arr.push(v)};
 for(let n=4;n>=1;n--)for(let i=0;i+n<=toks.length;i++){if(used.slice(i,i+n).some(Boolean))continue;const k=toks.slice(i,i+n).join('');let hit=false;
  if(PK[k]){add(r.pk,PK[k]);hit=true}
  if(MOVE[k]&&!(n==1&&MSTOP.has(k)&&!/^(learn|learns|know|knows|teach|use|uses|move|tm|hm)$/.test(toks[i-1]||''))){add(r.mv,MOVE[k]);hit=true}
  if(ABIL[k]&&!(n==1&&STOP.has(k))){add(r.ab,ABIL[k]);hit=true}
  if(AREA[k]&&(n>1||!/^(route|city|cave|forest|tower|bridge|town|bay)$/.test(k))){add(r.area,k);hit=true}
  if(ITEM[k]&&!(n==1&&MSTOP.has(k))){add(r.item,ITEM[k]);hit=true}
  if(n==1&&TYN[k]){add(r.type,TYN[k])}
  if(hit)for(let j=i;j<i+n;j++)used[j]=true}
 // TM/HM numbers ("tm13", "tm 13") map to the moved TM items
 toks.forEach((t,i)=>{const m=(t+(/^(tm|hm)$/.test(t)&&/^\d+$/.test(toks[i+1]||'')?toks[i+1]:'')).match(/^(tm|hm)(\d+)$/);if(!m)return;
  const pre=m[1]+String(+m[2]).padStart(2,'0');Object.keys(ITEM).filter(k=>k.startsWith(pre)).forEach(k=>add(r.item,ITEM[k]));used[i]=true});
 // typo tolerance. Never on common English words, never on names with numbers (Route 4 vs Route 14).
 const fz=(dict,minLen,maxN,onHit,skip)=>{for(let n=maxN;n>=1;n--)for(let i=0;i+n<=toks.length;i++){
  const sp=toks.slice(i,i+n);if(used.slice(i,i+n).some(Boolean)||sp.some(t=>STOP.has(t)||/\d/.test(t)))continue;const t=sp.join('');if(t.length<minLen)continue;
  let best=null,bd=9;for(const k in dict){if(k[0]!=t[0]||/\d/.test(k)||(skip&&skip(k)))continue;const d=lev(t,k),lim=t.length>=10?2:1;if(d<=lim&&d<bd){bd=d;best=k}}
  if(best){onHit(best,t);for(let j=i;j<i+n;j++)used[j]=true}}};
 fz(AREA,6,4,(k,t)=>{add(r.area,k);r.fuzzy.push([t,AREAN[k]])});
 fz(PK,4,1,(k,t)=>{add(r.pk,PK[k]);r.fuzzy.push([t,PK[k].name])});
 fz(MOVE,7,3,(k,t)=>{add(r.mv,MOVE[k]);r.fuzzy.push([t,MOVE[k]])},k=>MSTOP.has(k));
 fz(ITEM,7,3,(k,t)=>{add(r.item,ITEM[k]);r.fuzzy.push([t,ITEM[k]])});
 return r}

// "rustling grass", "dark grass", "fishing" etc. narrow location answers
function spotFilter(q){const t=' '+N(q)+' ';let star=null,m=null;
 if(/\b(rustling|shaking|special spot|special grass)/.test(t)){star=1;m=['Grass','Dark grass']}
 else if(/\brippling/.test(t)){star=1;m=['Surfing','Fishing']}
 else if(/\bdust ?clouds?\b/.test(t)){star=1;m=['Land','Sand']}
 else if(/\bdark grass/.test(t))m=['Dark grass'];
 else if(/\b(surf|surfing)\b/.test(t))m=['Surfing'];
 else if(/\b(fish|fishing|rod)\b/.test(t))m=['Fishing'];
 else if(/\bgrass(es)?\b/.test(t))m=['Grass'];
 if(!m)return null;const label=star?`only ${m[0]=='Grass'?'rustling grass':m[0]=='Surfing'?'rippling water':'dust cloud'} encounters`:`only ${m.join('/')} encounters`;
 return {ok:r=>m.includes(r[1])&&(star==null||r[5]==star),label}}
// ---------- answer builders (all data-driven)
function locs(e,areaKeys,flt){let rows=(LC.R[e.n]||[]).filter(r=>!flt||flt.ok(r));
 if(areaKeys&&areaKeys.length){const ids=new Set(areaKeys.flatMap(k=>[...AREA[k]]));rows=rows.filter(r=>ids.has(r[0]))}
 return rows}
function locH(e,areaKeys,flt){const rows=locs(e,areaKeys,flt),st=LC.S[e.n];let h=flt&&rows.length?`<p class="bm">Showing ${flt.label}.</p>`:'';
 if(rows.length){const g=[];rows.forEach(r=>{const l=g[g.length-1];if(l&&l.a==r[0])l.r.push(r);else g.push({a:r[0],r:[r]})});
  const show=g.slice(0,14);
  h+=`<ul>${show.map(x=>`<li><b>${esc(LC.A[x.a])}</b>${x.r[0][7]?' <i class="bp">post-game</i>':''}: ${x.r.map(r=>`${r[1]} ${lv(r[2],r[3])}, ${r[4]}%${r[5]?` <span class="bs">★ ${SPOT[r[1]]} only</span>`:''}${r[6]?` <span class="bm">(${esc(r[6])})</span>`:''}`).join('; ')}</li>`).join('')}</ul>`;
  if(g.length>show.length)h+=`<p class="bm">+${g.length-show.length} more areas on ${link(e)}'s page.</p>`}
 if(st&&!(areaKeys&&areaKeys.length))h+=`<p><b>Static encounter${st.lvl?` (Lv ${st.lvl})`:''}:</b> ${st.t.map(t=>esc(t.replace(/^[-*]+\s*/,''))).join(' ')}</p>`;
 if(!rows.length&&!(st&&!(areaKeys&&areaKeys.length))){if(flt)return `<p>${link(e)} has no listed ${flt.label.replace(/^only /,'')}${areaKeys&&areaKeys.length?' in that area':''}.</p>`;if(areaKeys&&areaKeys.length)return `<p>${link(e)} is not listed in that area in the JetBlack location list.</p>`;
  h=`<p>${link(e)} is not listed as a wild encounter in the JetBlack location list.</p>`;
  let p=pred[e.n],step=e.n;while(p){const r=LC.R[p]||[],m=(kids[p]||[]).find(k=>k[0]==step);
   if(r.length||LC.S[p]){const areas=[...new Set(r.map(x=>LC.A[x[0]]))];h+=`<p>It evolves from ${link(byN[p])}${m?` (${esc(m[1])})`:''}, which is found at: ${areas.slice(0,8).map(esc).join(', ')}${areas.length>8?` and ${areas.length-8} more`:''}.</p>`;break}
   step=p;p=pred[p]}}
 return h}
function natH(e){const n=natureOf(e,null);if(!n)return '';
 const f=x=>`<b>${x.n}</b> (+${NL[x.u]} −${NL[x.d]})`;
 return `<p>Suggested nature: ${f(n.a)}${n.b?`, or ${f(n.b)}`:''}. ${esc(n.why)}</p><p class="bm">This is the site's suggestion, worked out from JetBlack stats and level-up moves. The hack docs don't list natures.</p>`}
function statH(e){return e.st.map(g=>{const c=g.u||g.b||g.v;if(!c)return '';const t=c.reduce((a,b)=>a+b,0);
 return `<p>${g.label&&e.st.length>1?`<b>${esc(g.label)}</b>: `:''}${c.map((x,i)=>`${SL[i]} <b>${x}</b>`).join(' · ')} · Total <b>${t}</b>${g.v&&g.u?`<br><span class="bm">Vanilla: ${g.v.join(' / ')} (total ${g.v.reduce((a,b)=>a+b,0)})${g.diff?`. ${esc(g.diff)}`:''}</span>`:g.nc?' <span class="bm">(unchanged from vanilla)</span>':''}</p>`}).join('')}
function abH(e){const by={};e.ab.forEach(a=>(by[a.label||'']=by[a.label||'']||[]).push(a.text));
 return Object.entries(by).map(([l,xs])=>`<p>${l?`<b>${esc(l)}</b>: `:''}${xs.flatMap(x=>x.split('/')).map(x=>{const n=x.replace(/\*/g,'').replace(/\[.*?\]/g,'').trim(),d=AB[K(n)];return `<b>${esc(n)}</b>${x.includes('*')?' (made standard in JetBlack)':''}${d?`: ${esc(d)}`:''}`}).join('<br>')}</p>`).join('')}
function weakH(e){const tc=e.t,g={};[...ORD].forEach(a=>{const m=mult(a,tc);if(m!=1)(g[m]=g[m]||[]).push(TN[a])});
 const L=[[4,'4× weak'],[2,'2× weak'],[.5,'½ resist'],[.25,'¼ resist'],[0,'immune']].filter(([m])=>g[m]).map(([m,t])=>`<b>${t}:</b> ${g[m].join(', ')}`);
 const ab=[...new Set(e.ab.flatMap(a=>a.text.split('/')).map(x=>x.replace(/\*/g,'').replace(/\[.*?\]/g,'').trim()).filter(x=>AN[K(x)]))];
 return `<p>${[...tc].map(c=>TN[c]).join('/')} (Gen V chart, no Fairy):<br>${L.join('<br>')}</p>${ab.length?`<p class="bm">Ability effects: ${ab.map(x=>`${esc(x)} (${AN[K(x)]})`).join('; ')}.</p>`:''}${FORMS[e.n]?'<p class="bm">Other forms have different types; see the page.</p>':''}`}
function evoH(e){let r=e.n;while(pred[r])r=pred[r];const out=[];
 const walk=n=>(kids[n]||[]).forEach(([t,m,mod,old])=>{out.push(`${link(byN[n])} → ${link(byN[t])}: ${esc(m)}${mod?` <span class="bs">JetBlack change</span> <span class="bm">(vanilla: ${esc(old)})</span>`:''}`);walk(t)});walk(r);
 return out.length?`<p>${out.join('<br>')}</p>`:`<p>${link(e)} does not evolve.</p>`}
function lsH(e){return pick(e.ls,null).map(l=>`<p>${l.label?`<b>${esc(l.label)}</b><br>`:''}${l.mv.map(m=>`${m[0]} ${esc(m[1].replace(/\*/g,''))}`).join(', ')}</p>`).join('')+(e.tm.length?`<p><b>TM changes:</b> ${e.tm.map(esc).join('; ')}</p>`:'')}
function learnCheck(e,mv){const k=K(mv),hits=[];
 e.ls.forEach(l=>l.mv.forEach(m=>{if(K(m[1].replace(/\*/g,''))==k)hits.push(`Lv ${m[0]}${l.label?` (${esc(l.label)})`:''}`)}));
 const tm=e.tm.filter(t=>K(t).includes(k));
 if(hits.length||tm.length)return `<p><b>Yes.</b> ${link(e)} learns ${esc(mv)}${hits.length?` by level-up at ${hits.join(', ')}`:''}${tm.length?`${hits.length?'. Also: ':''}${tm.map(esc).join('; ')}`:''}.</p>`;
 return `<p>${esc(mv)} is <b>not</b> in ${link(e)}'s JetBlack level-up learnset or TM changes.</p><p class="bm">The hack docs only list TM <i>changes</i>, so TM, tutor or egg moves from vanilla Black may still work.</p>`}
function whoLearns(mv){const k=K(mv),out=[];
 P.forEach(e=>{const l=[];e.ls.forEach(s=>s.mv.forEach(m=>{if(K(m[1].replace(/\*/g,''))==k)l.push(m[0])}));const tm=e.tm.some(t=>K(t).includes(k));
  if(l.length||tm)out.push(`${link(e)} <span class="bm">${l.length?'Lv '+[...new Set(l)].join('/'):''}${tm?(l.length?', ':'')+'TM':''}</span>`)});
 if(!out.length)return `<p>No Pokémon learns ${esc(mv)} by level-up in JetBlack, and no TM change mentions it.</p>`;
 return `<p><b>${out.length}</b> Pokémon learn ${esc(mv)} by level-up or a JetBlack TM change:</p><p>${out.slice(0,60).join(', ')}${out.length>60?` … and ${out.length-60} more`:''}</p><p class="bm">Covers level-up moves and JetBlack TM changes only. TM/HM compatibility that matches vanilla Black isn't listed in the hack docs.</p>`}
function moveH(mv){return MP[mv].map(i=>{const m=MV[i],pw=x=>x==null?'—':x;const ch=m.u!=null&&m.u!==m.p;
 return `<p><b>${esc(m.n)}</b>: ${m.t?TN[m.t]:'varies'}, ${{P:'Physical',S:'Special',X:'Status'}[m.c]||'—'}. Power ${ch?`<s>${pw(m.p)}</s> <b>${m.u}</b>`:pw(m.p)}, PP ${m.ppn!=null&&m.ppn!==m.pp?`<s>${m.pp}</s> <b>${m.ppn}</b>`:m.pp}, accuracy ${m.acn!=null&&m.acn!==m.ac?`<s>${m.ac||'—'}</s> <b>${m.acn||'—'}</b>`:(m.ac||'—')}.<br>${esc(m.ds||'')}${m.e?`<br><span class="bs">JetBlack:</span> ${esc(m.e)}`:''}${(m.ch||[]).length?`<br><span class="bs">Changed:</span> ${m.ch.map(esc).join('; ')}`:''}${m.new?`<br><span class="bs">New move</span>, replaces ${esc(m.r)}`:''}</p>`}).join('')+
 ((LC.I||[]).filter(o=>K(o.i).endsWith(K(mv))&&/^TM|^HM/i.test(o.i)).map(o=>`<p class="bm">${esc(o.i)}: ${esc(o.w)}${o.n?` (${esc(o.n)})`:''}</p>`).join(''))}
function abilInfo(a){const d=AB[K(a)],who=P.filter(e=>e.ab.some(x=>x.text.split('/').some(t=>K(t.replace(/\*/g,'').replace(/\[.*?\]/g,''))==K(a))));
 return `<p><b>${esc(a)}</b>${d?`: ${esc(d)}`:''}</p>${who.length?`<p>Pokémon with it in JetBlack (${who.length}): ${who.slice(0,60).map(link).join(', ')}${who.length>60?' …':''}</p>`:''}`}
function areaH(keys,flt){const ids=new Set(keys.flatMap(k=>[...AREA[k]])),by={};
 for(const [n,rows] of Object.entries(LC.R))rows.forEach(r=>{if(ids.has(r[0])&&(!flt||flt.ok(r))){const k=LC.A[r[0]]+'|'+r[1];(by[k]=by[k]||[]).push([byN[n],r])}});
 const MO=['Grass','Dark grass','Land','Sand','Surfing','Fishing'],ks=Object.keys(by).sort((a,b)=>{const [aa,am]=a.split('|'),[ba,bm]=b.split('|');return LC.A.indexOf(aa)-LC.A.indexOf(ba)||MO.indexOf(am)-MO.indexOf(bm)});
 if(!ks.length)return flt?`<p>No ${flt.label.replace(/^only /,'')} are listed for that area.</p>`:'<p>No wild encounters are listed for that area.</p>';
 const names=[...new Set([...ids].map(i=>LC.A[i]))];
 const st=Object.entries(LC.S).filter(([,s])=>names.some(a=>{const loc=K((s.t[0]||'').split(' - ')[0]),b=a.split(' · ')[0];return loc==K(b)||loc==K(b.split(' - ')[0])})).map(([n,s])=>`${link(byN[n])}${s.lvl?` (Lv ${s.lvl})`:''}`);
 return ks.map(k=>{const [a,m]=k.split('|');return `<p><b>${esc(a)}</b>, ${m}:<br>${by[k].sort((x,y)=>x[1][5]-y[1][5]||y[1][4]-x[1][4]).map(([e,r])=>`${link(e)} ${lv(r[2],r[3])} ${r[4]}%${r[5]?' <span class="bs">★</span>':''}${r[6]?` <span class="bm">(${esc(r[6])})</span>`:''}`).join(', ')}</p>`}).join('')
  +(st.length?`<p><b>Static encounters:</b> ${st.join(', ')}</p>`:'')+'<p class="bm">★ = only in rustling grass, rippling water or dust clouds.</p>'}
function itemH(name){const k=K(name),g=(LC.I||[]).filter(o=>K(o.i)==k),m=Object.entries(LC.M||{}).filter(([,l])=>l.some(([n])=>K(n)==k)),pr=(LC.MP||[]).filter(t=>K(t).includes(k.replace(/s$/,'')));
 let h=g.map(o=>`<p><b>${esc(o.i)}</b>: ${esc(o.w)} (${o.k}${o.n?`; ${esc(o.n)}`:''})</p>`).join('');
 if(m.length)h+=`<p>Sold by the second clerk at: ${m.map(([c,l])=>esc(c)+(l.find(([n])=>K(n)==k)[1]?' (vanilla)':'')).join(', ')}</p>`;
 if(pr.length)h+=`<p class="bm">${pr.map(esc).join('. ')}.</p>`;
 return h}
function summary(e){const t=e.st[0]||{},c=t.u||t.b||t.v||[],n=natureOf(e,null),rows=LC.R[e.n]||[];
 return `<p>${link(e)} #${String(e.n).padStart(3,'0')} · ${[...e.t].map(x=>TN[x]).join('/')}<br>${c.map((x,i)=>`${SL[i]} ${x}`).join(' · ')} · Total ${c.reduce((a,b)=>a+b,0)}<br>Abilities: ${e.ab.map(a=>a.text.replace(/\*/g,'')).join(', ')}${n?`<br>Suggested nature: ${n.a.n}`:''}<br>${rows.length?(x=>`Wild in ${x} area${x>1?'s':''}`)(new Set(rows.map(r=>r[0])).size):LC.S[e.n]?'Static encounter':'Not listed as a wild encounter'}</p><p class="bm">Ask about its locations, evolution, moves, weaknesses or nature.</p>`}

// ---------- trainers (from trainers.js, grouped by area in areas.js)
const AREAS=window.JBArea?JBArea.groups:[],TRX=[];
AREAS.forEach(g=>g.tr.forEach(e=>e.T.forEach(t=>{const w=N(t.t).split(/[^a-z0-9]+/).filter(Boolean);TRX.push({g,e,t,key:w[w.length-1]||''})})));
const TTITLE=new Set('leader elite 4 four pokemon trainer team plasma ace grunt grunts twins'.split(' '));
const TQ=/\b(team|teams|gym|gyms|leader|leaders|trainer|trainers|battle|battles|fight|fights|roster|party|lineup|levels?|use|uses|has|have|rematch|rematches|elite|e4|champion|rival|boss|bosses|beat|against)\b/;
function findTrainers(q){const t=' '+N(q)+' ',toks=t.trim().split(/[^a-z0-9]+/).filter(Boolean),tk=new Set();
 toks.forEach(x=>{tk.add(x);if(x.length>3&&x.endsWith('s'))tk.add(x.slice(0,-1))});if(tk.has('ns'))tk.add('n');
 const intent=TQ.test(t);let hit=TRX.filter(o=>o.key&&!TTITLE.has(o.key)&&(o.key.length>=3||o.key=='n')&&tk.has(o.key)&&(intent||o.t.b));
 if(!hit.length&&/\bgyms?\b/.test(t)){const city=toks.filter(x=>x.length>=4&&!STOP.has(x));
  hit=TRX.filter(o=>o.e.sub=='Gym'&&city.some(c=>K(o.g.name).startsWith(c))&&(o.t.b||/\btrainers\b/.test(t)))}
 if(!hit.length&&/\b(elite|e4)\b/.test(t))hit=TRX.filter(o=>/^Elite 4/.test(o.t.t)&&!o.e.sub);
 // narrow by place words in the question ("N at the castle", "Cheren on Route 3", "Clay's gym")
 const kq=K(q),place=o=>{const w=N(o.g.name).split(/[^a-z0-9]+/).filter(x=>x.length>=4&&!/^(city|town|route|cave|forest|tower|bridge|pokemon|centre|center)$/.test(x));
  return (kq.includes(K(o.g.name))?2:0)+w.filter(x=>tk.has(x)).length+(/\bgyms?\b/.test(t)&&o.e.sub=='Gym'?1:0)+(/\b(rematch|rematches|post ?game)\b/.test(t)&&/Post|Rematch/i.test((o.e.sub||'')+o.g.name)?1:0)};
 if(hit.length>1){const best=Math.max(...hit.map(place));if(best>0)hit=hit.filter(o=>place(o)==best)}
 return hit}
const monTxt=([nm,it,l,ab,mv])=>`${nm.split('/').map(n=>{const e=PK[K(n.replace(/-[A-Z]$/,''))];return e?link(e):esc(n)}).join('/')}${l?` Lv ${l}`:''}${it?` @ ${esc(it)}`:''}${ab||mv?` <span class="bm">(${esc([ab,mv].filter(Boolean).join(': '))})</span>`:''}`;
function trainerH(o){const {g,e,t}=o;
 return `<p><b>${esc(t.t)}</b>, <a href="#area/${g.slug}">${esc(g.name)}</a>${e.sub?` · ${esc(e.sub)}`:''}${t.c?` <span class="bs">${esc(t.c)}</span>`:''}${t.x?`<br><span class="bm">${esc(t.x)}</span>`:''}</p>`+
  t.G.map(q=>`${q.c?`<p class="bs">${esc(q.c)}</p>`:''}<ul>${q.M.map(m=>`<li>${monTxt(m)}</li>`).join('')}</ul>`).join('')}
function trainersAns(list){const show=list.slice(0,6);
 return show.map(trainerH).join('')+(list.length>show.length?`<p class="bm">+${list.length-show.length} more battles. See the area pages.</p>`:'')+`<p class="bm">${esc((window.JBT&&JBT.N[0])||'')}</p>`}

const HELP=`<p>I answer only from the JetBlack data on this site, so I won't guess. Try:</p>`;
const EX=['Where can I find Axew?','Best nature for Haxorus','Does Snivy learn Leaf Blade?','Who learns Dragon Dance?','What Pokémon are on Route 4?','How does Gible evolve?','Garchomp weaknesses','What does Hurricane do?','Where is the Choice Band?'];
function answer(q){const t=' '+N(q)+' ',r=parse(q),has=re=>re.test(t);
 const W=has(/\b(where|find|catch|locat|encounter|found|obtain|spawn|wild|appear)/),NAT=has(/\bnature/),EV=has(/\bevol/),
  ST=has(/\b(stat|stats|bst|base|hp|attack|atk|defen[cs]e|def|special|spa|spd|speed|spe|fast|slow|bulk|total)\b/),
  AB_=has(/\babilit/),WK=has(/\b(weak|weakness|weaknesses|resist|resistance|resists|immune|immunit|effective|matchup|counter)/),
  LS=has(/\b(learn|learns|learnset|moves|moveset|movepool|level up|levelup|teach)\b/),WHO=has(/\b(who|which|what pokemon|what pok|list)\b/);
 let out=[];const FL=spotFilter(q);
 const TRS=findTrainers(q);if(TRS.length)return trainersAns(TRS);
 if(r.fuzzy.length)out.push(`<p class="bm">Reading ${r.fuzzy.map(([a,b])=>`“${esc(a)}” as ${esc(b)}`).join(', ')}.</p>`);
 if(r.pk.length&&r.mv.length){r.pk.slice(0,3).forEach(e=>r.mv.slice(0,3).forEach(m=>out.push(learnCheck(e,m))));return out.join('')}
 // "route 14 surf" / "fishing in route 1": the area wins over the Surf move
 if(r.area.length&&!r.pk.length&&!(WHO||LS))r.mv=r.mv.filter(m=>!/^(Surf|Dig|Fly|Waterfall|Dive)$/.test(m));
 if(r.mv.length&&!r.pk.length){r.mv.slice(0,2).forEach(m=>out.push((WHO||LS)?whoLearns(m):moveH(m)));return out.join('')}
 if(r.pk.length&&r.area.length){r.pk.slice(0,3).forEach(e=>out.push(locH(e,r.area,FL)));return out.join('')}
 if(r.area.length&&!r.pk.length){out.push((FL?`<p class="bm">Showing ${FL.label}.</p>`:'')+areaH(r.area,FL));return out.join('')}
 if(r.item.length&&!r.pk.length){r.item.slice(0,2).forEach(i=>out.push(itemH(i)));return out.join('')}
 if(r.ab.length&&!r.pk.length){r.ab.slice(0,2).forEach(a=>out.push(abilInfo(a)));return out.join('')}
 if(r.pk.length){r.pk.slice(0,3).forEach(e=>{const parts=[];
   if(NAT)parts.push(natH(e));if(W||FL)parts.push(locH(e,null,FL));if(EV)parts.push(evoH(e));if(ST)parts.push(statH(e));
   if(AB_)parts.push(abH(e));if(WK)parts.push(weakH(e));if(LS)parts.push(lsH(e));
   if(!parts.length)parts.push(summary(e));
   out.push((r.pk.length>1?`<h4>${esc(e.name)}</h4>`:'')+parts.join(''))});return out.join('')}
 if(W&&!r.pk.length)return `<p>I couldn't match a Pokémon, move, item or area in that question.</p><p class="bm">Items that JetBlack didn't move are in the same place as in vanilla Black.</p>`;
 return HELP}

// ---------- optional AI layer
// When window.JB_AI_URL is set (see ai-worker/README.md), questions go to a small Cloudflare Worker
// together with the matching JetBlack records below. The model only sees those records and is told
// to answer from them alone. The records it used are shown under each answer.
const AI_URL=String(window.JB_AI_URL||'').trim();
const txt=h=>h.replace(/<br\s*\/?>/g,'\n').replace(/<\/(p|li|h4|div)>/g,'\n').replace(/<li>/g,'- ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
function aiContext(q){const r=parse(q),parts=[],add=(title,h)=>{const s=txt(h);if(s)parts.push(`## ${title}\n${s}`)};
 const trs=findTrainers(q);trs.slice(0,8).forEach(o=>add('Trainer battle',trainerH(o)));
 r.pk.slice(0,3).forEach(e=>{add(e.name+' overview',summary(e));add(e.name+' base stats',statH(e));add(e.name+' abilities',abH(e));add(e.name+' locations',locH(e,null,spotFilter(q)));
  add(e.name+' evolution',evoH(e));add(e.name+' type matchups',weakH(e));add(e.name+' suggested nature',natH(e));add(e.name+' level-up moves',lsH(e));
  r.mv.slice(0,3).forEach(m=>add(`Does ${e.name} learn ${m}`,learnCheck(e,m)))});
 r.mv.slice(0,2).forEach(m=>{add(m+' move data',moveH(m));if(!r.pk.length)add('Who learns '+m,whoLearns(m))});
 if(r.area.length){add('Wild encounters',areaH(r.area,spotFilter(q)));
  const gs=new Set();r.area.forEach(k=>AREA[k].forEach(i=>{const g=AREAS.find(x=>x.subs.includes(i));if(g)gs.add(g)}));
  gs.forEach(g=>g.tr.forEach(e=>e.T.slice(0,25).forEach(t=>add(`Trainer in ${g.name}`,trainerH({g,e,t})))))}
 r.item.slice(0,2).forEach(i=>add(i+' item',itemH(i)));r.ab.slice(0,2).forEach(a=>add(a+' ability',abilInfo(a)));
 if(!trs.length&&/\b(gym|leader|leaders|elite|e4|champion|boss|bosses|hardest|strongest|toughest)\b/.test(N(q)))
  TRX.filter(o=>o.t.b).forEach(o=>parts.push(`## Key battle\n${o.t.t} (${o.g.name}${o.e.sub?' · '+o.e.sub:''}): `+o.t.G.map(g=>(g.c?`[${g.c}] `:'')+g.M.map(m=>`${m[0]}${m[2]?' Lv '+m[2]:''}`).join(', ')).join(' | ')));
 let s=parts.join('\n\n');if(s.length>14000)s=s.slice(0,14000)+'\n[data truncated]';
 return s}
const fmt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
async function askAI(q,ctx){const c=new AbortController(),to=setTimeout(()=>c.abort(),25000);
 try{const r=await fetch(AI_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q,ctx}),signal:c.signal});
  if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j.a)throw new Error('empty');return j.a}finally{clearTimeout(to)}}

// ---------- UI
const css=`#askb{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:40;border:0;border-radius:99px;padding:12px 18px;background:var(--ink);color:var(--bg);font:600 15px/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#askp{position:fixed;right:18px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:41;width:min(420px,calc(100vw - 32px));height:min(600px,calc(100vh - 120px));display:none;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:hidden}
#askp.on{display:flex}#askp header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line)}#askp header b{font-size:15px}#askp header small{display:block;color:var(--mut);font-size:12px}
#askx{border:0;background:none;color:var(--mut);font-size:22px;cursor:pointer;line-height:1}
#askm{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;font-size:14px}
.qm{align-self:flex-end;background:var(--ink);color:var(--bg);border-radius:14px 14px 4px 14px;padding:8px 12px;max-width:85%}
.am{align-self:flex-start;background:var(--chip);border-radius:14px 14px 14px 4px;padding:8px 12px;max-width:100%}.am p{margin:4px 0}.am ul{margin:4px 0;padding-left:18px}.am li{margin:3px 0}.am a{text-decoration:underline}.am h4{margin:8px 0 2px}
.am .bm{color:var(--mut);font-size:12.5px}.am .bs{font-weight:700;font-size:12px}.am .bp{font-style:normal;font-size:10.5px;font-weight:700;text-transform:uppercase;background:var(--ink);color:var(--bg);border-radius:4px;padding:0 4px}
.exs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.exs button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:4px 10px;font:12.5px inherit;font-family:inherit;cursor:pointer}
#askf{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}#aski{flex:1;min-width:0;padding:10px 12px;font-size:16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);outline:none;font-family:inherit}#aski:focus{border-color:var(--ink)}
#askf button{border:0;border-radius:12px;padding:0 14px;background:var(--ink);color:var(--bg);font-weight:600;cursor:pointer;font-family:inherit}
.src{margin-top:6px;border-top:1px solid var(--line);padding-top:4px}.src summary{cursor:pointer;color:var(--mut);font-size:12.5px}.src pre{white-space:pre-wrap;font:12px/1.4 inherit;font-family:inherit;color:var(--mut);max-height:240px;overflow:auto}
@media(max-width:560px){#askp{right:8px;left:8px;width:auto;bottom:calc(70px + env(safe-area-inset-bottom,0px));height:calc(100vh - 140px)}}`;
document.head.insertAdjacentHTML('beforeend',`<style>${css}</style>`);
document.body.insertAdjacentHTML('beforeend',`<button id="askb" aria-expanded="false" aria-controls="askp">Ask the Dex</button>
<div id="askp" role="dialog" aria-label="Ask the JetBlack Dex"><header><div><b>Ask the JetBlack Dex</b><small>${AI_URL?'AI answers, grounded in JetBlack data':'Answers come only from JetBlack data'}</small></div><button id="askx" aria-label="Close">×</button></header>
<div id="askm" aria-live="polite"></div><form id="askf"><input id="aski" autocomplete="off" placeholder="e.g. Where can I find Deino?" aria-label="Your question"><button>Ask</button></form></div>`);
const p=document.getElementById('askp'),b=document.getElementById('askb'),m=document.getElementById('askm'),i=document.getElementById('aski');
const exH=()=>`<div class="exs">${EX.map(x=>`<button type="button">${esc(x)}</button>`).join('')}</div>`;
const say=(cls,h)=>{m.insertAdjacentHTML('beforeend',`<div class="${cls}">${h}</div>`);m.scrollTop=m.scrollHeight};
let busy=false;
async function ask(q){q=q.trim();if(!q||busy)return;say('qm',esc(q));let a;try{a=answer(q)}catch(err){a='<p>Something went wrong reading the data for that question.</p>'}
 const ctx=AI_URL?aiContext(q):'';
 if(!ctx){say('am',a+(a==HELP?exH():''));return}
 busy=true;say('am ai-wait','<p class="bm">Looking it up…</p>');const w=m.lastElementChild;
 try{const res=await askAI(q,ctx);
  w.className='am';w.innerHTML=`<p>${fmt(res)}</p><details class="src"><summary>JetBlack data used</summary>${a!=HELP?a:`<pre>${esc(ctx)}</pre>`}</details><p class="bm">AI answer from the data above. If they disagree, trust the data.</p>`}
 catch(err){w.className='am';w.innerHTML=a+(a==HELP?exH():'')+'<p class="bm">The AI helper is unavailable right now (it may have hit its free daily limit), so this is the direct data answer.</p>'}
 finally{busy=false;m.scrollTop=m.scrollHeight}}
const toggle=on=>{p.classList.toggle('on',on);b.setAttribute('aria-expanded',on);if(on){if(!m.children.length)say('am',HELP+exH());i.focus()}};
b.onclick=()=>toggle(!p.classList.contains('on'));document.getElementById('askx').onclick=()=>toggle(false);
document.getElementById('askf').onsubmit=ev=>{ev.preventDefault();ask(i.value);i.value=''};
m.addEventListener('click',ev=>{const x=ev.target.closest('.exs button');if(x)ask(x.textContent);if(ev.target.closest('a')&&innerWidth<560)toggle(false)});
window.JBbot={answer,parse,aiContext};
})();
