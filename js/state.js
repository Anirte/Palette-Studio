// ══════════════════════════════════════════ ROLE CATALOG & STATE

let sources=[
  {id:'s1',name:'Primary', hex:'#3b5bdb'},
  {id:'s2',name:'Accent',  hex:'#e64980'},
];

const ROLE_CATALOG=[
  {id:'rc-pri',  group:'core',     name:'Primary',       desc:'Main brand action',    cf:1.0,  lock:false, defaultOn:true,  srcIdx:0},
  {id:'rc-sec',  group:'core',     name:'Secondary',     desc:'Supporting brand',     cf:0.35, lock:false, defaultOn:true,  srcIdx:0, hueShift:60},
  {id:'rc-bg',   group:'neutral',  name:'Background',    desc:'Page/canvas',          cf:0.03, lock:false, defaultOn:true,  srcIdx:0, fixedL:0.97},
  {id:'rc-surf', group:'neutral',  name:'Surface',       desc:'Cards, panels',        cf:0.05, lock:false, defaultOn:true,  srcIdx:0, fixedL:0.93},
  {id:'rc-bord', group:'neutral',  name:'Border',        desc:'Dividers, outlines',   cf:0.10, lock:false, defaultOn:false, srcIdx:0, fixedL:0.78},
  {id:'rc-txt',  group:'neutral',  name:'Text',          desc:'Body copy',            cf:0.05, lock:false, defaultOn:true,  srcIdx:0, fixedL:0.22},
  {id:'rc-txts', group:'neutral',  name:'Text Subtle',   desc:'Captions, hints',      cf:0.07, lock:false, defaultOn:false, srcIdx:0, fixedL:0.52},
  {id:'rc-ac1',  group:'accent',   name:'Accent 1',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:true,  srcIdx:1},
  {id:'rc-ac2',  group:'accent',   name:'Accent 2',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:false, srcIdx:2},
  {id:'rc-ac3',  group:'accent',   name:'Accent 3',      desc:'Category / rubric',    cf:1.0,  lock:false, defaultOn:false, srcIdx:3},
  {id:'rc-err',  group:'semantic', name:'Error',         desc:'Destructive / danger', cf:1.0,  lock:true,  defaultOn:false, fixedHue:25},
  {id:'rc-warn', group:'semantic', name:'Warning',       desc:'Caution',              cf:1.0,  lock:true,  defaultOn:false, fixedHue:57},
  {id:'rc-ok',   group:'semantic', name:'Success',       desc:'Positive / done',      cf:1.0,  lock:true,  defaultOn:false, fixedHue:147},
  {id:'rc-info', group:'semantic', name:'Info',          desc:'Informational',        cf:1.0,  lock:true,  defaultOn:false, fixedHue:255},
  {id:'rc-hl',   group:'extended', name:'Highlight',     desc:'Pullquote, plaque',    cf:1.0,  lock:false, defaultOn:false, srcIdx:0},
  {id:'rc-onp',  group:'extended', name:'On Primary',    desc:'Text over primary',    cf:0.0,  lock:true,  defaultOn:false, fixed:'#ffffff'},
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

let exportFmt='css', uid=20, activeCPId=null, exportSteps={};
let ctBg1='#ffffff', ctBg2='#111111';
let prevBg='rc-bg', prevBtn1='rc-pri', prevBtn2='rc-ac1', prevTxt='rc-txt', prevTxtS='rc-txts', prevStep=500;

// ══════════════════════════════════════════ STATE PERSISTENCE
function persistState() {
  const state = {
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
    ctBg1: ctBg1,
    ctBg2: ctBg2
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
    roleState = state.roleState || roleState;
    exportSteps = state.exportSteps || exportSteps;
    ctBg1 = state.ctBg1 || ctBg1;
    ctBg2 = state.ctBg2 || ctBg2;
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
    document.getElementById('btn-bg1').style.background = ctBg1;
    document.getElementById('btn-bg2').style.background = ctBg2;
  } catch (e) {
    console.error("Failed to load state", e);
    renderSources();
    renderRoleGroups();
    rebuild();
  }
}
