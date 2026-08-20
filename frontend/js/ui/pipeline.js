function eventVisualMeta(e={}){
  const text=String(e.title||'').toLowerCase();
  const source=String(e.source||'').toLowerCase();
  const manual=String(e.visualTheme||'auto').toLowerCase();
  const allowed=new Set(['lead','wedding','birthday','business','presentation','dinner','photo','event']);
  let type=allowed.has(manual)?manual:'event';

  if(manual==='auto' || !allowed.has(manual)){
    if(/свадь|wedding|регистрац|жених|невест/.test(text)) type='wedding';
    else if(/день рождения|birthday|юбилей/.test(text)) type='birthday';
    else if(/корпоратив|corporate|company party|тимбилд/.test(text)) type='business';
    else if(/презентац|brand launch|launch|открытие|показ коллекц/.test(text)) type='presentation';
    else if(/dinner|ужин|банкет/.test(text)) type='dinner';
    else if(/фото|shoot|съ?ем/.test(text)) type='photo';
    else if(source==='site' || /заявк/.test(text)) type='lead';
    else type='event';
  }

  const icons={
    lead:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5z"></path><path d="m8 10 4 3 4-3"></path></svg>',
    wedding:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="4.5"></circle><circle cx="15" cy="12" r="4.5"></circle><path d="M17.7 5.2 18.5 4l.8 1.2 1.3.5-1.3.5-.8 1.2-.8-1.2-1.3-.5z"></path></svg>',
    birthday:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c-2.7 0-4.5 2.2-4.5 5 0 2.5 1.5 4.3 4.5 5"></path><path d="M12 4c2.7 0 4.5 2.2 4.5 5 0 2.5-1.5 4.3-4.5 5"></path><path d="M9.2 13.2 12 16l2.8-2.8M12 16v4"></path></svg>',
    business:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2"></rect><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2"></path></svg>',
    presentation:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="11" rx="2"></rect><path d="m8 12 3-3 2 2 3-4M12 15v5M9 20h6"></path></svg>',
    dinner:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 15.5h15"></path><path d="M6.5 15.5a5.5 5.5 0 0 1 11 0M12 7V5M9 5h6"></path></svg>',
    photo:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2.5"></rect><path d="m8 7 1.3-2h5.4L16 7"></path><circle cx="12" cy="13" r="3"></circle></svg>',
    event:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path><circle cx="12" cy="12" r="4.5"></circle></svg>'
  };
  return {type,icon:icons[type]||icons.event};
}
function eventCardSubtitle(e={}){
  if(String(e.source||'').toLowerCase()==='site') return 'Заявка с сайта';
  return '';
}

