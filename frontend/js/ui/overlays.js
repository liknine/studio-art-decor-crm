function syncModalState(){
  const open=Boolean(document.querySelector('.overlay.open'));
  document.documentElement.classList.toggle('crm-modal-open',open);
  document.body.classList.toggle('crm-modal-open',open);
}
function openModal(overlay){overlay?.classList.add('open');syncModalState();}
function closeModal(overlay){overlay?.classList.remove('open');syncModalState();}

function clearNewEventValidation(){
  const alert=document.getElementById('newEventAlert');
  if(alert){alert.hidden=true;alert.textContent='';}
  document.querySelectorAll('#newEventOverlay [data-new-event-field]').forEach(label=>label.classList.remove('field-error'));
}
function showNewEventValidation(message,field='title'){
  const alert=document.getElementById('newEventAlert');
  if(alert){alert.textContent=message;alert.hidden=false;}
  const label=document.querySelector(`#newEventOverlay [data-new-event-field="${field}"]`);
  label?.classList.add('field-error');
  const input=label?.querySelector('input,textarea,select');
  window.setTimeout(()=>input?.focus(),40);
}
function createEventFromOverlay(){
  clearNewEventValidation();
  const title=document.getElementById('newEventTitle').value.trim();
  if(!title){showNewEventValidation('Заполните название мероприятия.');return false;}

  const dateValue=document.getElementById('newEventDate').value;
  const event={
    id:crmId('event'),
    title,
    subtitle:(document.getElementById('newEventPlace').value.trim()||''),
    avatar:title.charAt(0).toUpperCase(),
    date:dateValue ? eventLabelFromInput(dateValue) : 'Дата не указана',
    time:document.getElementById('newEventTime').value||'—',
    contact:document.getElementById('newEventContact').value.trim()||'Контакт не указан',
    place:document.getElementById('newEventPlace').value.trim()||'Место не указано',
    comment:document.getElementById('newEventComment').value.trim(),
    priority:document.getElementById('newEventPriority').value||'normal',
    visualTheme:document.getElementById('newEventTheme').value||'auto',
    reminders:0,
    reminderItems:[],
    estimate:false,
    estimateItems:[],
    rentalBooking:{status:'draft',startDate:dateValue||'',endDate:dateValue||'',autoPeriod:true,reservedAt:''},
    source:'manual',
    received:'создано вручную'
  };

  createCRMEvent(stages,event,0);
  persistCRM();
  currentStage=0;
  renderTrack();
  renderDynamicCalendar();

  ['newEventTitle','newEventDate','newEventTime','newEventContact','newEventPlace','newEventComment'].forEach(id=>{
    document.getElementById(id).value='';
  });

  document.getElementById('newEventPriority').value='normal';
  document.getElementById('newEventTheme').value='auto';
  return true;
}

function openFunnelHome(resetStage=false){
  if(resetStage)currentStage=0;

  document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));
  const boardBtn=document.querySelector('.tool[data-view="board"]');
  if(boardBtn)boardBtn.classList.add('active');

  frame.style.display='block';
  document.getElementById('stageSwitcher').style.display='block';
  document.getElementById('swipeHint').style.display='none';
  document.getElementById('calendar').classList.remove('active');

  showPage('eventsPage');

  window.requestAnimationFrame(()=>{
    window.requestAnimationFrame(()=>syncStageViewport('auto'));
  });
}


function openGlobalSearch(){
  globalSearchScope='all';
  document.querySelectorAll('[data-search-scope]').forEach(btn=>btn.classList.toggle('active',btn.dataset.searchScope==='all'));
  renderGlobalSearch('');
  document.getElementById('globalSearchInput').value='';
  openModal(document.getElementById('searchOverlay'));
  setTimeout(()=>document.getElementById('globalSearchInput').focus(),170);
}
document.getElementById('searchBtn').addEventListener('click',openGlobalSearch);
document.querySelectorAll('[data-search-scope]').forEach(btn=>btn.addEventListener('click',()=>{
  globalSearchScope=btn.dataset.searchScope||'all';
  document.querySelectorAll('[data-search-scope]').forEach(x=>x.classList.toggle('active',x===btn));
  renderGlobalSearch(document.getElementById('globalSearchInput').value);
}));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openGlobalSearch();}});

