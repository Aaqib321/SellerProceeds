const INC_D=['Incentive (NSP/VBI)','No Incentive'];

function npCard(label,net,sub){const disp=(typeof net==='number'&&isFinite(net))?fB(net):'—';return `<div class="np-card"><div class="npl">${label}</div><div class="npv">${disp}</div><div class="nps">${sub}</div></div>`;}
function npStrip(id,items){const el=document.getElementById(id);if(!el)return;el.innerHTML=items.map(it=>npCard(it.l,it.n,it.s||'Net Proceeds')).join('');}
let activeMode=false;
function toggleActive(el){
  activeMode=!activeMode;
  el.classList.toggle('active',activeMode);
  document.getElementById('act-icon').textContent=activeMode?'●':'◎';
  el.querySelector ? el.childNodes[1].textContent=(activeMode?' Active Only':' All Sellers') : null;
  el.innerHTML=(activeMode?'<span id="act-icon">●</span> Active Only':'<span id="act-icon">◎</span> All Sellers');
  el.classList.toggle('active',activeMode);
  kpis();
  if(BUILD[activeTab])BUILD[activeTab]();
}
function src(){return activeMode&&typeof D_ACT!=='undefined'?D_ACT:D;}

function npTot(t,d,m){return t.series[d]?t.series[d][m].reduce((a,b)=>a+b,0):0;}
const INC_C=['#8fba9e','#88b0cc'];
let grain='month',activeTab='ov',crossMode='geo_acct',selPF=null;
const CH={};
const P=['#88b0cc','#8fba9e','#c8a46a','#b88a90','#72aeb0','#b8aa84','#9898bc','#8aac88','#c89888','#88a8c0','#8ab8a4','#b0a0c8'];
const a=(h,o)=>h+Math.round(o*255).toString(16).padStart(2,'0');
const GC='rgba(255,255,255,.035)',TC='#525870',BG='#1a1d2a',BB='#262938';
function base(x){return Object.assign({responsive:true,maintainAspectRatio:false,animation:{duration:280},interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#606880',font:{size:10.5},padding:9,boxWidth:8}},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fB(ctx.parsed.y*1e9)}`}}},scales:{x:{ticks:{color:TC,font:{size:9},maxRotation:38},grid:{color:GC}},y:{ticks:{color:TC,font:{size:9}},grid:{color:GC}}}},x||{});}
function pct(x){const o=base(x);o.plugins.tooltip={backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`}};o.scales.y={ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}};return o;}
function stackO(){return{responsive:true,maintainAspectRatio:false,animation:{duration:280},interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#606880',font:{size:10.5},padding:9,boxWidth:8}},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fB(ctx.parsed.y*1e9)}`}}},scales:{x:{stacked:true,ticks:{color:TC,font:{size:9},maxRotation:38},grid:{color:GC}},y:{stacked:true,ticks:{color:TC,font:{size:9}},grid:{color:GC}}}};}
function donutO(){return{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:'#606880',font:{size:10.5},padding:9,boxWidth:8}},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,callbacks:{label:ctx=>` ${fB(ctx.parsed)}`}}}};}
const fB=v=>{const s=v<0?'-':'',abs=Math.abs(v);if(abs>=1e9)return s+'$'+(abs/1e9).toFixed(2)+'B';if(abs>=1e6)return s+'$'+(abs/1e6).toFixed(1)+'M';return s+'$'+abs.toFixed(2);};
const toB=arr=>arr.map(v=>+(v/1e9).toFixed(4));
const toM=arr=>arr.map(v=>+(v/1e6).toFixed(2));
function mk(id,type,data,opts){if(CH[id]){CH[id].destroy();delete CH[id];}const el=document.getElementById(id);if(!el)return;CH[id]=new Chart(el.getContext('2d'),{type,data,options:opts});return CH[id];}
function L(label,data,color,fill=false){return{label,data,borderColor:color,backgroundColor:fill?a(color,0.07):'transparent',fill,tension:0.38,pointRadius:0,borderWidth:1.9};}
function Ldash(label,data,color,dashArr=[5,3],bw=1.5){return Object.assign(L(label,data,color),{borderDash:dashArr,borderWidth:bw,borderColor:a(color.startsWith('#')?color:color,0.75)});}
function B(label,data,color){return{label,data,backgroundColor:a(color,0.68),borderRadius:3,borderSkipped:false};}
function tab(k){const s=src();return(s[k]&&s[k][grain])?s[k][grain]:D[k][grain];}
function gs(t,d,m){const s=t.series[d];return s?s[m]:[];}
function gsFba(t,d){const s=t.series[d];if(!s)return [];return s.fba_fees||s.fba_storage||[];}
function tot(t,d,m){return gs(t,d,m).reduce((a,b)=>a+b,0);}
/* Build 3-layer fee datasets: solid=total, long-dash=Ref+P&P, short-dash=FBA Storage */
function feeDs(t,dims,cFn){
  return dims.flatMap(d=>{
    const f=gs(t,d,'fees'),st=gsFba(t,d),g=gs(t,d,'gms');
    const c=cFn(d);
    const hasSt=st&&st.length>0;
    const total=f.map((v,i)=>g[i]>0?+((v+(hasSt?(st[i]||0):0))/g[i]*100).toFixed(2):0);
    const ref=f.map((v,i)=>g[i]>0?+(v/g[i]*100).toFixed(2):0);
    const stPct=hasSt?st.map((v,i)=>g[i]>0?+((v||0)/g[i]*100).toFixed(2):0):null;
    const out=[
      Object.assign(L(d+' — Total Fees',total,c),{borderWidth:2.3}),
      Ldash(d+' — Ref+P&P',ref,c,[5,3],1.5)
    ];
    if(stPct)out.push(Ldash(d+' — FBA Storage/IB',stPct,c,[2,2],1.3));
    return out;
  });
}
const GEO=['Domestic','OOC - CN','OOC - Others'];
const ACCT=['Brand Owner','Reseller'];
const geoC={'Domestic':'#88b0cc','OOC - CN':'#c89888','OOC - Others':'#c8a46a'};
const acC={'Brand Owner':'#9898bc','Reseller':'#8aac88'};
function kpis(){const s=src().summary||D.summary;document.getElementById('kv-gms').textContent=fB(s.gms);document.getElementById('kv-net').textContent=fB(s.net);document.getElementById('kv-fees').textContent=fB(s.fees);document.getElementById('kv-units').textContent=(s.units/1e9).toFixed(2)+'B';document.getElementById('kv-mg').textContent=s.net_pct_gms.toFixed(2)+'%';
  const periodLabel=activeMode?'Full period 2021–2026 · active only':'Full period 2021–2026';
  const elG=document.getElementById('ksub-gms');if(elG)elG.textContent=periodLabel;
  const elN=document.getElementById('ksub-net');if(elN)elN.textContent=periodLabel;
  const elF=document.getElementById('ksub-fees');if(elF)elF.textContent=periodLabel;
  const selCount=activeMode?(typeof D_ACT!=='undefined'?D_ACT.summary.sellers:225927):530516;
  const elU=document.getElementById('ksub-units');if(elU)elU.textContent='Full period · '+selCount.toLocaleString()+' sellers';
  const elM=document.getElementById('ksub-mg');if(elM)elM.textContent='Full period average';}
