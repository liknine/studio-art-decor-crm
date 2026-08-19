function openEditEventPage(){
  const e=selectedEvent();
  if(!e)return;

  document.getElementById('editEventSubtitle').textContent=e.title;
  document.getElementById('editEventTitle').value=e.title;
  document.getElementById('editEventDate').value=inputDateFromEventLabel(e.date);
  document.getElementById('editEventTime').value=e.time==='—'?'':e.time;
  document.getElementById('editEventPlace').value=e.place;
  document.getElementById('editEventContact').value=e.contact;
  document.getElementById('editEventComment').value=e.comment||'';
  document.getElementById('editEventPriority').value=e.priority||'normal';
  document.getElementById('editEventTheme').value=e.visualTheme||'auto';

  const status=document.getElementById('editEventStatus');
  status.innerHTML=stages.map((s,i)=>`<option value="${i}" ${i===selectedStageIndex?'selected':''}>${esc(s.name)}</option>`).join('');

  showPage('editEventPage');
}

function populateBookingPanel(){
  const event=selectedEvent();if(!event)return;
  const booking=eventBooking(event);
  const range=bookingRangeForEvent(event);
  const start=document.getElementById('bookingStart');
  const end=document.getElementById('bookingEnd');
  start.value=range.start||'';
  end.value=range.end||range.start||'';
  const status=document.getElementById('bookingStatus');
  const reserved=booking.status==='reserved';
  status.textContent=reserved?'Забронировано':'Не забронировано';
  status.classList.toggle('reserved',reserved);
  start.disabled=reserved;
  end.disabled=reserved;
  const button=document.getElementById('toggleBooking');
  button.textContent=reserved?'Снять бронь':'Забронировать реквизит';
  button.classList.toggle('release',reserved);
  button.classList.toggle('primary',!reserved);

  const linked=bookingRentalItems(event);
  const conflict=bookingConflict(event,range);
  const summary=document.getElementById('bookingSummary');
  summary.className='booking-summary';
  if(!range.start){
    summary.textContent='У мероприятия не указана дата. Сначала задайте период бронирования.';
    summary.classList.add('warn');
  }else if(!linked.length){
    summary.textContent=`${formatShortDateKey(range.start)}${range.end&&range.end!==range.start?' — '+formatShortDateKey(range.end):''} · в смете пока нет складских позиций.`;
  }else if(conflict){
    summary.textContent='Конфликт: '+conflict.message;
    summary.classList.add('warn');
  }else{
    const qty=linked.reduce((sum,item)=>sum+Math.max(1,Math.round(Number(item.qty)||1)),0);
    summary.textContent=`${formatShortDateKey(range.start)}${range.end!==range.start?' — '+formatShortDateKey(range.end):''} · ${linked.length} поз. / ${qty} шт. · склад доступен.`;
    summary.classList.add('ok');
  }
}
function populateEventPage(){
  const s=stages[selectedStageIndex],e=selectedEvent();if(!e)return;
  estimate=eventEstimate(e);
  document.getElementById('eventPageTitle').textContent=e.title;
  const eventSub='';
  const eventPageSub=document.getElementById('eventPageSub');
  eventPageSub.textContent=eventSub;
  eventPageSub.hidden=!eventSub;
  document.getElementById('eventDate').textContent=[e.date,e.time&&e.time!=='—'?e.time:''].filter(Boolean).join(' · ');
  document.getElementById('eventPlace').textContent=e.place;
  document.getElementById('eventContact').textContent=e.contact;
  const eventNote=document.getElementById('eventNote');
  eventNote.hidden=!String(e.comment||'').trim();
  document.getElementById('eventComment').textContent=e.comment||'';

  const priorityValue=e.priority||'normal';
  const priority=priorityMeta(priorityValue);
  const priorityBadge=document.getElementById('eventPriorityBadge');
  const priorityVisible=priorityValue!=='normal';
  priorityBadge.textContent=priority.label;
  priorityBadge.className='priority-badge '+priority.className;
  priorityBadge.hidden=!priorityVisible;
  const eventTitleMeta=document.getElementById('eventTitleMeta');
  eventTitleMeta.hidden=!priorityVisible;
  document.getElementById('eventHeroCard').classList.toggle('has-priority',priorityVisible);

  const reminderCount=eventReminderCount(e);
  const reminderButton=document.getElementById('openReminders');
  reminderButton.classList.toggle('has',reminderCount>0);
  reminderButton.setAttribute('aria-label',reminderCount?`Напоминания: ${reminderCount}`:'Напоминания');

  const contact=contactInfo(e.contact);
  const eventContactAvatar=document.getElementById('eventContactAvatar');
  eventContactAvatar.textContent=contact.initial;
  eventContactAvatar.style.setProperty('--contact-color',contactColor(contact.name));
  const eventContactCall=document.getElementById('eventContactCall');
  eventContactCall.href=contact.tel;
  eventContactCall.classList.toggle('disabled',!contact.phone);

  const phone=contact.phone;
  const call=document.getElementById('callClient');
  call.href=contact.tel;
  call.classList.toggle('disabled',!phone);

  const advance=document.getElementById('advanceEventBtn');
  const last=selectedStageIndex>=stages.length-1;
  advance.hidden=last;
  document.getElementById('advanceEventText').textContent=last?'Закрыто':'Далее: '+stageActionName(stages[selectedStageIndex+1].name);

  const client=estimate.reduce((sum,x)=>sum+estimateItemClientTotal(x),0);
  const cost=estimate.reduce((sum,x)=>sum+estimateItemCostTotal(x),0);
  const profit=client-cost;
  const hasEstimate=estimate.length>0;
  document.getElementById('eventFinanceClient').textContent=hasEstimate?money(client):'—';
  document.getElementById('eventFinanceCost').textContent=hasEstimate?money(cost):'—';
  document.getElementById('eventFinanceProfit').textContent=hasEstimate?money(profit):'—';
  document.getElementById('eventFinance').hidden=!hasEstimate;
  document.getElementById('eventFinance').classList.toggle('empty',!hasEstimate);
  document.getElementById('eventFinance').classList.toggle('negative',hasEstimate && profit<0);

  document.getElementById('estimateEventName').textContent=e.title;
  document.getElementById('remindersEventName').textContent=e.title;
  const bookingLabel=eventBooking(e).status==='reserved'?' · бронь активна':'';
  document.getElementById('estimateSmall').textContent=hasEstimate?(estimate.length+' позиций · '+money(client)+bookingLabel):'Смета ещё не создана';
  e.estimate=hasEstimate;
  e.reminders=eventReminderCount(e);
  renderReminders();
  populateBookingPanel();
}

