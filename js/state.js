// ══════════════════════════════════════════ ROLE CATALOG & STATE

let sources=[
  {id:'s1',name:'Primary', hex:'#3b5bdb'},
  {id:'s2',name:'Accent',  hex:'#e64980'},
];

// engine: 'hct' (default) = tone ladder, same step = same tone for every role | 'oklch' = decorative ladder anchored on the source colour
// neutral: tinted grey on the HCT ladder (hue/chroma borrowed from the source so the palette stays connected); cf = tint strength, 0.10 = reference
// lightStep / darkStep: default shade exported for each theme (nearest available step is used)
// Success sits two steps away from Error on purpose: same step = same tone, which red-green colour-blind users cannot tell apart
const ROLE_CATALOG=[
  {id:'rc-pri',  group:'core',     name:'Primary',       desc:'Main brand action',    cf:1.0,  lock:false, defaultOn:true,  srcIdx:0, lightStep:700, darkStep:300},
  {id:'rc-sec',  group:'core',     name:'Secondary',     desc:'Supporting brand',     cf:0.35, lock:false, defaultOn:true,  srcIdx:0, hueShift:60, lightStep:700, darkStep:300},
  {id:'rc-bg',   group:'neutral',  name:'Background',    desc:'Page/canvas',          cf:0.04, lock:false, defaultOn:true,  srcIdx:0, neutral:true, lightStep:50,  darkStep:950},
  {id:'rc-surf', group:'neutral',  name:'Surface',       desc:'Cards, panels',        cf:0.09, lock:false, defaultOn:true,  srcIdx:0, neutral:true, lightStep:100, darkStep:900},
  {id:'rc-bord', group:'neutral',  name:'Border',        desc:'Dividers, outlines',   cf:0.16, lock:false, defaultOn:false, srcIdx:0, neutral:true, lightStep:600, darkStep:500},
  {id:'rc-bords',group:'neutral',  name:'Border Subtle', desc:'Hairlines, soft dividers', cf:0.12, lock:false, defaultOn:true,  srcIdx:0, neutral:true, lightStep:300, darkStep:800},
  {id:'rc-txt',  group:'neutral',  name:'Text',          desc:'Body copy',            cf:0.08, lock:false, defaultOn:true,  srcIdx:0, neutral:true, lightStep:900, darkStep:200},
  {id:'rc-txts', group:'neutral',  name:'Text Subtle',   desc:'Captions, hints',      cf:0.11, lock:false, defaultOn:false, srcIdx:0, neutral:true, lightStep:700, darkStep:300},
  {id:'rc-ac1',  group:'accent',   name:'Accent 1',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:true,  srcIdx:1, engine:'oklch', lightStep:500, darkStep:500},
  {id:'rc-ac2',  group:'accent',   name:'Accent 2',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:false, srcIdx:2, engine:'oklch', lightStep:500, darkStep:500},
  {id:'rc-ac3',  group:'accent',   name:'Accent 3',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:false, srcIdx:3, engine:'oklch', lightStep:500, darkStep:500},
  {id:'rc-err',  group:'semantic', name:'Error',         desc:'Destructive / danger', cf:1.0,  lock:true,  defaultOn:false, fixedHue:25,  lightStep:700, darkStep:300},
  {id:'rc-warn', group:'semantic', name:'Warning',       desc:'Caution',              cf:1.0,  lock:true,  defaultOn:false, fixedHue:57,  lightStep:700, darkStep:300},
  {id:'rc-ok',   group:'semantic', name:'Success',       desc:'Positive / done',      cf:1.0,  lock:true,  defaultOn:false, fixedHue:147, lightStep:500, darkStep:500},
  {id:'rc-info', group:'semantic', name:'Info',          desc:'Informational',        cf:1.0,  lock:true,  defaultOn:false, fixedHue:255, lightStep:700, darkStep:300},
  {id:'rc-hl',   group:'extended', name:'Highlight',     desc:'Pullquote, plaque',    cf:1.0,  lock:false, defaultOn:false, srcIdx:0, engine:'oklch', lightStep:500, darkStep:500},
  {id:'rc-onp',  group:'extended', name:'On Primary',    desc:'Text over primary',    cf:0.04, lock:false, defaultOn:false, srcIdx:0, neutral:true, lightStep:50, darkStep:900},
];

const GROUP_META = {
  core:     {label:'Core',     desc:'Always needed'},
  neutral:  {label:'Neutrals', desc:'Space & text'},
  accent:   {label:'Accents',  desc:'Categories, rubrics'},
  semantic: {label:'Semantic', desc:'States (app/web)'},
  extended: {label:'Extended', desc:'Print & brand'},
};

let roleState = {};
ROLE_CATALOG.forEach(r=>{
  roleState[r.id]={
    enabled: r.defaultOn,
    sourceId: null,
  };
});

const defaultRoleState = JSON.parse(JSON.stringify(roleState));

let exportFmt='css', uid=20, activeCPId=null, exportSteps={};
let customPairs=[]; // user-added contrast pairs: {id, fg, bg}; fg/bg are a role id or '#rrggbb'

// ══════════════════════════════════════════ STATE PERSISTENCE
// v2: shade steps now mean the same tone for every role, so steps saved by v1 would point at different colours
const STATE_VERSION = 2;
function persistState() {
  const state = {
    version: STATE_VERSION,
    sliders: {
      val: document.getElementById('s-val').value,
      aro: document.getElementById('s-aro').value,
      tmp: document.getElementById('s-tmp').value,
      stp: document.getElementById('s-stp').value
    },
    aiText: document.getElementById('aiText') ? document.getElementById('aiText').value : '',
    sources: sources,
    roleState: roleState,
    exportSteps: exportSteps,
    customPairs: customPairs
  };
  localStorage.setItem('paletteStudioState', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('paletteStudioState');
  if (!saved) {
    renderSources();
    renderRoleGroups();
    rebuild();
    return;
  }
  try {
    const state = JSON.parse(saved);
    sources = state.sources || sources;
    roleState = Object.assign({}, defaultRoleState, state.roleState || {});
    const migrated = (state.version || 1) < STATE_VERSION;
    exportSteps = migrated ? {} : state.exportSteps || exportSteps;
    customPairs = state.customPairs || customPairs;
    if (document.getElementById('aiText')) {
      document.getElementById('aiText').value = state.aiText || '';
    }
    if (state.sliders) {
      document.getElementById('s-val').value = state.sliders.val;
      document.getElementById('s-aro').value = state.sliders.aro;
      document.getElementById('s-tmp').value = state.sliders.tmp;
      document.getElementById('s-stp').value = state.sliders.stp;
    }
    onSlide();
    renderSources();
    renderRoleGroups();
    rebuild();
    if (migrated) {
      persistState();
      setTimeout(() => toast('Palette engine updated: Light/Dark steps reset to new defaults'), 400);
    }
  } catch (e) {
    console.error("Failed to load state", e);
    renderSources();
    renderRoleGroups();
    rebuild();
  }
}
