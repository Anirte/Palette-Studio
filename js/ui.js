// ══════════════════════════════════════════ HELPERS

function getSliders(){
  const val=+document.getElementById('s-val').value;
  const aro=+document.getElementById('s-aro').value;
  const tmp=+document.getElementById('s-tmp').value;
  const stp=+document.getElementById('s-stp').value;
  const Lshift=(val/50)*0.20;
  const C=aro>=0?1.0+(aro/50)*0.8:0.1+0.9*((aro+50)/50);
  const T=(tmp/50)*30;
  return{Lshift,C,T,S:stp};
}

function activeRoles(){
  return ROLE_CATALOG.filter(r=>roleState[r.id]?.enabled);
}

function srcForRole(r){
  if(r.fixed) return {hex:r.fixed};
  const override = roleState[r.id]?.sourceId;
  if(override){
    const found = sources.find(s=>s.id===override);
    if(found) return found;
  }
  const byIdx = sources[r.srcIdx??0];
  return byIdx || sources[0];
}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}

function copyT(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) toast('Copied ' + text);
  } catch (err) {
    console.error('Oops, unable to copy', err);
  }
  document.body.removeChild(textArea);
}

function setTheme(t,btn){document.body.setAttribute('data-theme',t);document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('on',b===btn))}

// ══════════════════════════════════════════ MINIMIZE
let isMinimized = false;
function toggleMinimize() {
  isMinimized = !isMinimized;
  if (isMinimized) {
    document.getElementById('minimizeBtn').textContent = '□';
    parent.postMessage({ type: 'RESIZE', width: 900, height: 50 }, '*');
  } else {
    document.getElementById('minimizeBtn').textContent = '─';
    parent.postMessage({ type: 'RESIZE', width: 900, height: 640 }, '*');
  }
}

// ══════════════════════════════════════════ RENDER SOURCES
function renderSources(){
  document.getElementById('sourcesList').innerHTML=sources.map(s=>`
    <div class="source-item" data-id="${s.id}">
      <button class="swatch-btn" style="background:${s.hex}" onclick="openPicker('${s.id}',this,event)"></button>
      <input class="source-name-in" value="${s.name}" onchange="renameSource('${s.id}',this.value)">
      <button class="icon-btn del-btn" onclick="delSource('${s.id}')">×</button>
    </div>`).join('');
}

// ══════════════════════════════════════════ RENDER ROLE GROUPS
function renderRoleGroups(){
  const groups=['core','neutral','accent','semantic','extended'];
  document.getElementById('roleGroups').innerHTML = groups.map(gid=>{
    const meta = GROUP_META[gid];
    const gRoles = ROLE_CATALOG.filter(r=>r.group===gid);
    const enabledCount = gRoles.filter(r=>roleState[r.id]?.enabled).length;
    const allOn = enabledCount===gRoles.length;
    const someOn = enabledCount>0 && !allOn;
    const checkCls = allOn?'on':someOn?'partial':'';
    const roleRows = gRoles.map(r=>{
      const st=roleState[r.id];
      const src=srcForRole(r);
      const[,bc,bh]=hexToOklch(src.hex);
      const sw=oklchToHex(0.52,Math.min(bc*r.cf,maxC(0.52,bh)),bh);
      const selVal=src.id || sources[0].id;
      return`<div class="role-row${st.enabled?'':' disabled'}" data-rid="${r.id}">
        <div class="role-check${st.enabled?' on':''}" onclick="toggleRole('${r.id}')"></div>
        <div class="role-swatch" style="background:${sw}"></div>
        <span class="role-label">${r.name}<span class="role-label-dim">${r.desc?'· '+r.desc:''}</span></span>
        ${r.fixed
          ? `<span style="font-size:12px;color:var(--t3);font-style:italic">fixed</span>`
          : `<select class="role-src-sel" title="Source color" onchange="setRoleSrc('${r.id}',this.value)">
              ${sources.map(s=>`<option value="${s.id}"${s.id===selVal?' selected':''}>${s.name}</option>`).join('')}
             </select>`
        }
      </div>`;
    }).join('');
    return`<div class="role-group">
      <div class="group-header" onclick="toggleGroup('${gid}')">
        <div class="group-check ${checkCls}" onclick="event.stopPropagation();toggleGroupCheck('${gid}')"></div>
        <span class="group-name">${meta.label}</span>
        <span class="group-toggle">${meta.desc}</span>
      </div>
      <div class="group-roles" id="grp-${gid}">${roleRows}</div>
    </div>`;
  }).join('');
}