function bldOv(){const _ts=D.total.year;npStrip('np-ov',[{l:'Total Net Proceeds',n:npTot(_ts,'','net'),s:'All sellers · Full period'},{l:'Total GMS',n:npTot(_ts,'','gms'),s:'Gross merchandise sales'},{l:'Total Fees',n:npTot(_ts,'','fees'),s:'Referral + FBA P&P'}]);const t=tab('total'),tm=t.times;const ovO=base();ovO.plugins.vlines={lines:feLines(grain)};mk('c-ov-trend','line',{labels:tm,datasets:[L('GMS',toB(gs(t,'','gms')),'#88b0cc',true),L('Net Proceeds',toB(gs(t,'','net')),'#8fba9e',true)]},ovO);mk('c-ov-mg','line',{labels:tm,datasets:[L('Net Margin %',gs(t,'','net_pct_gms'),'#72aeb0')]},pct({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` Margin: ${ctx.parsed.y.toFixed(2)}%`}}}}));mk('c-ov-fees','bar',{labels:tm,datasets:[B('Referral + FBA P&P',toB(gs(t,'','fees')),'#c8a46a')]},base({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${fB(ctx.parsed.y*1e9)}`}}}}));mk('c-ov-units','bar',{labels:tm,datasets:[B('Units (M)',toM(gs(t,'','units')),'#b8aa84')]},{...base(),plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${ctx.parsed.y.toFixed(1)}M units`}}}});}
function bldGeo(){const _gy=D.geo.year;npStrip('np-geo',GEO.map(d=>({l:d,n:npTot(_gy,d,'net'),s:fB(npTot(_gy,d,'gms'))+' GMS · '+(npTot(_gy,d,'net')/npTot(_gy,d,'gms')*100).toFixed(1)+'% margin'})));const t=tab('geo'),tm=t.times;mk('c-geo-gms','bar',{labels:tm,datasets:GEO.map(d=>B(d,toB(gs(t,d,'gms')),geoC[d]))},stackO());mk('c-geo-dn','doughnut',{labels:GEO,datasets:[{data:GEO.map(d=>tot(t,d,'gms')),backgroundColor:GEO.map(d=>a(geoC[d],.78)),borderColor:'#1a1d2a',borderWidth:3}]},donutO());mk('c-geo-mg','line',{labels:tm,datasets:GEO.map(d=>L(d,gs(t,d,'net_pct_gms'),geoC[d]))},pct());mk('c-geo-fee','line',{labels:tm,datasets:feeDs(t,GEO,d=>geoC[d])},pct());}
function bldSeller(){const _ay=D.acct.year;npStrip('np-seller',ACCT.map(d=>({l:d,n:npTot(_ay,d,'net'),s:fB(npTot(_ay,d,'gms'))+' GMS'})));const t=tab('acct'),tm=t.times;mk('c-ac-gms','bar',{labels:tm,datasets:ACCT.map(d=>B(d,toB(gs(t,d,'gms')),acC[d]))},base());mk('c-ac-dn','doughnut',{labels:ACCT,datasets:[{data:ACCT.map(d=>tot(t,d,'gms')),backgroundColor:ACCT.map(d=>a(acC[d],.78)),borderColor:'#1a1d2a',borderWidth:3}]},donutO());mk('c-ac-mg','line',{labels:tm,datasets:ACCT.map(d=>L(d,gs(t,d,'net_pct_gms'),acC[d]))},pct());mk('c-ac-fee','line',{labels:tm,datasets:feeDs(t,ACCT,d=>acC[d])},pct());}
function bldPF(){const _py=D.pf.year;const _pfs=_py.dims.map(d=>d[0]).filter(p=>p!=='Unknown'&&p!=='Digital').sort((a,b)=>npTot(_py,b,'gms')-npTot(_py,a,'gms'));npStrip('np-pf',_pfs.map((p,i)=>({l:p,n:npTot(_py,p,'net'),s:fB(npTot(_py,p,'gms'))+' GMS'})));const t=tab('pf');const pfs=t.dims.map(d=>d[0]).filter(p=>p!=='Unknown'&&p!=='Digital');const sp=selPF;const mgT=pfs.map(p=>{const G=gs(t,p,'gms').reduce((a,b)=>a+b,0),N=gs(t,p,'net').reduce((a,b)=>a+b,0);return G>0?+(N/G*100).toFixed(2):0;});const pfBg=pfs.map((p,i)=>p===sp?a(P[i%P.length],.85):a(P[i%P.length],sp?.3:.72));mk('c-pf-mg','bar',{labels:pfs,datasets:[{label:'Net Margin %',data:mgT,backgroundColor:pfBg,borderRadius:4,borderSkipped:false}]},{...base(),indexAxis:'y',plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',footer:()=>['Click to drill'],callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(2)}%`}}},scales:{x:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}},y:{ticks:{color:'#b0b8d0',font:{size:11}},grid:{color:GC}}},onClick:(e,els)=>{if(els.length){selPF=pfs[els[0].index];bldPF();}}});mk('c-pf-trend','line',{labels:t.times,datasets:pfs.map((p,i)=>L(p,gs(t,p,'net_pct_gms'),P[i%P.length]))},pct());document.getElementById('bc').style.display=sp?'flex':'none';document.getElementById('gl-sec').style.display=sp?'block':'none';if(sp){document.getElementById('bc-sel').textContent=sp;document.getElementById('gl-bar-h').textContent='Net Margin % by GL — '+sp;document.getElementById('gl-trend-h').textContent='Net Margin % trend — '+sp;bldGL(sp);}}
function bldGL(pf){const pg=D.pf_gl[grain][pf];if(!pg)return;const gls=Object.keys(pg).filter(g=>g!=='Unknown');const glMg=gls.map(gl=>{const G=pg[gl].gms.reduce((a,b)=>a+b,0),N=pg[gl].net.reduce((a,b)=>a+b,0);return G>0?+(N/G*100).toFixed(2):0;});const glGms=gls.map(gl=>+(pg[gl].gms.reduce((a,b)=>a+b,0)/1e9).toFixed(4));mk('c-gl-mg','bar',{labels:gls,datasets:[{label:'Net Margin %',data:glMg,backgroundColor:glMg.map(m=>m>=80?a('#8fba9e',.75):m>=74?a('#72aeb0',.75):a('#c8a46a',.75)),borderRadius:3,borderSkipped:false}]},{...base(),indexAxis:'y',plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(2)}%`}}},scales:{x:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}},y:{ticks:{color:'#b0b8d0',font:{size:11}},grid:{color:GC}}}});mk('c-gl-gms','bar',{labels:gls,datasets:[{label:'GMS ($B)',data:glGms,backgroundColor:gls.map((_,i)=>a(P[i%P.length],.65)),borderRadius:3,borderSkipped:false}]},base({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${fB(ctx.parsed.y*1e9)}`}}}}));const times=pg[gls[0]]?pg[gls[0]].times:[];mk('c-gl-trend','line',{labels:times,datasets:gls.slice(0,8).map((gl,i)=>L(gl,pg[gl].net_pct_gms,P[i%P.length]))},pct());}
function pfBack(){selPF=null;bldPF();}
function bldCh(){const _by=D.band.year;npStrip('np-ch',BANDS.map(b=>({l:b,n:npTot(_by,b,'net'),s:fB(npTot(_by,b,'gms'))+' GMS'})));const fc=D.fba_comp[grain],tm=fc.times;mk('c-ch-stack','bar',{labels:tm,datasets:[B('FBA GMS',toB(fc.series['']['fba_gms']),'#72aeb0'),B('MFN GMS',toB(fc.series['']['mfn_gms']),'#b8aa84')]},stackO());mk('c-ch-fpct','line',{labels:tm,datasets:[L('FBA % of GMS',fc.series['']['fba_pct_gms'],'#72aeb0',true)]},pct({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` FBA%: ${ctx.parsed.y.toFixed(2)}%`}}}}));const bt=tab('band');const bMg=BANDS.map(b=>{const G=tot(bt,b,'gms'),N=tot(bt,b,'net');return G>0?+(N/G*100).toFixed(2):0;});mk('c-ch-band-bar','bar',{labels:BANDS,datasets:[{label:'Net Margin %',data:bMg,backgroundColor:BAND_C.map(c=>a(c,.72)),borderRadius:4,borderSkipped:false}]},{...base(),plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` Net Margin: ${ctx.parsed.y.toFixed(2)}%`}}},scales:{x:{ticks:{color:'#b0b8d0',font:{size:10.5}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}}}});mk('c-ch-band-gms','bar',{labels:bt.times,datasets:BANDS.map((b,i)=>B(b,toB(gs(bt,b,'gms')),BAND_C[i]))},stackO());const kb=['100% MFN','Q2: 25-50% FBA','Q4: 75-99% FBA','100% FBA'],kc=['#88a8c0','#8fba9e','#c89888','#b88a90'];mk('c-ch-band-trend','line',{labels:bt.times,datasets:kb.map((b,i)=>L(b,gs(bt,b,'net_pct_gms'),kc[i]))},pct());
/* Ad spend charts */
const ad=AD.ch_ads[grain];mk('c-ch-ads-trend','line',{labels:ad.times,datasets:[Object.assign(L('FBA Sellers — Ad Spend % of GMS',ad.fba_ads_pct,'#72aeb0'),{borderWidth:2.3}),Object.assign(L('MFN Sellers — Ad Spend % of GMS',ad.mfn_ads_pct,'#b8aa84'),{borderWidth:2.3})]},pct({plugins:{tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`}}}}));
const adBand=AD.band_ads[grain];const bAdPct=BANDS.map(b=>{const G=adBand.series[b].gms.reduce((a,c)=>a+c,0),A=adBand.series[b].ads.reduce((a,c)=>a+c,0);return G>0?+(A/G*100).toFixed(2):0;});mk('c-ch-ads-band','bar',{labels:BANDS,datasets:[{label:'Ad Spend % of GMS',data:bAdPct,backgroundColor:BAND_C.map(c=>a(c,.72)),borderRadius:4,borderSkipped:false}]},{...base(),plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` Ad Spend: ${ctx.parsed.y.toFixed(2)}% of GMS`}}},scales:{x:{ticks:{color:'#b0b8d0',font:{size:10.5}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}}}});}
function bldCross(){const isGB=crossMode==='geo_band_chart';
const _cMode=crossMode;
if(isGB){const _gby=D.geo_band.year;const _ranked=_gby.dims.filter(d=>!d.includes('Unknown')).map(d=>({d,g:npTot(_gby,d.join('|'),'gms')})).sort((a,b)=>b.g-a.g).slice(0,6);npStrip('np-cross',_ranked.map(x=>({l:x.d.join(' · '),n:npTot(_gby,x.d.join('|'),'net'),s:fB(npTot(_gby,x.d.join('|'),'gms'))+' GMS'})));}
else{const _ct=D[_cMode].year;const _cdims=_ct.dims.filter(d=>!d.includes('Unknown')&&!d.includes('Digital'));npStrip('np-cross',_cdims.map(d=>({l:d.join(' · '),n:npTot(_ct,d.join('|'),'net'),s:fB(npTot(_ct,d.join('|'),'gms'))+' GMS'})));}document.getElementById('cross-heatmap').style.display=isGB?'block':'none';document.getElementById('cross-chart2-wrap').style.display=isGB?'none':'block';if(isGB){const t=tab('geo_band'),tm=t.times;const allD=t.dims.filter(d=>!d.includes('Unknown'));const ranked=allD.map(d=>({d,g:tot(t,d.join('|'),'gms')})).sort((a,b)=>b.g-a.g).slice(0,9).map(x=>x.d);document.getElementById('cross-h').textContent='Net Margin % — Geo × FBA Band (top 9 combos by GMS)';document.getElementById('cross-h2').textContent='Geo × FBA Band — Avg Net Margin % heatmap';document.getElementById('cross-fee-h').textContent='Total Fee % of GMS — top combos (solid=total, dashed=Ref+P&P, dotted=FBA Storage)';mk('c-cross-mg','line',{labels:tm,datasets:ranked.map(d=>L(d.join(' · '),gs(t,d.join('|'),'net_pct_gms'),GB_C[d.join('|')]||'#888'))},pct());const hmEl=document.getElementById('cross-heatmap');hmEl.innerHTML='';const cols=BANDS,rows=GEO;const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:90px '+cols.map(()=>'1fr').join(' ')+';gap:3px';const bk=document.createElement('div');bk.textContent='';grid.appendChild(bk);cols.forEach(c=>{const h=document.createElement('div');h.className='hm-cell';h.style.cssText='font-size:.6rem;color:#606880;text-align:center;padding:3px 2px';h.textContent=c.replace('% FBA','%');grid.appendChild(h);});rows.forEach(row=>{const rl=document.createElement('div');rl.className='hm-label';rl.textContent=row.replace('OOC - ','OOC ');grid.appendChild(rl);cols.forEach(col=>{const key=row+'|'+col;const dims=t.dims.find(d=>d[0]===row&&d[1]===col);const mg=dims?(()=>{const n=tot(t,key,'net'),g2=tot(t,key,'gms');return g2>0?+(n/g2*100).toFixed(1):null;})():null;const cell=document.createElement('div');cell.className='hm-cell';if(mg!==null){const intensity=Math.max(0,Math.min(1,(mg-60)/35));const r=Math.round(180-intensity*60),g3=Math.round(160+intensity*40),b2=Math.round(140-intensity*40);cell.style.cssText='background:rgba('+r+','+g3+','+b2+',.2);border:1px solid rgba('+r+','+g3+','+b2+',.4);color:#d4d8e8';cell.textContent=mg+'%';}else{cell.style.cssText='background:#1a1d2a;border:1px solid #262938;color:#404660';cell.textContent='—';}grid.appendChild(cell);});});hmEl.appendChild(grid);mk('c-cross-fee','line',{labels:tm,datasets:feeDs(t,ranked.map(d=>d.join('|')),k=>GB_C[k]||'#888')},pct());}else{const lbl={geo_acct:'Net Margin % — Geo × Seller Type',pf_acct:'Net Margin % — PF × Seller Type'};document.getElementById('cross-h').textContent=lbl[crossMode]||'Net Margin %';document.getElementById('cross-h2').textContent='GMS ($B)';document.getElementById('cross-fee-h').textContent='Total Fee % of GMS (solid=total, dashed=Ref+P&P, dotted=FBA Storage)';const cc=d=>{const m={'Domestic|Brand Owner':'#9898bc','Domestic|Reseller':'#8aac88','OOC - CN|Brand Owner':'#c89888','OOC - CN|Reseller':'#c8a46a','OOC - Others|Brand Owner':'#88a8c0','OOC - Others|Reseller':'#8ab8a4'};return m[d.join('|')]||P[0];};const t=tab(crossMode),tm=t.times;const dims=t.dims.filter(d=>!d.includes('Unknown')&&!d.includes('Digital'));const dk=d=>d.join('|');mk('c-cross-mg','line',{labels:tm,datasets:dims.map(d=>L(dk(d),gs(t,dk(d),'net_pct_gms'),cc(d)))},pct());mk('c-cross-gms','bar',{labels:tm,datasets:dims.slice(0,6).map(d=>B(dk(d),toB(gs(t,dk(d),'gms')),cc(d)))},base());mk('c-cross-fee','line',{labels:tm,datasets:feeDs(t,dims.map(dk),k=>cc(dims.find(d=>dk(d)===k)||[k]))},pct());}}
function setCross(m,el){crossMode=m;document.querySelectorAll('.seg-pill').forEach(b=>b.classList.remove('on'));el.classList.add('on');bldCross();}
function bldInc(){
  /* Net proceeds strip — full period totals */
  const _iy=D.inc_v3.year;
  npStrip('np-inc',INC_D.map((d,i)=>({l:d,n:npTot(_iy,d,'net'),s:fB(npTot(_iy,d,'gms'))+' GMS · avg FBA: '+(npTot(_iy,d,'fba_gms')/npTot(_iy,d,'gms')*100).toFixed(0)+'%'})));

  /* ── Trend: 6 bands × 2 groups (12 lines) ── */
  const t=tab('band_inc'),tm=t.times;
  const trendDs=BANDS.flatMap((b,i)=>{
    const c=BAND_C[i];
    const ki=b+'|Incentive', kn=b+'|No Incentive';
    return [
      Object.assign(L(b+' — Enrolled',gs(t,ki,'net_pct_gms'),c),{borderWidth:2.4}),
      Object.assign(L(b+' — Control', gs(t,kn,'net_pct_gms'),c),{borderDash:[5,3],borderWidth:1.4,borderColor:a(c,0.55)})
    ];
  });
  mk('c-inc-trend','line',{labels:tm,datasets:trendDs},pct({plugins:{legend:{labels:{color:'#606880',font:{size:9.5},padding:7,boxWidth:7}}}}));

  /* ── Full-period bar: grouped by band ── */
  const yr=D.band_inc.year;
  function bandTotMg(b,grp){
    const s=yr.series[b+'|'+grp];if(!s)return 0;
    const g=s.gms.reduce((a,v)=>a+v,0),n=s.net.reduce((a,v)=>a+v,0);
    return g>0?+(n/g*100).toFixed(2):0;
  }
  const incMg=BANDS.map(b=>bandTotMg(b,'Incentive'));
  const noMg =BANDS.map(b=>bandTotMg(b,'No Incentive'));
  mk('c-inc-bar','bar',
    {labels:BANDS,datasets:[
      {label:'Enrolled (NSP/VBI)', data:incMg, backgroundColor:BAND_C.map(c=>a(c,.75)),borderRadius:3,borderSkipped:false},
      {label:'No Incentive',       data:noMg,  backgroundColor:BAND_C.map(c=>a(c,.3)), borderRadius:3,borderSkipped:false,borderColor:BAND_C.map(c=>a(c,.65)),borderWidth:1}
    ]},
    {...base(),plugins:{legend:{labels:{color:'#606880',font:{size:9.5},padding:7,boxWidth:7}},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`}}},scales:{x:{ticks:{color:'#b0b8d0',font:{size:9}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}}}}
  );

  /* ── Gap chart: Incentive − Control per band over time ── */
  const gapDs=BANDS.map((b,i)=>{
    const ki=b+'|Incentive',kn=b+'|No Incentive';
    const gi=gs(t,ki,'net_pct_gms'),gn=gs(t,kn,'net_pct_gms');
    const gap=gi.map((v,j)=>gn[j]?+(v-gn[j]).toFixed(2):null);
    return Object.assign(L(b,gap,BAND_C[i]),{borderWidth:1.8});
  });
  const gapO=pct();gapO.plugins.tooltip={backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y>=0?'+':''}${ctx.parsed.y?.toFixed(2)??'—'}pp`}};gapO.plugins.legend={labels:{color:'#606880',font:{size:9.5},padding:7,boxWidth:7}};gapO.scales.y.suggestedMin=-8;gapO.scales.y.suggestedMax=4;gapO.scales.y.ticks.callback=v=>(v>=0?'+':'')+v+'pp';mk('c-inc-gap','line',{labels:tm,datasets:gapDs},gapO);
}

function bldRatio(){const _ry=D.total.year;const _rnet=npTot(_ry,'','net');const _rgms=npTot(_ry,'','gms');const _rfee=npTot(_ry,'','fees');npStrip('np-ratio',[{l:'Net Proceeds',n:_rnet,s:((_rnet/_rgms)*100).toFixed(1)+'% of GMS'},{l:'Fees (Ref+P&P)',n:_rfee,s:((_rfee/_rgms)*100).toFixed(1)+'% of GMS'}]);const t=tab('total'),tm=t.times;mk('c-r-ng','line',{labels:tm,datasets:[L('Net % of GMS',gs(t,'','net_pct_gms'),'#8fba9e',true)]},pct({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${ctx.parsed.y.toFixed(2)}%`}}}}));mk('c-r-nf','line',{labels:tm,datasets:[L('Net % of Fees',gs(t,'','net_pct_fees'),'#c8a46a',true)]},pct({plugins:{legend:{display:false},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',callbacks:{label:ctx=>` ${ctx.parsed.y.toFixed(2)}%`}}}}));const bt=tab('band');const bMg=BANDS.map(b=>{const G=tot(bt,b,'gms'),N=tot(bt,b,'net');return G>0?+(N/G*100).toFixed(2):0;});const bSt=BANDS.map(b=>{const G=tot(bt,b,'gms'),F=tot(bt,b,'fba_storage');return G>0?+(F/G*100).toFixed(2):0;});mk('c-r-fba','bar',{labels:BANDS,datasets:[{label:'Net Margin %',data:bMg,backgroundColor:BAND_C.map(c=>a(c,.7)),borderRadius:3,borderSkipped:false},{label:'FBA Storage/Inbound Fee % of GMS',data:bSt,backgroundColor:BAND_C.map(c=>a(c,.3)),borderRadius:3,borderSkipped:false,borderColor:BAND_C.map(c=>a(c,.6)),borderWidth:1}]},{...base(),plugins:{legend:{labels:{color:'#606880',font:{size:10.5},padding:9,boxWidth:8}},tooltip:{backgroundColor:BG,borderColor:BB,borderWidth:1,titleColor:'#c4c8dc',bodyColor:'#606880',padding:8,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`}}},scales:{x:{ticks:{color:'#b0b8d0',font:{size:10.5}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:9},callback:v=>v+'%'},grid:{color:GC}}}});}

/* ── Fee Events (annotated trend + table + timeline) ── */
const FE_COL={decrease:'#8fba9e',increase:'#b88a90',mixed:'#c8a46a'};
const FE_LABEL={decrease:'seller +',increase:'seller −',mixed:'mixed'};

/* register vertical-line annotation plugin for all charts */
const vlinePlugin={id:'vlines',afterDraw(chart,_,opts){
  if(!opts||!opts.lines||!opts.lines.length)return;
  const {ctx,chartArea,scales:{x}}=chart;
  if(!x)return;
  opts.lines.forEach(({value,color,label})=>{
    const xPos=x.getPixelForValue(value);
    if(xPos<chartArea.left||xPos>chartArea.right)return;
    ctx.save();
    ctx.setLineDash([4,3]);
    ctx.strokeStyle=color||'rgba(200,164,106,.5)';
    ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(xPos,chartArea.top);ctx.lineTo(xPos,chartArea.bottom);ctx.stroke();
    if(label){
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(xPos+3,chartArea.top+8);
      ctx.rotate(-Math.PI/2);
      ctx.fillStyle=color||'rgba(200,164,106,.8)';
      ctx.font='8px Segoe UI,sans-serif';
      ctx.fillText(label,0,0);
      ctx.restore();
    }
    ctx.restore();
  });
}};
Chart.register(vlinePlugin);

function feLines(grain){
  if(!window.FEE_EVENTS)return[];
  return FEE_EVENTS.filter(ev=>!ev.date.startsWith('2026')).map(ev=>({
    value: grain==='month'?ev.ym:grain==='quarter'?ev.ym.slice(0,4)+'-Q'+Math.ceil(parseInt(ev.ym.slice(5,7))/3):ev.ym.slice(0,4),
    color: FE_COL[ev.type]+'cc',
    label: ev.label.replace('2022 ','').replace('2023 ','').replace('2024 ','').replace('2025 ','').replace('2026 ','').slice(0,14)
  }));
}

function bldFeeEvents(){
  document.getElementById('np-fees').style.display='none';

  /* ── Annotated trend chart ── */
  const t=tab('total'),tm=t.times;
  const trendO=pct();
  trendO.plugins.legend={display:false};
  trendO.plugins.vlines={lines:feLines(grain)};
  trendO.plugins.tooltip={backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',
    callbacks:{label:ctx=>` Margin: ${ctx.parsed.y.toFixed(2)}%`}};
  mk('c-fee-trend','line',{labels:tm,datasets:[
    Object.assign(L('Net Margin %',gs(t,'','net_pct_gms'),'#88b0cc',true),{borderWidth:2})
  ]},trendO);

  /* ── Cumulative impact line ── */
  const BASE=gs(tab('total'),'','net_pct_gms')[0];
  const cumul=gs(tab('total'),'','net_pct_gms').map(v=>+(v-BASE).toFixed(2));
  const cumulO=pct();
  cumulO.plugins.legend={display:false};
  cumulO.plugins.vlines={lines:feLines(grain)};
  cumulO.scales.y.ticks.callback=v=>(v>=0?'+':'')+v+'pp';
  cumulO.plugins.tooltip={backgroundColor:BG,borderColor:BB,borderWidth:1,bodyColor:'#606880',
    callbacks:{label:ctx=>` vs Jan 2021: ${ctx.parsed.y>=0?'+':''}${ctx.parsed.y.toFixed(2)}pp`}};
  mk('c-fee-cumul','line',{labels:tm,datasets:[
    Object.assign(L('Δ vs Jan 2021',cumul,'#72aeb0',true),{borderWidth:1.8})
  ]},cumulO);

  /* ── Before/After table ── */
  const monthly=D.total.month;
  const mos=monthly.times;
  const mgArr=monthly.series[''].net_pct_gms;
  const gmsArr=monthly.series[''].gms;
  function wndMg(centerYm,n=3){
    let ci=mos.indexOf(centerYm);
    if(ci<0){for(let i=0;i<mos.length;i++){if(mos[i]>=centerYm){ci=i;break;}}}
    if(ci<0)return[null,null];
    const pre=[],post=[];
    for(let i=0;i<n;i++){if(ci-i-1>=0)pre.push(ci-i-1);}
    for(let i=0;i<n;i++){if(ci+i<mos.length)post.push(ci+i);}
    const wMg=idxs=>idxs.reduce((s,i)=>s+mgArr[i]*gmsArr[i],0)/Math.max(idxs.reduce((s,i)=>s+gmsArr[i],0),1);
    return[+wMg(pre).toFixed(2),+wMg(post).toFixed(2)];
  }
  /* detect confounded events — another event within ±6 months */
  const evDates=FEE_EVENTS.filter(ev=>!ev.date.startsWith('2026')).map(ev=>ev.ym);
  function monthDiff(a,b){const[ay,am]=[+a.slice(0,4),+a.slice(5,7)],[by,bm]=[+b.slice(0,4),+b.slice(5,7)];return Math.abs((ay-by)*12+(am-bm));}
  const CONFOUND_NOTES={'FE1':'H2-22 macro headwinds (JPY −15%, inflation) masked fee investment benefit','FE2':'Only 1M before Apr-23 FBA increase — 6M post window captures that larger event','FE5':'≤750 JPY = small GMS share; concurrent SUS/AIS changes offset gains','FE7':'SUS targets only high-inventory sellers; broad portfolio unaffected'};
  const rows=FEE_EVENTS.filter(ev=>!ev.date.startsWith('2026')).map(ev=>{
    const[pre,post]=wndMg(ev.ym,6);
    const delta=pre&&post?+(post-pre).toFixed(2):null;
    const aligned=delta!==null&&((delta>0&&ev.seller_impact.startsWith('positive'))||(delta<0&&ev.seller_impact.startsWith('negative')));
    const col=delta>0?'#8fba9e':delta<0?'#b88a90':'#606880';
    const confounded=evDates.some(d=>d!==ev.ym&&monthDiff(d,ev.ym)<=6);
    const note=CONFOUND_NOTES[ev.id]||(aligned?'Direction aligns with expectation':'No clear explanation found');
    const confTag=confounded&&!aligned?'<span style="color:#c8a46a;font-size:.7rem"> ⚠confounded</span>':'';
    const alignTag=aligned?'<span style="color:#8fba9e"> ✓</span>':'';
    return `<tr>
      <td style="padding:5px 8px;font-size:.8rem;color:#d4d8e8;border-bottom:1px solid #262938">${ev.label}</td>
      <td style="padding:5px 8px;font-size:.8rem;color:#8fba9e;border-bottom:1px solid #262938;text-align:center">${ev.date}</td>
      <td style="padding:5px 8px;font-size:.8rem;border-bottom:1px solid #262938;text-align:center;color:${FE_COL[ev.type]}">${FE_LABEL[ev.type]}</td>
      <td style="padding:5px 8px;font-size:.8rem;color:#d4d8e8;border-bottom:1px solid #262938;text-align:center">${pre?pre+'%':'—'}</td>
      <td style="padding:5px 8px;font-size:.8rem;color:#d4d8e8;border-bottom:1px solid #262938;text-align:center">${post?post+'%':'—'}</td>
      <td style="padding:5px 8px;font-size:.82rem;font-weight:700;border-bottom:1px solid #262938;text-align:center;color:${col}">${delta!==null?(delta>=0?'+':'')+delta+'pp':'—'}${alignTag}${confTag}</td>
      <td style="padding:5px 8px;font-size:.75rem;color:var(--muted);border-bottom:1px solid #262938">${note}</td>
    </tr>`;
  }).join('');
  document.getElementById('fee-table').innerHTML=`
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#1a1d2a">
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:left;letter-spacing:.06em">Event</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Date</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Type</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Pre 6M</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Post 6M</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Δ Margin</th>
        <th style="padding:5px 8px;font-size:.72rem;color:#606880;text-transform:uppercase;text-align:center">Context</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  /* ── Timeline ── */
  const tl=document.getElementById('fee-timeline');
  tl.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:8px">'+
    FEE_EVENTS.filter(ev=>!ev.date.startsWith('2026')).map(ev=>`
      <div style="background:var(--surf2);border:1px solid ${FE_COL[ev.type]}44;border-left:3px solid ${FE_COL[ev.type]};border-radius:5px;padding:8px 12px;min-width:200px;flex:1">
        <div style="font-size:.68rem;color:${FE_COL[ev.type]};font-weight:700;letter-spacing:.05em">${ev.date} · ${FE_LABEL[ev.type].toUpperCase()}</div>
        <div style="font-size:.78rem;color:#d4d8e8;font-weight:600;margin:2px 0">${ev.label}</div>
        <div style="font-size:.68rem;color:var(--muted);line-height:1.5">${ev.changes.slice(0,2).join('<br>')}</div>
      </div>`).join('')+'</div>';
}

/* Also patch bldOv to show event lines on the main trend chart */

const BUILD={ov:bldOv,geo:bldGeo,seller:bldSeller,pf:bldPF,ch:bldCh,cross:bldCross,inc:bldInc,ratio:bldRatio,fees:bldFeeEvents};
function sw(name,el){activeTab=name;document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.getElementById('p-'+name).classList.add('on');el.classList.add('on');if(BUILD[name])BUILD[name]();}
function setGrain(g,el){grain=g;document.querySelectorAll('.gbtn').forEach(b=>b.classList.remove('on'));el.classList.add('on');if(BUILD[activeTab])BUILD[activeTab]();}
kpis();bldOv();
