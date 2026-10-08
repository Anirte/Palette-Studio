// ══════════════════════════════════════════ EXPORT FORMAT
function genExport(palData) {
  if (!palData) palData = computePalData();
  const key = (n) => n.toLowerCase().replace(/\s+/g, '-');

  if (exportFmt === 'css') {
    const lines = [':root {'];
    palData.forEach((p) => {
      const cfg = exportSteps[p.id] || {light: 'none', dark: 'none'};
      const lShade = p.shades.find((s) => s.step == cfg.light);
      const dShade = p.shades.find((s) => s.step == cfg.dark);
      if (lShade) lines.push(`  --color-${key(p.name)}-light: ${lShade.hex};`);
      if (dShade) lines.push(`  --color-${key(p.name)}-dark: ${dShade.hex};`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  if (exportFmt === 'tailwind') {
    const lines = ['colors: {'];
    palData.forEach((p) => {
      const cfg = exportSteps[p.id] || {light: 'none', dark: 'none'};
      const lShade = p.shades.find((s) => s.step == cfg.light);
      const dShade = p.shades.find((s) => s.step == cfg.dark);
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
  palData.forEach((p) => {
    const cfg = exportSteps[p.id] || {light: 'none', dark: 'none'};
    const lShade = p.shades.find((s) => s.step == cfg.light);
    const dShade = p.shades.find((s) => s.step == cfg.dark);
    if (lShade || dShade) {
      obj[key(p.name)] = {};
      if (lShade) obj[key(p.name)].light = lShade.hex;
      if (dShade) obj[key(p.name)].dark = dShade.hex;
    }
  });
  return JSON.stringify(obj, null, 2);
}

function setFmt(f) {
  exportFmt = f;
  const el = document.getElementById('exportCode');
  if (el) el.textContent = genExport();
  document.querySelectorAll('.etab').forEach((t) => t.classList.toggle('on', t.textContent.toLowerCase() === f));
}
function copyAllCSS() {
  exportFmt = 'css';
  navigator.clipboard.writeText(genExport()).then(() => toast('CSS copied!'));
}

// ══════════════════════════════════════════ EXPORT / IMPORT PALETTE
function exportPalette() {
  const state = JSON.parse(localStorage.getItem('paletteStudioState') || '{}');
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'palette-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Palette exported');
}

function importPalette(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const state = JSON.parse(e.target.result);
      localStorage.setItem('paletteStudioState', JSON.stringify(state));
      loadState();
      toast('Palette imported');
    } catch (err) {
      toast('Invalid file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ══════════════════════════════════════════ EXPORT TO PENPOT
function exportToPenpot(mode) {
  const palData = computePalData();
  if (!palData.length) return toast('No active roles to export');

  const colorsToExport = [];
  const key = (n) => n.toLowerCase().replace(/\s+/g, '-');

  palData.forEach((p) => {
    const cfg = exportSteps[p.id] || {light: 'none', dark: 'none'};
    const hasLight = cfg.light !== 'none';
    const hasDark = cfg.dark !== 'none';
    const hasBoth = hasLight && hasDark;

    if (mode === 'tokens') {
      // p.token comes from ROLE_CATALOG (group.name, as in the "Mobile design" system)
      const tokenName = p.token || `${key(p.group || 'color')}.${key(p.name)}`;
      const lShade = hasLight && p.shades.find((s) => s.step == cfg.light);
      const dShade = hasDark && p.shades.find((s) => s.step == cfg.dark);
      if (lShade && dShade && lShade.hex.toLowerCase() !== dShade.hex.toLowerCase()) {
        // differs per theme: goes to the Light and Dark sets
        colorsToExport.push({name: tokenName, hex: lShade.hex, variant: 'light'});
        colorsToExport.push({name: tokenName, hex: dShade.hex, variant: 'dark'});
      } else if (lShade || dShade) {
        // same in both themes (or only one theme picked): goes to the shared set
        colorsToExport.push({name: tokenName, hex: (lShade || dShade).hex, variant: 'shared'});
      }
    } else {
      const groupName = p.group || 'Color';
      const displayName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
      if (hasLight) {
        const lShade = p.shades.find((s) => s.step == cfg.light);
        if (lShade) {
          const label = hasBoth ? `${displayName} (Light)` : displayName;
          colorsToExport.push({name: `${groupName}/${label}`, hex: lShade.hex});
        }
      }
      if (hasDark) {
        const dShade = p.shades.find((s) => s.step == cfg.dark);
        if (dShade) {
          const label = hasBoth ? `${displayName} (Dark)` : displayName;
          colorsToExport.push({name: `${groupName}/${label}`, hex: dShade.hex});
        }
      }
    }
  });

  if (!colorsToExport.length) return toast('Nothing to export: pick a Light or Dark step for at least one role');

  if (mode === 'tokens') {
    const confirmed = confirm('This will create or update tokens with these names in the Penpot sets Universal, Light and Dark. Continue?');
    if (!confirmed) return;
  }

  parent.postMessage({type: 'ADD_COLORS', mode: mode, colors: colorsToExport}, '*');
}

// ══════════════════════════════════════════ LISTEN FOR PENPOT RESPONSE
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'COLORS_ERROR') {
    toast('Penpot: ' + String(msg.message).slice(0, 80));
    return;
  }
  if (msg.type !== 'COLORS_ADDED') return;

  if (msg.mode === 'tokens') {
    toast(`Exported ${msg.count} tokens to Penpot${msg.themed ? ' (Universal + Light / Dark)' : ''}`);
    if (msg.missingLinks && msg.missingLinks.length) {
      setTimeout(() => {
        toast('⚠️ Add these sets to their themes manually in the Penpot Tokens panel: ' + msg.missingLinks.join(', '));
      }, 2000);
    }
  } else {
    toast(`Penpot library: ${msg.added} added, ${msg.updated} updated`);
  }
});