function toggleRole(id){
  roleState[id].enabled=!roleState[id].enabled;
  renderRoleGroups(); rebuild(); persistState();
}
function toggleGroupCheck(gid){
  const gRoles=ROLE_CATALOG.filter(r=>r.group===gid);
  const allOn=gRoles.every(r=>roleState[r.id]?.enabled);
  gRoles.forEach(r=>{roleState[r.id].enabled=!allOn});
  renderRoleGroups(); rebuild(); persistState();
}
function toggleGroup(gid){
  const el=document.getElementById('grp-'+gid);
  el.style.display=el.style.display==='none'?'':'none';
}
function setRoleSrc(id,sid){
  if(roleState[id]) roleState[id].sourceId=sid;
  rebuild(); persistState();
}
function renameSource(id,val){
  const s=sources.find(x=>x.id===id);
  if(s) s.name=val;
  renderRoleGroups(); persistState();
}

// ══════════════════════════════════════════ REBUILD & SLIDERS
function rebuild(){
  const{Lshift,C,T,S}=getSliders();
  renderMain();
}

function onSlide(){['val','aro','tmp','stp'].forEach(k=>{
    document.getElementById('v-'+k).textContent=document.getElementById('s-'+k).value;
  });
  rebuild();
  persistState();
}

function resetSliders(){
  document.getElementById('s-val').value=0;
  document.getElementById('s-aro').value=0;
  document.getElementById('s-tmp').value=0;
  document.getElementById('s-stp').value=10;
  onSlide();
}

// ══════════════════════════════════════════ SOURCE CRUD
function addSource(){
  const hues=[40,120,280,160,310,200,60,240];
  const h=hues[sources.length%hues.length];
  const id='s'+(uid++);
  sources.push({id,name:'Color '+(uid-1),hex:oklchToHex(0.52,0.18,h)});
  renderSources(); renderRoleGroups(); rebuild(); persistState();
}
function delSource(id){
  if(sources.length<=1)return toast('Need at least one source');
  sources=sources.filter(s=>s.id!==id);
  Object.keys(roleState).forEach(rid=>{
    if(roleState[rid].sourceId===id) roleState[rid].sourceId=null;
  });
  renderSources(); renderRoleGroups(); rebuild(); persistState();
}

