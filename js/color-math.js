// ══════════════════════════════════════════ HCT COLOR SPACE
function _matMul(row,m){return[row[0]*m[0][0]+row[1]*m[0][1]+row[2]*m[0][2],row[0]*m[1][0]+row[1]*m[1][1]+row[2]*m[1][2],row[0]*m[2][0]+row[1]*m[2][1]+row[2]*m[2][2]]}
function _sanDeg(d){d=d%360;return d<0?d+360:d}
function _sgn(x){return x<0?-1:x>0?1:0}
function _lin(c8){const c=c8/255;return(c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4))*100}
function _delin(lin){const c=lin/100;const d=c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055;return Math.round(Math.max(0,Math.min(255,d*255)))}
function _yFromL(l){const c=(l+16)/116;return 100*(c*c*c>0.008856452?c*c*c:(c-16/116)/7.787037)}
function _lFromY(y){const t=y/100;return 116*(t>0.008856452?Math.cbrt(t):7.787037*t+16/116)-16}
function _lFromArgb(a){const r=_lin((a>>16)&255),g=_lin((a>>8)&255),b=_lin(a&255);return _lFromY(0.2126*r+0.7152*g+0.0722*b)}
function _hexFromArgb(a){const r=(a>>16)&255,g=(a>>8)&255,b=a&255;return'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}
function _argbFromHex(h){return(255<<24)|parseInt(h.replace('#',''),16)}
function _argbFromLstar(l){const y=_yFromL(l)/100;const v=Math.round(Math.max(0,Math.min(255,(y<=0.0031308?y*12.92:1.055*Math.pow(y,1/2.4)-0.055)*255)));return(255<<24)|((v&255)<<16)|((v&255)<<8)|(v&255)}
function _argbFromLin(r,g,b){return(255<<24)|((_delin(r)&255)<<16)|((_delin(g)&255)<<8)|(_delin(b)&255)}

const _VC=(()=>{
  const wp=[95.047,100,108.883];
  const rW=wp[0]*.401288+wp[1]*.650173+wp[2]*-.051461,gW=wp[0]*-.250268+wp[1]*1.204414+wp[2]*.045854,bW=wp[0]*-.002079+wp[1]*.048952+wp[2]*.953127;
  const aL=(200/Math.PI)*_yFromL(50)/100,f=1.0,c=0.69,dc=Math.max(0,Math.min(1,f*(1-(1/3.6)*Math.exp((-aL-42)/92))));
  const rgbD=[dc*(100/rW)+1-dc,dc*(100/gW)+1-dc,dc*(100/bW)+1-dc];
  const k=1/(5*aL+1),k4=k**4,k4f=1-k4,fl=k4*aL+.1*k4f*k4f*Math.pow(5*aL,1/3);
  const n=_yFromL(50)/wp[1],z=1.48+Math.sqrt(n),nbb=.725/Math.pow(n,.2);
  const rf=[rW,gW,bW].map((w,i)=>Math.pow((fl*rgbD[i]*w)/100,.42));
  const rgbA=rf.map(x=>(400*x)/(x+27.13));
  return{n,aw:(2*rgbA[0]+rgbA[1]+.05*rgbA[2])*nbb,nbb,ncb:nbb,c,nc:1,rgbD,fl,flRoot:Math.pow(fl,.25),z};
})();

function _ca(c){const af=Math.pow(Math.abs(c),.42);return _sgn(c)*400*af/(af+27.13)}
function _cam16(argb){
  const r=_lin((argb>>16)&255),g=_lin((argb>>8)&255),b=_lin(argb&255);
  const x=.41233895*r+.35762064*g+.18051042*b,y=.2126*r+.7152*g+.0722*b,z=.01932141*r+.11916382*g+.95034478*b;
  const rC=.401288*x+.650173*y-.051461*z,gC=-.250268*x+1.204414*y+.045854*z,bC=-.002079*x+.048952*y+.953127*z;
  const rA=_ca(_VC.rgbD[0]*rC),gA=_ca(_VC.rgbD[1]*gC),bA=_ca(_VC.rgbD[2]*bC);
  const a=(11*rA-12*gA+bA)/11,bb=(rA+gA-2*bA)/9,u=(20*rA+20*gA+21*bA)/20,p2=(40*rA+20*gA+bA)/20;
  const hue=_sanDeg(Math.atan2(bb,a)*180/Math.PI),hRad=hue*Math.PI/180;
  const ac=p2*_VC.nbb,j=100*Math.pow(ac/_VC.aw,_VC.c*_VC.z);
  const hp=hue<20.14?hue+360:hue,eH=.25*(Math.cos(hp*Math.PI/180+2)+3.8);
  const p1=(50000/13)*eH*_VC.nc*_VC.ncb,t=p1*Math.sqrt(a*a+bb*bb)/(u+.305);
  return{hue,chroma:Math.pow(t,.9)*Math.pow(1.64-Math.pow(.29,_VC.n),.73)*Math.sqrt(j/100),j};
}

const _SD=[[.001200833568784504,.002389694492170889,.0002795742885861124],[.0005891086651375999,.0029785502573438758,.0003270666104008398],[.00010146692491640572,.0005364214359186694,.0032979401770712076]];
const _LS=[[1373.2198709594231,-1100.4251190754821,-7.278681089101213],[-271.815969077903,559.6580465940733,-32.46047482791194],[1.9622899599665666,-57.173814538844006,308.7233197812385]];
const _YL=[.2126,.7152,.0722];
const _CP=[0.015176349177441876,0.045529047532325624,0.07588174588720938,0.10623444424209313,0.13658714259697685,0.16693984095186062,0.19729253930674434,0.2276452376616281,0.2579979360165119,0.28835063437139563,0.3188300904430532,0.350925934958123,0.3848314933096426,0.42057480301049466,0.458183274052838,0.4976837250274023,0.5391024159806381,0.5824650784040898,0.6277969426914107,0.6751227633498623,0.7244668422128921,0.775853049866786,0.829304845476233,0.8848452951698498,0.942497089126609,1.0022825574869039,1.0642236851973577,1.1283421258858297,1.1946592148522128,1.2631959812511864,1.3339731595349034,1.407011200216447,1.4823302800086415,1.5599503113873272,1.6398909516233677,1.7221716113234105,1.8068114625156377,1.8938294463134073,1.9832442801866852,2.075074464868551,2.1693382909216234,2.2660538449872063,2.36523901573795,2.4669114995532007,2.5710888059345764,2.6777882626779785,2.7870270208169257,2.898822059350997,3.0131901897720907,3.1301480604002863,3.2497121605402226,3.3718988244681087,3.4967242352587946,3.624204428461639,3.754355295633311,3.887192587735158,4.022731918402185,4.160988767090289,4.301978482107941,4.445716283538092,4.592217266055746,4.741496401646282,4.893568542229298,5.048448422192488,5.20615066083972,5.3666897647573375,5.5300801301023865,5.696336044816294,5.865471690767354,6.037501145825082,6.212438385869475,6.390297286737924,6.571091626112461,6.7548350853498045,6.941541251256611,7.131223617812143,7.323895587840543,7.5195704746346665,7.7182615035334345,7.919981813454504,8.124744458384042,8.332562408825165,8.543448553206703,8.757415699253682,8.974476575321063,9.194643831691977,9.417930041841839,9.644347703669503,9.873909240696694,10.106627003236781,10.342513269534024,10.58158024687427,10.8238400726681,11.069304815507364,11.317986476196008,11.569896988756009,11.825048221409341,12.083451977536606,12.345119996613247,12.610063955123938,12.878295467455942,13.149826086772048,13.42466730586372,13.702830557985108,13.984327217668513,14.269168601521828,14.55736596900856,14.848930523210871,15.143873411576273,15.44220572664832,15.743938506781891,16.04908273684337,16.35764934889634,16.66964922287304,16.985093187232053,17.30399201960269,17.62635644741625,17.95219714852476,18.281524751807332,18.614349837764564,18.95068293910138,19.290534541298456,19.633915083172692,19.98083495742689,20.331304511189067,20.685334046541502,21.042933821039977,21.404114048223256,21.76888489811322,22.137256497705877,22.50923893145328,22.884842241736916,23.264076429332462,23.6469514538663,24.033477234264016,24.42366364919083,24.817520537484558,25.21505769858089,25.61628489293138,26.021211842414342,26.429848230738664,26.842203703840827,27.258287870275353,27.678110301598522,28.10168053274597,28.529008062403893,28.96010235337422,29.39497283293396,29.83362889318845,30.276079891419332,30.722335150426627,31.172403958865512,31.62629557157785,32.08401920991837,32.54558406207592,33.010999283389665,33.4802739966603,33.953417292456834,34.430438229418264,34.911345834551085,35.39614910352207,35.88485700094671,36.37747846067349,36.87402238606382,37.37449765026789,37.87891309649659,38.38727753828926,38.89959975977785,39.41588851594697,39.93615253289054,40.460400508064545,40.98864111053629,41.520882981230194,42.05713473317016,42.597404951718396,43.141702194811224,43.6900349931913,44.24241185063697,44.798841244188324,45.35933162437017,45.92389141541209,46.49252901546552,47.065252796817916,47.64207110610409,48.22299226451468,48.808024568002054,49.3971762874833,49.9904556690408,50.587870934119984,51.189430279724725,51.79514187861014,52.40501387947288,53.0190544071392,53.637271562750364,54.259673423945976,54.88626804504493,55.517063457223934,56.15206766869424,56.79128866487574,57.43473440856916,58.08241284012621,58.734331877617365,59.39049941699807,60.05092333227251,60.715611475655585,61.38457167773311,62.057811747619894,62.7353394731159,63.417162620860914,64.10328893648692,64.79372614476921,65.48848194977529,66.18756403501224,66.89098006357258,67.59873767827808,68.31084450182222,69.02730813691093,69.74813616640164,70.47333615344107,71.20291564160104,71.93688215501312,72.67524319850172,73.41800625771542,74.16517879925733,74.9167682708136,75.67278210128072,76.43322770089146,77.1981124613393,77.96744375590167,78.74122893956174,79.51947534912904,80.30219030335869,81.08938110306934,81.88105503125999,82.67721935322541,83.4778813166706,84.28304815182372,85.09272707154808,85.90692527145302,86.72564993000343,87.54890820862819,88.3767072518277,89.2090541872801,90.04595612594655,90.88742016217518,91.73345337380438,92.58406282226491,93.43925555268066,94.29903859396902,95.16341895893969,96.03240364439274,96.9059996312159,97.78421388448044,98.6670533535366,99.55452497210776];

function _sanRad(a){return(a+8*Math.PI)%(2*Math.PI)}
function _tDelin(c){const n=c/100;return(n<=0.0031308?n*12.92:1.055*Math.pow(n,1/2.4)-0.055)*255}
function _hueOf(lr){const sd=_matMul(lr,_SD),rA=_ca(sd[0]),gA=_ca(sd[1]),bA=_ca(sd[2]);return Math.atan2((rA+gA-2*bA)/9,(11*rA-12*gA+bA)/11)}
function _cyclic(a,b,c){return _sanRad(b-a)<_sanRad(c-a)}
function _nthV(y,n){const[kr,kg,kb]=_YL,cA=n%4<=1?0:100,cB=n%2===0?0:100;if(n<4){const r=(y-cA*kg-cB*kb)/kr;return(r>=0&&r<=100)?[r,cA,cB]:null}if(n<8){const g=(y-cB*kr-cA*kb)/kg;return(g>=0&&g<=100)?[cB,g,cA]:null}const b=(y-cA*kr-cB*kg)/kb;return(b>=0&&b<=100)?[cA,cB,b]:null}
function _bisectSeg(y,tH){let L=null,R=null,lH=0,rH=0,init=false,uncut=true;for(let n=0;n<12;n++){const mid=_nthV(y,n);if(!mid)continue;const mH=_hueOf(mid);if(!init){L=R=mid;lH=rH=mH;init=true;continue}if(uncut||_cyclic(lH,mH,rH)){uncut=false;if(_cyclic(lH,tH,mH)){R=mid;rH=mH}else{L=mid;lH=mH}}}return[L||[0,0,0],R||[0,0,0]]}
function _bisectLim(y,tH){let[L,R]=_bisectSeg(y,tH),lH=_hueOf(L);for(let ax=0;ax<3;ax++){if(L[ax]===R[ax])continue;let lP,rP;if(L[ax]<R[ax]){lP=Math.floor(_tDelin(L[ax])-.5);rP=Math.ceil(_tDelin(R[ax])-.5)}else{lP=Math.ceil(_tDelin(L[ax])-.5);rP=Math.floor(_tDelin(R[ax])-.5)}for(let i=0;i<8;i++){if(Math.abs(rP-lP)<=1)break;const mP=Math.floor((lP+rP)/2),mC=_CP[mP],t=(mC-L[ax])/(R[ax]-L[ax]),mid=L.map((v,i)=>v+(R[i]-v)*t),mH=_hueOf(mid);if(_cyclic(lH,tH,mH)){R=mid;rP=mP}else{L=mid;lH=mH;lP=mP}}}return L.map((v,i)=>(v+R[i])/2)}
function _invCA(a){const aa=Math.abs(a),base=Math.max(0,27.13*aa/(400-aa));return _sgn(a)*Math.pow(base,1/.42)}
function _findByJ(hR,ch,y){let j=Math.sqrt(y)*11;const tIC=1/Math.pow(1.64-Math.pow(.29,_VC.n),.73),eH=.25*(Math.cos(hR+2)+3.8),p1=eH*(50000/13)*_VC.nc*_VC.ncb,hS=Math.sin(hR),hC=Math.cos(hR);for(let i=0;i<5;i++){const jN=j/100,alpha=(ch!==0&&j!==0)?ch/Math.sqrt(jN):0,t=Math.pow(alpha*tIC,1/.9),ac=_VC.aw*Math.pow(jN,1/_VC.c/_VC.z),p2=ac/_VC.nbb,g=23*(p2+.305)*t/(23*p1+11*t*hC+108*t*hS),a=g*hC,b=g*hS,rA=(460*p2+451*a+288*b)/1403,gA=(460*p2-891*a-261*b)/1403,bA=(460*p2-220*a-6300*b)/1403,lr=_matMul([_invCA(rA),_invCA(gA),_invCA(bA)],_LS);if(lr[0]<0||lr[1]<0||lr[2]<0)return 0;const fnj=_YL[0]*lr[0]+_YL[1]*lr[1]+_YL[2]*lr[2];if(fnj<=0)return 0;if(i===4||Math.abs(fnj-y)<.002){if(lr[0]>100.01||lr[1]>100.01||lr[2]>100.01)return 0;return _argbFromLin(lr[0],lr[1],lr[2])}j=j-(fnj-y)*j/(2*fnj)}return 0}

function hctFromHex(hex){const a=_argbFromHex(hex),cam=_cam16(a);return{hue:cam.hue,chroma:cam.chroma,tone:_lFromArgb(a)}}
function hexFromHct(hue,chroma,tone){
  if(chroma<0.0001||tone<0.0001||tone>99.9999)return _hexFromArgb(_argbFromLstar(tone));
  hue=_sanDeg(hue);const hR=hue*Math.PI/180,y=_yFromL(tone);
  const exact=_findByJ(hR,chroma,y);
  if(exact!==0)return _hexFromArgb(exact);
  const lr=_bisectLim(y,hR);
  return _hexFromArgb(_argbFromLin(lr[0],lr[1],lr[2]));
}

// ══════════════════════════════════════════ OKLCH / OKLAB
function hsvToHex(h,s,v){s/=100;v/=100;let c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}const t=x=>Math.round((x+m)*255).toString(16).padStart(2,'0');return`#${t(r)}${t(g)}${t(b)}`}
function hexToHsv(hex){let r=parseInt(hex.substr(1,2),16)/255,g=parseInt(hex.substr(3,2),16)/255,b=parseInt(hex.substr(5,2),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0,s=max===0?0:d/max,v=max;if(max!==min){if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6}return[Math.round(h*360),Math.round(s*100),Math.round(v*100)]}
const lin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
const delin=c=>{c=Math.max(0,Math.min(1,c));return Math.round((c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055)*255)};
const h2r=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]};
const r2h=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
const toXyz=(r,g,b)=>{r=lin(r);g=lin(g);b=lin(b);return[r*.4124564+g*.3575761+b*.1804375,r*.2126729+g*.7151522+b*.0721750,r*.0193339+g*.1191920+b*.9503041]};
const toOklab=(x,y,z)=>{const l=Math.cbrt(.8189330101*x+.3618667424*y-.1288597137*z),m=Math.cbrt(.0329845436*x+.9293118715*y+.0361456387*z),s=Math.cbrt(.0482003018*x+.2643662691*y+.6338517070*z);return[.2104542553*l+.7936177850*m-.0040720468*s,1.9779984951*l-2.4285922050*m+.4505937099*s,.0259040371*l+.7827717662*m-.8086757660*s]};
const fromOklab=(L,a,b)=>{const l_=L+.3963377774*a+.2158037573*b,m_=L-.1055613458*a-.0638541728*b,s_=L-.0894841775*a-1.2914855480*b,l=l_**3,m=m_**3,s=s_**3;return[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.7076147010*s]};
const toRgbLin=(x,y,z)=>[x*3.2404542-y*1.5371385-z*0.4985314,-x*0.9692660+y*1.8760108+z*0.0415560,x*0.0556434-y*0.2040259+z*1.0572252];
function hexToOklch(hex){const[r,g,b]=h2r(hex),xyz=toXyz(r,g,b),[L,a,ob]=toOklab(...xyz);return[L,Math.sqrt(a*a+ob*ob),(Math.atan2(ob,a)*180/Math.PI+360)%360]}
function oklchToHex(L,C,H){
  if(L<=0.001)return'#000000';if(L>=0.999)return'#ffffff';
  if(C<0.001){const v=delin(Math.max(0,Math.min(1,L)));return r2h(v,v,v)}
  const rlin=c=>{const a=c*Math.cos(H*Math.PI/180),b=c*Math.sin(H*Math.PI/180);return toRgbLin(...fromOklab(L,a,b))};
  const ok=c=>{const[r,g,b]=rlin(c);return r>=-0.001&&r<=1.001&&g>=-0.001&&g<=1.001&&b>=-0.001&&b<=1.001};
  let lo=0,hi=C;if(ok(hi)){lo=hi}else{for(let i=0;i<20;i++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}}
  const[rl,gl,bl]=rlin(lo);return r2h(delin(rl),delin(gl),delin(bl))
}
function maxC(L,H){let lo=0,hi=0.4;for(let i=0;i<20;i++){const m=(lo+hi)/2,a=m*Math.cos(H*Math.PI/180),b=m*Math.sin(H*Math.PI/180),[r,g,bl]=toRgbLin(...fromOklab(L,a,b));(r>=-0.001&&r<=1.001&&g>=-0.001&&g<=1.001&&bl>=-0.001&&bl<=1.001)?lo=m:hi=m}return lo}

