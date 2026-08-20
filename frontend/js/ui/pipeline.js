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
  rail.innerHTML=`<span class="stage-rail-indicator" aria-hidden="true"></span>`+stages.map((stage,index)=>`
    <button class="stage-chip ${index===currentStage?'active':''}" data-stage-jump="${index}" title="${esc(stage.name)}">
      <span class="stage-chip-dot" style="background:${stage.color}"></span>
      <span class="stage-chip-name">${esc(stage.name)}</span>
      <span class="stage-chip-count">${stage.events.length}</span>
    </button>`).join('');
}

let stagePreviewIndex=null;
let stageMotionTimer=0;
let stageMotionEpoch=0;
const STAGE_SNAP_MS=320;

function clampStageIndex(index){
  return Math.max(0,Math.min(stages.length-1,Number(index)||0));
}

function stageRailSetActiveClasses(activeIndex){
  const rail=document.getElementById('stageRail');
  if(!rail)return;
  rail.querySelectorAll('[data-stage-jump]').forEach((chip,index)=>{
    const active=index===activeIndex;
    chip.classList.toggle('active',active);
    chip.setAttribute('aria-current',active?'step':'false');
  });
}

function stageRailIndicatorTo(index,animate=true){
  const rail=document.getElementById('stageRail');
  const indicator=rail?.querySelector('.stage-rail-indicator');
  const chip=rail?.querySelector(`[data-stage-jump="${index}"]`);
  if(!rail||!indicator||!chip)return;
  rail.classList.toggle('stage-rail-instant',!animate);
  indicator.style.width=`${chip.offsetWidth}px`;
  indicator.style.transform=`translate3d(${chip.offsetLeft}px,0,0)`;
  if(!animate)window.requestAnimationFrame(()=>rail.classList.remove('stage-rail-instant'));
}

function syncStageRail(ensureVisible=true,behavior='smooth',activeIndex=stagePreviewIndex??currentStage){
  const rail=document.getElementById('stageRail');
  if(!rail)return;
  const active=clampStageIndex(activeIndex);
  stageRailSetActiveClasses(active);
  stageRailIndicatorTo(active,behavior==='smooth');
  if(!ensureVisible)return;
  const chip=rail.querySelector(`[data-stage-jump="${active}"]`);
  if(!chip)return;
  const railRect=rail.getBoundingClientRect();
  const chipRect=chip.getBoundingClientRect();
  let delta=0;
  if(chipRect.left<railRect.left+6)delta=chipRect.left-railRect.left-10;
  else if(chipRect.right>railRect.right-6)delta=chipRect.right-railRect.right+10;
  if(delta)rail.scrollBy({left:delta,behavior});
}

function setStageRailProgress(originIndex,targetIndex,progress){
  const rail=document.getElementById('stageRail');
  const indicator=rail?.querySelector('.stage-rail-indicator');
  const origin=rail?.querySelector(`[data-stage-jump="${originIndex}"]`);
  const target=rail?.querySelector(`[data-stage-jump="${targetIndex}"]`);
  if(!rail||!indicator||!origin||!target)return;
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  rail.classList.add('stage-rail-dragging');
  const x=origin.offsetLeft+(target.offsetLeft-origin.offsetLeft)*p;
  const width=origin.offsetWidth+(target.offsetWidth-origin.offsetWidth)*p;
  indicator.style.width=`${width}px`;
  indicator.style.transform=`translate3d(${x}px,0,0)`;
  stagePreviewIndex=p>=.5?targetIndex:originIndex;
  stageRailSetActiveClasses(stagePreviewIndex);
}

function stagePageMarkup(index,slot){
  const stage=stages[index];
  if(!stage)return '';
  const current=slot==='current';
  return `<section class="stage-page" data-index="${index}" data-slot="${slot}" aria-hidden="${current?'false':'true'}" tabindex="${current?'0':'-1'}">
    <div class="stage-page-content">${stageHTML(stage,index)}</div>
  </section>`;
}

function renderStageWindow(center=currentStage){
  const current=clampStageIndex(center);
  const pages=[];
  if(current>0)pages.push(stagePageMarkup(current-1,'prev'));
  pages.push(stagePageMarkup(current,'current'));
  if(current<stages.length-1)pages.push(stagePageMarkup(current+1,'next'));
  track.classList.remove('stage-single-page','stage-animating');
  track.classList.add('stage-follow-finger');
  track.style.setProperty('--stage-drag-x','0px');
  track.innerHTML=pages.join('');
}