function eventCardHTML(stage,e,stageIndex,eventIndex){
  const priority=e.priority||'normal';
  const visual=eventVisualMeta(e);
  const cardSubtitle=eventCardSubtitle(e);
  const contact=contactInfo(e.contact);
  const contactStyle=`--contact-color:${contactColor(contact.name)}`;
  const contactLabel=contact.phone
    ? `Позвонить ${esc(contact.name)} по номеру ${esc(contact.phone)}`
    : `Контакт ${esc(contact.name)}`;
  const contactControl=contact.tel
    ? `<button type="button" class="contact-pill contact-call" data-call-event-id="${esc(e.id)}" style="${contactStyle}" aria-label="${contactLabel}"><span class="contact-avatar">${esc(contact.initial)}</span>${esc(e.contact)}</button>`
    : `<span class="contact-pill contact-call disabled" style="${contactStyle}" aria-disabled="true" aria-label="${contactLabel}"><span class="contact-avatar">${esc(contact.initial)}</span>${esc(e.contact)}</span>`;
  const reminderCount=eventReminderCount(e);
  const estimateItems=eventEstimate(e);
  const hasEstimate=estimateItems.length>0;
  const eventClientTotal=eventEstimateClientTotal(e);
  const estimateMeta=hasEstimate?`<span class="footer-item footer-estimate" aria-label="Смета">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="16" rx="2"></rect><path d="M9 8h6M9 12h6M9 16h4"></path></svg>
    <span class="footer-money">${money(eventClientTotal)}</span>
  </span>`:'';
  const reminderMeta=reminderCount?`<span class="footer-item footer-reminder" aria-label="Напоминания: ${reminderCount}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg>${reminderCount}
  </span>`:'';
  const advanceMeta=stageIndex<stages.length-1?`<button class="advance" data-stage-index="${stageIndex}" data-event-index="${eventIndex}" data-event-id="${esc(e.id)}"><svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3"></rect><path d="m8.5 12 2.2 2.2L15.5 9.5"></path></svg>Далее</button>`:'';
  const footerHtml=(estimateMeta||reminderMeta||advanceMeta)?`<div class="card-footer">${estimateMeta}${reminderMeta}${advanceMeta}</div>`:'';
  return `
    <div class="card clickable js-open-detail priority-${priority} event-theme-${visual.type}" data-priority="${priority}" data-stage-index="${stageIndex}" data-event-index="${eventIndex}">
      <div class="card-head">
        <div class="avatar event-avatar event-avatar-${visual.type}">${visual.icon}</div>
        <div class="card-name ${cardSubtitle?'has-origin':''}">
          <div class="card-title-line"><strong>${esc(e.title)}</strong></div>
          ${cardSubtitle?`<span class="card-subline"><span class="card-origin">${esc(cardSubtitle)}</span></span>`:''}
          ${priorityBadgeHTML(priority,true)}
        </div>
        <button class="bell ${reminderCount?'has':''} js-reminder" aria-label="${reminderCount?`Напоминания: ${reminderCount}`:'Добавить напоминание'}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9a5 5 0 0 0-10 0c0 5.6-2.4 6.3-2.4 8h14.8c0-1.7-2.4-2.4-2.4-8"></path><path d="M9.5 19.5h5"></path></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="row"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg><span>${esc(e.date)}</span><span class="right">${esc(e.time)}</span></div>
        <div class="row"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"></circle><path d="M6 20c0-4 2.6-6 6-6s6 2 6 6"></path></svg>${contactControl}</div>
        <div class="row"><svg viewBox="0 0 24 24"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"></path><circle cx="12" cy="10" r="2"></circle></svg><span>${esc(e.place)}</span></div>
        ${e.comment?`<div class="row comment"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="12" rx="4"></rect><path d="M9 17 5 20v-4"></path></svg><span class="comment-text">${esc(e.comment)}</span></div>`:''}
        ${footerHtml}
      </div>
    </div>`;
}
function stageHTML(stage,index){
  return `
    <div class="stage-head">
      <div class="stage-title"><span class="stage-dot" style="background:${stage.color}"></span><strong>${esc(stage.name)}</strong><span class="count">${stage.events.length}</span></div>
    </div>
    ${stage.events.length?`<div class="stage-list">${stage.events.map((e,i)=>eventCardHTML(stage,e,index,i)).join('')}</div>`:`<div class="empty">Пока нет мероприятий на этом этапе</div>`}`;
}
function renderStageRail(){
  const rail=document.getElementById('stageRail');
  if(!rail)return;
  rail.innerHTML=stages.map((stage,index)=>`
    <button class="stage-chip ${index===currentStage?'active':''}" data-stage-jump="${index}" title="${esc(stage.name)}">
      <span class="stage-chip-dot" style="background:${stage.color}"></span>
      <span class="stage-chip-name">${esc(stage.name)}</span>
      <span class="stage-chip-count">${stage.events.length}</span>
    </button>`).join('');
}

function syncStageRail(ensureVisible=true,behavior='smooth'){
  const rail=document.getElementById('stageRail');
  if(!rail)return;
  const chips=[...rail.querySelectorAll('[data-stage-jump]')];
  chips.forEach((chip,index)=>{
    const active=index===currentStage;
    chip.classList.toggle('active',active);
    chip.setAttribute('aria-current',active?'step':'false');
  });
  if(!ensureVisible)return;
  const active=rail.querySelector(`[data-stage-jump="${currentStage}"]`);
  if(!active)return;
  const railRect=rail.getBoundingClientRect();
  const activeRect=active.getBoundingClientRect();
  let delta=0;
  if(activeRect.left<railRect.left+6)delta=activeRect.left-railRect.left-10;
  else if(activeRect.right>railRect.right-6)delta=activeRect.right-railRect.right+10;
  if(delta)rail.scrollBy({left:delta,behavior});
}

