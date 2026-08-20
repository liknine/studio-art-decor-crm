let productEstimateTargetId='';
function estimateTargetRows(){
  const rows=[];
  stages.forEach((stage,stageIndex)=>{
    if(stageIndex>=stages.length-1)return;
    stage.events.forEach((event,eventIndex)=>rows.push({stage,stageIndex,event,eventIndex}));
  });
  return rows;
}
function estimateTargetById(id){
  return estimateTargetRows().find(row=>row.event.id===id)||null;
}
function populateProductEstimateTarget(){
  const select=document.getElementById('productEstimateTarget');
  const hint=document.getElementById('productEstimateTargetHint');
  const button=document.getElementById('addProductToEstimate');
  if(!select||!hint||!button)return;
  const rows=estimateTargetRows();
  const current=selectedEvent();
  if(!productEstimateTargetId || !rows.some(row=>row.event.id===productEstimateTargetId)){
    productEstimateTargetId=current&&rows.some(row=>row.event.id===current.id)?current.id:(rows[0]?.event.id||'');
  }
  select.innerHTML=rows.map(row=>`<option value="${esc(row.event.id)}">${esc(row.event.title)} · ${esc(row.stage.name)}</option>`).join('');
  select.value=productEstimateTargetId;
  select.disabled=!rows.length;
  const target=estimateTargetById(productEstimateTargetId);
  hint.textContent=target?`Смета «${target.event.title}»`:'Нет активных мероприятий';
  button.disabled=!target;
  button.textContent=target?'Добавить в выбранную смету':'Нет активных мероприятий';
}

function renderRentalFilters(){
  const categories=['Все',...new Set(rentalProducts.map(p=>p.category))];
  document.getElementById('rentalFilters').innerHTML=categories.map(cat=>`
    <button class="rental-filter ${cat===rentalCategory?'active':''}" data-rental-category="${esc(cat)}">${esc(cat)}</button>`).join('');
}

function renderRental(){
  const q=rentalQuery.trim().toLowerCase();
  const rows=rentalProducts
    .map((p,i)=>({p,i}))
    .filter(({p})=>rentalCategory==='Все'||p.category===rentalCategory)
    .filter(({p})=>!q||[p.name,p.category,p.desc].join(' ').toLowerCase().includes(q));

  document.getElementById('rentalList').innerHTML=rows.length?rows.map(({p,i})=>{
    const dateKey=rentalDateKey();
    const busy=reservedQuantity(p.id,dateKey);
    const free=Math.max(0,p.total-busy);
    const availabilityText=free>0?`Свободно ${free}`:'Нет свободных';
    const stockText=busy>0?`занято ${busy} из ${p.total}`:`всего ${p.total}`;
    return `<button class="list-card rental-card" data-product="${i}">
      <div class="list-main">
        <strong>${esc(p.name)}</strong>
        <span>${esc(p.category)} · ${p.price} BYN / сутки</span>
      </div>
      <div class="rental-row-side ${free?'available':'unavailable'}">
        <strong>${availabilityText}</strong>
        <span>${stockText}</span>
      </div>
      <svg class="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`;
  }).join(''):`<div class="empty rental-empty">Ничего не найдено</div>`;
  renderRentalFilters();
}
function populateProductPage(){
  const p=rentalProducts[selectedProductIndex];
  if(!p)return;
  const dateKey=rentalDateKey();
  const busy=reservedQuantity(p.id,dateKey);
  const free=Math.max(0,p.total-busy);
  document.getElementById('productTitle').textContent=p.name;
  document.getElementById('productDescription').textContent=p.desc;
  document.getElementById('productCategory').textContent=p.category;
  document.getElementById('productPrice').textContent=p.price+' BYN / сутки';
  const totalNode=document.getElementById('productStockTotal');
  if(totalNode)totalNode.textContent=`${p.total} шт.`;
  const dateText=dateKey?formatShortDateKey(dateKey):'Дата не выбрана';
  document.getElementById('productAvailable').textContent=`${dateText} · свободно ${free} из ${p.total}${busy?` · занято ${busy}`:''}`;
  populateProductEstimateTarget();
}

function renderCatalog(){
  const event=selectedEvent();
  document.getElementById('catalogList').innerHTML=rentalProducts.map((p,i)=>{
    const availability=event?maxReservableForEvent(p,event):{max:Math.max(0,p.total-reservedQuantity(p.id,rentalDateKey()))};
    const available=availability.max>0;
    return `<button type="button" class="catalog-row ${available?'available':'unavailable'}" data-catalog-add="${i}" ${available?'':'disabled'}>
      <div><strong>${esc(p.name)}</strong><span>${esc(p.category)} · ${p.price} BYN / сутки</span></div>
      <div class="catalog-row-side"><strong>${available?'Свободно '+availability.max:'Нет свободных'}</strong><span>${available?'Добавить в смету':'Недоступно'}</span></div>
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`;
  }).join('');
}