// ══════════════════════════════════════════ APCA CONTRAST
function apcaY(hex){const[r,g,b]=h2r(hex);return 0.2126729*lin(r)+0.7151522*lin(g)+0.0721750*lin(b)}
function apca(txtHex,bgHex){
  const Rtxt=apcaY(txtHex),Rbg=apcaY(bgHex);
  const Ntxt=0.57,Nbg=0.56,Sapc=1.14,Ofloor=0.1,Wb=0.03,Sc=1.618;
  const Yt=Math.max(Rtxt,0),Yb=Math.max(Rbg,0);
  const Ytc=Yt>Wb?Yt:Yt+Math.pow(Wb-Yt,1.33)/Sc;
  const Ybc=Yb>Wb?Yb:Yb+Math.pow(Wb-Yb,1.33)/Sc;
  const Lc=(Math.pow(Ybc,Nbg)-Math.pow(Ytc,Ntxt))*Sapc;
  return Math.abs(Lc)<Ofloor?0:Lc*100;
}
function cr(bg,a,b){return Math.abs(apca(a,bg))>=Math.abs(apca(b,bg))?a:b}

// ══════════════════════════════════════════ SHADE ENGINE
const STEPS=[50,100,200,300,400,500,600,700,800,900,950];
function pickIdx(n){const m={5:[0,2,5,8,10],6:[0,1,3,5,7,10],7:[0,1,3,5,6,8,10],8:[0,1,2,4,5,7,8,10],9:[0,1,2,4,5,6,7,9,10],10:[0,1,2,3,4,5,6,7,9,10],11:[0,1,2,3,4,5,6,7,8,9,10],12:[0,1,2,3,4,5,6,7,8,9,10,10]};return m[Math.min(12,Math.max(5,n))]??m[10]}