function ensureStageTargetPage(targetIndex){
  const target=clampStageIndex(targetIndex);
  const direction=target>currentStage?1:-1;
  const currentPage=track.querySelector(`[data-index="${currentStage}"]`);
  if(!currentPage){
    renderStageWindow(currentStage);
  }
  track.querySelectorAll('.stage-page').forEach(page=>{
    const index=Number(page.dataset.index);
    if(index!==currentStage && index!==target)page.remove();
  });
  const liveCurrent=track.querySelector(`[data-index="${currentStage}"]`);
  if(liveCurrent){
    liveCurrent.dataset.slot='current';
    liveCurrent.setAttribute('aria-hidden','false');
    liveCurrent.tabIndex=0;
  }
  let targetPage=track.querySelector(`[data-index="${target}"]`);
  if(!targetPage){
    track.insertAdjacentHTML(direction>0?'beforeend':'afterbegin',stagePageMarkup(target,direction>0?'next':'prev'));
    targetPage=track.querySelector(`[data-index="${target}"]`);
  }
  if(targetPage){
    targetPage.dataset.slot=direction>0?'next':'prev';
    targetPage.setAttribute('aria-hidden','true');
    targetPage.tabIndex=-1;
  }
}

function setStageDragX(px,animate=false){
  track.classList.toggle('stage-animating',animate);
  track.style.setProperty('--stage-drag-x',`${Number(px).toFixed(2)}px`);
}

function completeStageMotion(targetIndex){
  if(stageMotionTimer){window.clearTimeout(stageMotionTimer);stageMotionTimer=0;}
  currentStage=clampStageIndex(targetIndex);
  stagePreviewIndex=null;
  renderStageWindow(currentStage);
  syncStageRail(true,'auto',currentStage);
  stageGestureActive=false;
  stageTransitionLockUntil=0;
  window.setTimeout(()=>{suppressClick=false;flushPendingRemoteCRMStages();},70);
}

function animateStageTo(targetIndex,fromDx=0){
  const target=clampStageIndex(targetIndex);
  if(target===currentStage){
    stagePreviewIndex=currentStage;
    const rail=document.getElementById('stageRail');
    rail?.classList.remove('stage-rail-dragging');
    syncStageRail(false,'smooth',currentStage);
    stageTransitionLockUntil=performance.now()+STAGE_SNAP_MS+40;
    const epoch=++stageMotionEpoch;
    setStageDragX(fromDx,false);
    void track.offsetWidth;
    setStageDragX(0,true);
    stageMotionTimer=window.setTimeout(()=>{
      if(epoch!==stageMotionEpoch)return;
      completeStageMotion(currentStage);
    },STAGE_SNAP_MS+30);
    return;
  }
  ensureStageTargetPage(target);
  const direction=target>currentStage?1:-1;
  const width=pageWidth();
  const finalX=direction>0?-width:width;
  stagePreviewIndex=target;
  const rail=document.getElementById('stageRail');
  rail?.classList.remove('stage-rail-dragging');
  syncStageRail(true,'smooth',target);
  stageTransitionLockUntil=performance.now()+STAGE_SNAP_MS+40;
  stageGestureActive=true;
  const epoch=++stageMotionEpoch;
  setStageDragX(fromDx,false);
  void track.offsetWidth;
  setStageDragX(finalX,true);
  crmHaptic('selection');
  stageMotionTimer=window.setTimeout(()=>{
    if(epoch!==stageMotionEpoch)return;
    completeStageMotion(target);
  },STAGE_SNAP_MS+30);
}

function syncStageViewport(behavior='auto'){
  if(track.scrollLeft)track.scrollLeft=0;
  if(stageGestureActive)return;
  const shown=track.querySelector('.stage-page[data-slot="current"]');
  if(!shown || Number(shown.dataset.index)!==currentStage)renderStageWindow(currentStage);
  syncStageRail(true,behavior==='smooth'?'smooth':'auto',currentStage);
}