// ══════════════════════════════════════════ RENDER MAIN
function renderMain(){
  const{Lshift,C,T,S}=getSliders();
  const main=document.getElementById('main');
  const active=activeRoles();
  if(!active.length){main.innerHTML='<div style="display:flex;flex:1;align-items:center;justify-content:center;color:var(--t3);font-size:15px">Enable some roles to see palettes</div>';return}

  const palData=active.map(r=>{
    const catalogRole=ROLE_CATALOG.find(x=>x.id===r.id)||r;
    let src, shades;
    if(catalogRole.fixed){
      src={hex:catalogRole.fixed};
      shades=makeShades(src.hex,r.cf,r.lock,S,Lshift,C,T,catalogRole.fixedL??null,catalogRole.hueShift??0);
    } else if(catalogRole.fixedHue !== undefined){
      src=srcForRole(r);
      shades=makeSemanticShades(catalogRole.fixedHue, src.hex, S, Lshift, C);
    } else {
      src=srcForRole(r);
      shades=makeShades(src.hex,r.cf,r.lock,S,Lshift,C,T,catalogRole.fixedL??null,catalogRole.hueShift??0);
    }
    const mid=shades[Math.floor(shades.length/2)];
    return{...r,src,shades,mid,group:catalogRole.group};
  });

  const groupOrder=['core','neutral','accent','semantic','extended'];
  let html='';
  groupOrder.forEach(gid=>{
    const gPals=palData.filter(p=>p.group===gid);
    if(!gPals.length)return;
    html+=`<div class="group-section">
      <div class="group-section-label">${GROUP_META[gid].label}</div>
      ${gPals.map(p=>renderPalCard(p)).join('')}
    </div>`;
  });

  const bgPal  = palData.find(p=>p.id===prevBg)  || palData.find(p=>p.group==='neutral') || palData[0];
  const btn1Pal= palData.find(p=>p.id===prevBtn1) || palData[0];
  const btn2Pal= palData.find(p=>p.id===prevBtn2) || palData[1]||palData[0];
  const txtPal  = palData.find(p=>p.id===prevTxt)  || palData.find(p=>p.id==='rc-txt')  || palData.find(p=>p.group==='neutral'&&p.shades[0]?.hex) || btn1Pal;
  const txtsPal = palData.find(p=>p.id===prevTxtS) || palData.find(p=>p.id==='rc-txts') || txtPal;
  const mkOpts=(sel)=>palData.map(p=>`<option value="${p.id}"${p.id===sel?' selected':''}>${p.name}</option>`).join('');
  if(bgPal){
    const bgC=bgPal.shades[0]?.hex||'#fff';
    const txtC=bgPal.shades[bgPal.shades.length-1]?.hex||'#000';
    const getShadeByStep=(pal,step)=>pal.shades.find(s=>s.step===step)?.hex||pal.shades[Math.floor(pal.shades.length/2)]?.hex||'#888';
    const b1C=getShadeByStep(btn1Pal,prevStep);
    const b1T=cr(b1C,'#fff','#000');
    const b2C=getShadeByStep(btn2Pal,prevStep);
    const b2T=cr(b2C,'#fff','#000');
    const subtleC=bgPal.shades[Math.floor(bgPal.shades.length*.65)]?.hex||'#666';
    const txtC2  = txtPal.shades[txtPal.shades.length-1]?.hex  || txtC;
    const txtsC2 = txtsPal.shades[Math.floor(txtsPal.shades.length*.55)]?.hex || subtleC;
    const stepOpts=[50,100,200,300,400,500,600,700,800,900,950].map(s=>`<option value="${s}"${s===prevStep?' selected':''}>${s}</option>`).join('');
    html+=`<div class="preview-card">
      <div class="prev-lbl">Preview UI
        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--t3)">
          BG<select class="prev-select" onchange="prevBg=this.value;renderMain()">${mkOpts(prevBg)}</select>
          Btn1<select class="prev-select" onchange="prevBtn1=this.value;renderMain()">${mkOpts(prevBtn1)}</select>
          Btn2<select class="prev-select" onchange="prevBtn2=this.value;renderMain()">${mkOpts(prevBtn2)}</select>
          Step<select class="prev-select" onchange="prevStep=+this.value;renderMain()">${stepOpts}</select>
          Text<select class="prev-select" onchange="prevTxt=this.value;renderMain()">${mkOpts(prevTxt)}</select>
          Subtle<select class="prev-select" onchange="prevTxtS=this.value;renderMain()">${mkOpts(prevTxtS)}</select>
        </div>
      </div>
      <div class="prev-body"><div class="prev-inner" style="background:${bgC}">
        <div class="prev-h" style="color:${txtC2}">Welcome to the experience</div>
        <div class="prev-p" style="color:${txtsC2}">Subtle body text — captions, hints, secondary content.</div>
        <div class="prev-btns">
          <button class="prev-btn" style="background:${b1C};color:${b1T}">${btn1Pal.name}</button>
          <button class="prev-btn" style="background:${b2C};color:${b2T}">${btn2Pal.name}</button>
        </div>
      </div></div>
    </div>`;
  }

  html+=`<div class="export-card">
    <div class="export-tabs">
      <button class="etab${exportFmt==='css'?' on':''}" onclick="setFmt('css')">CSS</button>
      <button class="etab${exportFmt==='tailwind'?' on':''}" onclick="setFmt('tailwind')">Tailwind</button>
      <button class="etab${exportFmt==='json'?' on':''}" onclick="setFmt('json')">JSON</button>
      <div style="flex:1"></div>
      <button class="etab" onclick="exportToPenpot('assets')" style="color:#5b6af5;font-weight:700;">Export as Assets</button>
      <button class="etab" onclick="exportToPenpot('tokens')" style="color:#5b6af5;font-weight:700;">Export as Tokens</button>
    </div>
    <div class="export-code" id="exportCode">${genExport(palData)}</div>
  </div>`;

  main.innerHTML=html;
}

