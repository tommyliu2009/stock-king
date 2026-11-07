const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fx=(v,d=2)=>v==null||isNaN(v)?'—':(+v).toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
const fi=v=>v==null?'—':(+v).toLocaleString('zh-TW');
const cls=v=>v>0?'up':v<0?'dn':'';
const sg=v=>v==null?'—':(v>0?'+':'')+fx(v);
const ymd=s=>s&&/^\d{8}$/.test(s)?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6)}`:(s||'—');
let D,S=[],M={},tab='screen',sortK='c',sortD=1;
const MKS=['上市','上櫃','美股','日股','港股','歐股','英股'];const isG=x=>!!x.g;
const st={m:'',dy1:'',dy2:'',pe1:'',pe2:'',ry1:'',ry2:'',i:''};
fetch('data/all.json?v='+Date.now()).then(r=>r.json()).then(j=>{D=j;S=j.s;S.forEach(x=>M[x.c]=x);init();route()});
function init(){
  const m=D.meta;
  $('#stats').innerHTML=`<span class="stat"><b>${fi(m.n)}</b>檔（上市櫃股票＋ETF）</span>`+(m.g?`<span class="stat">全球 <b>${fi(m.g.n)}</b> 檔</span>`:'')+`<span class="stat">收盤日 <b>${m.qdate}</b></span><span class="stat">法人 <b>${m.idate}</b></span><span class="stat">月營收 <b>${m.rdate}</b></span>`;
  $('#foot').innerHTML=`資料最後更新：<b>${m.built}</b>（台北時間）・收盤資料日 ${m.qdate}・股價歷史 ${ymd(m.hfrom)} 起`+(m.g?`・全球市場更新 ${m.g.built}`:'')+(m.fail.length?`・<span class="up">部分來源抓取失敗：${esc(m.fail.map(f=>f[0]).join('、'))}</span>`:'');
  $('#fm').innerHTML=['',...MKS].map(v=>`<button class="chip${v===''?' on':''}" data-v="${v}">${v||'全部'}</button>`).join('');
  $('#fm').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;st.m=b.dataset.v;[...$('#fm').children].forEach(c=>c.classList.toggle('on',c===b));go('screen')};
  const inds=[...new Set(S.map(x=>x.i))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  $('#fi').innerHTML+=inds.map(i=>`<option>${esc(i)}</option>`).join('');
  $('#fi').onchange=()=>{st.i=$('#fi').value;go('screen')};
  ['dy1','dy2','pe1','pe2','ry1','ry2'].forEach(k=>$('#'+k).addEventListener('input',()=>{st[k]=$('#'+k).value.trim();clearTimeout(init.t);init.t=setTimeout(()=>go('screen'),300)}));
  $('#reset').onclick=()=>{Object.keys(st).forEach(k=>st[k]='');document.querySelectorAll('.rng input').forEach(i=>i.value='');$('#fi').value='';[...$('#fm').children].forEach((c,i)=>c.classList.toggle('on',i===0));go('screen')};
  $('#applyFilters').onclick=()=>$('#filters').classList.remove('open');
  // 搜尋
  const q=$('#q');let comp=false,t;
  q.addEventListener('compositionstart',()=>comp=true);
  q.addEventListener('compositionend',()=>{comp=false;sugg()});
  q.addEventListener('input',()=>{if(comp)return;clearTimeout(t);t=setTimeout(sugg,250)});
  q.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();doSearch()}});
  $('#qBtn').onclick=doSearch;
  document.addEventListener('click',e=>{if(!e.target.closest('.searchbar'))$('#sugg').hidden=true});
}
function find(s){s=s.trim().toLowerCase();if(!s)return[];
  const ex=S.filter(x=>x.c.toLowerCase()===s||x.n.toLowerCase()===s||(x.g&&x.c.split('.')[0].toLowerCase().replace(/^0+/,'')===s.replace(/^0+/,'')));
  const pre=S.filter(x=>!ex.includes(x)&&(x.c.toLowerCase().startsWith(s)||x.n.toLowerCase().startsWith(s)));
  const sub=S.filter(x=>!ex.includes(x)&&!pre.includes(x)&&(x.n.toLowerCase().includes(s)||(x.full||'').toLowerCase().includes(s)||(x.en||'').toLowerCase().includes(s)||(x.g&&x.c.split('.')[0].toLowerCase()===s)));
  return [...ex,...pre,...sub]}
function sugg(){const r=find($('#q').value).slice(0,12),b=$('#sugg');
  if(!r.length){b.hidden=true;return}
  b.innerHTML=r.map(x=>`<a href="#/s/${x.c}"><b>${x.c}</b> ${esc(x.n)}${x.en?' '+esc(x.en):''} <small style="color:#888">${x.m}・${esc(x.i)}</small></a>`).join('');b.hidden=false}
function doSearch(){const v=$('#q').value.trim();if(!v)return;const r=find(v);$('#sugg').hidden=true;
  if(r.length===1||(r[0]&&(r[0].c.toLowerCase()===v.toLowerCase()||r[0].n===v||(r[0].g&&r[0].c.split('.')[0]===v))))location.hash='#/s/'+r[0].c;else{location.hash='#/q/'+encodeURIComponent(v)}}
function go(t){tab=t;if(location.hash!=='#/'+t)location.hash='#/'+t;else route()}
window.addEventListener('hashchange',route);
function route(){if(!D)return;document.body.classList.remove('is-dash');const h=decodeURIComponent(location.hash.slice(2));window.scrollTo(0,0);
  if(h.startsWith('s/'))return stock(h.slice(2));
  if(h.startsWith('q/'))return listView('搜尋「'+h.slice(2)+'」',find(h.slice(2)));
  if(h.startsWith('gm/'))return listView('全球市場：'+h.slice(3),S.filter(x=>x.m===h.slice(3)));
  if(h.startsWith('ind/'))return listView('產業：'+h.slice(4),S.filter(x=>x.i===h.slice(4)));
  tab=['dash','screen','global','ind','inst','news'].includes(h)?h:(h?'screen':'dash');home()}
const tabs=()=>`<div class="tabs">${[['dash','市場主控台'],['screen','選股篩選'],['global','全球市場'],['ind','產業分類'],['inst','法人買賣超排行'],['news','今日重大訊息']].map(([k,n])=>`<button class="tab${tab===k?' on':''}" onclick="go('${k}')">${n}</button>`).join('')}${tab==='dash'?'':`<button class="tab only-mobile" onclick="$('#filters').classList.add('open')">⚙ 篩選條件</button>`}</div>`;
function num(v){return v===''?null:+v}
function filt(){return S.filter(x=>{
  if(st.m&&x.m!==st.m)return false;if(st.i&&x.i!==st.i)return false;
  for(const[k,f]of[['dy','dy'],['pe','pe'],['ry','ryy']]){const a=num(st[k+'1']),b=num(st[k+'2']);if(a==null&&b==null)continue;const v=x[f];if(v==null)return false;if(a!=null&&v<a)return false;if(b!=null&&v>b)return false}
  return true})}
const COLS=[['c','代號','l'],['n','名稱','l'],['m','市場','l'],['i','產業','l'],['p','價格'],['cp','漲跌%'],['v','成交量'],['pe','本益比'],['dy','殖利率%'],['pb','淨值比'],['ryy','營收年增%'],['ii','法人(張)']];
function table(rows){
  rows=[...rows].sort((a,b)=>{const x=a[sortK],y=b[sortK];if(x==null)return 1;if(y==null)return -1;return (typeof x==='string'?x.localeCompare(y,'zh-Hant'):x-y)*sortD});
  const shown=rows.slice(0,500);
  return `<p class="count">共 ${fi(rows.length)} 檔${rows.length>500?'，顯示前 500 檔（可點欄位排序）':'（可點欄位排序）'}</p><div class="tw"><table class="t" id="tbl"><thead><tr>${COLS.map(([k,n,l])=>`<th class="${l||''}" data-k="${k}">${n}${sortK===k?(sortD>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead><tbody>${shown.map(x=>`<tr><td class="l"><a href="#/s/${x.c}">${x.c}</a></td><td class="l"><a href="#/s/${x.c}">${esc(x.n)}</a></td><td class="l">${x.m}${x.cur?' <small class="muted">'+x.cur+'</small>':''}</td><td class="l">${esc(x.i)}</td><td>${fx(x.p)}</td><td class="${cls(x.cp)}">${sg(x.cp)}</td><td>${fi(x.v)}<small class="muted">${x.g?' 股':' 張'}</small></td><td>${fx(x.pe)}</td><td>${fx(x.dy)}</td><td>${fx(x.pb)}</td><td class="${cls(x.ryy)}">${sg(x.ryy)}</td><td class="${cls(x.ii)}">${fi(x.ii)}</td></tr>`).join('')}</tbody></table></div>`}
function bindSort(re){const t=$('#tbl');if(t)t.querySelector('thead').onclick=e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.k;if(sortK===k)sortD=-sortD;else{sortK=k;sortD=['c','n','m','i'].includes(k)?1:-1}re()}}
function listView(title,rows){const re=()=>{$('#main').innerHTML=tabs()+`<h2>${esc(title)}</h2>`+(rows.length?table(rows):'<div class="empty">找不到符合的股票。</div>');bindSort(re)};re()}
function home(){const m=$('#main');
  document.body.classList.toggle('is-dash', tab==='dash');
  document.title=tab==='dash'?'股票王｜市場主控台':'股票王｜台股與全球股市公開資訊整理';
  if(tab==='dash'){dashView(m);return}
  if(tab==='screen'){const re=()=>{m.innerHTML=tabs()+table(filt());bindSort(re)};re()}
  else if(tab==='global')gview(m);
  else if(tab==='ind'){const c={};S.forEach(x=>c[x.i]=(c[x.i]||0)+1);
    m.innerHTML=tabs()+`<div class="indg">${Object.keys(c).sort((a,b)=>c[b]-c[a]).map(i=>`<a class="btn" href="#/ind/${encodeURIComponent(i)}">${esc(i)} <small>${c[i]} 檔</small></a>`).join('')}</div>`}
  else if(tab==='inst'){const r=S.filter(x=>x.ii!=null);
    const L=(k,n,asc)=>{const a=[...r].sort((x,y)=>asc?x[k]-y[k]:y[k]-x[k]).slice(0,20);return `<div class="box"><h3>${n}</h3><table class="t"><tr><th class="l">股票</th><th>買賣超(張)</th><th>收盤</th><th>漲跌%</th></tr>${a.map(x=>`<tr><td class="l"><a href="#/s/${x.c}">${x.c} ${esc(x.n)}</a></td><td class="${cls(x[k])}">${fi(x[k])}</td><td>${fx(x.p)}</td><td class="${cls(x.cp)}">${sg(x.cp)}</td></tr>`).join('')}</table></div>`};
    m.innerHTML=tabs()+`<p class="count">資料日：${D.meta.idate}，單位：張（1 張＝1,000 股）。排行僅為統計，不代表推薦。</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px">${L('ii','三大法人買超前 20')}${L('ii','三大法人賣超前 20',1)}${L('fi','外資買超前 20')}${L('fi','外資賣超前 20',1)}${L('ti','投信買超前 20')}${L('ti','投信賣超前 20',1)}</div>`}
  else{const N=D.news,last=N.length?N[0].d:'';const today=N.filter(z=>z.d===last);
    m.innerHTML=tabs()+`<div class="box"><h3>重大訊息（發言日 ${last}，共 ${today.length} 則）</h3>${newsHtml(today)}</div>`+(N.length>today.length?`<div class="box"><h3>近期重大訊息</h3>${newsHtml(N.filter(z=>z.d!==last).slice(0,100))}</div>`:'')}
}
function newsHtml(a){return a.length?a.map(z=>`<div class="news"><div class="m">${z.d} ${z.t}・${z.m}・<a href="#/s/${z.c}">${z.c} ${esc(z.n)}</a>${z.fd?'・事實發生日 '+z.fd:''}</div><details><summary>${esc(z.s)}</summary><pre>${esc(z.x)}</pre></details></div>`).join(''):'<p class="muted">目前沒有資料。</p>'}
function stock(c){const x=M[c],m=$('#main');
  if(!x){m.innerHTML=tabs()+'<div class="empty">找不到這檔股票。</div>';return}
  if(x.g)return gstock(x,m);
  document.title=`${x.c} ${x.n}｜股票王`;
  const k=(n,v,c='')=>`<div><small>${n}</small><b class="${c}">${v}</b></div>`;
  m.innerHTML=`<div class="sk"><a href="#/">← 回主控台</a><h2 style="margin-top:8px">${x.c} ${esc(x.n)} <small style="font-size:14px;color:#888">${x.m}・<a href="#/ind/${encodeURIComponent(x.i)}">${esc(x.i)}</a></small></h2>
  ${watchBtn(x.c)}
  <div class="disc">本站為公開資訊整理，不構成投資建議。</div>
  <div class="kv2">${k('收盤價（'+(x.id||(x.m==='上市'?D.meta.qdate:D.meta.odate))+'）',fx(x.p))}${k('漲跌',sg(x.ch)+' ('+sg(x.cp)+'%)',cls(x.ch))}${k('成交量（張）',fi(x.v))}${k('本益比',fx(x.pe))}${k('殖利率（%）',fx(x.dy))}${k('股價淨值比',fx(x.pb))}</div>
  <div class="box"><h3>近一年股價走勢（收盤價）</h3><div id="chart">載入中…</div></div>
  <div class="box"><h3>三大法人買賣超（張）</h3><div id="inst">載入中…</div></div>
  <div class="box"><h3>月營收（千元）</h3>${x.ry?`<table class="t"><tr><th class="l">資料年月</th><th>當月營收</th><th>月增率</th><th>去年同月</th><th>年增率</th><th>累計營收</th><th>累計年增</th></tr><tr><td class="l">${x.ry}</td><td>${fi(x.r)}</td><td class="${cls(x.rm)}">${sg(x.rm)}%</td><td>${fi(x.rl)}</td><td class="${cls(x.ryy)}">${sg(x.ryy)}%</td><td>${fi(x.rc)}</td><td class="${cls(x.rcy)}">${sg(x.rcy)}%</td></tr></table>`:'<p class="muted">無月營收資料（ETF 或未申報）。</p>'}</div>
  <div class="box"><h3>近期重大訊息</h3><div id="snews">載入中…</div></div>
  ${x.full?`<div class="box"><h3>公司基本資料</h3><p>${esc(x.full)}｜董事長：${esc(x.chair)}｜成立：${ymd(x.est)}｜上市櫃：${ymd(x.lst)}｜實收資本額：${fi(x.cap)} 元${x.web?`｜<a href="${esc(x.web.startsWith('http')?x.web:'http://'+x.web)}" target="_blank" rel="noopener">公司網站</a>`:''}｜<a href="https://mops.twse.com.tw/mops/#/web/t05st01" target="_blank" rel="noopener">公開資訊觀測站</a></p></div>`:''}</div>`;
  bindWatchBtn();
  fetch(`data/h/${c}.json?v=${D.meta.built}`).then(r=>r.json()).then(h=>{
    $('#chart').innerHTML=chart(h.h);
    $('#inst').innerHTML=h.inst.length?`<div class="tw" style="max-height:300px"><table class="t"><tr><th class="l">日期</th><th>外資</th><th>投信</th><th>自營商</th><th>合計</th></tr>${h.inst.slice().reverse().map(r=>`<tr><td class="l">${r[0]}</td>${r.slice(1).map(v=>`<td class="${cls(v)}">${fi(v)}</td>`).join('')}</tr>`).join('')}</table></div>`:'<p class="muted">無法人資料。</p>';
    $('#snews').innerHTML=newsHtml(h.news)}).catch(()=>{$('#chart').textContent='載入失敗'})}
