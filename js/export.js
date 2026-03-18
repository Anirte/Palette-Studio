// ══════════════════════════════════════════ EXPORT FORMAT
function genExport(palData){
  if(!palData){
    const{Lshift,C,T,S}=getSliders();
    palData=activeRoles().map(r=>{
      const catalogRole=ROLE_CATALOG.find(x=>x.id===r.id)||r;
      let src,shades;
      if(catalogRole.fixed){src={hex:catalogRole.fixed};shades=makeShades(src.hex,r.cf,r.lock,S,Lshift,C,T,null,0);}
      else if(catalogRole.fixedHue!==undefined){src=srcForRole(r);shades=makeSemanticShades(catalogRole.fixedHue,src.hex,S,Lshift,C);}
      else{src=srcForRole(r);shades=makeShades(src.hex,r.cf,r.lock,S,Lshift,C,T,catalogRole.fixedL??null,catalogRole.hueShift??0);}
      return{...r,src,shades};
    });
  }
  const key=n=>n.toLowerCase().replace(/\s+/g,'-');

  if (exportFmt === 'css') {
    const lines = [':root {'];
    palData.forEach(p => {
      const cfg = exportSteps[p.id] || { light: 'none', dark: 'none' };
      const lShade = p.shades.find(s => s.step == cfg.light);
      const dShade = p.shades.find(s => s.step == cfg.dark);
      if (lShade) lines.push(`  --color-${key(p.name)}-light: ${lShade.hex};`);
      if (dShade) lines.push(`  --color-${key(p.name)}-dark: ${dShade.hex};`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  if (exportFmt === 'tailwind') {
    const lines = ['colors: {'];
    palData.forEach(p => {
      const cfg = exportSteps[p.id] || { light: 'none', dark: 'none' };
      const lShade = p.shades.find(s => s.step == cfg.light);
      const dShade = p.shades.find(s => s.step == cfg.dark);
      if (lShade || dShade) {
        lines.push(`  '${key(p.name)}': {`);
        if (lShade) lines.push(`    light: '${lShade.hex}',`);
        if (dShade) lines.push(`    dark: '${dShade.hex}',`);
        lines.push(`  },`);
      }
    });
    lines.push('}');
    return lines.join('\n');
  }

  // JSON
  const obj = {};
  palData.forEach(p => {
    const cfg = exportSteps[p.id] || { light: 'none', dark: 'none' };
    const lShade = p.shades.find(s => s.step == cfg.light);
    const dShade = p.shades.find(s => s.step == cfg.dark);
    if (lShade || dShade) {
      obj[key(p.name)] = {};
      if (lShade) obj[key(p.name)].light = lShade.hex;
      if (dShade) obj[key(p.name)].dark = dShade.hex;
    }
  });
  return JSON.stringify(obj, null, 2);
}

function setFmt(f){exportFmt=f;const el=document.getElementById('exportCode');if(el)el.textContent=genExport();document.querySelectorAll('.etab').forEach(t=>t.classList.toggle('on',t.textContent.toLowerCase()===f))}
function copyAllCSS(){exportFmt='css';navigator.clipboard.writeText(genExport()).then(()=>toast('CSS copied!'))}

// ══════════════════════════════════════════ EXPORT / IMPORT PALETTE
function exportPalette() {
  const state = JSON.parse(localStorage.getItem('paletteStudioState') || '{}');
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'palette-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Palette exported');
}

function importPalette(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const state = JSON.parse(e.target.result);
      localStorage.setItem('paletteStudioState', JSON.stringify(state));
      loadState();
      toast('Palette imported');
    } catch(err) {
      toast('Invalid file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ══════════════════════════════════════════ EXPORT TO PENPOT
function exportToPenpot(mode) {
  const { Lshift, C, T, S } = getSliders();
  const active = activeRoles();
  if(!active.length) return toast('No active roles to export');

  const palData = active.map(r => {
    const catalogRole = ROLE_CATALOG.find(x => x.id === r.id) || r;
    let src, shades;
    if(catalogRole.fixed){ src = {hex:catalogRole.fixed}; shades = makeShades(src.hex, r.cf, r.lock, S, Lshift, C, T, catalogRole.fixedL??null, catalogRole.hueShift??0); }
    else if(catalogRole.fixedHue!==undefined){ src = srcForRole(r); shades = makeSemanticShades(catalogRole.fixedHue, src.hex, S, Lshift, C); }
    else { src = srcForRole(r); shades = makeShades(src.hex, r.cf, r.lock, S, Lshift, C, T, catalogRole.fixedL??null, catalogRole.hueShift??0); }
    return { ...r, src, shades, group: catalogRole.group };
  });

  const colorsToExport = [];
  const key = n => n.toLowerCase().replace(/\s+/g, '-');

  palData.forEach(p => {
    const cfg = exportSteps[p.id] || { light: 'none', dark: 'none' };
    const hasLight = cfg.light !== 'none';
    const hasDark = cfg.dark !== 'none';
    const hasBoth = hasLight && hasDark;

    if (mode === 'tokens') {
      const tokenName = `${key(p.group || 'color')}.${key(p.name)}`;
      if (hasLight) {
        const lShade = p.shades.find(s => s.step == cfg.light);
        if (lShade) colorsToExport.push({ name: tokenName, hex: lShade.hex, variant: 'light' });
      }
      if (hasDark) {
        const dShade = p.shades.find(s => s.step == cfg.dark);
        if (dShade) colorsToExport.push({ name: tokenName, hex: dShade.hex, variant: 'dark' });
      }
    } else {
      const groupName = p.group || 'Color';
      const displayName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
      if (hasLight) {
        const lShade = p.shades.find(s => s.step == cfg.light);
        if (lShade) {
          const label = hasBoth ? `${displayName} (Light)` : displayName;
          colorsToExport.push({ name: `${groupName}/${label}`, hex: lShade.hex });
        }
      }
      if (hasDark) {
        const dShade = p.shades.find(s => s.step == cfg.dark);
        if (dShade) {
          const label = hasBoth ? `${displayName} (Dark)` : displayName;
          colorsToExport.push({ name: `${groupName}/${label}`, hex: dShade.hex });
        }
      }
    }
  });

  if (mode === 'tokens') {
    const confirmed = confirm('This will update existing Palette Studio tokens. Continue?');
    if (!confirmed) return;
  }

  parent.postMessage({ type: 'ADD_COLORS', mode: mode, colors: colorsToExport }, '*');
}

// ══════════════════════════════════════════ LISTEN FOR PENPOT RESPONSE
window.addEventListener('message', (event) => {
  if (event.data.type === 'COLORS_ADDED') {
    if (event.data.needsThemes) {
      toast(`Added ${event.data.count} tokens to Penpot!`);
      if (!event.data.themesExist) {
        setTimeout(() => {
          toast('⚠️ Link "Palette Studio/Light" and "Palette Studio/Dark" sets to Light and Dark themes manually in Penpot Tokens panel.');
        }, 2000);
      }
    } else {
      toast(`Added ${event.data.count} colors to Penpot library!`);
    }
  }
});
