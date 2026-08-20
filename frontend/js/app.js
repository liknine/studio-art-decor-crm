function isTelegramAuthenticationError(error){
  return error?.status===401 || error?.status===403 ||
    error?.code==='AUTH_REQUIRED' ||
    error?.code==='INVALID_TELEGRAM_DATA' ||
    error?.code==='TELEGRAM_DATA_EXPIRED' ||
    error?.code==='TELEGRAM_USER_NOT_ALLOWED' ||
    error?.code==='AUTH_CONFIGURATION_ERROR';
}

CRMDataLayer.setErrorHandler((error,operation)=>{
  if(operation==='load'){
    if(CRM_DATA_CONFIG.mode==='http' && isTelegramAuthenticationError(error)){
      notify(telegramAuthMessage());
    }else{
      notify(CRM_DATA_CONFIG.mode==='http'
        ? 'Сервер CRM недоступен. Данные не будут сохранены.'
        : 'Локальные данные недоступны. Изменения не будут сохранены.');
    }
    return;
  }
  notify(CRM_DATA_CONFIG.mode==='http'
    ? 'Не удалось сохранить изменения на сервере'
    : 'Не удалось сохранить изменения на устройстве');
});

const crmAppRoot=document.querySelector('.app');
if(crmAppRoot)crmAppRoot.inert=true;

const CRM_BACKGROUND_REFRESH_MS=5000;
let crmBackgroundRefreshTimer=0;
let crmBackgroundRefreshBusy=false;

function renderCRMCollections(){
  renderTrack();
  renderRental();
  renderEstimate();
  renderReminders();
  renderDynamicCalendar();
}

function applyRemoteRentalItems(nextItems,{allowEmpty=false}={}){
  if(!Array.isArray(nextItems))return false;
  return replaceRentalProducts(nextItems,{allowEmpty});
}

function activeCRMPageId(){
  return document.querySelector('.page.active')?.id||'eventsPage';
}

function applyRemoteCRMStages(nextStages){
  const activePage=activeCRMPageId();
  const selectedId=selectedEvent()?.id||'';
  stages=normalizeStages(nextStages);
  currentStage=Math.max(0,Math.min(stages.length-1,currentStage));

  let location=selectedId?crmEventLocation(stages,selectedId):null;
  if(location){
    selectedStageIndex=location.stageIndex;
    selectedEventIndex=location.eventIndex;
  }else if(selectedId){
    selectedStageIndex=currentStage;
    selectedEventIndex=0;
  }

  renderTrack();
  renderRental();
  renderDynamicCalendar();

  if(location){
    if(activePage==='eventPage')populateEventPage();
    else if(activePage==='estimatePage'){
      populateEventPage();
      renderEstimate();
    }else if(activePage==='remindersPage'){
      populateEventPage();
      renderReminders();
    }
    /* editEventPage intentionally keeps typed form values. The selected event
       indexes are refreshed by stable ID so saving still targets the same row. */
  }else if(selectedId && ['eventPage','estimatePage','remindersPage','editEventPage'].includes(activePage)){
    showPage('eventsPage');
  }

  const searchOverlay=document.getElementById('searchOverlay');
  if(searchOverlay?.classList.contains('open')){
    renderGlobalSearch(document.getElementById('globalSearchInput')?.value||'');
  }
}

async function refreshCRMFromServer(){
  if(CRM_DATA_CONFIG.mode!=='http' || CRMDataLayer.status!=='ready' || CRMDataLayer.dirty)return;
  if(document.visibilityState && document.visibilityState!=='visible')return;
  if(document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(crmBackgroundRefreshBusy)return;
  crmBackgroundRefreshBusy=true;
  try{
    const result=await CRMDataLayer.refresh(stages);
    if(result?.changed && Array.isArray(result.stages)){
      if(Array.isArray(result.rentalItems))applyRemoteRentalItems(result.rentalItems,{allowEmpty:true});
      applyRemoteCRMStages(result.stages);
    }
  }finally{
    crmBackgroundRefreshBusy=false;
  }
}

function startCRMBackgroundRefresh(){
  if(CRM_DATA_CONFIG.mode!=='http' || crmBackgroundRefreshTimer)return;
  crmBackgroundRefreshTimer=window.setInterval(()=>{void refreshCRMFromServer();},CRM_BACKGROUND_REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')void refreshCRMFromServer();
  });
  window.addEventListener('focus',()=>{void refreshCRMFromServer();});
}

function renderEmptyProductionState(){
  stages=normalizeStages(stages.map(stage=>({...stage,events:[]})));
  renderCRMCollections();
  document.documentElement.dataset.crmLoading='false';
}

