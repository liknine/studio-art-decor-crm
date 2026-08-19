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

async function bootstrapCRM(){
  try{
    if(CRM_DATA_CONFIG.mode==='http'){
      try{
        TelegramMiniAppAuth.prepare(CRM_DATA_CONFIG);
      }catch(error){
        stages=normalizeStages(stages.map(stage=>({...stage,events:[]})));
        renderTrack();
        renderRental();
        renderEstimate();
        renderReminders();
        renderDynamicCalendar();
        document.documentElement.dataset.crmReady='auth-required';
        notify(telegramAuthMessage(error));
        return;
      }
    }
    try{
      stages=await CRMDataLayer.init(stages);
    }catch(err){
      /* Keep the UI available with normalized seed data. The data layer has
         already retained and reported the adapter error. */
      stages=normalizeStages(CRM_DATA_CONFIG.mode==='http'
        ? stages.map(stage=>({...stage,events:[]}))
        : stages);
      if(CRM_DATA_CONFIG.mode==='http' && isTelegramAuthenticationError(err)){
        document.documentElement.dataset.crmReady='auth-required';
      }
    }
    renderTrack();
    renderRental();
    renderEstimate();
    renderReminders();
    renderDynamicCalendar();
    if(document.documentElement.dataset.crmReady!=='auth-required'){
      document.documentElement.dataset.crmReady='true';
    }
  }catch(err){
    console.error('CRM UI bootstrap failed',err);
    notify('Не удалось полностью загрузить интерфейс CRM');
    document.documentElement.dataset.crmReady='error';
  }finally{
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
