// ══════════════════════════════════════════ HELPERS

function getSliders() {
  const val = +document.getElementById('s-val').value;
  const aro = +document.getElementById('s-aro').value;
  const tmp = +document.getElementById('s-tmp').value;
  const stp = +document.getElementById('s-stp').value;
  const Lshift = (val / 50) * 0.2;
  const C = aro >= 0 ? 1.0 + (aro / 50) * 0.8 : 0.1 + 0.9 * ((aro + 50) / 50);
  const T = (tmp / 50) * 30;
  return {Lshift, C, T, S: stp};
}

function activeRoles() {
  return ROLE_CATALOG.filter((r) => roleState[r.id]?.enabled);
}

function srcForRole(r) {
  if (r.fixed) return {hex: r.fixed};
  const override = roleState[r.id]?.sourceId;
  if (override) {
    const found = sources.find((s) => s.id === override);
    if (found) return found;
  }
  const byIdx = sources[r.srcIdx ?? 0];
  return byIdx || sources[0];
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function copyT(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
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

function setTheme(t, btn) {
  document.body.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach((b) => b.classList.toggle('on', b === btn));
}

// ══════════════════════════════════════════ MINIMIZE
let isMinimized = false;

function toggleMinimize() {
  isMinimized = !isMinimized;
  if (isMinimized) {
    document.querySelector('.nav-dot').style.opacity = '0.3';
    parent.postMessage({type: 'GET_SIZE_AND_MINIMIZE'}, '*');
  } else {
    document.querySelector('.nav-dot').style.opacity = '1';
    parent.postMessage({type: 'RESTORE_SIZE'}, '*');
  }
}

// ══════════════════════════════════════════ RENDER SOURCES
function renderSources() {
  document.getElementById('sourcesList').innerHTML = sources
    .map(
      (s) => `
    <div class="source-item" data-id="${s.id}">
      <button class="swatch-btn" style="background:${s.hex}" onclick="openPicker('${s.id}',this,event)"></button>
      <input class="source-name-in" value="${s.name}" onchange="renameSource('${s.id}',this.value)">
      <button class="icon-btn del-btn" onclick="delSource('${s.id}')">×</button>
    </div>`
    )
    .join('');
}

// ══════════════════════════════════════════ RENDER ROLE GROUPS
function renderRoleGroups() {
  const groups = ['core', 'neutral', 'accent', 'semantic', 'extended'];
  document.getElementById('roleGroups').innerHTML = groups
    .map((gid) => {
      const meta = GROUP_META[gid];
      const gRoles = ROLE_CATALOG.filter((r) => r.group === gid);
      const enabledCount = gRoles.filter((r) => roleState[r.id]?.enabled).length;
      const allOn = enabledCount === gRoles.length;
      const someOn = enabledCount > 0 && !allOn;
      const checkCls = allOn ? 'on' : someOn ? 'partial' : '';
      const roleRows = gRoles
        .map((r) => {
          const st = roleState[r.id];
          const src = srcForRole(r);
          const [, bc, bh] = hexToOklch(src.hex);
          const sw = oklchToHex(0.52, Math.min(bc * r.cf, maxC(0.52, bh)), bh);
          const selVal = src.id || sources[0].id;
          return `<div class="role-row${st.enabled ? '' : ' disabled'}" data-rid="${r.id}">
        <div class="role-check${st.enabled ? ' on' : ''}" onclick="toggleRole('${r.id}')"></div>
        <div class="role-swatch" style="background:${sw}"></div>
        <span class="role-label">${r.name}<span class="role-label-dim">${r.desc ? '· ' + r.desc : ''}</span></span>
        ${
          r.fixed
            ? `<span style="font-size:12px;color:var(--t3);font-style:italic">fixed</span>`
            : `<select class="role-src-sel" title="Source color" onchange="setRoleSrc('${r.id}',this.value)">
              ${sources.map((s) => `<option value="${s.id}"${s.id === selVal ? ' selected' : ''}>${s.name}</option>`).join('')}
             </select>`
        }
      </div>`;
        })
        .join('');
      return `<div class="role-group">
      <div class="group-header" onclick="toggleGroup('${gid}')">
        <div class="group-check ${checkCls}" onclick="event.stopPropagation();toggleGroupCheck('${gid}')"></div>
        <span class="group-name">${meta.label}</span>
        <span class="group-toggle">${meta.desc}</span>
      </div>
      <div class="group-roles" id="grp-${gid}">${roleRows}</div>
    </div>`;
    })
    .join('');
}

function toggleRole(id) {
  roleState[id].enabled = !roleState[id].enabled;
  renderRoleGroups();
  rebuild();
  persistState();
}
function toggleGroupCheck(gid) {
  const gRoles = ROLE_CATALOG.filter((r) => r.group === gid);
  const allOn = gRoles.every((r) => roleState[r.id]?.enabled);
  gRoles.forEach((r) => {
    roleState[r.id].enabled = !allOn;
  });
  renderRoleGroups();
  rebuild();
  persistState();
}
function toggleGroup(gid) {
  const el = document.getElementById('grp-' + gid);
  el.style.display = el.style.display === 'none' ? '' : 'none';
}
function setRoleSrc(id, sid) {
  if (roleState[id]) roleState[id].sourceId = sid;
  rebuild();
  persistState();
}
function renameSource(id, val) {
  const s = sources.find((x) => x.id === id);
  if (s) s.name = val;
  renderRoleGroups();
  persistState();
}

// ══════════════════════════════════════════ REBUILD & SLIDERS
function rebuild() {
  const {Lshift, C, T, S} = getSliders();
  renderMain();
}

function onSlide() {
  ['val', 'aro', 'tmp', 'stp'].forEach((k) => {
    document.getElementById('v-' + k).textContent = document.getElementById('s-' + k).value;
  });
  rebuild();
  persistState();
}

function resetSliders() {
  document.getElementById('s-val').value = 0;
  document.getElementById('s-aro').value = 0;
  document.getElementById('s-tmp').value = 0;
  document.getElementById('s-stp').value = 10;
  onSlide();
}

// ══════════════════════════════════════════ SOURCE CRUD
function addSource() {
  const hues = [40, 120, 280, 160, 310, 200, 60, 240];
  const h = hues[sources.length % hues.length];
  const id = 's' + uid++;
  sources.push({id, name: 'Color ' + (uid - 1), hex: oklchToHex(0.52, 0.18, h)});
  renderSources();
  renderRoleGroups();
  rebuild();
  persistState();
}
function delSource(id) {
  if (sources.length <= 1) return toast('Need at least one source');
  sources = sources.filter((s) => s.id !== id);
  Object.keys(roleState).forEach((rid) => {
    if (roleState[rid].sourceId === id) roleState[rid].sourceId = null;
  });
  renderSources();
  renderRoleGroups();
  rebuild();
  persistState();
}

// ══════════════════════════════════════════ RENDER MAIN
function renderMain() {
  const {Lshift, C, T, S} = getSliders();
  const main = document.getElementById('main');
  const active = activeRoles();
  if (!active.length) {
    main.innerHTML = '<div style="display:flex;flex:1;align-items:center;justify-content:center;color:var(--t3);font-size:15px">Enable some roles to see palettes</div>';
    return;
  }

  const palData = computePalData();

  const groupOrder = ['core', 'neutral', 'accent', 'semantic', 'extended'];
  let html = '';
  groupOrder.forEach((gid) => {
    const gPals = palData.filter((p) => p.group === gid);
    if (!gPals.length) return;
    html += `<div class="group-section">
      <div class="group-section-label">${GROUP_META[gid].label}</div>
      ${gPals.map((p) => renderPalCard(p)).join('')}
    </div>`;
  });

  html += renderContrastCard(palData);
  html += renderPreviewCard(palData);

  html += `<div class="export-card">
    <div class="export-tabs">
      <button class="etab${exportFmt === 'css' ? ' on' : ''}" onclick="setFmt('css')">CSS</button>
      <button class="etab${exportFmt === 'tailwind' ? ' on' : ''}" onclick="setFmt('tailwind')">Tailwind</button>
      <button class="etab${exportFmt === 'json' ? ' on' : ''}" onclick="setFmt('json')">JSON</button>
      <div style="flex:1"></div>
      <button class="etab" onclick="exportToPenpot('assets')" style="color:#5b6af5;font-weight:700;">Export as Assets</button>
      <button class="etab" onclick="exportToPenpot('tokens')" style="color:#5b6af5;font-weight:700;">Export as Tokens</button>
    </div>
    <div class="export-code" id="exportCode">${genExport(palData)}</div>
  </div>`;

  const scrollTop = main.scrollTop;
  main.innerHTML = html;
  main.scrollTop = scrollTop;
}

function renderPalCard(p) {
  const catalogRole = ROLE_CATALOG.find((x) => x.id === p.id) || p;
  const srcLabel = catalogRole.fixed ? 'fixed' : srcForRole(catalogRole).name || '?';
  if (!exportSteps[p.id]) exportSteps[p.id] = {light: nearestStep(p.shades, p.lightStep ?? 500), dark: nearestStep(p.shades, p.darkStep ?? 500)};

  return `<div class="pal-card">
    <div class="pal-head">
      <div class="pal-head-l">
        <div class="pal-dot" style="background:${p.mid?.hex || '#888'}"></div>
        <div>
          <div class="pal-name">${p.name} <span style="font-size:13px;color:var(--t3);font-style:italic">· ${srcLabel}</span></div>
          <div style="display:flex;gap:4px;margin-top:2px">
            <span class="pal-tag">C×${p.cf}</span>
            ${p.lock ? '<span class="pal-tag">locked</span>' : ''}
            ${p.desc ? `<span class="pal-tag">${p.desc}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <select class="role-src-sel" onchange="exportSteps['${p.id}'].light = this.value; renderMain(); persistState()" title="Light theme shade">
          <option value="none">Light: None</option>
          ${p.shades.map((s) => `<option value="${s.step}" ${exportSteps[p.id].light == s.step ? 'selected' : ''}>Light: ${s.step}</option>`).join('')}
        </select>
        <select class="role-src-sel" onchange="exportSteps['${p.id}'].dark = this.value; renderMain(); persistState()" title="Dark theme shade">
          <option value="none">Dark: None</option>
          ${p.shades.map((s) => `<option value="${s.step}" ${exportSteps[p.id].dark == s.step ? 'selected' : ''}>Dark: ${s.step}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="shades-wrap">
      ${p.shades
        .map((s) => {
          const tc = cr(s.hex, '#fff', '#111');
          return `<div class="shade-col" onclick="copyT('${s.hex}')">
          <div class="shade" style="background:${s.hex}">
            <div class="sh-tip">${s.hex}</div>
            <div class="sh-num" style="color:${tc}">${s.step}</div>
          </div>
        </div>`;
        })
        .join('')}
    </div>
  </div>`;
}

// ══════════════════════════════════════════ PALETTE DATA
function computePalData() {
  const {Lshift, C, T, S} = getSliders();
  return activeRoles().map((r) => {
    const src = srcForRole(r);
    const shades = buildShades(r, src.hex, S, Lshift, C, T);
    const mid = shades[Math.floor(shades.length / 2)];
    return {...r, src, shades, mid};
  });
}

// ══════════════════════════════════════════ CONTRAST CHECK (real token pairs, per theme)
// [label, foreground role, background role, minimum WCAG ratio]: 4.5 text, 3 UI / large, 1.05 visible separation
const CONTRAST_PAIRS = [
  ['Text / Background', 'rc-txt', 'rc-bg', 4.5],
  ['Text / Surface', 'rc-txt', 'rc-surf', 4.5],
  ['Text Subtle / Background', 'rc-txts', 'rc-bg', 4.5],
  ['Text Subtle / Surface', 'rc-txts', 'rc-surf', 4.5],
  ['Border / Background', 'rc-bord', 'rc-bg', 3],
  ['Border Subtle / Background', 'rc-bords', 'rc-bg', 1.05],
  ['Border Subtle / Surface', 'rc-bords', 'rc-surf', 1.05],
  ['Surface / Background', 'rc-surf', 'rc-bg', 1.05],
  ['Primary / Background', 'rc-pri', 'rc-bg', 3],
  ['On Primary / Primary', 'rc-onp', 'rc-pri', 4.5],
  ['Secondary / Background', 'rc-sec', 'rc-bg', 3],
  ['Accent 1 / Background', 'rc-ac1', 'rc-bg', 3],
  ['Error / Background', 'rc-err', 'rc-bg', 4.5],
  ['Success / Background', 'rc-ok', 'rc-bg', 3],
];

function stepHex(palData, id, theme) {
  const p = palData.find((x) => x.id === id);
  const cfg = p && exportSteps[p.id];
  if (!cfg || cfg[theme] === 'none') return null;
  return p.shades.find((s) => s.step == cfg[theme])?.hex || null;
}

// Error vs Success as seen with colour-vision deficiency: simulated colour difference (CIE76 dE).
// Soft hint only: below CVD_WARN_DE the pair is likely to look alike. 10 is the level where Krzywinski's deuteranopia palettes treat colours as
// indistinguishable (all 58 main/alt pairs of his 8/12/15/24-colour sets measure <= 9.9 with these matrices). Not a standard.
const CVD_WARN_DE = 10;
function renderCvdCheck(palData) {
  if (!palData.some((p) => p.id === 'rc-err') || !palData.some((p) => p.id === 'rc-ok')) return '';
  const chip = (hex) => `<span class="cv-chip" style="background:${hex}"></span>`;
  let warned = false;
  const rows = ['light', 'dark']
    .map((theme) => {
      const e = stepHex(palData, 'rc-err', theme);
      const s = stepHex(palData, 'rc-ok', theme);
      if (!e || !s) return '';
      const de = (k) => cvdDeltaE(e, s, k).toFixed(0);
      const deCell = (k) => {
        const v = cvdDeltaE(e, s, k);
        warned = warned || v < CVD_WARN_DE;
        return v < CVD_WARN_DE ? `<span class="help-badge orange" title="May look alike to people with this colour-vision type">⚠ ${v.toFixed(0)}</span>` : v.toFixed(0);
      };
      return `<tr><td>${theme === 'light' ? 'Light' : 'Dark'}</td>
        <td>${chip(e)}${chip(s)} <span class="cc-lc">normal</span> &nbsp; ${chip(cvdHex(e, 'deutan'))}${chip(cvdHex(s, 'deutan'))} <span class="cc-lc">deuteranopia</span></td>
        <td>${de(null)}</td><td>${deCell('protan')}</td><td>${deCell('deutan')}</td><td>${deCell('tritan')}</td></tr>`;
    })
    .join('');
  if (!rows) return '';
  return `<div class="prev-lbl" style="padding-top:12px;padding-bottom:6px">Colour-blind check · Error vs Success</div>
    <table class="cc-tbl"><thead><tr><th>Theme</th><th>Colours</th><th>ΔE normal</th><th>Protan</th><th>Deutan</th><th>Tritan</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cc-legend">${warned ? '<b style="color:#f5a623">⚠ These colours may look alike to some users: change a step or pair them with an icon or text. </b>' : ''}ΔE = CIE76 colour difference after simulating the vision type (higher = easier to tell apart). ⚠ marks ΔE &lt; ${CVD_WARN_DE}, the level at which Krzywinski's deuteranopia palettes treat colours as indistinguishable. It is a soft hint, not a standard; protan and tritan use the same value as a rough guide. Matrices: Krzywinski, mk.bcgsc.ca/colorblind. Do not rely on colour alone (WCAG 1.4.1).</div>`;
}

// WCAG 2.x level of a contrast ratio: AAA 7, AA 4.5, 3 = large text / UI components only
const wcagLevel = (ratio) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'large / UI' : '✕');

function renderContrastCard(palData) {
  const cell = (fg, bg, min) => {
    if (!fg || !bg) return '<td>-</td>';
    const ratio = wcag(fg, bg);
    const ok = ratio >= min;
    const lc = Math.round(Math.abs(apca(fg, bg)));
    // text rows (min 4.5) use the full Lc ladder; non-text rows (min 3) pass at Lc 30 (solid meaningful elements) or are only discernible at 15;
    // separation rows (min < 3) are about visibility, not legibility, so Lc stays ungraded
    let lcTag = `<span class="cc-lc">Lc ${lc}</span>`;
    if (min >= 4.5) lcTag = `<span class="help-badge ${lcTier(lc)}" style="margin-left:6px">Lc ${lc}</span>`;
    else if (min >= 3) lcTag = `<span class="help-badge ${lc >= 30 ? 'green' : lc >= 15 ? 'orange' : 'red'}" style="margin-left:6px">Lc ${lc} ${lc >= 30 ? '✓' : '✕'}</span>`;
    return `<td><span class="cc-sw" style="background:${bg};color:${fg}">Aa</span> <span class="ct-row ${ok ? 'ct-aaa' : 'ct-fail'}" style="display:inline-flex" title="WCAG 2.x: needs ${min}">${ratio.toFixed(2)} ${min >= 3 ? wcagLevel(ratio) : ok ? '✓' : '✕'}</span>${lcTag}</td>`;
  };
  const rows = CONTRAST_PAIRS.filter(([, fgId, bgId]) => palData.some((p) => p.id === fgId) && palData.some((p) => p.id === bgId))
    .map(([label, fgId, bgId, min]) => `<tr><td>${label}<span class="cc-min">≥ ${min}</span></td>${cell(stepHex(palData, fgId, 'light'), stepHex(palData, bgId, 'light'), min)}${cell(stepHex(palData, fgId, 'dark'), stepHex(palData, bgId, 'dark'), min)}</tr>`)
    .join('');
  // custom pairs are not tied to a purpose: WCAG shows its level, Lc shows the full ladder (what the pair is good for)
  const cellAuto = (fg, bg) => {
    if (!fg || !bg) return '<td>-</td>';
    const ratio = wcag(fg, bg);
    const lvl = wcagLevel(ratio);
    const cls = ratio >= 4.5 ? 'ct-aaa' : ratio >= 3 ? 'ct-aa' : 'ct-fail';
    const lc = Math.round(Math.abs(apca(fg, bg)));
    return `<td><span class="cc-sw" style="background:${bg};color:${fg}">Aa</span> <span class="ct-row ${cls}" style="display:inline-flex">${ratio.toFixed(2)} ${lvl}</span><span class="help-badge ${lcTier(lc)}" style="margin-left:6px">Lc ${lc}</span></td>`;
  };
  const customRows = customPairs
    .map((cp) => {
      const L = {f: resolveRef(palData, cp.fg, 'light'), b: resolveRef(palData, cp.bg, 'light')};
      const Dk = {f: resolveRef(palData, cp.fg, 'dark'), b: resolveRef(palData, cp.bg, 'dark')};
      const fixed = cp.fg.startsWith('#') && cp.bg.startsWith('#');
      const body = fixed ? cellAuto(L.f.hex, L.b.hex).replace(/^<td>/, '<td colspan="2">') : cellAuto(L.f.hex, L.b.hex) + cellAuto(Dk.f.hex, Dk.b.hex);
      return `<tr class="cc-custom"><td>${L.f.label} / ${L.b.label}<button class="icon-btn del-btn" title="Remove pair" onclick="delCustomPair('${cp.id}')">×</button></td>${body}</tr>`;
    })
    .join('');
  if (!rows && !customRows) return '';
  return `<div class="export-card" style="margin-bottom:14px">
    <div class="prev-lbl" style="padding-bottom:8px">Contrast check · selected Light / Dark steps</div>
    <table class="cc-tbl"><thead><tr><th>Pair</th><th>Light</th><th>Dark</th></tr></thead><tbody>${rows}${customRows ? '<tr class="cc-sub"><td colspan="3">Custom pairs</td></tr>' + customRows : ''}</tbody></table>
    ${renderPairForm(palData)}
    <div class="cc-legend"><b class="cc-h">APCA · Lc</b><span class="help-badge lc90">90+</span>body text <span class="help-badge lc75">75+</span>body minimum <span class="help-badge lc60">60+</span>content text <span class="help-badge lc45">45+</span>headlines <span class="help-badge lc30">30+</span>spot text / solid non-text <span class="help-badge lc15">15+</span>discernible <span class="help-badge lc0">&lt;15</span>invisible · non-text rows: ✓ at Lc 30+ · text sizes in Help</div>
    <div class="cc-legend" style="padding-top:0"><b class="cc-h">WCAG 2.x · contrast ratio</b><b>AAA</b> 7+ · <b>AA</b> 4.5+ · <b>large / UI</b> 3+ (large text 18px+ or bold 14px+, or UI components) · ✕ below 3 · separation rows: ✓ at 1.05+</div>
    ${renderCvdCheck(palData)}
  </div>`;
}

// ══════════════════════════════════════════ CUSTOM CONTRAST PAIRS
let pairDraft = {fg: 'rc-txt', bg: 'rc-bg', fgHex: '#000000', bgHex: '#ffffff'};

// ref = 'roleId' (follows the Light / Dark step chosen on the role card) or '#rrggbb' (same in both themes)
function resolveRef(palData, ref, theme) {
  if (ref.startsWith('#')) return {hex: ref, label: ref.toUpperCase()};
  const id = ref.split(':')[0]; // pairs saved earlier carried a step; roles now follow the card selection
  const p = palData.find((x) => x.id === id);
  return {hex: stepHex(palData, id, theme), label: p ? p.name : id};
}

function pairOptions(palData, sel) {
  return palData.map((p) => `<option value="${p.id}"${sel === p.id ? ' selected' : ''}>${p.name}</option>`).join('') + `<option value="custom"${sel === 'custom' ? ' selected' : ''}>Custom colour…</option>`;
}

function renderPairForm(palData) {
  const side = (key) =>
    `<select class="prev-select" onchange="pairDraft.${key}=this.value;renderMain()">${pairOptions(palData, pairDraft[key])}</select>` +
    (pairDraft[key] === 'custom' ? `<input type="color" class="cc-color" value="${pairDraft[key + 'Hex']}" onchange="pairDraft.${key}Hex=this.value;renderMain()">` : '');
  return `<div class="cc-add"><span>Add pair</span>${side('fg')}<span>on</span>${side('bg')}
    <button class="etab" onclick="addCustomPair()">+ Add</button></div>`;
}

function addCustomPair() {
  const fg = pairDraft.fg === 'custom' ? pairDraft.fgHex : pairDraft.fg;
  const bg = pairDraft.bg === 'custom' ? pairDraft.bgHex : pairDraft.bg;
  customPairs.push({id: 'cp' + uid++, fg, bg});
  renderMain();
  persistState();
}
function delCustomPair(id) {
  customPairs = customPairs.filter((p) => p.id !== id);
  renderMain();
  persistState();
}
// ══════════════════════════════════════════ PREVIEW UI
// A small app screen built from the Light / Dark steps selected on each role, shown side by side, optionally as seen with a colour-vision deficiency.
let pvMode = 'both',
  pvVision = 'normal';
const PV_MODES = {both: 'Light + Dark', light: 'Light', dark: 'Dark'};
const PV_VISION = {normal: 'Normal vision', protan: 'Protanopia', deutan: 'Deuteranopia', tritan: 'Tritanopia', achroma: 'Achromatopsia'};
const PV_TOKENS = [
  ['bg', 'Background'],
  ['surface', 'Surface'],
  ['border', 'Border'],
  ['borderSubtle', 'Border Subtle'],
  ['text', 'Text'],
  ['subtle', 'Text Subtle'],
  ['primary', 'Primary'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent 1'],
  ['error', 'Error'],
  ['success', 'Success']
];

function pvTokens(palData, theme) {
  const get = (id) => stepHex(palData, id, theme);
  const bg = get('rc-bg') || (theme === 'light' ? '#ffffff' : '#121212');
  const text = get('rc-txt') || cr(bg, '#ffffff', '#000000');
  const primary = get('rc-pri') || text;
  const c = {
    bg,
    surface: get('rc-surf') || bg,
    text,
    subtle: get('rc-txts') || text,
    border: get('rc-bord') || get('rc-txts') || text,
    borderSubtle: get('rc-bords') || get('rc-bord') || get('rc-txts') || text,
    primary,
    onPrimary: get('rc-onp') || cr(primary, '#ffffff', '#000000'),
    secondary: get('rc-sec') || primary,
    accent: get('rc-ac1') || primary,
    error: get('rc-err'),
    success: get('rc-ok')
  };
  if (pvVision !== 'normal') for (const k in c) if (c[k]) c[k] = cvdHex(c[k], pvVision);
  return c;
}

function pvPhone(c, label) {
  const dot = (col) => `<span class="pv-dot" style="background:${col}"></span>`;
  const chip = (txt, on) => `<span class="pv-chip" style="${on ? `background:${c.primary};color:${c.onPrimary}` : `background:${c.surface};color:${c.subtle};border-color:${c.border}`}">${txt}</span>`;
  return `<div class="pv-col">
    <div class="pv-lbl">${label}</div>
    <div class="pv-phone" style="background:${c.bg};border-color:${c.borderSubtle}">
      <div class="pv-top"><div class="pv-title" style="color:${c.text}">Discover</div><div class="pv-ico" style="background:${c.surface};border-color:${c.border}">${dot(c.subtle)}</div></div>
      <div class="pv-search" style="background:${c.surface};border-color:${c.border};color:${c.subtle}">Search titles…</div>
      <div class="pv-chips">${chip('Movies', true)}${chip('Series', false)}${chip('Anime', false)}</div>
      <div class="pv-card" style="background:${c.surface}">
        <div class="pv-poster" style="background:linear-gradient(135deg,${c.secondary},${c.primary})"></div>
        <div class="pv-meta">
          <div style="color:${c.text};font-weight:600;font-size:14px">Night Train</div>
          <div style="color:${c.subtle}">2024 · Thriller</div>
          <div class="pv-tags">
            <span style="color:${c.text}"><b style="color:${c.accent}">★</b> 8.4</span>
            ${c.success ? `<span style="color:${c.text}">${dot(c.success)}Done</span>` : ''}
            ${c.error ? `<span style="color:${c.text}">${dot(c.error)}Failed</span>` : ''}
          </div>
        </div>
      </div>
      <div class="pv-btns">
        <span class="pv-btn" style="background:${c.primary};color:${c.onPrimary}">Watch</span>
        <span class="pv-btn" style="border-color:${c.primary};color:${c.primary}">Save</span>
      </div>
      <div class="pv-nav" style="border-color:${c.borderSubtle}">${[0, 1, 2, 3].map((i) => `<span class="pv-navi" style="background:${i === 0 ? c.primary : c.subtle};opacity:${i === 0 ? 1 : 0.55}"></span>`).join('')}</div>
    </div>
    <div class="pv-tokens">${PV_TOKENS.filter(([k]) => c[k]).map(([k, n]) => `<span class="pv-tk" style="background:${c[k]}" title="${n} ${c[k]}"></span>`).join('')}</div>
  </div>`;
}

function renderPreviewCard(palData) {
  const themes = pvMode === 'both' ? ['light', 'dark'] : [pvMode];
  const sel = (id, opts, cur) => `<select class="prev-select" onchange="${id}=this.value;renderMain()">${Object.entries(opts).map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="preview-card">
    <div class="prev-lbl">Preview UI
      <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--t3)">
        ${sel('pvMode', PV_MODES, pvMode)}${sel('pvVision', PV_VISION, pvVision)}
      </div>
    </div>
    <div class="pv-row">${themes.map((th) => pvPhone(pvTokens(palData, th), th === 'light' ? 'Light' : 'Dark')).join('')}</div>
  </div>`;
}

// ══════════════════════════════════════════ COLOR PICKER
function openPicker(id, btnEl, event) {
  event.stopPropagation();
  activeCPId = id;
  let hex = '#3b5bdb';
  const src = sources.find((x) => x.id === id);
  if (src) hex = src.hex;
  const [h, s, v] = hexToHsv(hex);
  ['h', 's', 'v'].forEach((k, i) => (document.getElementById('cp-' + k).value = [h, s, v][i]));
  document.getElementById('cp-hex').value = hex;
  document.getElementById('cp-preview').style.background = hex;
  updateCPGrad(h, s, v);
  const pop = document.getElementById('cp-popover');
  pop.style.display = 'flex';
  const r = btnEl.getBoundingClientRect();
  const pw = 240,
    ph = 220;
  let left = r.left;
  let top = r.bottom + 6;
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (left < 8) left = 8;
  if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
  if (top < 8) top = 8;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}
function closePicker() {
  document.getElementById('cp-popover').style.display = 'none';
  activeCPId = null;
}
function closePickerOnOutside(e) {
  if (activeCPId && !document.getElementById('cp-popover').contains(e.target)) closePicker();
}
function updateCPGrad(h, s, v) {
  document.getElementById('cp-s').style.background = `linear-gradient(to right,${hsvToHex(h, 0, v)},${hsvToHex(h, 100, v)})`;
  document.getElementById('cp-v').style.background = `linear-gradient(to right,#000,${hsvToHex(h, s, 100)})`;
}
function updateCP() {
  const h = +document.getElementById('cp-h').value,
    s = +document.getElementById('cp-s').value,
    v = +document.getElementById('cp-v').value;
  const hex = hsvToHex(h, s, v);
  document.getElementById('cp-hex').value = hex;
  document.getElementById('cp-preview').style.background = hex;
  updateCPGrad(h, s, v);
  applyCPColor(hex);
}
function updateCPFromHex() {
  let hex = document.getElementById('cp-hex').value.trim();
  if (!/^#[0-9a-fA-F]{6}$/i.test(hex)) {
    if (/^[0-9a-fA-F]{6}$/i.test(hex)) hex = '#' + hex;
    else return;
  }
  const [h, s, v] = hexToHsv(hex);
  ['h', 's', 'v'].forEach((k, i) => (document.getElementById('cp-' + k).value = [h, s, v][i]));
  document.getElementById('cp-preview').style.background = hex;
  updateCPGrad(h, s, v);
  applyCPColor(hex);
}
function applyCPColor(hex) {
  if (!activeCPId) return;
  {
    const s = sources.find((x) => x.id === activeCPId);
    if (s) {
      s.hex = hex;
      document.querySelector(`.source-item[data-id="${activeCPId}"] .swatch-btn`).style.background = hex;
      renderRoleGroups();
      rebuild();
      persistState();
    }
  }
}

// ══════════════════════════════════════════ HARMONY
const HARMONIES = [
  {id: 'comp', label: 'Complementary', offsets: [180]},
  {id: 'split', label: 'Split-comp', offsets: [150, 210]},
  {id: 'triadic', label: 'Triadic', offsets: [120, 240]},
  {id: 'tetra', label: 'Tetradic', offsets: [90, 180, 270]},
  {id: 'analog2', label: 'Analogous ×2', offsets: [30, 60]},
  {id: 'analog3', label: 'Analogous ×3', offsets: [30, 60, 90]},
  {id: 'square', label: 'Square', offsets: [90, 180, 270]}
];
let activeHarmony = null;
let savedSources = null;

function toggleHarmony() {
  const panel = document.getElementById('harmonyPanel');
  const btn = document.querySelector('[onclick="toggleHarmony()"]');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  if (btn) btn.classList.toggle('active', !isOpen);
  if (!isOpen) renderHarmonyGrid();
}

function renderHarmonyGrid() {
  document.getElementById('harmonyGrid').innerHTML = HARMONIES.map((h) => `<button class="h-preset${activeHarmony === h.id ? ' on' : ''}" onclick="applyHarmony('${h.id}')">${h.label}</button>`).join(
    ''
  );
}

function applyHarmony(id) {
  if (activeHarmony === id && savedSources) {
    sources = savedSources.map((s) => ({...s}));
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
  savedSources = sources.map((s) => ({...s}));
  activeHarmony = id;
  const harmony = HARMONIES.find((h) => h.id === id);
  if (!harmony) return;
  const primary = sources[0];
  const [, bC, bH] = hexToOklch(primary.hex);
  const baseHue = bH;
  const baseChroma = Math.max(bC, 0.16);
  const needed = harmony.offsets.length + 1;
  while (sources.length < needed) {
    const sid = 's' + uid++;
    sources.push({id: sid, name: 'Color ' + (uid - 1), hex: oklchToHex(0.52, 0.16, 0)});
  }
  harmony.offsets.forEach((offset, i) => {
    const src = sources[i + 1];
    if (!src) return;
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
function extractFromImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
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
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const samples = [];
      const fallbackSamples = [];
      for (let i = 0; i < data.length; i += 4) {
        const [L, C, H] = hexToOklch(r2h(data[i], data[i + 1], data[i + 2]));
        if (L > 0.1 && L < 0.95) {
          if (C > 0.04) samples.push([L, C, H]);
          else if (C > 0.005) fallbackSamples.push([L, C, H]);
        }
      }
      const useSamples = samples.length >= 10 ? samples : [...samples, ...fallbackSamples];
      if (useSamples.length < 5) {
        toast('Image has no usable colors');
        return;
      }
      const k = sources.length;
      const centers = kMeans(useSamples, k);
      centers.sort((a, b) => b[1] - a[1]);
      let applied = 0;
      centers.forEach((center, i) => {
        if (i >= sources.length) return;
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
      toast(applied + ' color' + (applied !== 1 ? 's' : '') + ' extracted');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearImgPreview() {
  const wrap = document.getElementById('imgPreviewWrap');
  const preview = document.getElementById('imgPreview');
  wrap.style.display = 'none';
  preview.src = '';
  preview.onclick = null;
}