function chart(h){if(!h||h.length<2)return'<p class="muted">歷史資料不足。</p>';
  const W=800,H=220,P=40,ys=h.map(r=>r[1]),mn=Math.min(...ys),mx=Math.max(...ys),rg=mx-mn||1;
  const X=i=>P+i*(W-P-10)/(h.length-1),Y=v=>10+(H-30)*(1-(v-mn)/rg);
  const pts=h.map((r,i)=>`${X(i).toFixed(1)},${Y(r[1]).toFixed(1)}`).join(' ');
  const up=ys[ys.length-1]>=ys[0];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline fill="none" stroke="${up?'#e03131':'#2b8a3e'}" stroke-width="2" points="${pts}"/>
  <text x="2" y="16" font-size="12" fill="#888">${fx(mx)}</text><text x="2" y="${H-20}" font-size="12" fill="#888">${fx(mn)}</text>
  <text x="${P}" y="${H-4}" font-size="12" fill="#888">${h[0][0]}</text><text x="${W-90}" y="${H-4}" font-size="12" fill="#888">${h[h.length-1][0]}</text></svg>
  <p class="count">${h[0][0]} 至 ${h[h.length-1][0]}，共 ${h.length} 個交易日；期間最高 ${fx(mx)}、最低 ${fx(mn)}。</p>`}

const TZN={'America/New_York':'美東','Asia/Tokyo':'東京','Asia/Hong_Kong':'香港','Europe/London':'倫敦','Europe/Berlin':'中歐','Europe/Paris':'中歐','Europe/Amsterdam':'中歐','Europe/Madrid':'中歐','Europe/Rome':'中歐','Europe/Brussels':'中歐','Europe/Helsinki':'赫爾辛基','Europe/Dublin':'都柏林','Europe/Zurich':'中歐','Europe/Lisbon':'里斯本','Asia/Taipei':'台北','Asia/Shanghai':'上海','Asia/Seoul':'首爾'};
const tzl=z=>TZN[z]||z||'';
let GX=null;
function spark(h,w=160,hh=40){if(!h||h.length<2)return'';const ys=h.map(r=>r[1]),mn=Math.min(...ys),mx=Math.max(...ys),rg=mx-mn||1;
  return `<svg viewBox="0 0 ${w} ${hh}" width="100%" height="${hh}" preserveAspectRatio="none"><polyline fill="none" stroke="${ys.at(-1)>=ys[0]?'#e03131':'#2b8a3e'}" stroke-width="1.5" points="${h.map((r,i)=>`${(i*w/(h.length-1)).toFixed(1)},${(2+(hh-4)*(1-(r[1]-mn)/rg)).toFixed(1)}`).join(' ')}"/></svg>`}
function gview(m){
  const G=S.filter(isG),mk=MKS.slice(2);
  const grp=mk.map(k=>{const a=G.filter(x=>x.m===k&&x.cp!=null);if(!a.length)return'';
    const up=[...a].sort((x,y)=>y.cp-x.cp).slice(0,5),dn=[...a].sort((x,y)=>x.cp-y.cp).slice(0,5),idx=[...new Set(a.flatMap(x=>x.idx||[]))];
    const li=r=>r.map(x=>`<tr><td class="l"><a href="#/s/${x.c}">${x.c} ${esc(x.n)}</a></td><td>${fx(x.p)}</td><td class="${cls(x.cp)}">${sg(x.cp)}%</td></tr>`).join('');
    const d=a.map(x=>x.d).sort().at(-1),st=a.find(x=>x.d===d);
    return `<div class="box"><h3>${k}　<small class="muted">${a.length} 檔（${idx.join('、')}）・資料日 ${d}（${tzl(st.tz)}時間）・${st.st}</small>　<a class="btn" href="#/gm/${encodeURIComponent(k)}">看全部 ${a.length} 檔</a></h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px"><table class="t"><tr><th class="l">漲幅前 5</th><th>價格</th><th>漲跌%</th></tr>${li(up)}</table><table class="t"><tr><th class="l">跌幅前 5</th><th>價格</th><th>漲跌%</th></tr>${li(dn)}</table></div></div>`}).join('');
  const draw=()=>{const X=GX.x,card=x=>`<div class="box" style="margin:0"><div style="display:flex;justify-content:space-between"><b>${esc(x.n)}</b><small class="muted">${esc(x.r||'')}</small></div><div style="font-size:20px;font-weight:700">${fx(x.p,x.k==='fx'?4:2)}</div><div class="${cls(x.ch)}">${sg(x.ch)}（${sg(x.cp)}%）</div>${spark(x.h)}<small class="muted">資料日 ${x.d}${x.tz?'（'+tzl(x.tz)+'）':''}・近一年走勢</small></div>`;
    m.innerHTML=tabs()+`<p class="count">全球市場報價來自 Yahoo Finance 公開資料，盤中報價延遲約 15–20 分鐘，每天更新 5 次（台北時間 5:13、10:13、14:13、17:13、22:13）；最後更新 ${GX.built}（台北時間）。僅供參考，不構成投資建議。</p>
    <h2>主要指數</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${X.filter(x=>x.k==='idx').map(card).join('')}</div>
    <h2>匯率</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${X.filter(x=>x.k==='fx').map(card).join('')}</div>
    <h2>各市場個股</h2>${grp}`};
  if(GX)return draw();m.innerHTML=tabs()+'載入中…';
  fetch('data/gidx.json?v='+D.meta.built).then(r=>r.json()).then(j=>{GX=j;if(tab==='global')draw()}).catch(()=>{m.innerHTML=tabs()+'<div class="empty">全球指數載入失敗。</div>'})}