async function bootstrapCRM(){
  try{
    if(CRM_DATA_CONFIG.mode==='http'){
      /* Never show prototype/demo customers while Telegram or the network is
         still loading. Render the real pipeline structure with zero events. */
      renderEmptyProductionState();
      try{
        TelegramMiniAppAuth.prepare(CRM_DATA_CONFIG);
      }catch(error){
        document.documentElement.dataset.crmReady='auth-required';
        notify(telegramAuthMessage(error));
        return;
      }
    }else{
      document.documentElement.dataset.crmLoading='false';
    }
    try{
      const loadedStages=await CRMDataLayer.init(stages);
      if(Array.isArray(CRMDataLayer.rentalItems))applyRemoteRentalItems(CRMDataLayer.rentalItems,{allowEmpty:true});
      applyRemoteCRMStages(loadedStages);
    }catch(err){
      /* HTTP mode deliberately stays empty when the server cannot be loaded.
         Local development may continue to use its normalized seed data. */
      if(CRM_DATA_CONFIG.mode!=='http'){
        stages=normalizeStages(stages);
        renderCRMCollections();
      }
      if(CRM_DATA_CONFIG.mode==='http' && isTelegramAuthenticationError(err)){
        document.documentElement.dataset.crmReady='auth-required';
      }
    }
    if(document.documentElement.dataset.crmReady!=='auth-required'){
      document.documentElement.dataset.crmReady='true';
      startCRMBackgroundRefresh();
    }
  }catch(err){
    console.error('CRM UI bootstrap failed',err);
    notify('Не удалось полностью загрузить интерфейс CRM');
    document.documentElement.dataset.crmReady='error';
  }finally{
    document.documentElement.dataset.crmLoading='false';
    if(crmAppRoot)crmAppRoot.inert=false;
  }
}
bootstrapCRM();

window.__CRM_CORE_V59__={
  version:CRM_SCHEMA_VERSION,
  dataMode:CRM_DATA_CONFIG.mode,
  dataLayer:CRMDataLayer,
  persist:persistCRM,
  reservedQuantity,
  bookingConflict,
  maxReservableForEvent,
  paymentMethods:PAYMENT_METHODS
};

function crmSelfAudit(){
  const issues=[];
  if(!stages.every(stage=>stage.events.every(event=>event.id&&Array.isArray(event.estimateItems)&&Array.isArray(event.reminderItems))))issues.push('core-event-model');
  if(!rentalProducts.every(product=>product.id))issues.push('rental-stable-ids');
  if(!stages.every(stage=>stage.events.every(event=>event.rentalBooking&&['draft','reserved'].includes(event.rentalBooking.status))))issues.push('booking-model');
  if(!stages.every(stage=>stage.events.every(event=>['','cash','card','barter'].includes(event.paymentMethod||''))))issues.push('payment-method-model');
  if(!stages.every(stage=>stage.events.every(event=>event.estimateItems.every(item=>Number.isFinite(Number(item.unitClient))&&Number.isFinite(Number(item.unitCost))))))issues.push('estimate-unit-model');
  const expected=['Новый заказ','Переговоры','Составляем ТЗ','Подготовительные работы','Монтаж','Демонтаж','Закрыт'];
  if(stages.length!==7)issues.push('pipeline-stage-count');
  if(stages.some((s,i)=>s.name!==expected[i]))issues.push('pipeline-order');
  if(document.querySelectorAll('.stage-page').length!==7)issues.push('rendered-stage-count');
  if(document.querySelector('.stage-index'))issues.push('legacy-stage-index-visible-risk');
  if(!document.getElementById('brandHome'))issues.push('brand-home');
  if(!document.getElementById('eventsNav') || !document.getElementById('rentalNav'))issues.push('bottom-nav');
  if(!document.getElementById('stageRail') || !document.getElementById('rentalSearch'))issues.push('v34-navigation-tools');
  if(!document.getElementById('eventPriorityBadge') || !document.getElementById('eventContactCall'))issues.push('v35-premium-detail');
  if(typeof contactInfo!=='function' || typeof priorityMeta!=='function')issues.push('v35-contact-priority-helpers');
  if(typeof pageMotionFrames!=='function' || typeof scheduleStagePosition!=='function')issues.push('v36-motion-core');
  if(!document.getElementById('eventFinance') || !document.getElementById('advanceEventBtn'))issues.push('v34-event-actions');
  window.__CRM_AUDIT__={ok:issues.length===0,issues};
  if(issues.length)console.error('CRM self-audit failed',issues);
  return window.__CRM_AUDIT__;
}
setTimeout(crmSelfAudit,0);
