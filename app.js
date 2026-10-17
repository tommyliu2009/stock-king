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
function route(){if(!D)return;const h=decodeURIComponent(location.hash.slice(2));window.scrollTo(0,0);
  if(h.startsWith('s/'))return stock(h.slice(2));
  if(h.startsWith('q/'))return listView('搜尋「'+h.slice(2)+'」',find(h.slice(2)));
  if(h.startsWith('gm/'))return listView('全球市場：'+h.slice(3),S.filter(x=>x.m===h.slice(3)));
  if(h.startsWith('ind/'))return listView('產業：'+h.slice(4),S.filter(x=>x.i===h.slice(4)));
  tab=['screen','global','ind','inst','news'].includes(h)?h:'screen';home()}
const tabs=()=>`<div class="tabs">${[['screen','選股篩選'],['global','全球市場'],['ind','產業分類'],['inst','法人買賣超排行'],['news','今日重大訊息']].map(([k,n])=>`<button class="tab${tab===k?' on':''}" onclick="go('${k}')">${n}</button>`).join('')}<button class="tab only-mobile" onclick="$('#filters').classList.add('open')">⚙ 篩選條件</button></div>`;
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
  m.innerHTML=`<div class="sk"><a href="#/">← 回列表</a><h2 style="margin-top:8px">${x.c} ${esc(x.n)} <small style="font-size:14px;color:#888">${x.m}・<a href="#/ind/${encodeURIComponent(x.i)}">${esc(x.i)}</a></small></h2>
  <div class="disc">本站為公開資訊整理，不構成投資建議。</div>
  <div class="kv2">${k('收盤價（'+(x.m==='上市'?D.meta.qdate:D.meta.odate)+'）',fx(x.p))}${k('漲跌',sg(x.ch)+' ('+sg(x.cp)+'%)',cls(x.ch))}${k('成交量（張）',fi(x.v))}${k('本益比',fx(x.pe))}${k('殖利率（%）',fx(x.dy))}${k('股價淨值比',fx(x.pb))}</div>
  <div class="box"><h3>近一年股價走勢（收盤價）</h3><div id="chart">載入中…</div></div>
  <div class="box"><h3>三大法人買賣超（張）</h3><div id="inst">載入中…</div></div>
  <div class="box"><h3>月營收（千元）</h3>${x.ry?`<table class="t"><tr><th class="l">資料年月</th><th>當月營收</th><th>月增率</th><th>去年同月</th><th>年增率</th><th>累計營收</th><th>累計年增</th></tr><tr><td class="l">${x.ry}</td><td>${fi(x.r)}</td><td class="${cls(x.rm)}">${sg(x.rm)}%</td><td>${fi(x.rl)}</td><td class="${cls(x.ryy)}">${sg(x.ryy)}%</td><td>${fi(x.rc)}</td><td class="${cls(x.rcy)}">${sg(x.rcy)}%</td></tr></table>`:'<p class="muted">無月營收資料（ETF 或未申報）。</p>'}</div>
  <div class="box"><h3>近期重大訊息</h3><div id="snews">載入中…</div></div>
  ${x.full?`<div class="box"><h3>公司基本資料</h3><p>${esc(x.full)}｜董事長：${esc(x.chair)}｜成立：${ymd(x.est)}｜上市櫃：${ymd(x.lst)}｜實收資本額：${fi(x.cap)} 元${x.web?`｜<a href="${esc(x.web.startsWith('http')?x.web:'http://'+x.web)}" target="_blank" rel="noopener">公司網站</a>`:''}｜<a href="https://mops.twse.com.tw/mops/#/web/t05st01" target="_blank" rel="noopener">公開資訊觀測站</a></p></div>`:''}</div>`;
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
  <div class="disc">本站為公開資訊整理，不構成投資建議。報價來自 Yahoo Finance 公開資料，可能延遲 15–20 分鐘。</div>
  <div class="kv2">${k(`${x.st==='收盤'?'收盤價':'最新價'}（${x.cur}）`,fx(x.p))}${k('漲跌',sg(x.ch)+' ('+sg(x.cp)+'%)',cls(x.ch))}${k('成交量（股）',fi(x.v))}${k('本益比',fx(x.pe))}${k('殖利率（%）',fx(x.dy))}${k('資料時間',`${x.d}（${tzl(x.tz)}時間）・${x.st}`)}</div>
  <div class="box"><h3>近一年股價走勢（收盤價，${x.cur}）</h3><div id="chart">載入中…</div></div>
  <div class="box"><h3>基本資料</h3><p>${esc(x.full)}｜市場：${x.m}｜所屬指數：${esc((x.idx||[]).join('、'))}${x.mc?`｜市值：約 ${fi(Math.round(x.mc/1e8))} 億 ${x.cur}`:''}｜<a href="https://finance.yahoo.com/quote/${encodeURIComponent(x.c)}" target="_blank" rel="noopener">Yahoo Finance 原始頁面</a></p></div></div>`;
  fetch(`data/h/${encodeURIComponent(x.c)}.json?v=${D.meta.built}`).then(r=>r.json()).then(h=>{$('#chart').innerHTML=chart(h.h)}).catch(()=>{$('#chart').textContent='載入失敗'})}