function gstock(x,m){document.title=`${x.c} ${x.n}｜股票王`;
  const k=(n,v,c='')=>`<div><small>${n}</small><b class="${c}">${v}</b></div>`;
  m.innerHTML=`<div class="sk"><a href="#/global">← 回全球市場</a><h2 style="margin-top:8px">${esc(x.c)} ${esc(x.n)} <small style="font-size:14px;color:#888">${x.en?esc(x.en)+'・':''}<a href="#/gm/${encodeURIComponent(x.m)}">${x.m}</a>・${esc(x.i)}${x.ind?'／'+esc(x.ind):''}</small></h2>
  ${watchBtn(x.c)}
  <div class="disc">本站為公開資訊整理，不構成投資建議。報價來自 Yahoo Finance 公開資料，可能延遲 15–20 分鐘。</div>
  <div class="kv2">${k(`${x.st==='收盤'?'收盤價':'最新價'}（${x.cur}）`,fx(x.p))}${k('漲跌',sg(x.ch)+' ('+sg(x.cp)+'%)',cls(x.ch))}${k('成交量（股）',fi(x.v))}${k('本益比',fx(x.pe))}${k('殖利率（%）',fx(x.dy))}${k('資料時間',`${x.d}（${tzl(x.tz)}時間）・${x.st}`)}</div>
  <div class="box"><h3>近一年股價走勢（收盤價，${x.cur}）</h3><div id="chart">載入中…</div></div>
  <div class="box"><h3>基本資料</h3><p>${esc(x.full)}｜市場：${x.m}｜所屬指數：${esc((x.idx||[]).join('、'))}${x.mc?`｜市值：約 ${fi(Math.round(x.mc/1e8))} 億 ${x.cur}`:''}｜<a href="https://finance.yahoo.com/quote/${encodeURIComponent(x.c)}" target="_blank" rel="noopener">Yahoo Finance 原始頁面</a></p></div></div>`;
  bindWatchBtn();
  fetch(`data/h/${encodeURIComponent(x.c)}.json?v=${D.meta.built}`).then(r=>r.json()).then(h=>{$('#chart').innerHTML=chart(h.h)}).catch(()=>{$('#chart').textContent='載入失敗'})}