function renderCurrentStage(direction=0,animate=false){
  const stage=stages[currentStage];
  if(!stage)return;
  track.classList.add('stage-single-page');
  const motion=animate ? (direction>0?'stage-content-next':direction<0?'stage-content-prev':'') : '';
  track.innerHTML=`<section class="stage-page" data-index="${currentStage}" aria-hidden="false" tabindex="0">
    <div class="stage-page-content ${motion}">${stageHTML(stage,currentStage)}</div>
  </section>`;
  if(animate){
    stageTransitionLockUntil=performance.now()+180;
    window.setTimeout(()=>{
      track.querySelector('.stage-page-content')?.classList.remove('stage-content-next','stage-content-prev');
      flushPendingRemoteCRMStages();
    },180);
  }
}

function syncStageViewport(behavior='auto'){
  if(track.scrollLeft)track.scrollLeft=0;
  const shown=track.querySelector('.stage-page');
  if(!shown || Number(shown.dataset.index)!==currentStage)renderCurrentStage(0,false);
  syncStageRail(true,behavior==='smooth'?'smooth':'auto');
}

function goToStage(index,behavior='smooth'){
  const next=Math.max(0,Math.min(stages.length-1,Number(index)||0));
  if(next===currentStage){
    syncStageRail(true,behavior==='smooth'?'smooth':'auto');
    return false;
  }
  const direction=next>currentStage?1:-1;
  currentStage=next;
  syncStageRail(true,behavior==='smooth'?'smooth':'auto');
  renderCurrentStage(direction,behavior==='smooth');
  crmHaptic('selection');
  return true;
}

function renderTrack(){
  renderCurrentStage(0,false);
  renderStageRail();
  window.requestAnimationFrame(()=>syncStageRail(false,'auto'));
}

function pageWidth(){
  return Math.max(1,frame.clientWidth||track.clientWidth||390);
}

function stageSwipeTarget(originStage,dx,width=pageWidth()){
  const threshold=Math.min(72,Math.max(44,width*.13));
  if(Math.abs(dx)<threshold)return originStage;
  return Math.max(0,Math.min(stages.length-1,originStage+(dx<0?1:-1)));
}

/* Compatibility entry point used by existing page/view code. There is now one
   visible stage DOM subtree, so there is no carousel position to reconcile. */
function positionPages(){
  const shown=track.querySelector('.stage-page');
  if(!shown || Number(shown.dataset.index)!==currentStage)renderCurrentStage(0,false);
  syncStageRail(false,'auto');
}

function changeStage(dir){
  const next=currentStage+dir;
  if(next<0 || next>=stages.length)return;
  goToStage(next,'smooth');
}

document.getElementById('stageRail').addEventListener('click',e=>{
  const chip=e.target.closest('[data-stage-jump]');
  if(!chip)return;
  goToStage(Number(chip.dataset.stageJump),'smooth');
});

function stageActionName(name=''){
  const compact={
    'Подготовительные работы':'Подготовка'
  };
  return compact[name]||name;
}

