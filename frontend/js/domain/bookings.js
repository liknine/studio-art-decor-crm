function safeDateKey(value=''){
  const key=String(value||'');
  const match=key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match)return '';
  const year=Number(match[1]);
  const month=Number(match[2]);
  const day=Number(match[3]);
  const date=new Date(year,month-1,day,12,0,0,0);
  return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day?key:'';
}
function compareDateKeys(a,b){
  return String(a||'').localeCompare(String(b||''));
}
function datesInRange(start,end){
  start=safeDateKey(start);end=safeDateKey(end);
  if(!start||!end||compareDateKeys(start,end)>0)return [];
  const rows=[];
  const cursor=new Date(start+'T12:00:00');
  const stop=new Date(end+'T12:00:00');
  while(cursor<=stop && rows.length<370){
    rows.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`);
    cursor.setDate(cursor.getDate()+1);
  }
  return rows;
}
function formatShortDateKey(value){
  const key=safeDateKey(value);if(!key)return 'дата не указана';
  const d=new Date(key+'T12:00:00');
  return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(d).replace(/\./g,'');
}

const RU_MONTHS={
  'января':0,'февраля':1,'марта':2,'апреля':3,'мая':4,'июня':5,
  'июля':6,'августа':7,'сентября':8,'октября':9,'ноября':10,'декабря':11
};

function normalizeBooking(event){
  const eventDate=dateKeyFromEventLabel(event?.date);
  const source=event?.rentalBooking&&typeof event.rentalBooking==='object'?event.rentalBooking:{};
  let start=safeDateKey(source.startDate)||eventDate;
  let end=safeDateKey(source.endDate)||start;
  if(start&&end&&compareDateKeys(start,end)>0)end=start;
  const status=source.status==='reserved'?'reserved':'draft';
  return {
    status,
    startDate:start||'',
    endDate:end||'',
    autoPeriod:source.autoPeriod!==false,
    reservedAt:status==='reserved'?String(source.reservedAt||''):''
  };
}

function dateKeyFromEventLabel(label){
  const m=String(label||'').match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if(!m)return '';
  const month=RU_MONTHS[m[2].toLowerCase()];
  if(month===undefined)return '';
  return `${m[3]}-${String(month+1).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
}

function inputDateFromEventLabel(label){
  return dateKeyFromEventLabel(label);
}

function eventLabelFromInput(value){
  if(!value)return '';
  const d=new Date(value+'T12:00:00');
  return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d);
}

function eventBooking(event){
  if(!event)return {status:'draft',startDate:'',endDate:'',autoPeriod:true,reservedAt:''};
  if(!event.rentalBooking)event.rentalBooking=normalizeBooking(event);
  return event.rentalBooking;
}

function bookingRangeForEvent(event){
  const booking=eventBooking(event);
  const fallback=eventDateKey(event);
  const start=safeDateKey(booking.startDate)||fallback;
  const end=safeDateKey(booking.endDate)||start;
  return {start,end};
}
function bookingContainsDate(event,dateKey){
  const booking=eventBooking(event);
  if(booking.status!=='reserved')return false;
  const {start,end}=bookingRangeForEvent(event);
  return !!(start&&end&&dateKey&&compareDateKeys(start,dateKey)<=0&&compareDateKeys(dateKey,end)<=0);
}
function reservedQuantity(productId,dateKey,excludeEventId=''){
  if(!productId||!dateKey)return 0;
  let total=0;
  stages.forEach(stage=>stage.events.forEach(event=>{
    if(event.id===excludeEventId || !bookingContainsDate(event,dateKey))return;
    eventEstimate(event).forEach(item=>{
      if(item.productId===productId)total+=Math.max(1,Math.round(Number(item.qty)||1));
    });
  }));
  return total;
}
function maxReservableForEvent(product,event=selectedEvent(),rangeOverride=null){
  if(!product||!event)return {max:0,dateKey:'',busy:0};
  const range=rangeOverride||bookingRangeForEvent(event);
  const days=datesInRange(range.start,range.end);
  if(!days.length)return {max:Number(product.total)||0,dateKey:'',busy:0};
  let max=Number(product.total)||0;
  let tightDate=days[0];
  let tightBusy=0;
  days.forEach(dateKey=>{
    const busy=reservedQuantity(product.id,dateKey,event.id);
    const free=Math.max(0,(Number(product.total)||0)-busy);
    if(free<max){max=free;tightDate=dateKey;tightBusy=busy;}
  });
  return {max,dateKey:tightDate,busy:tightBusy};
}
function bookingConflict(event,rangeOverride=null){
  if(!event)return null;
  const range=rangeOverride||bookingRangeForEvent(event);
  if(!range.start||!range.end)return {type:'date',message:'Укажите период бронирования'};
  if(compareDateKeys(range.start,range.end)>0)return {type:'date',message:'Дата окончания раньше даты начала'};
  for(const item of eventEstimate(event)){
    if(!item.productId)continue;
    const product=rentalProducts.find(p=>p.id===item.productId);
    if(!product){
      return {type:'product',productId:item.productId,item,message:`Позиция аренды «${item.name||item.productId}» отсутствует в каталоге`};
    }
    const availability=maxReservableForEvent(product,event,range);
    const qty=Math.max(1,Math.round(Number(item.qty)||1));
    if(qty>availability.max){
      return {type:'stock',product,item,qty,available:availability.max,dateKey:availability.dateKey,message:`${product.name}: нужно ${qty}, доступно ${availability.max} на ${formatShortDateKey(availability.dateKey)}`};
    }
  }
  return null;
}
function bookingRentalItems(event){
  return eventEstimate(event).filter(item=>item.productId&&rentalProducts.some(p=>p.id===item.productId));
}
function reserveEventBooking(event,rangeOverride=null){
  if(!event)return {ok:false,conflict:{type:'event',message:'Мероприятие не найдено'}};
  const range=rangeOverride||bookingRangeForEvent(event);
  const conflict=bookingConflict(event,range);
  if(conflict)return {ok:false,conflict};
  const booking=eventBooking(event);
  booking.startDate=range.start;
  booking.endDate=range.end;
  booking.status='reserved';
  booking.reservedAt=new Date().toISOString();
  return {ok:true,booking};
}
function releaseEventBooking(event){
  if(!event)return null;
  const booking=eventBooking(event);
  booking.status='draft';
  booking.reservedAt='';
  return booking;
}
