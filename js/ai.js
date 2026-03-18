// ══════════════════════════════════════════ AI GENERATION
async function checkConn() {
  const port = document.getElementById('port').value || '1234';
  const dot = document.getElementById('aiDot'),
    txt = document.getElementById('aiStatusTxt'),
    sel = document.getElementById('modelSel');
  try {
    const r = await fetch(`http://localhost:${port}/api/v1/models`, {signal: AbortSignal.timeout(3000)});
    if (!r.ok) throw 0;
    const data = await r.json();
    const models = (data.models ?? data.data ?? []).filter((m) => m.type === 'llm' || !m.type);
    const loaded = models.filter((m) => m.loaded_instances?.length > 0);
    const list = loaded.length ? loaded : models;
    sel.innerHTML = '<option value="">— select model —</option>';
    list.forEach((m) => {
      const key = m.key ?? m.id ?? '';
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = ((m.display_name ?? key) + (m.loaded_instances?.length ? ' ●' : '')).slice(0, 38);
      if (m.loaded_instances?.length) opt.selected = true;
      sel.appendChild(opt);
    });
    dot.className = 'status-dot ok';
    txt.textContent = list.length + ' model' + (list.length !== 1 ? 's' : '');
  } catch {
    dot.className = 'status-dot';
    txt.textContent = 'Not connected';
    sel.innerHTML = '<option value="">— select model —</option>';
  }
}

async function runAI() {
  const text = document.getElementById('aiText').value.trim();
  if (!text) return;
  const port = document.getElementById('port').value || '1234';
  const model = document.getElementById('modelSel').value;
  if (!model) return toast('Select a model first');
  const btn = document.getElementById('aiBtn'),
    lbl = document.getElementById('aiLabel');
  btn.disabled = true;
  lbl.innerHTML = '<span class="spin"></span>';
  const srcLines = sources.map((s) => `- "${s.id}": ${s.name}`).join('\n');
  const system = `You are an expert UI colour designer and colour psychologist.
The user describes a project mood or theme. You must:
1. Choose mood values between -1 and 1:
   - valence: palette lightness (-1=dark, 0=neutral, +1=light)
   - arousal: saturation (-1=muted, 0=neutral, +1=vivid)
   - temperature: hue shift (-1=cool/blue, 0=neutral, +1=warm/orange)
2. Choose a hue angle (0-359°) for each source. Make them visually distinct (60°+ apart).
   OKLCH hue ref: 0=red 30=orange 60=yellow 90=lime 150=green 180=cyan 220=sky 250=blue 280=violet 300=magenta 330=pink

Sources to assign hues to:
${srcLines}

Return ONLY valid JSON:
{"valence":0.0,"arousal":0.0,"temperature":0.0,"sources":{${sources.map((s, i) => `"${s.id}":${[250, 350, 120][i] ?? 40}`).join(',')}},"reasoning":"one sentence"}`;
  try {
    const r = await fetch(`http://localhost:${port}/api/v1/chat`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({model, system_prompt: system, input: text, temperature: 0.65, max_output_tokens: 300, store: false})
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const msg = (data.output ?? []).find((o) => o.type === 'message');
    if (!msg) throw new Error('No message');
    const raw = msg.content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json|```/g, '')
      .trim();
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON');
    const p = JSON.parse(m[0]);
    if (!p.sources) throw new Error('No sources');
    let applied = 0;
    sources.forEach((s, i) => {
      const h = p.sources[s.id] ?? Object.values(p.sources)[i];
      if (typeof h === 'number') {
        s.hex = oklchToHex(0.52, Math.min(0.18, maxC(0.52, ((h % 360) + 360) % 360)), ((h % 360) + 360) % 360);
        applied++;
      }
    });
    if (!applied) throw new Error('No hues applied');
    ['val', 'aro', 'tmp'].forEach((k, i) => {
      const v = [p.valence, p.arousal, p.temperature][i];
      if (typeof v === 'number') {
        const el = document.getElementById('s-' + k);
        el.value = Math.round(Math.max(-50, Math.min(50, v * 50)));
        document.getElementById('v-' + k).textContent = el.value;
      }
    });
    renderSources();
    renderRoleGroups();
    rebuild();
    persistState();
    if (p.reasoning) {
      const box = document.getElementById('aiResp');
      document.getElementById('aiRespText').textContent = p.reasoning;
      box.style.display = 'block';
    }
  } catch (e) {
    toast('AI: ' + e.message.slice(0, 60));
    const box = document.getElementById('aiResp');
    document.getElementById('aiRespText').textContent = 'Error: ' + e.message;
    box.style.display = 'block';
  }
  btn.disabled = false;
  lbl.textContent = 'Generate';
}