let stageFeedbackTimer=0;
const advancingEventIds=new Set();
function advanceEventToNextStage(fromStage,fromEvent,stayOnDetail=false,expectedEventId=''){
  if(
    !Number.isFinite(fromStage) || !Number.isFinite(fromEvent) ||
    fromStage<0 || fromStage>=stages.length-1 || !stages[fromStage]?.events?.[fromEvent]
  )return;
  const event=stages[fromStage].events[fromEvent];
  if(expectedEventId && event.id!==expectedEventId)return false;
  if(advancingEventIds.has(event.id))return false;
  advancingEventIds.add(event.id);
  window.setTimeout(()=>advancingEventIds.delete(event.id),550);
  const targetStage=stages[fromStage+1];
  const moved=moveEventForward(fromStage,fromEvent,stayOnDetail,event.id);
  if(!moved)advancingEventIds.delete(event.id);
  if(moved)showStageChangeFeedback(targetStage,stayOnDetail);
  return moved;
}
function showStageChangeFeedback(stage,stayOnDetail=false){
  const feedback=document.getElementById('stageStatusToast');
  const name=document.getElementById('stageStatusName');
  const dot=document.getElementById('stageStatusDot');
  if(!feedback||!name||!dot||!stage)return;
  window.clearTimeout(stageFeedbackTimer);
  name.textContent=stage.name;
  dot.style.background=stage.color;
  feedback.classList.remove('show');
  void feedback.offsetWidth;
  feedback.classList.add('show');
  if(stayOnDetail){
    retriggerMotion(document.getElementById('advanceEventBtn'),'status-advance-pulse',520);
  }
  stageFeedbackTimer=window.setTimeout(()=>feedback.classList.remove('show'),1500);
}


function moveEventForward(fromStage,fromEvent,stayOnDetail=false,expectedEventId=''){
  if(
    !Number.isFinite(fromStage) ||
    !Number.isFinite(fromEvent) ||
    fromStage<0 ||
    fromStage>=stages.length-1 ||
    !stages[fromStage]?.events?.[fromEvent] ||
    (expectedEventId && stages[fromStage].events[fromEvent].id!==expectedEventId)
  ) return false;

  const eventId=expectedEventId||stages[fromStage].events[fromEvent].id;
  const result=moveCRMEvent(stages,eventId,fromStage+1,fromStage);
  if(!result)return false;
  persistCRM();
  currentStage=fromStage+1;
  selectedStageIndex=currentStage;
  selectedEventIndex=0;
  renderTrack();
  renderDynamicCalendar();
  if(stayOnDetail)populateEventPage();
  return true;
}

track.addEventListener('click',e=>{
  if(suppressClick)return;

  const contactCall=e.target.closest('.contact-call');
  if(contactCall){
    e.stopPropagation();
    crmHaptic('soft');
    requestEventCall(contactCall.dataset.callEventId||'');
    return;
  }

  const card=e.target.closest('.js-open-detail');
  const stageIndex=card ? Number(card.dataset.stageIndex) : currentStage;
  const eventIndex=card ? Number(card.dataset.eventIndex) : 0;

  const reminder=e.target.closest('.js-reminder');
  if(reminder){
    e.stopPropagation();
    selectedStageIndex=stageIndex;
    selectedEventIndex=eventIndex;
    openReminderEditor();
    return;
  }

  const advance=e.target.closest('.advance');
  if(advance){
    e.stopPropagation();

    const fromStage=Number(advance.dataset.stageIndex);
    const fromEvent=Number(advance.dataset.eventIndex);

    if(
      !Number.isFinite(fromStage) ||
      !Number.isFinite(fromEvent) ||
      fromStage<0 ||
      fromStage>=stages.length-1
    ) return;

    advanceEventToNextStage(fromStage,fromEvent,false,advance.dataset.eventId||'');
    return;
  }

  if(card){
    selectedStageIndex=stageIndex;
    selectedEventIndex=eventIndex;
    currentStage=stageIndex;
    populateEventPage();
    showPage('eventPage');
  }
});

/* Deterministic stage gestures.
   A swipe commits exactly once as soon as it crosses the threshold. The same
   goToStage() function is used by chips, touch, mouse/pen, wheel and keyboard,
   so the rail highlight and visible stage change in the same synchronous turn. */
let gestureStarted=false;
let gestureOriginStage=0;
let gestureCommitted=false;

frame.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;
  if(e.pointerType==='mouse' && e.button!==0)return;
  if(e.target.closest('button,input,textarea,select,a'))return;
  pointerId=e.pointerId;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  dragDx=0;
  dragDy=0;
  gestureOriginStage=currentStage;
  gestureCommitted=false;
  gestureStarted=true;
  dragging=false;
  stageGestureActive=true;
  suppressClick=false;
});

