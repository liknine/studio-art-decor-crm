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

function syncStageRail(scrollIntoView=true){
  const rail=document.getElementById('stageRail');
  if(!rail)return;
  [...rail.querySelectorAll('[data-stage-jump]')].forEach((chip,index)=>{
    const active=index===currentStage;
    chip.classList.toggle('active',active);
    chip.setAttribute('aria-current',active?'step':'false');
  });
  if(scrollIntoView){
    const active=rail.querySelector(`[data-stage-jump="${currentStage}"]`);
    active?.scrollIntoView({behavior:'auto',block:'nearest',inline:'center'});
  }
}

function clearStageProgrammaticSync(){
  if(stageProgrammaticTimer){clearTimeout(stageProgrammaticTimer);stageProgrammaticTimer=0;}
  stageProgrammaticTarget=null;
}
function syncStageViewport(behavior='auto'){
  if(nativeMobile){
    const target=currentStage*pageWidth();
    stageProgrammaticTarget=currentStage;
    if(stageProgrammaticTimer)clearTimeout(stageProgrammaticTimer);
    if(behavior==='smooth'){
      track.scrollTo({left:target,behavior:'smooth'});
      stageProgrammaticTimer=window.setTimeout(()=>{
        track.scrollLeft=target;
        stageProgrammaticTarget=null;
        stageProgrammaticTimer=0;
        syncStageRail(true);
      },520);
    }else{
      track.scrollLeft=target;
      stageProgrammaticTimer=window.setTimeout(()=>{
        stageProgrammaticTarget=null;
        stageProgrammaticTimer=0;
        syncStageRail(true);
      },80);
    }
  }else{
    positionPages(0,behavior==='smooth');
  }
  syncStageRail(true);
}

function goToStage(index,behavior='smooth'){
  const next=Math.max(0,Math.min(stages.length-1,Number(index)||0));
  if(next===currentStage){syncStageRail(true);return;}
  currentStage=next;
  syncStageViewport(behavior);
  crmHaptic('selection');
}

function renderTrack(){
  track.innerHTML=stages.map((stage,index)=>
    `<section class="stage-page" data-index="${index}">
      ${stageHTML(stage,index)}
    </section>`
  ).join('');

  renderStageRail();
  window.requestAnimationFrame(()=>syncStageViewport('auto'));
}

function pageWidth(){
  return Math.max(1,track.clientWidth);
}

function pages(){
  return [...track.querySelectorAll('.stage-page')];
}
let stageMotionRaf=0;
let pendingStageOffset=0;

function scheduleStagePosition(offset){
  pendingStageOffset=offset;
  if(stageMotionRaf)return;

  stageMotionRaf=requestAnimationFrame(()=>{
    stageMotionRaf=0;
    positionPages(pendingStageOffset,false);
  });
}

function cancelScheduledStagePosition(){
  if(stageMotionRaf){
    cancelAnimationFrame(stageMotionRaf);
    stageMotionRaf=0;
  }
}


function positionPages(dragOffset=0,animate=false){
  const w=pageWidth();
  const duration=animate?'440ms':'0ms';

  pages().forEach((page,index)=>{
    const x=(index-currentStage)*w+dragOffset;
    const active=index===currentStage;

    page.style.setProperty('--stage-x',x+'px');
    page.style.setProperty('--stage-duration',duration);
    page.style.setProperty('--stage-pe',active?'auto':'none');
    page.setAttribute('aria-hidden',active?'false':'true');
    page.tabIndex=active?0:-1;
  });

  if(animate){
    window.setTimeout(()=>{
      pages().forEach(page=>page.style.setProperty('--stage-duration','0ms'));
    },470);
  }
  if(!dragging)syncStageRail(false);
}

function changeStage(dir){
  const next=currentStage+dir;

  if(next<0 || next>=stages.length){
    const edge=dir>0 ? -10 : 10;
    if(!nativeMobile){
      positionPages(edge,true);
      window.setTimeout(()=>positionPages(0,true),110);
    }
    return;
  }

  goToStage(next,'smooth');
}

document.getElementById('stageRail').addEventListener('click',e=>{
  const chip=e.target.closest('[data-stage-jump]');
  if(!chip)return;
  goToStage(Number(chip.dataset.stageJump),'smooth');
});

track.addEventListener('scroll',()=>{
  if(!nativeMobile)return;
  cancelAnimationFrame(stageScrollRaf);
  stageScrollRaf=requestAnimationFrame(()=>{
    if(stageProgrammaticTarget!==null){
      const targetLeft=stageProgrammaticTarget*pageWidth();
      if(Math.abs(track.scrollLeft-targetLeft)<=2){
        currentStage=stageProgrammaticTarget;
        clearStageProgrammaticSync();
        syncStageRail(true);
      }
      return;
    }
    const idx=Math.round(track.scrollLeft/pageWidth());
    const clamped=Math.max(0,Math.min(stages.length-1,idx));
    if(clamped!==currentStage){
      currentStage=clamped;
      syncStageRail(true);
    }
  });
},{passive:true});
if('onscrollend' in window){
  track.addEventListener('scrollend',()=>{
    if(!nativeMobile)return;
    const idx=Math.round(track.scrollLeft/pageWidth());
    currentStage=Math.max(0,Math.min(stages.length-1,idx));
    clearStageProgrammaticSync();
    syncStageRail(true);
  });
}

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

/* Desktop mouse / pen drag. */
let gestureStarted=false;

frame.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;
  if(e.pointerType==='mouse' && e.button!==0)return;
  if(e.target.closest('button,input,textarea,select,a'))return;

  pointerId=e.pointerId;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  dragDx=0;
  dragDy=0;
  dragging=false;
  gestureStarted=true;
  suppressClick=false;
});

