function crmClone(value){
  return JSON.parse(JSON.stringify(value));
}
function crmId(prefix='id'){
  if(globalThis.crypto?.randomUUID)return prefix+'-'+crypto.randomUUID();
  return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
}
function uniqueCRMIds(rows,prefix){
  const seen=new Set();
  rows.forEach(row=>{
    let id=String(row?.id||'').trim();
    while(!id || seen.has(id))id=crmId(prefix);
    row.id=id;
    seen.add(id);
  });
  return rows;
}

function normalizeEvent(event,stageIndex,eventIndex){
  const e={...event};
  e.id=e.id||crmId('event');
  if(Array.isArray(e.estimateItems)){
    e.estimateItems=uniqueCRMIds(e.estimateItems.map(normalizeEstimateItem),'estimate');
  }else if(e.estimate){
    e.estimateItems=uniqueCRMIds(crmClone(DEFAULT_ESTIMATE).map(normalizeEstimateItem),'estimate');
  }else{
    e.estimateItems=[];
  }

  if(Array.isArray(e.reminderItems)){
    e.reminderItems=uniqueCRMIds(e.reminderItems.map(normalizeReminder),'reminder');
  }else if(e.title==='Свадьба Анны и Максима'){
    e.reminderItems=uniqueCRMIds(crmClone(DEFAULT_REMINDERS).map(normalizeReminder),'reminder');
  }else{
    const count=Math.max(0,Number(e.reminders)||0);
    e.reminderItems=uniqueCRMIds(Array.from({length:count},(_,i)=>normalizeReminder({
      text:'Напоминание '+(i+1),kind:'Сохранено из прототипа'
    },i)),'reminder');
  }
  e.rentalBooking=normalizeBooking(e);
  e.paymentMethod=normalizePaymentMethod(e.paymentMethod);
  e.reminders=e.reminderItems.length;
  e.estimate=e.estimateItems.length>0;

  const rawSubtitle=String(e.subtitle||'').trim();
  if(e.source==='site'){
    e.subtitle=/с сайта/i.test(String(e.title||''))?'':'Заявка с сайта';
    delete e.newLead;
  }else if(/^(ещё не обработана|заявка с сайта|создано вручную)$/i.test(rawSubtitle)){
    e.subtitle=(e.place&&e.place!=='Место не указано')?e.place:'';
  }
  return e;
}
function normalizeStages(input){
  const seenEventIds=new Set();
  return (Array.isArray(input)?input:[]).map((stage,stageIndex)=>({
    ...stage,
    events:(Array.isArray(stage.events)?stage.events:[]).map((event,eventIndex)=>{
      const normalized=normalizeEvent(event,stageIndex,eventIndex);
      let id=String(normalized.id||'').trim();
      while(!id || seenEventIds.has(id))id=crmId('event');
      normalized.id=id;
      seenEventIds.add(id);
      return normalized;
    })
  }));
}
function crmSnapshot(currentStages=stages){
  return {
    version:CRM_SCHEMA_VERSION,
    updatedAt:new Date().toISOString(),
    stages:normalizeStages(crmClone(currentStages))
  };
}

function selectedEvent(){return stages[selectedStageIndex]?.events?.[selectedEventIndex]}

function crmEventLocation(currentStages,eventId){
  const id=String(eventId||'');
  for(let stageIndex=0;stageIndex<currentStages.length;stageIndex+=1){
    const eventIndex=currentStages[stageIndex].events.findIndex(event=>event.id===id);
    if(eventIndex>=0)return {stageIndex,eventIndex,event:currentStages[stageIndex].events[eventIndex]};
  }
  return null;
}
function createCRMEvent(currentStages,event,stageIndex=0){
  if(!currentStages[stageIndex])return null;
  const normalized=normalizeEvent(event,stageIndex,0);
  if(crmEventLocation(currentStages,normalized.id))normalized.id=crmId('event');
  currentStages[stageIndex].events.unshift(normalized);
  return normalized;
}
function updateCRMEvent(currentStages,eventId,changes){
  const location=crmEventLocation(currentStages,eventId);
  if(!location)return null;
  const normalized=normalizeEvent({...location.event,...changes,id:location.event.id},location.stageIndex,location.eventIndex);
  Object.assign(location.event,normalized,{id:location.event.id});
  return location.event;
}
function deleteCRMEvent(currentStages,eventId){
  const location=crmEventLocation(currentStages,eventId);
  if(!location)return null;
  return currentStages[location.stageIndex].events.splice(location.eventIndex,1)[0]||null;
}
function moveCRMEvent(currentStages,eventId,toStageIndex,expectedFromStage=null){
  if(!currentStages[toStageIndex])return null;
  const location=crmEventLocation(currentStages,eventId);
  if(!location || (expectedFromStage!==null && location.stageIndex!==expectedFromStage))return null;
  if(location.stageIndex===toStageIndex)return {...location,toStageIndex,toEventIndex:location.eventIndex};
  const event=currentStages[location.stageIndex].events.splice(location.eventIndex,1)[0];
  currentStages[toStageIndex].events.unshift(event);
  return {...location,event,toStageIndex,toEventIndex:0};
}

const PAYMENT_METHODS={cash:'Наличные',card:'Карта',barter:'Бартер'};
function normalizePaymentMethod(value=''){
  const method=String(value||'');
  return Object.hasOwn(PAYMENT_METHODS,method)?method:'';
}
function setEventPaymentMethod(event,value=''){
  if(!event)return '';
  event.paymentMethod=normalizePaymentMethod(value);
  return event.paymentMethod;
}
function paymentMethodLabel(value=''){
  return PAYMENT_METHODS[value]||'Не выбран';
}