frame.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  if(!gestureStarted || e.pointerId!==pointerId)return;
  dragDx=e.clientX-dragStartX;
  dragDy=e.clientY-dragStartY;
  const horizontal=Math.abs(dragDx)>9 && Math.abs(dragDx)>Math.abs(dragDy)*1.15;
  if(!horizontal)return;
  dragging=true;
  e.preventDefault();
  if(gestureCommitted)return;
  const target=stageSwipeTarget(gestureOriginStage,dragDx,pageWidth());
  if(target===gestureOriginStage)return;
  gestureCommitted=true;
  suppressClick=true;
  goToStage(target,'smooth');
});

function finishPointerDrag(){
  if(!gestureStarted)return;
  gestureStarted=false;
  pointerId=null;
  stageGestureActive=false;
  dragging=false;
  dragDx=0;
  dragDy=0;
  window.setTimeout(()=>{suppressClick=false;flushPendingRemoteCRMStages();},190);
}
frame.addEventListener('pointerup',finishPointerDrag);
frame.addEventListener('pointercancel',finishPointerDrag);

let touchActive=false;
let touchHorizontal=false;
let touchStartX=0;
let touchStartY=0;
let touchDx=0;
let touchDy=0;
let touchOriginStage=0;
let touchStageCommitted=false;

frame.addEventListener('touchstart',e=>{
  if(e.touches.length!==1)return;
  if(e.target.closest('button,input,textarea,select,a'))return;
  const t=e.touches[0];
  touchActive=true;
  touchHorizontal=false;
  touchStartX=t.clientX;
  touchStartY=t.clientY;
  touchDx=0;
  touchDy=0;
  touchOriginStage=currentStage;
  touchStageCommitted=false;
  stageGestureActive=true;
  suppressClick=false;
},{passive:true});

frame.addEventListener('touchmove',e=>{
  if(!touchActive || e.touches.length!==1)return;
  const t=e.touches[0];
  touchDx=t.clientX-touchStartX;
  touchDy=t.clientY-touchStartY;
  if(!touchHorizontal){
    if(Math.abs(touchDx)>9 && Math.abs(touchDx)>Math.abs(touchDy)*1.15)touchHorizontal=true;
    else if(Math.abs(touchDy)>10 && Math.abs(touchDy)>Math.abs(touchDx))return;
  }
  if(!touchHorizontal)return;
  e.preventDefault();
  if(touchStageCommitted)return;
  const target=stageSwipeTarget(touchOriginStage,touchDx,pageWidth());
  if(target===touchOriginStage)return;
  touchStageCommitted=true;
  suppressClick=true;
  goToStage(target,'smooth');
},{passive:false});

function finishTouchSwipe(){
  if(!touchActive)return;
  touchActive=false;
  stageGestureActive=false;
  touchHorizontal=false;
  touchDx=0;
  touchDy=0;
  window.setTimeout(()=>{suppressClick=false;flushPendingRemoteCRMStages();},190);
}
frame.addEventListener('touchend',finishTouchSwipe,{passive:true});
frame.addEventListener('touchcancel',finishTouchSwipe,{passive:true});

/* Horizontal trackpad gesture. */
frame.addEventListener('wheel',e=>{
  if(wheelLock)return;
  const horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY) && Math.abs(e.deltaX)>24;
  const shifted=e.shiftKey && Math.abs(e.deltaY)>24;
  if(horizontal || shifted){
    e.preventDefault();
    wheelLock=true;
    changeStage((horizontal?e.deltaX:e.deltaY)>0 ? 1 : -1);
    window.setTimeout(()=>wheelLock=false,220);
  }
},{passive:false});

/* Keyboard fallback on desktop. */
document.addEventListener('keydown',e=>{
  if(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  if(!document.getElementById('eventsPage').classList.contains('active'))return;
  if(e.key==='ArrowRight')changeStage(1);
  if(e.key==='ArrowLeft')changeStage(-1);
});

window.addEventListener('resize',()=>{
  window.requestAnimationFrame(()=>syncStageViewport('auto'));
});