const WK='stockking.watchlist.v1';
const WMAX=40;
let GX_ERR=false;
let WARM=false;
const TP_NOW=new Date();
const tpFmt=(d,opt)=>new Intl.DateTimeFormat('sv-SE',Object.assign({timeZone:'Asia/Taipei',hourCycle:'h23'},opt)).format(d);
const TP_DAY=tpFmt(TP_NOW,{year:'numeric',month:'2-digit',day:'2-digit'});
const TP_CLOCK=tpFmt(TP_NOW,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const TP_WEEK=new Intl.DateTimeFormat('zh-Hant-TW',{timeZone:'Asia/Taipei',weekday:'long'}).format(TP_NOW);
function loadW(){try{const a=JSON.parse(localStorage.getItem(WK)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&x.trim()&&x.length<=16).slice(0,WMAX):[]}catch(e){return []}}
function saveW(a){localStorage.setItem(WK,JSON.stringify(a.slice(0,WMAX)))}
function canonCode(raw){const s=String(raw||'').trim();if(!s)return '';const hit=S.find(x=>x.c.toLowerCase()===s.toLowerCase());return hit?hit.c:s}
function watchBtn(c){const on=loadW().includes(c);return `<p style="margin:8px 0"><button type="button" class="btn" id="togWatch" data-c="${esc(c)}">${on?'自選中（按一下移除）':'加入自選'}</button></p><p class="dk-meta" id="togWatchMsg">自選只存在這台瀏覽器的 localStorage，重新整理會保留。不上傳，不接券商，不是持倉。</p>`}
function bindWatchBtn(){const b=$('#togWatch');if(!b)return;b.onclick=()=>{const c=b.getAttribute('data-c');let a=loadW();if(a.includes(c))a=a.filter(x=>x!==c);else a=[c,...a.filter(x=>x!==c)];saveW(a);b.textContent=a.includes(c)?'自選中（按一下移除）':'加入自選';const msg=$('#togWatchMsg');if(msg)msg.textContent=a.includes(c)?'已加入自選。只存在這台瀏覽器。':'已從自選移除。'}}
function numOrGap(v,d){return v==null||v===''||isNaN(+v)?'未提供':fx(v,d)}
function builtAge(s){if(!s||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s))return null;const t=Date.parse(s.replace(' ','T')+':00+08:00');return isNaN(t)?null:(Date.now()-t)/36e5}
function ageNote(s){const h=builtAge(s);if(h==null)return '抓取時間無法從檔案解析。';if(h<0)return '抓取時間晚於這台裝置的時鐘，請對時後再看。';if(h>=26)return `距離抓取約 ${Math.floor(h)} 小時，資料可能過期。`;if(h>=8)return `距離抓取約 ${Math.floor(h)} 小時，可能尚未寫入下一輪更新。`;return `距離抓取約 ${Math.floor(h)} 小時。`}
function dayLag(d,maxDay){if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d))return '狀態：資料交易日未提供，無法判斷休市或延遲。';const bits=[];if(d>TP_DAY)bits.push('資料日晚於台北今天');else if(d<TP_DAY)bits.push('早於台北今天，非即時');else bits.push('與台北今天同一天，仍非即時');if(maxDay&&/^\d{4}-\d{2}-\d{2}$/.test(maxDay)&&d<maxDay)bits.push(`早於同檔較新資料日 ${maxDay}，未核對休市行事曆`);return '狀態：'+bits.join('，')+'。'}
function srcLinks(parts){return parts.filter(Boolean).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('、')}
function idxLinks(x){const y=`https://finance.yahoo.com/quote/${encodeURIComponent(x.c)}`;const file='data/gidx.json';const bits=[['本站指數檔',file],['Yahoo Finance 代號頁',y]];if(x.c==='^TWII'||x.src==='TWSE')bits.push(['臺灣證券交易所','https://www.twse.com.tw/']);return srcLinks(bits)}
function idxSourceText(x){const bits=[];bits.push(x.src?`src「${x.src}」`:'src 未提供');bits.push(x.st?`盤別「${x.st}」`:'盤別未提供');if(x.k==='fx')bits.push('匯率沿用全球頁說明：Yahoo Finance 公開報價，非即時');else if(x.src==='TWSE')bits.push('此筆標 TWSE；其他指數為 Yahoo 代號，全球頁說明來自 Yahoo Finance，非即時');else bits.push('全球頁說明此類報價來自 Yahoo Finance，延遲而非即時');return bits.join('。')+'。'}
function dkSpark(h){if(!Array.isArray(h)||h.length<2)return `<p class="dk-gap">走勢未提供（資料點 ${Array.isArray(h)?h.length:0}，不足 2 點，不繪製）</p>`;const ys=h.map(r=>+r[1]).filter(v=>!isNaN(v));if(ys.length<2)return '<p class="dk-gap">走勢未提供（價格欄不足，不繪製）</p>';const mn=Math.min(...ys),mx=Math.max(...ys),rg=mx-mn||1,w=320,hh=48;const pts=h.map((r,i)=>`${(i*(w)/(h.length-1)).toFixed(1)},${(3+(hh-6)*(1-((+r[1])-mn)/rg)).toFixed(1)}`).join(' ');const up=ys[ys.length-1]>=ys[0];const cap=`走勢 ${h[0][0]} 至 ${h[h.length-1][0]}，${h.length} 點`;return `<div class="dk-spark"><svg role="img" aria-label="${esc(cap+'，起 '+ys[0]+' 迄 '+ys[ys.length-1]+'。線色只比較區間起迄，不是當日漲跌。')}" viewBox="0 0 ${w} ${hh}" preserveAspectRatio="none"><polyline fill="none" stroke="${ys[ys.length-1]===ys[0]?'#868e96':up?'#e03131':'#2b8a3e'}" stroke-width="2" points="${pts}"/></svg><p class="dk-meta">${esc(cap)}。最高 ${fx(mx)}、最低 ${fx(mn)}。線色只比較區間起迄，不是當日漲跌。</p></div>`}
function spreadText(rows,pick){const c={};rows.forEach(x=>{const k=pick(x)||'未提供';c[k]=(c[k]||0)+1});return Object.keys(c).sort((a,b)=>a<b?1:a>b?-1:0).map(k=>`${k}（${c[k]} 檔）`).join('、')||'未提供'}
function ad3(){return `<p class="ad3"><span>仁禾管理顧問</span><a href="mailto:renhe74123@gmail.com">renhe74123@gmail.com</a><a href="https://line.me/R/ti/p/@891tcxhu" target="_blank" rel="noopener">LINE 官方帳號：@891tcxhu</a></p>`}
function dashView(m){const draw=()=>{if(tab!=='dash')return;m.innerHTML=tabs()+dashboardHtml();bindDash()};if(GX||GX_ERR)return draw();m.innerHTML=tabs()+'<p class="count">市場主控台載入中…</p>';fetch('data/gidx.json?v='+encodeURIComponent(D.meta.built)).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(j=>{GX=j;GX_ERR=false}).catch(()=>{GX=null;GX_ERR=true}).then(()=>{if(tab==='dash')draw()})}
function dashboardHtml(){const meta=D.meta,g=meta.g||{},idx=GX&&Array.isArray(GX.x)?GX.x.filter(x=>x.k==='idx'):[],fxs=GX&&Array.isArray(GX.x)?GX.x.filter(x=>x.k==='fx'):[],maxDay=idx.map(x=>x.d).filter(Boolean).sort().at(-1)||'';const news=Array.isArray(D.news)?D.news:[];const newsDays=[...new Set(news.map(z=>z.d).filter(Boolean))].sort();const byInd={};let unmatched=0;news.forEach(z=>{const x=M[z.c];const name=x&&x.i?x.i:'';if(!name)unmatched++;const k=name||'未提供';(byInd[k]||(byInd[k]=[])).push(z)});const indRows=Object.keys(byInd).sort((a,b)=>byInd[b].length-byInd[a].length);const companies=new Set(news.map(z=>z.c));const missP=S.filter(x=>x.p==null).length;const gBuilt=(GX&&GX.built)||g.built||'';const qAge=ageNote(meta.built),gAge=gBuilt?ageNote(gBuilt):'全球檔抓取時間未提供。';
  const lagIdx=idx.filter(x=>x.d&&maxDay&&x.d<maxDay);
  const kpis=[['重大訊息則數',news.length?fi(news.length):'未提供',news.length?`發言日 ${newsDays.join('、')}`:'資料檔 news 是空的'],['可對到公司產業',news.length?`${fi(news.length-unmatched)} / ${fi(news.length)}`:'未提供',unmatched?`${unmatched} 則沒有公司產業`:'以公告公司的 i 欄對應，不是因果'],['涉及公司數',news.length?fi(companies.size):'未提供','同一公司可有多則公告'],['沒有價格的標的',fi(missP),'這些標的顯示未提供，不補數字'],['指數資料日不一致',lagIdx.length?fi(lagIdx.length)+' 條':'沒有',lagIdx.length?lagIdx.map(x=>x.n).join('、'):'與同檔較新的指數日相比']];
  const gaps=[];
  if(!news.length)gaps.push('重大訊息未提供。');
  else if(newsDays.length===1)gaps.push(`重大訊息只含發言日 ${newsDays[0]}，共 ${news.length} 則。沒有別的日期，頁面不補。`);
  if(meta.qdate&&newsDays.length&&newsDays.at(-1)<meta.qdate)gaps.push(`重大訊息最新發言日 ${newsDays.at(-1)} 早於收盤資料日 ${meta.qdate}。這只表示檔案內容停在發言日，不代表後來沒有公告。`);
  if(missP)gaps.push(`${missP} 檔沒有價格。`);
  if(GX_ERR)gaps.push('全球指數檔載入失敗，指數與匯率走勢不顯示。');
  else if(!GX||!Array.isArray(GX.x))gaps.push('全球指數檔沒有 x 陣列。');
  else {const short=GX.x.filter(x=>!Array.isArray(x.h)||x.h.length<2);if(short.length)gaps.push('走勢點數不足、不繪製：'+short.map(x=>`${x.n}（${Array.isArray(x.h)?x.h.length:0} 點）`).join('、')+'。');const days=[...new Set(idx.map(x=>x.d||'未提供'))];if(days.length>1)gaps.push('指數資料日並不一致：'+days.join('、')+'。頁面保留各自的日期。');}
  if(!idx.some(x=>/櫃買|OTC/i.test(x.n||'')))gaps.push('指數檔沒有櫃買指數，不另畫櫃買走勢。');
  if(!S.some(x=>x.m==='陸股'||x.m==='韓股'))gaps.push('個股清單沒有陸股或韓股。上證、深證、KOSPI 只在指數檔，不能用個股回推。');
  const codeInd=S.filter(x=>x.g&&/^[A-Z0-9]{8,}$/.test(x.i||''));
  if(codeInd.length)gaps.push(`${codeInd.length} 檔全球個股的產業欄是代碼（例如 ISIN），不是產業名稱，不放進產業清單。`);
  gaps.push(meta.rdate?`月營收資料月份是 ${meta.rdate}，與報價日不同。`:'月營收月份未提供。');
  gaps.push('沒有 AI 分析欄位，本頁不做 AI 解讀。');
  gaps.push('沒有交易所行事曆，只標日期差，不判斷是休市還是來源延遲。');
  if(Array.isArray(meta.fail)&&meta.fail.length)gaps.push('目錄記載部分來源抓取失敗：'+meta.fail.map(f=>f[0]).join('、')+'。');
  const fresh=`<p class="dk-warn">本頁讀取時間 ${esc(TP_CLOCK)}（台北，${esc(TP_WEEK)}）。個股與重大訊息抓取時間 ${esc(meta.built||'未提供')}（台北）。${esc(qAge)} 全球指數檔抓取時間 ${esc(gBuilt||'未提供')}（台北）。${esc(gAge)} 這些都是已寫入的快照，不是盤中即時。</p>`;
  const cards=kpis.map(([t,v,s])=>`<article class="dk-kpi"><h3>${esc(t)}</h3><b>${esc(v)}</b><p class="dk-meta">${esc(s)}</p><p class="dk-meta">來源：<a href="data/all.json">data/all.json</a>${t.startsWith('指數')?'、<a href="data/gidx.json">data/gidx.json</a>':''}。抓取：${esc(meta.built||'未提供')}（台北）。</p></article>`).join('');
  const series=(x,digits)=>`<article class="dk-card"><h3>${esc(x.n||'名稱未提供')}</h3><p class="dk-px">${numOrGap(x.p,digits)}</p><p class="${cls(x.cp)}">${x.cp==null?'漲跌未提供':sg(x.cp)+'%'}${x.ch==null?'':`（${sg(x.ch)}）`}</p>${dkSpark(x.h)}<p class="dk-meta">${esc(dayLag(x.d,x.k==='idx'?maxDay:''))}</p><p class="dk-meta">資料交易日 ${esc(x.d||'未提供')}${x.tz?'（'+esc(tzl(x.tz))+'時間）':'（時區未提供）'}。抓取時間 ${esc(gBuilt||'未提供')}（台北）。</p><p class="dk-meta">${esc(idxSourceText(x))}來源：${idxLinks(x)}。</p></article>`;
  const mkt=MKS.map(name=>{const rows=S.filter(x=>x.m===name);const global=rows.some(isG);const built=global?(g.built||meta.built):meta.built;const src=name==='上市'?[['臺灣證券交易所','https://www.twse.com.tw/'],['本站目錄','data/all.json']]:name==='上櫃'?[['證券櫃檯買賣中心','https://www.tpex.org.tw/'],['本站目錄','data/all.json']]:[['Yahoo Finance','https://finance.yahoo.com/'],['本站目錄','data/all.json'],['這個市場的清單','#/gm/'+encodeURIComponent(name)]];return `<tr><td class="l">${esc(name)}</td><td class="l">${fi(rows.length)} 檔，有價格 ${fi(rows.filter(x=>x.p!=null).length)}</td><td class="l">${esc(spreadText(rows,x=>x.g?x.d:x.id))}</td><td class="l">${esc(built||'未提供')}（台北）</td><td class="l">${srcLinks(src)}</td></tr>`}).join('');
  const ev=news.slice().sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.t||'').localeCompare(a.t||'')).slice(0,8).map(z=>{const x=M[z.c];const ind=x&&x.i?x.i:'';let how='產業未提供';if(ind){const blob=(z.s||'')+(z.x||'');how=ind.length>=3&&blob.includes(ind)?`公司產業「${ind}」。主旨或內文含相同字樣，這是關鍵字配對，不是因果`:`公司產業分類為「${ind}」。公告文字沒有這串產業名稱，只依公司資料對應，不是因果推論`}return `<article class="news"><div class="m">${esc(z.d||'日期未提供')} ${esc(z.t||'')}・${esc(z.m||'')}・<a href="#/s/${encodeURIComponent(z.c)}">${esc(z.c)} ${esc(z.n||'')}</a></div><p style="margin:4px 0">${esc(z.s||'主旨未提供')}</p><p class="dk-meta">${esc(how)}。來源：<a href="https://mops.twse.com.tw/" target="_blank" rel="noopener">公開資訊觀測站</a>、<a href="data/all.json">data/all.json</a>。資料交易日（發言日）${esc(z.d||'未提供')}。抓取時間 ${esc(meta.built||'未提供')}（台北）。本檔沒有單則公告深連結。</p></article>`}).join('');
  const indTbl=indRows.slice(0,18).map(i=>`<tr><td class="l">${i==='未提供'?esc(i):`<a href="#/ind/${encodeURIComponent(i)}">${esc(i)}</a>`}</td><td>${fi(byInd[i].length)}</td><td>${fi(new Set(byInd[i].map(z=>z.c)).size)}</td></tr>`).join('');
  const twInd={};S.filter(x=>!x.g).forEach(x=>{twInd[x.i]=(twInd[x.i]||0)+1});const twTop=Object.keys(twInd).sort((a,b)=>twInd[b]-twInd[a]).slice(0,12).map(i=>`<a class="btn" href="#/ind/${encodeURIComponent(i)}">${esc(i)} <small>${twInd[i]} 檔</small></a>`).join('');
  const gInd={};S.filter(x=>isG(x)&&!/^[A-Z0-9]{8,}$/.test(x.i||'')).forEach(x=>{gInd[x.i]=(gInd[x.i]||0)+1});const gTop=Object.keys(gInd).sort((a,b)=>gInd[b]-gInd[a]).map(i=>`<a class="btn" href="#/ind/${encodeURIComponent(i)}">${esc(i)} <small>${gInd[i]} 檔</small></a>`).join('');
  return `<div class="dk"><section class="dk-sec"><h2>股票王市場主控台</h2><p class="dk-lead">資訊彙整，不構成投資建議，不提供買賣點、報酬保證或個人建議。沒有模型產生的解讀；下面的數字都來自既有資料檔，缺的就標未提供。</p>${ad3()}<p class="dk-meta" style="margin-top:8px">選股篩選、個股行情、法人與重大訊息全文仍在上方頁籤。</p>${fresh}</section>
  <section class="dk-sec" aria-labelledby="ev-h"><h2 id="ev-h">重大事件摘要</h2><p class="dk-lead">這些卡片是公告數量與資料狀態，不是風險評分，也不代表買賣時機。</p><div class="dk-kpis">${cards}</div><div class="dk-warn" style="margin-top:10px"><b>資料缺口</b><ul>${gaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div></section>
  <section class="dk-sec" aria-labelledby="mkt-h"><h2 id="mkt-h">台灣與全球市場走勢</h2><p class="dk-lead">小圖只畫資料檔裡的收盤序列。點數不足就留白。跨市場日期不同時各自保留，不改成同一天。</p>${GX_ERR?'<p class="dk-err">全球指數檔載入失敗。請稍後重新整理。個股頁籤仍可使用已載入的目錄。</p>':''}${idx.length?`<div class="dk-grid">${idx.map(x=>series(x,2)).join('')}</div>`:'<p class="dk-gap">指數未提供。</p>'}<h3>匯率</h3>${fxs.length?`<div class="dk-grid">${fxs.map(x=>series(x,4)).join('')}</div>`:'<p class="dk-gap">匯率未提供。</p>'}<h3>各市場個股覆蓋</h3><p class="dk-meta">下表是目錄裡的檔數與資料日分布，不是漲跌幅排行，也不是推薦名單。</p><div class="tw"><table class="t"><thead><tr><th class="l">市場</th><th class="l">檔數</th><th class="l">資料交易日分布</th><th class="l">抓取時間</th><th class="l">來源</th></tr></thead><tbody>${mkt}</tbody></table></div><p style="margin-top:8px"><a class="btn" href="#/global">開啟既有全球市場頁</a> <a class="btn" href="#/screen">開啟選股篩選</a></p></section>
  <section class="dk-sec" aria-labelledby="ind-h"><h2 id="ind-h">產業資訊與事件對應</h2><p class="dk-lead">台股產業名稱與全球個股產業名稱不是同一套分類，只並列、不比較強弱。事件列的產業來自公告公司在目錄中的產業欄。</p><h3>重大訊息對到的產業</h3><p class="dk-meta">依則數排列是為了閱讀，不是看好程度。來源 <a href="data/all.json">data/all.json</a>，發言日 ${esc(newsDays.join('、')||'未提供')}，抓取 ${esc(meta.built||'未提供')}（台北）。</p>${indTbl?`<div class="tw"><table class="t"><thead><tr><th class="l">產業</th><th>公告則數</th><th>公司數</th></tr></thead><tbody>${indTbl}</tbody></table></div>`:'<p class="dk-gap">沒有可對應的產業。</p>'}<h3>最近公告（最多 8 則）</h3>${ev||'<p class="dk-gap">重大訊息未提供。</p>'}<p><a class="btn" href="#/news">看重大訊息全文</a></p><h3>上市櫃產業檔數</h3><div class="indg">${twTop||'<p class="dk-gap">未提供。</p>'}</div><h3>全球個股產業檔數</h3><p class="dk-meta">這組名稱來自全球個股的 i 欄，與上市櫃產業分類不同。</p><div class="indg">${gTop||'<p class="dk-gap">未提供。</p>'}</div></section>
  <section class="dk-sec" aria-labelledby="w-h"><h2 id="w-h">自選標的</h2><p class="dk-lead">名單只存在這台瀏覽器。可以新增、移除、重新整理後保留，也可以清除。不接券商，不記錄股數、成本或身分資料。</p><form id="wForm" class="dk-form"><label for="wInput">請輸入完整代號</label><div class="dk-row"><input id="wInput" class="dk-input" type="text" maxlength="16" autocomplete="off" placeholder="例如 2330、0050、AAPL" enterkeyhint="done"><button class="btn primary" type="submit">加入</button><button class="btn" id="wClear" type="button">清除全部</button></div><p id="wStatus" class="dk-meta" role="status" aria-live="polite"></p></form><div id="wList" class="dk-watch"></div></section></div>`}