function goToStage(index,behavior='smooth'){
  const next=clampStageIndex(index);
  if(stageGestureActive)return false;
  if(next===currentStage){
    syncStageRail(true,behavior==='smooth'?'smooth':'auto',currentStage);
    return false;
  }
  if(behavior!=='smooth'){
    currentStage=next;
    stagePreviewIndex=null;
    renderStageWindow(currentStage);
    syncStageRail(true,'auto',currentStage);
    return true;
  }
  stageGestureActive=true;
  suppressClick=true;
  ensureStageTargetPage(next);
  animateStageTo(next,0);
  return true;
}

function renderTrack(){
  stagePreviewIndex=null;
  if(stageMotionTimer){window.clearTimeout(stageMotionTimer);stageMotionTimer=0;}
  stageMotionEpoch++;
  stageGestureActive=false;
  stageTransitionLockUntil=0;
  renderStageRail();
  renderStageWindow(currentStage);
  window.requestAnimationFrame(()=>syncStageRail(false,'auto',currentStage));
}

function pageWidth(){
  return Math.max(1,frame.clientWidth||track.clientWidth||390);
}

function stageGestureTarget(originStage,dx){
  const direction=dx<0?1:dx>0?-1:0;
  return clampStageIndex(originStage+direction);
}

function stageDragDistance(originStage,dx,width=pageWidth()){
  const raw=Math.max(-width,Math.min(width,Number(dx)||0));
  const target=stageGestureTarget(originStage,raw);
  if(target===originStage && raw!==0)return raw*.28;
  return raw;
}

function stageSwipeProgress(dx,width=pageWidth()){
  return Math.max(0,Math.min(1,Math.abs(Number(dx)||0)/Math.max(1,width)));
}

function stageSwipeTarget(originStage,dx,width=pageWidth(),elapsedMs=240){
  const target=stageGestureTarget(originStage,dx);
  if(target===originStage)return originStage;
  const distance=Math.abs(Number(dx)||0);
  const threshold=Math.min(84,Math.max(56,width*.18));
  const velocity=distance/Math.max(1,Number(elapsedMs)||1);
  if(distance>=threshold || (distance>=24 && velocity>=.48))return target;
  return originStage;
}

function updateStageDrag(originStage,dx){
  const width=pageWidth();
  const effective=stageDragDistance(originStage,dx,width);
  setStageDragX(effective,false);
  const target=stageGestureTarget(originStage,effective);
  if(target===originStage){
    stagePreviewIndex=originStage;
    syncStageRail(false,'auto',originStage);
    return effective;
  }
  setStageRailProgress(originStage,target,stageSwipeProgress(effective,width));
  return effective;
}

/* Compatibility entry point used by page/view code. The controlled carousel
   always keeps current/adjacent stages in a three-slot transform window. */
function positionPages(){
  if(stageGestureActive)return;
  const shown=track.querySelector('.stage-page[data-slot="current"]');
  if(!shown || Number(shown.dataset.index)!==currentStage)renderStageWindow(currentStage);
  setStageDragX(0,false);
  syncStageRail(false,'auto',currentStage);
}

function changeStage(dir){
  const next=currentStage+dir;
  if(next<0 || next>=stages.length)return;
  goToStage(next,'smooth');
}

document.getElementById('stageRail').addEventListener('click',e=>{
  const chip=e.target.closest('[data-stage-jump]');
  if(!chip || stageGestureActive)return;
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

/* Follow-the-finger stage gestures.
   The page transform is driven directly by the finger/mouse delta. On release
   it springs to the adjacent stage or returns to the origin. The rail pill is
   interpolated from the same progress, so content and status stay synchronous. */
let gestureStarted=false;
let gestureOriginStage=0;
let gestureStartTime=0;
let gestureHorizontal=false;

function beginStageGesture(originStage){
  if(stageGestureActive)return false;
  gestureOriginStage=originStage;
  gestureStartTime=performance.now();
  gestureHorizontal=false;
  stageGestureActive=true;
  stagePreviewIndex=originStage;
  suppressClick=false;
  track.classList.remove('stage-animating');
  setStageDragX(0,false);
  syncStageRail(false,'auto',originStage);
  return true;
}

function finishStageGesture(originStage,dx,startedAt,cancelled=false){
  const elapsed=Math.max(1,performance.now()-startedAt);
  const target=cancelled?originStage:stageSwipeTarget(originStage,dx,pageWidth(),elapsed);
  const effective=stageDragDistance(originStage,dx,pageWidth());
  suppressClick=suppressClick||Math.abs(dx)>8;
  animateStageTo(target,effective);
}

frame.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;
  if(e.pointerType==='mouse' && e.button!==0)return;
  if(e.target.closest('button,input,textarea,select,a'))return;
  if(!beginStageGesture(currentStage))return;
  pointerId=e.pointerId;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  dragDx=0;
  dragDy=0;
  gestureStarted=true;
  dragging=false;
  try{frame.setPointerCapture?.(e.pointerId)}catch{}
});