document.getElementById('closeSearch').addEventListener('click',()=>closeModal(document.getElementById('searchOverlay')));
document.getElementById('globalSearchInput').addEventListener('input',e=>renderGlobalSearch(e.target.value));
document.getElementById('globalSearchResults').addEventListener('click',e=>{
  const eventRow=e.target.closest('[data-search-event-id]');
  const productRow=e.target.closest('[data-search-product]');

  if(eventRow){
    const location=crmEventLocation(stages,eventRow.dataset.searchEventId||'');
    if(!location)return;
    selectedStageIndex=location.stageIndex;
    selectedEventIndex=location.eventIndex;
    currentStage=selectedStageIndex;
    closeModal(document.getElementById('searchOverlay'));
    populateEventPage();
    showPage('eventPage');
    return;
  }

  if(productRow){
    selectedProductIndex=Number(productRow.dataset.searchProduct);
    closeModal(document.getElementById('searchOverlay'));
    populateProductPage();
    showPage('rentalDetailPage');
  }
});

document.getElementById('cancelEventBtn').addEventListener('click',()=>openModal(document.getElementById('cancelEventOverlay')));
document.getElementById('closeCancelEvent').addEventListener('click',()=>closeModal(document.getElementById('cancelEventOverlay')));
document.getElementById('keepEventBtn').addEventListener('click',()=>closeModal(document.getElementById('cancelEventOverlay')));
document.getElementById('confirmCancelEvent').addEventListener('click',()=>{
  const event=selectedEvent();
  if(!event || !deleteCRMEvent(stages,event.id))return;
  persistCRM();
  selectedEventIndex=0;
  closeModal(document.getElementById('cancelEventOverlay'));
  renderTrack();
  renderDynamicCalendar();
  openFunnelHome(false);
  notify('Мероприятие отменено');
});

document.getElementById('brandHome').addEventListener('click',()=>openFunnelHome(true));
document.getElementById('eventsNav').addEventListener('click',()=>openFunnelHome(false));
document.getElementById('rentalNav').addEventListener('click',()=>{renderRental();showPage('rentalPage')});
document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>{
  const target=btn.dataset.back;
  if(target==='eventsPage'){openFunnelHome(false);return;}
  showPage(target);
}));
document.querySelectorAll('.tool').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.classList.contains('active'))return;
  document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');

  const boardMode=btn.dataset.view==='board';
  const calendar=document.getElementById('calendar');
  const switcher=document.getElementById('stageSwitcher');
  const hint=document.getElementById('swipeHint');
  const outgoing=boardMode?calendar:frame;

  outgoing.classList.add('v43-panel-out');
  if(!boardMode){switcher.classList.add('v43-panel-out');hint.classList.add('v43-panel-out');}

  window.setTimeout(()=>{
    outgoing.classList.remove('v43-panel-out');
    switcher.classList.remove('v43-panel-out');
    hint.classList.remove('v43-panel-out');

    frame.style.display=boardMode?'block':'none';
    switcher.style.display=boardMode?'block':'none';
    hint.style.display='none';
    calendar.classList.toggle('active',!boardMode);

    if(!boardMode)renderDynamicCalendar();
    if(boardMode)syncStageViewport('auto');

    const incoming=boardMode?frame:calendar;
    incoming.classList.add('v43-panel-in');
    if(boardMode){switcher.classList.add('v43-panel-in');hint.classList.add('v43-panel-in');}
    window.setTimeout(()=>{
      incoming.classList.remove('v43-panel-in');
      switcher.classList.remove('v43-panel-in');
      hint.classList.remove('v43-panel-in');
    },220);
  },120);
}));

document.getElementById('openEditEvent').addEventListener('click',openEditEventPage);