function bindDash(){WARM=false;const form=$('#wForm');const status=t=>{const n=$('#wStatus');if(n)n.textContent=t};const paint=()=>{const box=$('#wList');if(!box)return;const a=loadW();if(!a.length){box.innerHTML='<p class="dk-gap">自選是空的。輸入代號後按加入。</p>';return}box.innerHTML=a.map(c=>{const x=M[c];if(!x)return `<article class="dk-witem" data-code="${esc(c)}"><div><b>${esc(c)}</b><p class="dk-gap">本站資料未提供此代號，沒有價格與走勢。</p></div><button type="button" class="btn" data-rm="${esc(c)}">移除</button></article>`;const day=x.g?(x.d||'未提供'):(x.id||'未提供');const built=x.g?((D.meta.g&&D.meta.g.built)||D.meta.built):D.meta.built;const src=x.g?srcLinks([['Yahoo Finance','https://finance.yahoo.com/quote/'+encodeURIComponent(x.c)],['本站目錄','data/all.json']]):srcLinks(x.m==='上櫃'?[['證券櫃檯買賣中心','https://www.tpex.org.tw/'],['個股頁','#/s/'+encodeURIComponent(x.c)]]:[['臺灣證券交易所','https://www.twse.com.tw/'],['個股頁','#/s/'+encodeURIComponent(x.c)]]);return `<article class="dk-witem" data-code="${esc(c)}"><div><b><a href="#/s/${encodeURIComponent(x.c)}">${esc(x.c)} ${esc(x.n)}</a></b> <span class="dk-meta">${esc(x.m)}・${esc(x.i||'產業未提供')}</span><p class="dk-px">${numOrGap(x.p,2)}${x.cur?' '+esc(x.cur):''} <small class="${cls(x.cp)}">${x.cp==null?'漲跌未提供':sg(x.cp)+'%'}</small></p><p class="dk-meta">資料交易日 ${esc(day)}${x.tz?'（'+esc(tzl(x.tz))+'）':x.g?'':'（欄位 id）'}。${esc(dayLag(day,''))}</p><p class="dk-meta">抓取時間 ${esc(built||'未提供')}（台北）。狀態：${esc(x.st||(x.g?'檔案未提供盤別':'收盤資料'))}。來源：${src}。</p><div class="w-spark" data-c="${esc(c)}"><p class="dk-meta">走勢載入中…</p></div></div><button type="button" class="btn" data-rm="${esc(c)}">移除</button></article>`}).join('');box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{saveW(loadW().filter(x=>x!==b.getAttribute('data-rm')));WARM=false;$('#wClear').textContent='清除全部';status('已移除 '+b.getAttribute('data-rm'));paint()});a.forEach(c=>{if(!M[c])return;fetch('data/h/'+encodeURIComponent(c)+'.json?v='+encodeURIComponent(D.meta.built)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(h=>{const el=[...box.querySelectorAll('.w-spark')].find(n=>n.getAttribute('data-c')===c);if(el)el.innerHTML=dkSpark(h.h)}).catch(()=>{const el=[...box.querySelectorAll('.w-spark')].find(n=>n.getAttribute('data-c')===c);if(el)el.innerHTML='<p class="dk-gap">走勢未提供（歷史檔讀取失敗）</p>'})})};if(form)form.onsubmit=e=>{e.preventDefault();const raw=$('#wInput').value;const c=canonCode(raw);if(!c){status('請輸入代號');return}if(c.length>16){status('代號過長，未加入');return}let a=loadW();if(a.includes(c)){status(c+' 已在自選');$('#wInput').value='';return}if(a.length>=WMAX){status('自選已達 '+WMAX+' 檔，請先移除再加入');return}a=[c,...a];saveW(a);$('#wInput').value='';status(M[c]?('已加入 '+c+' '+M[c].n):('已加入 '+c+'。本站沒有此代號，價格顯示未提供'));paint()};const clr=$('#wClear');if(clr)clr.onclick=()=>{if(!loadW().length){status('自選本來就是空的');return}if(!WARM){WARM=true;clr.textContent='確定清除自選';status('再按一次才會清除這台瀏覽器的自選');return}saveW([]);WARM=false;clr.textContent='清除全部';status('已清除自選');paint()};paint()}