function money(v){
  const n=Number(v)||0;
  return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n)+' BYN';
}

function renderPaymentMethod(){
  const event=selectedEvent();
  const value=event?.paymentMethod||'';
  const label=paymentMethodLabel(value);
  const valueNode=document.getElementById('paymentMethodValue');
  if(valueNode)valueNode.textContent=label;
  document.querySelectorAll('#paymentMethodOptions [data-payment-method]').forEach(button=>{
    const active=button.dataset.paymentMethod===value;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
  });
}
function renderEstimate(){
  syncSelectedEstimate();
  const current=selectedEvent();
  document.getElementById('estimateList').innerHTML=estimate.map((x,i)=>{
    syncEstimateItemTotals(x);
    const profit=estimateItemClientTotal(x)-estimateItemCostTotal(x);
    let stockMeta='';
    if(x.productId&&current){
      const product=rentalProducts.find(p=>p.id===x.productId);
      if(product){
        const av=maxReservableForEvent(product,current);
        if(x.qty>av.max) stockMeta='<span class="booking-linked warn">Недостаточно на складе</span>';
      }
    }
    return `
    <div class="estimate-item" data-estimate-index="${i}">
      <div class="estimate-item-top">
        <div class="item-main"><strong>${esc(x.name)}</strong><span>${esc(x.sub)}</span>${x.clientVisible===false?'<em class="internal-badge">Только для команды</em>':''}${stockMeta}<span class="booking-line-meta">${money(x.unitClient)} × ${x.qty} клиенту · ${money(x.unitCost)} × ${x.qty} расходы</span></div>
        <div class="qty-chip">× ${x.qty}</div>
      </div>
      <div class="estimate-economy-line ${profit<0?'negative':''}">
        <span>Клиенту <strong>${money(estimateItemClientTotal(x))}</strong></span>
        <span>Расходы <strong>${money(estimateItemCostTotal(x))}</strong></span>
        <span class="profit">Прибыль <strong>${money(profit)}</strong></span>
      </div>
    </div>`;
  }).join('');
  const client=estimate.reduce((s,x)=>s+estimateItemClientTotal(x),0),cost=estimate.reduce((s,x)=>s+estimateItemCostTotal(x),0);
  const profit=client-cost;
  document.getElementById('sumClient').textContent=money(client);
  document.getElementById('sumCost').textContent=money(cost);
  document.getElementById('sumProfit').textContent=money(profit);
  document.getElementById('sumProfitRow').classList.toggle('negative',profit<0);
  const bookingLabel=current&&eventBooking(current).status==='reserved'?' · бронь активна':'';
  document.getElementById('estimateSmall').textContent=estimate.length+' позиций · '+money(client)+bookingLabel;
  if(current){
    current.estimate=estimate.length>0;
  }
  if(current && current.estimate){
    document.getElementById('eventFinanceClient').textContent=money(client);
    document.getElementById('eventFinanceCost').textContent=money(cost);
    document.getElementById('eventFinanceProfit').textContent=money(profit);
    document.getElementById('eventFinance').classList.toggle('negative',profit<0);
  }
  renderPaymentMethod();
  populateBookingPanel();
}
function renderClientEstimatePreview(){
  const rows=estimate.filter(x=>x.clientVisible!==false && estimateItemClientTotal(x)!==0);
  document.getElementById('clientEstimateRows').innerHTML=rows.length?rows.map(x=>`
    <div class="client-preview-row">
      <div><strong>${esc(x.name)}</strong><small>${x.qty>1?x.qty+' × '+money(x.unitClient):'1 × '+money(x.unitClient)}</small></div>
      <span>${money(estimateItemClientTotal(x))}</span>
    </div>`).join(''):'<div class="client-preview-row"><div><strong>Нет клиентских позиций</strong><small>Добавьте позицию или включите её для клиента.</small></div><span>—</span></div>';
  const total=rows.reduce((s,x)=>s+estimateItemClientTotal(x),0);
  document.getElementById('clientEstimateTotal').textContent=money(total);
  const event=selectedEvent();
  const payment=event?.paymentMethod||'';
  const paymentRow=document.getElementById('clientEstimatePayment');
  const paymentValue=document.getElementById('clientEstimatePaymentValue');
  if(paymentRow&&paymentValue){
    paymentRow.hidden=!payment;
    paymentValue.textContent=payment?paymentMethodLabel(payment):'';
  }
}

function reminderDateLabel(reminder){
  const date=reminder?.date;
  const time=reminder?.time||'';
  if(!date)return time||'Без даты';
  const d=new Date(date+'T12:00:00');
  const label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d).replace('.','');
  return label+(time?' · '+time:'');
}
function renderReminders(){
  const event=selectedEvent();
  const rows=eventReminders(event);
  const host=document.getElementById('reminderList');
  if(!host)return;
  host.innerHTML=rows.length?rows.map(r=>`
    <div class="reminder-card" data-reminder-id="${esc(r.id)}">
      <div class="reminder-icon"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg></div>
      <div class="reminder-copy"><strong>${esc(r.text)}</strong><span>${esc(r.kind||'CRM-напоминание')}</span></div>
      <div class="reminder-time">${esc(reminderDateLabel(r))}</div>
    </div>`).join(''):`<div class="empty">Напоминаний пока нет</div>`;
  if(event)event.reminders=rows.length;
}
