stages=normalizeStages(stages);

let currentStage=0;
let selectedStageIndex=0;
let selectedEventIndex=0;
let selectedProductIndex=0;
let editingReminderId='';
let calendarCursor=new Date(2026,7,1);
let calendarSelectedDate='2026-08-24';
let pointerId=null;
let dragStartX=0,dragStartY=0,dragDx=0,dragDy=0;
let dragging=false;
let suppressClick=false;
let wheelLock=false;
let rentalCategory='Все';
let rentalQuery='';
let stageGestureActive=false;
let stageTransitionLockUntil=0;

const frame=document.getElementById('stageFrame');
const track=document.getElementById('stageTrack');
const toast=document.getElementById('toast');


function esc(s=''){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function normalizedPhoneParts(raw=''){
  const value=String(raw||'');
  const candidates=value.match(/(?:\+\d|\(\d|\d)[\d\s().\-–—]*\d/g)||[];
  for(const candidateValue of candidates){
    const display=candidateValue.trim();
    const digits=display.replace(/\D/g,'');
    let normalized='';
    if(display.startsWith('+')&&digits.length>=7&&digits.length<=15)normalized='+'+digits;
    else if(digits.length===12&&digits.startsWith('375'))normalized='+'+digits;
    else if(digits.length===11&&digits.startsWith('80'))normalized='+375'+digits.slice(2);
    else if(digits.length===10&&digits.startsWith('0'))normalized='+375'+digits.slice(1);
    else if(digits.length===9)normalized='+375'+digits;
    if(!/^\+[1-9]\d{6,14}$/.test(normalized))continue;
    return {
      display,
      normalized
    };
  }
  return {display:'',normalized:''};
}
function contactInfo(raw=''){
  const value=String(raw||'').trim();
  const phoneParts=normalizedPhoneParts(value);
  const phone=phoneParts.display;
  let name=phone ? value.replace(phone,'') : value;
  name=name.replace(/[\s·|,;:\-–—]+$/g,'').trim();
  if(!name || /^контакт не указан$/i.test(name))name='Клиент';
  const initial=(name.match(/[A-Za-zА-Яа-яЁё]/)||['К'])[0].toUpperCase();
  return {
    name,
    phone,
    tel:phoneParts.normalized ? 'tel:'+phoneParts.normalized : '',
    initial
  };
}
const contactPalette=[
  '#007AFF', /* blue */
  '#5AC8FA', /* cyan */
  '#34C759', /* green */
  '#FF9500', /* orange */
  '#AF52DE', /* purple */
  '#5856D6', /* indigo */
  '#FF2D55', /* pink */
  '#8E8E93'  /* gray */
];
function contactColor(name=''){
  let h=0;
  for(const ch of String(name))h=((h<<5)-h+ch.codePointAt(0))|0;
  return contactPalette[Math.abs(h)%contactPalette.length];
}
function priorityMeta(priority='normal'){
  if(priority==='urgent')return {label:'Срочно',className:'priority-urgent'};
  if(priority==='high')return {label:'Важно',className:'priority-high'};
  return {label:'Обычный',className:'priority-normal'};
}
function priorityBadgeHTML(priority='normal',hideNormal=true){
  const meta=priorityMeta(priority);
  if(hideNormal && priority==='normal')return '';
  return `<em class="priority-badge ${meta.className}">${meta.label}</em>`;
}
function crmHaptic(kind='selection'){
  try{
    const h=window.Telegram?.WebApp?.HapticFeedback;
    if(!h)return;
    if(kind==='selection')h.selectionChanged();
    else if(kind==='success')h.notificationOccurred('success');
    else h.impactOccurred(kind);
  }catch(_){}
}

function notify(msg){
  toast.textContent=msg;toast.classList.add('show');
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>toast.classList.remove('show'),1700);
}
function retriggerMotion(el,className,duration=360){
  if(!el)return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  window.setTimeout(()=>el.classList.remove(className),duration);
}

let activePageTransition=null;

function finishActivePageTransition(){
  if(!activePageTransition)return;

  const {oldPage,newPage,animations}=activePageTransition;
  animations.forEach(a=>{
    try{a.cancel()}catch(_){}
  });

  oldPage?.classList.remove('crm-transition-visible','crm-transition-old');
  newPage?.classList.remove('crm-transition-visible','crm-transition-new','crm-transition-fallback');

  if(oldPage)oldPage.style.pointerEvents='';
  if(newPage)newPage.style.pointerEvents='';

  activePageTransition=null;
}

function pageMotionFrames(direction){
  if(direction==='back'){
    return {
      old:[
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'},
        {opacity:.10,transform:'translate3d(30px,0,0) scale(.996)'}
      ],
      next:[
        {opacity:0,transform:'translate3d(-34px,0,0) scale(.997)'},
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
      ]
    };
  }

  if(direction==='switch-left'){
    return {
      old:[
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'},
        {opacity:.08,transform:'translate3d(30px,0,0) scale(.997)'}
      ],
      next:[
        {opacity:0,transform:'translate3d(-34px,0,0) scale(.998)'},
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
      ]
    };
  }

  if(direction==='switch-right'){
    return {
      old:[
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'},
        {opacity:.08,transform:'translate3d(-30px,0,0) scale(.997)'}
      ],
      next:[
        {opacity:0,transform:'translate3d(34px,0,0) scale(.998)'},
        {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
      ]
    };
  }

  /* Forward / drill-in */
  return {
    old:[
      {opacity:1,transform:'translate3d(0,0,0) scale(1)'},
      {opacity:.10,transform:'translate3d(-30px,0,0) scale(.996)'}
    ],
    next:[
      {opacity:0,transform:'translate3d(34px,0,0) scale(.997)'},
      {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
    ]
  };
}

function showPage(id){
  const next=document.getElementById(id);
  if(!next)return;

  if(nativeMobile){
    finishActivePageTransition();
    document.querySelectorAll('.page').forEach(p=>{
      p.classList.remove('active','motion-enter','crm-transition-visible','crm-transition-old','crm-transition-new','crm-transition-fallback');
      p.style.pointerEvents='';
      p.style.opacity='';
      p.style.transform='';
    });
    next.classList.add('active');
    window.requestAnimationFrame(()=>retriggerMotion(next,'motion-enter',260));

    const eventsActive=id==='eventsPage'||id==='eventPage'||id==='estimatePage'||id==='remindersPage'||id==='editEventPage';
    const eventsNav=document.getElementById('eventsNav');
    const rentalNav=document.getElementById('rentalNav');
    eventsNav.classList.toggle('active',eventsActive);
    rentalNav.classList.toggle('active',id==='rentalPage'||id==='rentalDetailPage');
    crmHaptic('selection');
    return;
  }

  finishActivePageTransition();

  const current=document.querySelector('.page.active');
  const currentId=current?.id||'';
  if(currentId===id)return;

  const depth={
    eventsPage:0,
    rentalPage:0,
    eventPage:1,
    rentalDetailPage:1,
    editEventPage:2,
    estimatePage:2,
    remindersPage:2
  };

  const oldDepth=depth[currentId]??0;
  const newDepth=depth[id]??0;

  let direction='forward';
  if(newDepth<oldDepth)direction='back';
  else if(newDepth===oldDepth){
    const peerOrder={eventsPage:0,rentalPage:1};
    if(currentId in peerOrder && id in peerOrder){
      direction=peerOrder[id]>peerOrder[currentId]?'switch-right':'switch-left';
    }else{
      direction='switch-right';
    }
  }

  const eventsActive=
    id==='eventsPage' ||
    id==='eventPage' ||
    id==='estimatePage' ||
    id==='remindersPage' ||
    id==='editEventPage';

  const eventsNav=document.getElementById('eventsNav');
  const rentalNav=document.getElementById('rentalNav');

  eventsNav.classList.toggle('active',eventsActive);
  rentalNav.classList.toggle('active',id==='rentalPage'||id==='rentalDetailPage');

  const activeNav=eventsNav.classList.contains('active')
    ? eventsNav
    : (rentalNav.classList.contains('active')?rentalNav:null);

  if(activeNav)retriggerMotion(activeNav,'nav-activate',280);

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!current || reduced){
    document.querySelectorAll('.page').forEach(p=>{
      p.classList.remove('active','crm-transition-visible','crm-transition-old','crm-transition-new');
    });
    next.classList.add('active');
    crmHaptic('selection');
    return;
  }

  /* Keep both pages painted for one compositor transition. */
  current.classList.add('crm-transition-visible','crm-transition-old');
  next.classList.add('crm-transition-visible','crm-transition-new','active');
  current.classList.remove('active');

  current.style.pointerEvents='none';
  next.style.pointerEvents='none';

  const frames=pageMotionFrames(direction);
  const options={
    duration:410,
    easing:'cubic-bezier(.16,1,.3,1)',
    fill:'both'
  };

  if(typeof current.animate!=='function' || typeof next.animate!=='function'){
    current.classList.remove('crm-transition-visible','crm-transition-old');
    next.classList.remove('crm-transition-visible','crm-transition-new');
    next.classList.add('crm-transition-fallback');
    window.setTimeout(()=>next.classList.remove('crm-transition-fallback'),430);
    crmHaptic('selection');
    return;
  }

  const oldAnim=current.animate(frames.old,options);
  const newAnim=next.animate(frames.next,options);

  activePageTransition={
    oldPage:current,
    newPage:next,
    animations:[oldAnim,newAnim]
  };

  Promise.allSettled([oldAnim.finished,newAnim.finished]).then(()=>{
    if(!activePageTransition || activePageTransition.newPage!==next)return;

    current.classList.remove('crm-transition-visible','crm-transition-old');
    next.classList.remove('crm-transition-visible','crm-transition-new');
    current.style.pointerEvents='';
    next.style.pointerEvents='';

    try{oldAnim.cancel()}catch(_){}
    try{newAnim.cancel()}catch(_){}

    activePageTransition=null;
  });

  crmHaptic('selection');
}