document.getElementById('saveEventEdit').addEventListener('click',()=>{
  const e=selectedEvent();
  if(!e)return;

  const nextStage=Number(document.getElementById('editEventStatus').value);
  const previousDateKey=eventDateKey(e);
  const editedDateKey=document.getElementById('editEventDate').value||previousDateKey;

  e.title=document.getElementById('editEventTitle').value.trim()||e.title;
  e.date=eventLabelFromInput(editedDateKey)||e.date;
  e.time=document.getElementById('editEventTime').value||'—';
  e.place=document.getElementById('editEventPlace').value.trim()||e.place;
  e.contact=document.getElementById('editEventContact').value.trim()||e.contact;
  e.comment=document.getElementById('editEventComment').value.trim();
  e.priority=document.getElementById('editEventPriority').value||'normal';
  e.visualTheme=document.getElementById('editEventTheme').value||'auto';

  const booking=eventBooking(e);
  if(booking.autoPeriod && editedDateKey && editedDateKey!==previousDateKey){
    const oldStart=booking.startDate||previousDateKey;
    const oldEnd=booking.endDate||oldStart;
    const duration=Math.max(0,datesInRange(oldStart,oldEnd).length-1);
    const startDate=new Date(editedDateKey+'T12:00:00');
    const endDate=new Date(startDate);endDate.setDate(endDate.getDate()+duration);
    booking.startDate=editedDateKey;
    booking.endDate=`${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
    if(booking.status==='reserved'){
      const conflict=bookingConflict(e);
      if(conflict){
        booking.status='draft';booking.reservedAt='';
        notify('Дата изменена: бронь снята из-за конфликта склада');
      }
    }
  }

  if(Number.isFinite(nextStage) && nextStage!==selectedStageIndex){
    const moved=moveCRMEvent(stages,e.id,nextStage,selectedStageIndex);
    if(!moved)return;
    selectedStageIndex=nextStage;
    selectedEventIndex=0;
    currentStage=nextStage;
    renderTrack();
  }

  persistCRM();
  /* Editing an event mutates the in-memory object immediately. Repaint the
     funnel too; otherwise the card keeps its old date/time/contact until a
     full reload or another stage render happens. */
  renderTrack();
  populateEventPage();
  renderDynamicCalendar();
  renderRental();
  showPage('eventPage');
  crmHaptic('success');notify('Мероприятие обновлено');
});

document.getElementById('calendarPrev').addEventListener('click',()=>{
  calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
  renderDynamicCalendar();
});

document.getElementById('calendarNext').addEventListener('click',()=>{
  calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);
  renderDynamicCalendar();
});

document.getElementById('calendarToday').addEventListener('click',()=>{
  const now=new Date();
  calendarCursor=new Date(now.getFullYear(),now.getMonth(),1);
  calendarSelectedDate=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  renderDynamicCalendar();
});

document.getElementById('calendarMonthPicker').addEventListener('change',e=>{
  if(!e.target.value)return;
  const [y,m]=e.target.value.split('-').map(Number);
  calendarCursor=new Date(y,m-1,1);
  renderDynamicCalendar();
});

document.getElementById('dynamicCalendarGrid').addEventListener('click',e=>{
  const day=e.target.closest('[data-calendar-date]');
  if(!day)return;

  calendarSelectedDate=day.dataset.calendarDate;
  const d=new Date(calendarSelectedDate+'T12:00:00');

  if(d.getMonth()!==calendarCursor.getMonth() || d.getFullYear()!==calendarCursor.getFullYear()){
    calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);
  }

  renderDynamicCalendar();
});

document.getElementById('calendarSelectedEvents').addEventListener('click',e=>{
  const row=e.target.closest('[data-calendar-stage]');
  if(!row)return;

  selectedStageIndex=Number(row.dataset.calendarStage);
  selectedEventIndex=Number(row.dataset.calendarEvent);
  currentStage=selectedStageIndex;
  populateEventPage();
  showPage('eventPage');
});


document.getElementById('advanceEventBtn').addEventListener('click',()=>{
  advanceEventToNextStage(selectedStageIndex,selectedEventIndex,true,selectedEvent()?.id||'');
});

document.getElementById('openEstimate').addEventListener('click',()=>{renderEstimate();populateBookingPanel();showPage('estimatePage')});
document.getElementById('openReminders').addEventListener('click',()=>{renderReminders();showPage('remindersPage')});
document.getElementById('toggleBooking').addEventListener('click',()=>{
  const event=selectedEvent();if(!event)return;
  const booking=eventBooking(event);
  if(booking.status==='reserved'){
    releaseEventBooking(event);
    persistCRM();renderEstimate();renderRental();populateBookingPanel();populateEventPage();notify('Бронь снята');
    return;
  }
  const start=safeDateKey(document.getElementById('bookingStart').value)||booking.startDate||eventDateKey(event);
  const end=safeDateKey(document.getElementById('bookingEnd').value)||booking.endDate||start;
  if(!start||!end){notify('Укажите период бронирования');return;}
  if(!bookingRentalItems(event).length){notify('В смете нет реквизита из каталога аренды');return;}
  const result=reserveEventBooking(event,{start,end});
  if(!result.ok){notify('Бронь невозможна: '+result.conflict.message);return;}
  persistCRM();renderEstimate();renderRental();populateBookingPanel();populateEventPage();crmHaptic('success');notify('Реквизит забронирован');
});
['bookingStart','bookingEnd'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{
  const event=selectedEvent();if(!event)return;
  const booking=eventBooking(event);
  if(booking.status==='reserved'){populateBookingPanel();notify('Сначала снимите активную бронь');return;}
  const start=safeDateKey(document.getElementById('bookingStart').value);
  let end=safeDateKey(document.getElementById('bookingEnd').value)||start;
  if(start&&end&&compareDateKeys(start,end)>0){document.getElementById('bookingEnd').value=start;end=start;}
  if(start){booking.startDate=start;booking.endDate=end;booking.autoPeriod=false;persistCRM();}
  const conflict=bookingConflict(event,{start,end});
  const summary=document.getElementById('bookingSummary');
  if(conflict){summary.textContent='Конфликт: '+conflict.message;summary.className='booking-summary warn';}
  else if(start){summary.textContent=`${formatShortDateKey(start)}${end&&end!==start?' — '+formatShortDateKey(end):''} · склад доступен для бронирования.`;summary.className='booking-summary ok';}
}));
document.getElementById('rentalDate').addEventListener('change',()=>{renderRental();if(document.getElementById('rentalDetailPage').classList.contains('active'))populateProductPage();});
document.getElementById('rentalSearch').addEventListener('input',e=>{
  rentalQuery=e.target.value||'';
  renderRental();
});

document.getElementById('rentalFilters').addEventListener('click',e=>{
  const button=e.target.closest('[data-rental-category]');
  if(!button)return;
  rentalCategory=button.dataset.rentalCategory;
  renderRental();
});

document.getElementById('rentalList').addEventListener('click',e=>{
  const card=e.target.closest('[data-product]');if(!card)return;
  selectedProductIndex=Number(card.dataset.product);populateProductPage();showPage('rentalDetailPage');
});
document.getElementById('productEstimateTarget').addEventListener('change',e=>{
  productEstimateTargetId=e.target.value||'';
  populateProductEstimateTarget();
});
document.getElementById('addProductToEstimate').addEventListener('click',()=>{
  const p=rentalProducts[selectedProductIndex];
  const target=estimateTargetById(document.getElementById('productEstimateTarget').value);
  if(!target){notify('Выберите мероприятие для сметы');return;}
  if(!addRentalProductToSelectedEstimate(p,target.event))return;
  if(selectedEvent()?.id===target.event.id)renderEstimate();
  populateProductPage();
  notify(`Добавлено в смету «${target.event.title}»`);
});
function closeAddItemSheet(){closeModal(document.getElementById('addItemOverlay'));}
function openAddItemSheet(){
  renderCatalog();
  const overlay=document.getElementById('addItemOverlay');
  const list=document.getElementById('catalogList');
  if(list)list.scrollTop=0;
  openModal(overlay);
}
document.getElementById('addMoreBtn').addEventListener('click',openAddItemSheet);
document.getElementById('catalogList').addEventListener('click',e=>{
  const b=e.target.closest('[data-catalog-add]');if(!b)return;
  const p=rentalProducts[Number(b.dataset.catalogAdd)];
  if(!addRentalProductToSelectedEstimate(p))return;
  renderEstimate();closeAddItemSheet();notify('Добавлено в смету');
});
document.getElementById('customItemBtn').addEventListener('click',()=>openNewEstimateItem('custom'));
document.getElementById('extraExpenseBtn').addEventListener('click',()=>openNewEstimateItem('expense'));
document.querySelector('.js-close-add').addEventListener('click',closeAddItemSheet);
document.getElementById('addItemOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeAddItemSheet();});
function resetReminderEditor(){
  editingReminderId='';
  document.getElementById('reminderOverlayTitle').textContent='Новое напоминание';
  document.getElementById('saveReminder').textContent='Сохранить напоминание';
  document.getElementById('newReminderText').value='';
  document.getElementById('newReminderDate').value='';
  document.getElementById('newReminderTime').value='';
  const alert=document.getElementById('reminderAlert');
  alert.hidden=true;alert.textContent='';
  document.getElementById('newReminderText').removeAttribute('aria-invalid');
  document.getElementById('newReminderDate').removeAttribute('aria-invalid');
  document.querySelectorAll('.quick-times button').forEach(button=>button.classList.remove('active'));
}
function quickReminderTarget(label,now=new Date()){
  const base=new Date(now.getTime());
  const pad=value=>String(value).padStart(2,'0');
  const key=String(label||'').trim();
  if(key==='Через 1 час')base.setMinutes(base.getMinutes()+60);
  else{
    const days={'Завтра':1,'Через 3 дня':3,'Через неделю':7}[key];
    if(!days)return null;
    base.setDate(base.getDate()+days);
    base.setHours(10,0,0,0);
  }
  return {
    date:`${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`,
    time:`${pad(base.getHours())}:${pad(base.getMinutes())}`
  };
}
function openReminderEditor(reminderId=''){
  resetReminderEditor();
  const reminder=eventReminders(selectedEvent()).find(item=>item.id===reminderId);
  if(reminder){
    editingReminderId=reminder.id;
    document.getElementById('reminderOverlayTitle').textContent='Редактировать напоминание';
    document.getElementById('saveReminder').textContent='Сохранить изменения';
    document.getElementById('newReminderText').value=reminder.text||'';
    document.getElementById('newReminderDate').value=reminder.date||'';
    document.getElementById('newReminderTime').value=reminder.time||'';
  }
  openModal(document.getElementById('reminderOverlay'));
}
function closeReminderEditor(){
  closeModal(document.getElementById('reminderOverlay'));
  resetReminderEditor();
}
document.getElementById('addReminderBtn').addEventListener('click',()=>openReminderEditor());
document.getElementById('reminderList').addEventListener('click',event=>{
  const card=event.target.closest('[data-reminder-id]');
  if(card)openReminderEditor(card.dataset.reminderId||'');
});
document.querySelector('.js-close-reminder').addEventListener('click',closeReminderEditor);
document.getElementById('newReminderText').addEventListener('input',()=>{
  const alert=document.getElementById('reminderAlert');
  alert.hidden=true;alert.textContent='';
  document.getElementById('newReminderText').removeAttribute('aria-invalid');
});
document.getElementById('saveReminder').addEventListener('click',async()=>{
  const e=selectedEvent();
  if(!e)return;
  const textInput=document.getElementById('newReminderText');
  const text=textInput.value.trim();
  if(!text){
    const alert=document.getElementById('reminderAlert');
    alert.textContent='Введите текст напоминания.';alert.hidden=false;
    textInput.setAttribute('aria-invalid','true');
    textInput.focus();
    return;
  }
  const dateInput=document.getElementById('newReminderDate');
  const date=dateInput.value||'';
  if(!date){
    const alert=document.getElementById('reminderAlert');
    alert.textContent='Укажите дату напоминания.';alert.hidden=false;
    dateInput.setAttribute('aria-invalid','true');
    dateInput.focus();
    return;
  }
  const reminderDraft={
    text,
    kind:'Telegram-напоминание',
    date,
    time:document.getElementById('newReminderTime').value||''
  };
  const previous=e.reminderItems.map(item=>({...item}));
  const saveButton=document.getElementById('saveReminder');
  saveButton.disabled=true;
  if(editingReminderId)updateEventReminder(e,editingReminderId,reminderDraft);
  else createEventReminder(e,reminderDraft);
  e.reminders=e.reminderItems.length;
  try{
    await CRMDataLayer.save(stages);
    closeReminderEditor();
    renderTrack();
    renderReminders();
    populateEventPage();
    notify('Напоминание сохранено');
  }catch(error){
    e.reminderItems=previous;e.reminders=previous.length;
    const alert=document.getElementById('reminderAlert');
    alert.textContent='Не удалось сохранить напоминание. Проверьте соединение и повторите.';alert.hidden=false;
  }finally{
    saveButton.disabled=false;
  }
});
document.querySelectorAll('.quick-times button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.quick-times button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  const target=quickReminderTarget(b.textContent.trim());
  if(!target)return;
  document.getElementById('newReminderDate').value=target.date;
  document.getElementById('newReminderTime').value=target.time;
  document.getElementById('newReminderDate').removeAttribute('aria-invalid');
}));
['newReminderDate','newReminderTime'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{
  document.querySelectorAll('.quick-times button').forEach(x=>x.classList.remove('active'));
  document.getElementById('newReminderDate').removeAttribute('aria-invalid');
  const alert=document.getElementById('reminderAlert');
  if(alert.textContent==='Укажите дату напоминания.'){alert.hidden=true;alert.textContent='';}
}));
function openNewEventSheet(){
  const plus=document.getElementById('newEventBtn');
  const overlay=document.getElementById('newEventOverlay');
  retriggerMotion(plus,'plus-pulse',460);
  clearNewEventValidation();
  overlay.classList.remove('open');
  requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.classList.add('open')));
}
function closeNewEventSheet(){document.getElementById('newEventOverlay').classList.remove('open');}
document.getElementById('newEventBtn').addEventListener('click',openNewEventSheet);
document.querySelector('.js-close-new').addEventListener('click',closeNewEventSheet);
document.getElementById('newEventTitle').addEventListener('input',clearNewEventValidation);
document.getElementById('createEvent').addEventListener('click',()=>{
  if(!createEventFromOverlay())return;
  closeNewEventSheet();
  openFunnelHome(true);
  crmHaptic('success');notify('Мероприятие создано в «Новый заказ»');
});
let editingEstimateIndex=-1;
let estimateEditorMode='edit';
let estimateDraftKind='custom';

function openNewEstimateItem(kind){
  estimateEditorMode='create';
  estimateDraftKind=kind==='expense'?'expense':'custom';
  editingEstimateIndex=-1;
  const expense=estimateDraftKind==='expense';
  document.getElementById('estimateEditTitle').textContent=expense?'Доп. расход':'Свой товар';
  document.getElementById('estimateEditHelper').textContent=expense?'Доставка, монтаж, печать, подрядчик или другой расход.':'Позиция, которой нет в каталоге аренды.';
  document.getElementById('estimateEditName').value='';
  document.getElementById('estimateEditQty').value=1;
  document.getElementById('estimateEditClient').value=expense?0:'';
  document.getElementById('estimateEditCost').value='';
  document.getElementById('estimateEditVisible').checked=!expense;
  document.getElementById('saveEstimateItem').textContent='Добавить в смету';
  document.getElementById('deleteEstimateItem').hidden=true;
  syncEstimateEditProfit();
  closeModal(document.getElementById('addItemOverlay'));
  openModal(document.getElementById('estimateEditOverlay'));
  requestAnimationFrame(()=>document.getElementById('estimateEditName').focus());
}

function syncEstimateEditProfit(){
  const qty=Math.max(1,Math.round(Number(document.getElementById('estimateEditQty').value)||1));
  const client=Number(document.getElementById('estimateEditClient').value)||0;
  const cost=Number(document.getElementById('estimateEditCost').value)||0;
  const profit=(client-cost)*qty;
  document.getElementById('estimateEditProfit').textContent=money(profit);
  document.getElementById('estimateEditProfitRow').classList.toggle('negative',profit<0);
}
document.getElementById('estimateList').addEventListener('click',e=>{
  const row=e.target.closest('[data-estimate-index]');if(!row)return;
  editingEstimateIndex=Number(row.dataset.estimateIndex);
  estimateEditorMode='edit';
  syncSelectedEstimate();
  const x=estimate[editingEstimateIndex];if(!x)return;
  document.getElementById('estimateEditTitle').textContent='Позиция сметы';
  document.getElementById('estimateEditHelper').textContent=x.sub||'';
  document.getElementById('saveEstimateItem').textContent='Сохранить';
  document.getElementById('deleteEstimateItem').hidden=false;
  document.getElementById('estimateEditName').value=x.name;
  document.getElementById('estimateEditQty').value=x.qty;
  document.getElementById('estimateEditClient').value=x.unitClient;
  document.getElementById('estimateEditCost').value=x.unitCost;
  document.getElementById('estimateEditVisible').checked=x.clientVisible!==false;
  syncEstimateEditProfit();
  document.getElementById('estimateEditOverlay').classList.add('open');
});
['estimateEditQty','estimateEditClient','estimateEditCost'].forEach(id=>document.getElementById(id).addEventListener('input',syncEstimateEditProfit));
document.getElementById('closeEstimateEdit').addEventListener('click',()=>document.getElementById('estimateEditOverlay').classList.remove('open'));
document.getElementById('saveEstimateItem').addEventListener('click',()=>{
  syncSelectedEstimate();
  const name=document.getElementById('estimateEditName').value.trim();
  const qty=Math.max(1,Math.round(Number(document.getElementById('estimateEditQty').value)||1));
  const unitClient=Math.max(0,Number(document.getElementById('estimateEditClient').value)||0);
  const unitCost=Math.max(0,Number(document.getElementById('estimateEditCost').value)||0);
  const clientVisible=document.getElementById('estimateEditVisible').checked;
  if(!name){notify('Введите наименование');return;}

  if(estimateEditorMode==='create'){
    const sub=estimateDraftKind==='expense'?'Доп. расход':'Свой товар';
    const event=selectedEvent();
    createEventEstimateItem(event,{name,sub,qty,unitClient,unitCost,clientVisible});
    persistCRM();
    document.getElementById('estimateEditOverlay').classList.remove('open');
    renderEstimate();renderRental();
    notify(estimateDraftKind==='expense'?'Расход добавлен':'Свой товар добавлен');
    return;
  }

  const x=estimate[editingEstimateIndex];if(!x)return;
  if(x.productId){
    const p=rentalProducts.find(product=>product.id===x.productId);
    const event=selectedEvent();
    if(p&&event){
      const availability=maxReservableForEvent(p,event);
      if(qty>availability.max){notify(`Доступно только ${availability.max} шт. на ${formatShortDateKey(availability.dateKey)}`);return;}
    }
  }
  const event=selectedEvent();
  updateEventEstimateItem(event,x.id,{name,qty,unitClient,unitCost,clientVisible});
  if(event)estimate=eventEstimate(event);
  persistCRM();
  document.getElementById('estimateEditOverlay').classList.remove('open');
  renderEstimate();renderRental();notify('Позиция обновлена');
});
document.getElementById('deleteEstimateItem').addEventListener('click',()=>{
  syncSelectedEstimate();
  if(estimateEditorMode!=='edit'||editingEstimateIndex<0||!estimate[editingEstimateIndex])return;
  const event=selectedEvent();
  deleteEventEstimateItem(event,estimate[editingEstimateIndex].id);editingEstimateIndex=-1;
  if(event)estimate=eventEstimate(event);
  persistCRM();
  document.getElementById('estimateEditOverlay').classList.remove('open');
  renderEstimate();renderRental();notify('Позиция удалена из сметы');
});
document.getElementById('paymentMethodOptions').addEventListener('click',e=>{
  const button=e.target.closest('[data-payment-method]');
  if(!button)return;
  const event=selectedEvent();
  if(!event)return;
  const value=button.dataset.paymentMethod;
  if(!PAYMENT_METHODS[value])return;
  setEventPaymentMethod(event,event.paymentMethod===value?'':value);
  persistCRM();
  renderPaymentMethod();
  crmHaptic('soft');
});
let currentCallPhone='';
function closeCallHandoff(){
  closeModal(document.getElementById('callHandoffOverlay'));
  currentCallPhone='';
  const link=document.getElementById('continueCallHandoff');
  link.hidden=true;link.href='';
  document.getElementById('copyCallNumber').disabled=true;
}
function openTelegramHttps(url){
  const webApp=window.Telegram?.WebApp;
  if(webApp&&typeof webApp.openLink==='function'){
    webApp.openLink(url,{try_instant_view:false});
    return true;
  }
  return false;
}
async function requestEventCall(eventId=''){
  const location=crmEventLocation(stages,eventId||selectedEvent()?.id||'');
  const event=location?.event;
  const localPhone=contactInfo(event?.contact||'');
  if(!event||!localPhone.tel){notify('Номер телефона не указан');return;}
  const overlay=document.getElementById('callHandoffOverlay');
  const status=document.getElementById('callHandoffStatus');
  const continueLink=document.getElementById('continueCallHandoff');
  const copyButton=document.getElementById('copyCallNumber');
  currentCallPhone=localPhone.normalized;
  status.textContent='Подготавливаем безопасный переход к звонку…';
  continueLink.hidden=true;continueLink.href='';copyButton.disabled=true;
  openModal(overlay);
  try{
    const result=await CRMDataLayer.createCallLink(event.id);
    if(!/^https:\/\//.test(result?.callUrl||''))throw new Error('Invalid call handoff URL');
    currentCallPhone=String(result.normalizedPhone||localPhone.normalized);
    continueLink.href=result.callUrl;
    continueLink.hidden=false;
    copyButton.disabled=false;
    status.textContent=`Номер ${result.displayPhone||localPhone.phone}. Если системный звонок не открылся, нажмите «Продолжить звонок».`;
    try{openTelegramHttps(result.callUrl)}catch(error){/* visible user-action fallback remains */}
  }catch(error){
    status.textContent=error?.code==='PHONE_NOT_AVAILABLE'
      ? 'Номер телефона не указан.'
      : 'Не удалось подготовить звонок. Можно скопировать номер.';
    copyButton.disabled=!currentCallPhone;
    notify(status.textContent);
  }
}
document.getElementById('eventContactCall').addEventListener('click',event=>requestEventCall(event.currentTarget.dataset.callEventId||''));
document.getElementById('callClient').addEventListener('click',event=>requestEventCall(event.currentTarget.dataset.callEventId||''));
document.getElementById('continueCallHandoff').addEventListener('click',event=>{
  const url=event.currentTarget.href;
  if(url&&openTelegramHttps(url))event.preventDefault();
});
document.getElementById('copyCallNumber').addEventListener('click',async()=>{
  if(!currentCallPhone){notify('Номер телефона не указан');return;}
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(currentCallPhone);
    else{
      const input=document.createElement('textarea');input.value=currentCallPhone;
      input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);
      input.select();document.execCommand('copy');input.remove();
    }
    notify('Номер скопирован');
  }catch(error){notify(`Номер: ${currentCallPhone}`);}
});
document.getElementById('closeCallHandoff').addEventListener('click',closeCallHandoff);
document.getElementById('cancelCallHandoff').addEventListener('click',closeCallHandoff);

function resetClientPdfSheet(){
  document.getElementById('clientPdfStatus').textContent='Выберите действие с клиентским документом.';
  const fallback=document.getElementById('clientPdfFallback');
  fallback.hidden=true;fallback.href='';
  document.getElementById('shareClientPdf').disabled=false;
  document.getElementById('downloadClientPdf').disabled=false;
}
function closeClientPdfSheet(){closeModal(document.getElementById('clientEstimateOverlay'));resetClientPdfSheet();}
function setClientPdfBusy(busy,message){
  document.getElementById('shareClientPdf').disabled=busy;
  document.getElementById('downloadClientPdf').disabled=busy;
  if(message)document.getElementById('clientPdfStatus').textContent=message;
}
function showClientPdfFallback(result,message){
  const fallback=document.getElementById('clientPdfFallback');
  fallback.href=result.downloadUrl;fallback.hidden=false;
  document.getElementById('clientPdfStatus').textContent=message;
}
async function runClientPdfAction(purpose){
  const event=selectedEvent();
  if(!event){notify('Мероприятие не найдено');return;}
  setClientPdfBusy(true,purpose==='share'?'Подготавливаем отправку в Telegram…':'Формируем PDF…');
  try{
    const result=await CRMDataLayer.createClientPdf(event.id,purpose);
    if(!/^https:\/\//.test(result?.downloadUrl||''))throw new Error('Invalid PDF URL');
    if(purpose==='share'){
      const webApp=window.Telegram?.WebApp;
      if(typeof webApp?.shareMessage==='function'&&result.preparedMessageId){
        webApp.shareMessage(result.preparedMessageId,success=>{
          document.getElementById('clientPdfStatus').textContent=success
            ? 'PDF отправлен через Telegram.'
            : 'Отправка отменена или не поддержана. PDF можно скачать.';
          showClientPdfFallback(result,document.getElementById('clientPdfStatus').textContent);
          if(success)notify('PDF отправлен');
        });
      }else{
        showClientPdfFallback(result,'Telegram share недоступен. Используйте готовый PDF.');
        notify('Отправка недоступна — PDF готов к скачиванию');
      }
      return;
    }

    const webApp=window.Telegram?.WebApp;
    if(typeof webApp?.downloadFile==='function'){
      webApp.downloadFile({url:result.downloadUrl,file_name:result.fileName||'studio-art-decor-estimate.pdf'},accepted=>{
        document.getElementById('clientPdfStatus').textContent=accepted
          ? 'Скачивание PDF начато.'
          : 'Скачивание отменено. Можно открыть готовый PDF.';
        showClientPdfFallback(result,document.getElementById('clientPdfStatus').textContent);
        if(accepted)notify('Скачивание PDF начато');
      });
    }else if(openTelegramHttps(result.downloadUrl)){
      showClientPdfFallback(result,'PDF открыт во внешнем окне. Ссылка действует ограниченное время.');
    }else{
      showClientPdfFallback(result,'PDF готов. Нажмите «Открыть готовый PDF».');
    }
  }catch(error){
    const message=error?.code==='EMPTY_ESTIMATE'
      ? 'В смете нет позиций, доступных клиенту.'
      : 'Не удалось сформировать PDF. Повторите попытку.';
    document.getElementById('clientPdfStatus').textContent=message;
    notify(message);
  }finally{
    setClientPdfBusy(false);
  }
}
document.getElementById('pdfEstimate').addEventListener('click',()=>{
  resetClientPdfSheet();
  openModal(document.getElementById('clientEstimateOverlay'));
});
document.getElementById('closeClientEstimate').addEventListener('click',closeClientPdfSheet);
document.getElementById('cancelClientPdf').addEventListener('click',closeClientPdfSheet);
document.getElementById('shareClientPdf').addEventListener('click',()=>runClientPdfAction('share'));
document.getElementById('downloadClientPdf').addEventListener('click',()=>runClientPdfAction('download'));

document.querySelectorAll('.overlay').forEach(overlay=>{
  overlay.addEventListener('click',e=>{
    if(e.target===overlay){
      if(overlay.id==='reminderOverlay')closeReminderEditor();
      else if(overlay.id==='callHandoffOverlay')closeCallHandoff();
      else if(overlay.id==='clientEstimateOverlay')closeClientPdfSheet();
      else closeModal(overlay);
    }
  });
});

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const open=[...document.querySelectorAll('.overlay.open')].pop();
  if(open){
    if(open.id==='reminderOverlay')closeReminderEditor();
    else if(open.id==='callHandoffOverlay')closeCallHandoff();
    else if(open.id==='clientEstimateOverlay')closeClientPdfSheet();
    else closeModal(open);
    return;
  }
});
