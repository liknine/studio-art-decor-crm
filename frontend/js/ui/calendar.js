function allCalendarEvents(){
  const result=[];
  stages.forEach((stage,stageIndex)=>{
    stage.events.forEach((event,eventIndex)=>{
      const key=dateKeyFromEventLabel(event.date);
      if(key)result.push({key,stage,stageIndex,event,eventIndex});
    });
  });
  return result;
}

function monthLabel(date){
  return new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(date)
    .replace(/^./,x=>x.toUpperCase());
}

function shortDayLabel(key){
  const d=new Date(key+'T12:00:00');
  return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(d);
}

function calendarEventCountLabel(n){
  const mod10=n%10,mod100=n%100;
  const word=mod10===1&&mod100!==11?'мероприятие':(mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?'мероприятия':'мероприятий');
  return `${n} ${word}`;
}
function renderCalendarSelected(){
  const items=allCalendarEvents().filter(x=>x.key===calendarSelectedDate);
  document.getElementById('calendarSelectedLabel').textContent=shortDayLabel(calendarSelectedDate);
  document.getElementById('calendarSelectedCount').textContent=calendarEventCountLabel(items.length);

  document.getElementById('calendarSelectedEvents').innerHTML=items.length
    ? items.map(x=>{
      const meta=[x.event.time&&x.event.time!=='—'?x.event.time:'',x.event.place&&x.event.place!=='Место не указано'?x.event.place:'',x.stage.name].filter(Boolean).join(' · ');
      return `<button class="calendar-event-row" data-calendar-stage="${x.stageIndex}" data-calendar-event="${x.eventIndex}">
        <span class="bar" style="background:${x.stage.color}"></span>
        <span>
          <strong>${esc(x.event.title)}</strong>
          <span>${esc(meta)}</span>
        </span>
        <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
      </button>`;
    }).join('')
    : `<div class="calendar-empty">На эту дату мероприятий нет</div>`;
}

function renderDynamicCalendar(){
  const year=calendarCursor.getFullYear();
  const month=calendarCursor.getMonth();

  document.getElementById('calendarMonthLabel').textContent=monthLabel(calendarCursor);
  document.getElementById('calendarMonthPicker').value=
    `${year}-${String(month+1).padStart(2,'0')}`;

  const events=allCalendarEvents();
  const byDate={};
  events.forEach(x=>{(byDate[x.key]||(byDate[x.key]=[])).push(x);});

  const today=new Date();
  const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selected=new Date((calendarSelectedDate||'')+'T12:00:00');
  const selectedInMonth=!Number.isNaN(selected.getTime()) && selected.getFullYear()===year && selected.getMonth()===month;
  if(!selectedInMonth){
    const monthPrefix=`${year}-${String(month+1).padStart(2,'0')}-`;
    const firstEventKey=Object.keys(byDate).sort().find(key=>key.startsWith(monthPrefix));
    calendarSelectedDate=(today.getFullYear()===year&&today.getMonth()===month)?todayKey:(firstEventKey||`${year}-${String(month+1).padStart(2,'0')}-01`);
  }

  const lastDay=new Date(year,month+1,0).getDate();
  let daysHtml='';
  for(let day=1;day<=lastDay;day++){
    const key=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvents=byDate[key]||[];
    const colors=[...new Set(dayEvents.map(x=>x.stage.color))].slice(0,3);
    const markers=colors.map(color=>`<i style="background:${color}"></i>`).join('');
    daysHtml+=`<button class="calendar-month-day ${key===todayKey?'today':''} ${key===calendarSelectedDate?'selected':''} ${dayEvents.length?'has-events':''}" data-calendar-date="${key}" aria-label="${esc(shortDayLabel(key))}">
      <span class="calendar-month-number">${day}</span>
      <span class="calendar-month-markers">${markers}</span>
    </button>`;
  }
  const grid=document.getElementById('dynamicCalendarGrid');
  grid.classList.remove('calendar-date-ribbon');
  grid.innerHTML=`<div class="calendar-days-v55">${daysHtml}</div>`;
  renderCalendarSelected();
}
