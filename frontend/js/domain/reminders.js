const DEFAULT_REMINDERS=[
  {text:'Уточнить финальную смету',kind:'Telegram-уведомление',date:'2026-08-17',time:'10:00'},
  {text:'Проверить весь реквизит',kind:'Перед мероприятием',date:'2026-08-23',time:'12:00'},
  {text:'Напомнить о выезде',kind:'Монтажная команда',date:'2026-08-24',time:'13:00'}
];

function normalizeReminder(item,index=0){
  const r={...item};
  r.id=r.id||crmId('reminder');
  r.text=String(r.text||r.title||('Напоминание '+(index+1))).trim();
  r.kind=String(r.kind||r.type||'CRM-напоминание');
  r.date=String(r.date||'');
  r.time=String(r.time||'');
  return r;
}

function eventReminders(event){
  if(!event)return [];
  if(!Array.isArray(event.reminderItems))event.reminderItems=[];
  event.reminders=event.reminderItems.length;
  return event.reminderItems;
}
function eventReminderCount(event){
  return eventReminders(event).length;
}
function createEventReminder(event,item){
  if(!event)return null;
  const reminder=normalizeReminder(item,eventReminders(event).length);
  if(event.reminderItems.some(existing=>existing.id===reminder.id))reminder.id=crmId('reminder');
  event.reminderItems.push(reminder);
  event.reminders=event.reminderItems.length;
  return reminder;
}
function updateEventReminder(event,reminderId,changes){
  const rows=eventReminders(event);
  const index=rows.findIndex(reminder=>reminder.id===reminderId);
  if(index<0)return null;
  const updated=normalizeReminder({...rows[index],...changes,id:rows[index].id},index);
  rows[index]=updated;
  event.reminders=rows.length;
  return updated;
}
function deleteEventReminder(event,reminderId){
  const rows=eventReminders(event);
  const index=rows.findIndex(reminder=>reminder.id===reminderId);
  if(index<0)return null;
  const removed=rows.splice(index,1)[0]||null;
  event.reminders=rows.length;
  return removed;
}