frame.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  if(!gestureStarted || e.pointerId!==pointerId)return;
  dragDx=e.clientX-dragStartX;
  dragDy=e.clientY-dragStartY;
  if(!gestureHorizontal){
    if(Math.abs(dragDx)>8 && Math.abs(dragDx)>Math.abs(dragDy)*1.12)gestureHorizontal=true;
    else if(Math.abs(dragDy)>10 && Math.abs(dragDy)>Math.abs(dragDx))return;
  }
  if(!gestureHorizontal)return;
  dragging=true;
  suppressClick=true;
  e.preventDefault();
  updateStageDrag(gestureOriginStage,dragDx);
});

function finishPointerDrag(cancelled=false){
  if(!gestureStarted)return;
  const origin=gestureOriginStage;
  const dx=dragDx;
  const started=gestureStartTime;
  gestureStarted=false;
  pointerId=null;
  dragging=false;
  dragDx=0;
  dragDy=0;
  if(!gestureHorizontal){
    stageGestureActive=false;
    stagePreviewIndex=null;
    syncStageRail(false,'auto',currentStage);
    flushPendingRemoteCRMStages();
    return;
  }
  finishStageGesture(origin,dx,started,cancelled);
}
frame.addEventListener('pointerup',()=>finishPointerDrag(false));
frame.addEventListener('pointercancel',()=>finishPointerDrag(true));

let touchActive=false;
let touchHorizontal=false;
let touchStartX=0;
let touchStartY=0;
let touchDx=0;
let touchDy=0;
let touchOriginStage=0;
let touchStartTime=0;

frame.addEventListener('touchstart',e=>{
  if(e.touches.length!==1)return;
  if(e.target.closest('button,input,textarea,select,a'))return;
  if(!beginStageGesture(currentStage))return;
  const t=e.touches[0];
  touchActive=true;
  touchHorizontal=false;
  touchStartX=t.clientX;
  touchStartY=t.clientY;
  touchDx=0;
  touchDy=0;
  touchOriginStage=currentStage;
  touchStartTime=performance.now();
},{passive:true});

frame.addEventListener('touchmove',e=>{
  if(!touchActive || e.touches.length!==1)return;
  const t=e.touches[0];
  touchDx=t.clientX-touchStartX;
  touchDy=t.clientY-touchStartY;
  if(!touchHorizontal){
    if(Math.abs(touchDx)>8 && Math.abs(touchDx)>Math.abs(touchDy)*1.12)touchHorizontal=true;
    else if(Math.abs(touchDy)>10 && Math.abs(touchDy)>Math.abs(touchDx))return;
  }
  if(!touchHorizontal)return;
  suppressClick=true;
  e.preventDefault();
  updateStageDrag(touchOriginStage,touchDx);
},{passive:false});

function finishTouchSwipe(cancelled=false){
  if(!touchActive)return;
  const origin=touchOriginStage;
  const dx=touchDx;
  const started=touchStartTime;
  touchActive=false;
  touchDx=0;
  touchDy=0;
  if(!touchHorizontal){
    touchHorizontal=false;
    stageGestureActive=false;
    stagePreviewIndex=null;
    syncStageRail(false,'auto',currentStage);
    flushPendingRemoteCRMStages();
    return;
  }
  touchHorizontal=false;
  finishStageGesture(origin,dx,started,cancelled);
}
frame.addEventListener('touchend',()=>finishTouchSwipe(false),{passive:true});
frame.addEventListener('touchcancel',()=>finishTouchSwipe(true),{passive:true});

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