function hexToHsl(hex){
  let r=parseInt(hex.substr(1,2),16)/255,g=parseInt(hex.substr(3,2),16)/255,b=parseInt(hex.substr(5,2),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
  if(max===min)return[0,0,l];
  const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);
  let h=0;
  if(max===r)h=(g-b)/d+(g<b?6:0);
  else if(max===g)h=(b-r)/d+2;
  else h=(r-g)/d+4;
  return[h*60,s,l];
}

function makeShades(srcHex, cf, lockHue, nSteps, Lshift, cScale, tShift, fixedL=null, hueShift=0){
  const[bL,bC,bH]=hexToOklch(srcHex);
  const chroma=bC>=0.015;
  const anchorL = fixedL !== null
    ? Math.max(0.05, Math.min(0.97, fixedL + Lshift*0.3))
    : Math.max(0.08, Math.min(0.92, bL+Lshift));
  const midL = anchorL;
  let neutralHue=0, neutralChroma=0;
  if(fixedL !== null){
    const {hue: brandHue} = hctFromHex(srcHex);
    const tNorm = tShift / 50;
    const pole = tNorm < 0 ? 220 : 30;
    const tAbs = Math.abs(tNorm);
    const dH = ((pole - brandHue + 540) % 360) - 180;
    neutralHue = (brandHue + dH * tAbs + 360) % 360;
    const brandC = hctFromHex(srcHex).chroma;
    const brandBoost = Math.min(brandC / 40, 1) * 2;
    neutralChroma = Math.max(0, (cScale - 0.1) / 1.7 * 8 + brandBoost);
  }
  return pickIdx(nSteps).map(idx=>{
    let L;
    if(idx===5)L=midL;
    else if(idx<5){const t=(5-idx)/5;L=midL+t*(0.97-midL)}
    else{const t=(idx-5)/5;L=midL-t*(midL-0.03)}
    L=Math.max(0.03,Math.min(0.97,L));
    if(fixedL !== null){
      const tone = Math.max(0.1, Math.min(99.9, L * 100));
      return{step:STEPS[idx], hex: hexFromHct(neutralHue, neutralChroma, tone)};
    }
    if(!chroma||cf===0)return{step:STEPS[idx],hex:oklchToHex(L,0,0)};
    let finalH = bH;
    if(hueShift !== 0){
      const srcHct = hctFromHex(srcHex);
      const hctH = (srcHct.hue + hueShift + 360) % 360;
      const sampHex = hexFromHct(hctH, Math.min(srcHct.chroma, 40), 55);
      finalH = hexToOklch(sampHex)[2];
    }
    const H = lockHue ? bH : ((finalH + tShift) + 360) % 360;
    const effC=bC*cf*cScale;
    return{step:STEPS[idx],hex:oklchToHex(L,Math.min(effC,maxC(L,H)),H)};
  });
}