function renderPalCard(p) {
  const catalogRole = ROLE_CATALOG.find(x => x.id === p.id) || p;
  const srcLabel = catalogRole.fixed ? 'fixed' : srcForRole(catalogRole).name || '?';
  if (!exportSteps[p.id]) exportSteps[p.id] = { light: p.shades[5]?.step || 500, dark: p.shades[5]?.step || 500 };

  return `<div class="pal-card">
    <div class="pal-head">
      <div class="pal-head-l">
        <div class="pal-dot" style="background:${p.mid?.hex||'#888'}"></div>
        <div>
          <div class="pal-name">${p.name} <span style="font-size:13px;color:var(--t3);font-style:italic">· ${srcLabel}</span></div>
          <div style="display:flex;gap:4px;margin-top:2px">
            <span class="pal-tag">C×${p.cf}</span>
            ${p.lock?'<span class="pal-tag">locked</span>':''}
            ${p.desc?`<span class="pal-tag">${p.desc}</span>`:''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <select class="role-src-sel" onchange="exportSteps['${p.id}'].light = this.value; renderMain(); persistState()" title="Light theme shade">
          <option value="none">Light: None</option>
          ${p.shades.map(s => `<option value="${s.step}" ${exportSteps[p.id].light == s.step ? 'selected' : ''}>Light: ${s.step}</option>`).join('')}
        </select>
        <select class="role-src-sel" onchange="exportSteps['${p.id}'].dark = this.value; renderMain(); persistState()" title="Dark theme shade">
          <option value="none">Dark: None</option>
          ${p.shades.map(s => `<option value="${s.step}" ${exportSteps[p.id].dark == s.step ? 'selected' : ''}>Dark: ${s.step}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="shades-wrap">
      ${p.shades.map(s => {
        const lc1=apca(s.hex,ctBg1), lc2=apca(s.hex,ctBg2);
        const badge=(lc,bg)=>{const a=Math.abs(lc);const cls=a>=75?'ct-aaa':a>=60?'ct-aa':'ct-fail';const lbl=a>=45?'Lc'+Math.round(a):'Lc'+Math.round(a);return`<div class="ct-row ${cls}"><div class="ct-dot" style="background:${bg}"></div>${lbl}</div>`};
        const tc=cr(s.hex,'#fff','#111');
        return `<div class="shade-col" onclick="copyT('${s.hex}')">
          <div class="shade" style="background:${s.hex}">
            <div class="sh-tip">${s.hex}</div>
            <div class="sh-num" style="color:${tc}">${s.step}</div>
          </div>
          <div class="shade-ct">${badge(lc1,ctBg1)}${badge(lc2,ctBg2)}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ══════════════════════════════════════════ COLOR PICKER
function openPicker(id,btnEl,event){
  event.stopPropagation();activeCPId=id;
  let hex='#3b5bdb';
  if(id==='bg1')hex=ctBg1;
  else if(id==='bg2')hex=ctBg2;
  else{const s=sources.find(x=>x.id===id);if(s)hex=s.hex}
  const[h,s,v]=hexToHsv(hex);['h','s','v'].forEach((k,i)=>document.getElementById('cp-'+k).value=[h,s,v][i]);
  document.getElementById('cp-hex').value=hex;
  document.getElementById('cp-preview').style.background=hex;
  updateCPGrad(h,s,v);
  const pop=document.getElementById('cp-popover');
  pop.style.display='flex';
  const r=btnEl.getBoundingClientRect();
  const pw=240, ph=220;
  let left=r.left;
  let top=r.bottom+6;
  if(left+pw>window.innerWidth-8) left=window.innerWidth-pw-8;
  if(left<8) left=8;
  if(top+ph>window.innerHeight-8) top=r.top-ph-6;
  if(top<8) top=8;
  pop.style.left=left+'px';
  pop.style.top=top+'px';
}
function closePicker(){document.getElementById('cp-popover').style.display='none';activeCPId=null}
function closePickerOnOutside(e){if(activeCPId&&!document.getElementById('cp-popover').contains(e.target))closePicker()}
function updateCPGrad(h,s,v){
  document.getElementById('cp-s').style.background=`linear-gradient(to right,${hsvToHex(h,0,v)},${hsvToHex(h,100,v)})`;
  document.getElementById('cp-v').style.background=`linear-gradient(to right,#000,${hsvToHex(h,s,100)})`;
}
function updateCP(){
  const h=+document.getElementById('cp-h').value,s=+document.getElementById('cp-s').value,v=+document.getElementById('cp-v').value;
  const hex=hsvToHex(h,s,v);
  document.getElementById('cp-hex').value=hex;
  document.getElementById('cp-preview').style.background=hex;
  updateCPGrad(h,s,v);applyCPColor(hex);
}
function updateCPFromHex(){
  let hex=document.getElementById('cp-hex').value.trim();
  if(!/^#[0-9a-fA-F]{6}$/i.test(hex)){if(/^[0-9a-fA-F]{6}$/i.test(hex))hex='#'+hex;else return}
  const[h,s,v]=hexToHsv(hex);['h','s','v'].forEach((k,i)=>document.getElementById('cp-'+k).value=[h,s,v][i]);
  document.getElementById('cp-preview').style.background=hex;
  updateCPGrad(h,s,v);applyCPColor(hex);
}
function applyCPColor(hex){
  if(!activeCPId)return;
  if(activeCPId==='bg1'){ctBg1=hex;document.getElementById('btn-bg1').style.background=hex;rebuild();persistState();}
  else if(activeCPId==='bg2'){ctBg2=hex;document.getElementById('btn-bg2').style.background=hex;rebuild();persistState();}
  else{
    const s=sources.find(x=>x.id===activeCPId);
    if(s){s.hex=hex;document.querySelector(`.source-item[data-id="${activeCPId}"] .swatch-btn`).style.background=hex;renderRoleGroups();rebuild();persistState();}
  }
}

// ══════════════════════════════════════════ HARMONY
const HARMONIES=[
  {id:'comp',    label:'Complementary',  offsets:[180]},
  {id:'split',   label:'Split-comp',     offsets:[150, 210]},
  {id:'triadic', label:'Triadic',        offsets:[120, 240]},
  {id:'tetra',   label:'Tetradic',       offsets:[90, 180, 270]},
  {id:'analog2', label:'Analogous ×2',   offsets:[30, 60]},
  {id:'analog3', label:'Analogous ×3',   offsets:[30, 60, 90]},
  {id:'square',  label:'Square',         offsets:[90, 180, 270]},
];
let activeHarmony = null;
let savedSources = null;

function toggleHarmony(){
  const panel = document.getElementById('harmonyPanel');
  const btn = document.querySelector('[onclick="toggleHarmony()"]');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  if(btn) btn.classList.toggle('active', !isOpen);
  if(!isOpen) renderHarmonyGrid();
}

function renderHarmonyGrid(){
  document.getElementById('harmonyGrid').innerHTML = HARMONIES.map(h =>
    `<button class="h-preset${activeHarmony===h.id?' on':''}" onclick="applyHarmony('${h.id}')">${h.label}</button>`
  ).join('');
}

function applyHarmony(id){
  if(activeHarmony === id && savedSources){
    sources = savedSources.map(s=>({...s}));
    activeHarmony = null;
    savedSources = null;
    renderHarmonyGrid();
    renderSources();
    renderRoleGroups();
    rebuild();
    persistState();
    toast('Harmony removed');
    return;
  }
  savedSources = sources.map(s=>({...s}));
  activeHarmony = id;
  const harmony = HARMONIES.find(h=>h.id===id);
  if(!harmony) return;
  const primary = sources[0];
  const [,bC,bH] = hexToOklch(primary.hex);
  const baseHue = bH;
  const baseChroma = Math.max(bC, 0.16);
  const needed = harmony.offsets.length + 1;
  while(sources.length < needed){
    const sid='s'+(uid++);
    sources.push({id:sid, name:'Color '+(uid-1), hex:oklchToHex(0.52,0.16,0)});
  }
  harmony.offsets.forEach((offset, i) => {
    const src = sources[i+1];
    if(!src) return;
    const newH = (baseHue + offset + 360) % 360;
    const safeC = Math.min(baseChroma, maxC(0.52, newH));
    src.hex = oklchToHex(0.52, safeC, newH);
  });
  renderHarmonyGrid();
  renderSources();
  renderRoleGroups();
  rebuild();
  persistState();
  toast(harmony.label + ' applied · click again to undo');
}

// ══════════════════════════════════════════ FROM IMAGE
function extractFromImage(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const preview = document.getElementById('imgPreview');
      const wrap = document.getElementById('imgPreviewWrap');
      preview.src = e.target.result;
      wrap.style.display = 'block';
      preview.title = 'Click to enlarge';
      preview.onclick = () => {
        document.getElementById('imgModalImg').src = e.target.result;
        document.getElementById('imgModal').style.display = 'flex';
      };
      const canvas = document.createElement('canvas');
      const MAX = 200;
      const scale = Math.min(1, MAX/Math.max(img.width,img.height));
      canvas.width = Math.round(img.width*scale);
      canvas.height = Math.round(img.height*scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      const samples=[];
      const fallbackSamples=[];
      for(let i=0;i<data.length;i+=4){
        const[L,C,H]=hexToOklch(r2h(data[i],data[i+1],data[i+2]));
        if(L>0.10 && L<0.95){
          if(C>0.04) samples.push([L,C,H]);
          else if(C>0.005) fallbackSamples.push([L,C,H]);
        }
      }
      const useSamples = samples.length >= 10 ? samples : [...samples, ...fallbackSamples];
      if(useSamples.length < 5){ toast('Image has no usable colors'); return; }
      const k = sources.length;
      const centers = kMeans(useSamples, k);
      centers.sort((a,b)=>b[1]-a[1]);
      let applied = 0;
      centers.forEach((center, i) => {
        if(i >= sources.length) return;
        const L = Math.max(0.25, Math.min(0.75, center[0]));
        const H = center[2];
        const C = Math.min(Math.max(center[1], 0.01), maxC(L, H));
        sources[i].hex = oklchToHex(L, C, H);
        applied++;
      });
      renderSources();
      renderRoleGroups();
      rebuild();
      persistState();
      toast(applied + ' color' + (applied!==1?'s':'') + ' extracted');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearImgPreview(){
  const wrap = document.getElementById('imgPreviewWrap');
  const preview = document.getElementById('imgPreview');
  wrap.style.display = 'none';
  preview.src = '';
  preview.onclick = null;
}