frame.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  if(!gestureStarted || e.pointerId!==pointerId)return;

  dragDx=e.clientX-dragStartX;
  dragDy=e.clientY-dragStartY;

  const horizontal=
    Math.abs(dragDx)>8 &&
    Math.abs(dragDx)>Math.abs(dragDy)*1.15;

  if(!dragging && horizontal){
    dragging=true;
    frame.classList.add('dragging');

    try{frame.setPointerCapture(pointerId)}catch(_){}
  }

  if(!dragging)return;

  e.preventDefault();

  let dx=dragDx*.94;

  if(
    (currentStage===0 && dx>0) ||
    (currentStage===stages.length-1 && dx<0)
  ){
    dx*=.18;
  }

  scheduleStagePosition(dx);
});

function finishPointerDrag(e){
  if(!gestureStarted)return;

  gestureStarted=false;

  if(dragging){
    frame.classList.remove('dragging');
    try{
      if(pointerId!==null)frame.releasePointerCapture(pointerId);
    }catch(_){}
  }

  pointerId=null;

  const horizontal=
    Math.abs(dragDx)>Math.abs(dragDy)*1.05;

  if(Math.abs(dragDx)>9){
    suppressClick=true;
    window.setTimeout(()=>suppressClick=false,250);
  }

  if(dragging && horizontal){
    const threshold=Math.min(76,pageWidth()*.20);

    if(Math.abs(dragDx)>=threshold){
      currentStage=Math.max(
        0,
        Math.min(
          stages.length-1,
          currentStage+(dragDx<0?1:-1)
        )
      );
    }

    cancelScheduledStagePosition();
    positionPages(0,true);
  }

  dragging=false;
  dragDx=0;
  dragDy=0;
  syncStageRail(true);
}

frame.addEventListener('pointerup',finishPointerDrag);
frame.addEventListener('pointercancel',finishPointerDrag);

/*
  iPhone/iPad:
  - vertical gesture is never prevented -> event list scrolls normally;
  - only a clearly horizontal gesture becomes a status swipe.
*/
let touchActive=false;
let touchHorizontal=false;
let touchStartX=0;
let touchStartY=0;
let touchDx=0;
let touchDy=0;

frame.addEventListener('touchstart',e=>{
  if(nativeMobile)return;
  if(e.touches.length!==1)return;
  if(e.target.closest('button,input,textarea,select,a'))return;

  const t=e.touches[0];

  touchActive=true;
  touchHorizontal=false;
  touchStartX=t.clientX;
  touchStartY=t.clientY;
  touchDx=0;
  touchDy=0;
  suppressClick=false;
},{passive:true});

frame.addEventListener('touchmove',e=>{
  if(nativeMobile)return;
  if(!touchActive || e.touches.length!==1)return;

  const t=e.touches[0];
  touchDx=t.clientX-touchStartX;
  touchDy=t.clientY-touchStartY;

  if(!touchHorizontal){
    if(
      Math.abs(touchDx)>9 &&
      Math.abs(touchDx)>Math.abs(touchDy)*1.15
    ){
      touchHorizontal=true;
    }else if(
      Math.abs(touchDy)>10 &&
      Math.abs(touchDy)>Math.abs(touchDx)
    ){
      /* Vertical scroll belongs to .stage-page. */
      return;
    }
  }

  if(!touchHorizontal)return;

  e.preventDefault();

  let dx=touchDx*.94;

  if(
    (currentStage===0 && dx>0) ||
    (currentStage===stages.length-1 && dx<0)
  ){
    dx*=.18;
  }

  scheduleStagePosition(dx);
},{passive:false});

function finishTouchSwipe(){
  if(nativeMobile)return;
  if(!touchActive)return;

  touchActive=false;

  if(!touchHorizontal){
    touchDx=0;
    touchDy=0;
    return;
  }

  const threshold=Math.min(70,pageWidth()*.18);

  if(Math.abs(touchDx)>=threshold){
    currentStage=Math.max(
      0,
      Math.min(
        stages.length-1,
        currentStage+(touchDx<0?1:-1)
      )
    );
  }

  suppressClick=true;
  cancelScheduledStagePosition();
  positionPages(0,true);

  window.setTimeout(()=>suppressClick=false,330);

  touchHorizontal=false;
  touchDx=0;
  touchDy=0;
}

frame.addEventListener('touchend',finishTouchSwipe,{passive:true});
frame.addEventListener('touchcancel',finishTouchSwipe,{passive:true});

/* Horizontal trackpad gesture. */
frame.addEventListener('wheel',e=>{
  if(wheelLock)return;

  const horizontal=
    Math.abs(e.deltaX)>Math.abs(e.deltaY) &&
    Math.abs(e.deltaX)>24;

  const shifted=
    e.shiftKey &&
    Math.abs(e.deltaY)>24;

  if(horizontal || shifted){
    e.preventDefault();
    wheelLock=true;
    changeStage((horizontal?e.deltaX:e.deltaY)>0 ? 1 : -1);
    window.setTimeout(()=>wheelLock=false,460);
  }
},{passive:false});

/* Keyboard fallback on desktop. */
document.addEventListener('keydown',e=>{
  if(
    document.activeElement &&
    /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
  ) return;

  if(!document.getElementById('eventsPage').classList.contains('active'))return;

  if(e.key==='ArrowRight')changeStage(1);
  if(e.key==='ArrowLeft')changeStage(-1);
});

window.addEventListener('resize',()=>{
  window.requestAnimationFrame(()=>positionPages(0,false));
});