function makeSemanticShades(fixedHue, brandHex, nSteps, Lshift, cScale){
  const {chroma: brandC} = hctFromHex(brandHex);
  const baseC = 40 + Math.min(brandC / 150, 1) * 12;
  const semC = Math.max(10, baseC * cScale);
  const midTone = Math.max(20, Math.min(80, 50 + Lshift * 40));
  return pickIdx(nSteps).map(idx => {
    let tone;
    if(idx === 5) tone = midTone;
    else if(idx < 5){ const t=(5-idx)/5; tone = midTone + t*(97-midTone); }
    else{ const t=(idx-5)/5; tone = midTone - t*(midTone-3); }
    tone = Math.max(3, Math.min(97, tone));
    return { step: STEPS[idx], hex: hexFromHct(fixedHue, semC, tone) };
  });
}

// ══════════════════════════════════════════ IMAGE UTILS
function kMeans(points, k, iterations=20){
  const centers = [points[Math.floor(Math.random()*points.length)]];
  while(centers.length < k){
    let best=null, bestDist=0;
    const sample = points.filter((_,i)=>i%8===0);
    sample.forEach(p=>{
      const d = Math.min(...centers.map(c=>oklchDist(p,c)));
      if(d>bestDist){bestDist=d;best=p}
    });
    centers.push(best||points[Math.floor(Math.random()*points.length)]);
  }
  for(let iter=0;iter<iterations;iter++){
    const clusters = Array.from({length:k},()=>[]);
    points.forEach(p=>{
      let best=0, bestD=Infinity;
      centers.forEach((c,i)=>{const d=oklchDist(p,c);if(d<bestD){bestD=d;best=i}});
      clusters[best].push(p);
    });
    centers.forEach((c,i)=>{
      if(!clusters[i].length) return;
      c[0]=clusters[i].reduce((s,p)=>s+p[0],0)/clusters[i].length;
      c[1]=clusters[i].reduce((s,p)=>s+p[1],0)/clusters[i].length;
      const sinSum=clusters[i].reduce((s,p)=>s+Math.sin(p[2]*Math.PI/180),0);
      const cosSum=clusters[i].reduce((s,p)=>s+Math.cos(p[2]*Math.PI/180),0);
      c[2]=(Math.atan2(sinSum,cosSum)*180/Math.PI+360)%360;
    });
  }
  return centers;
}

function oklchDist(a,b){
  const dL=a[0]-b[0], dC=a[1]-b[1];
  const dH=((a[2]-b[2]+540)%360)-180;
  return Math.sqrt(dL*dL+dC*dC+(dH/180)*(dH/180)*0.5);
}
