let globalSearchScope='all';

function normalizeGlobalSearchValue(value=''){
  return String(value||'')
    .toLowerCase()
    .replace(/ё/g,'е')
    .replace(/\s+/g,' ')
    .trim();
}

function globalSearchDigits(value=''){
  return String(value||'').replace(/\D/g,'');
}

function globalSearchMatchesEvent(event,stageName,query=''){
  const q=normalizeGlobalSearchValue(query);
  if(!q)return true;
  const fields=[
    event?.title,event?.subtitle,event?.contact,event?.place,event?.comment,
    event?.date,event?.time,event?.received,event?.source,stageName
  ];
  const hay=normalizeGlobalSearchValue(fields.filter(Boolean).join(' '));
  if(hay.includes(q))return true;
  const queryDigits=globalSearchDigits(q);
  return queryDigits.length>=3 && globalSearchDigits(fields.join(' ')).includes(queryDigits);
}

function globalSearchMatchesProduct(product,query=''){
  const q=normalizeGlobalSearchValue(query);
  if(!q)return true;
  return normalizeGlobalSearchValue([product?.name,product?.category,product?.desc].join(' ')).includes(q);
}

function renderGlobalSearch(query=''){
  const eventRows=[];

  stages.forEach((stage,stageIndex)=>{
    stage.events.forEach((event,eventIndex)=>{
      if(globalSearchMatchesEvent(event,stage.name,query))eventRows.push({stage,event,stageIndex,eventIndex});
    });
  });

  const productRows=rentalProducts
    .map((product,productIndex)=>({product,productIndex}))
    .filter(({product})=>globalSearchMatchesProduct(product,query));

  const eventsHtml=eventRows.slice(0,40).map(r=>`
    <button class="search-result" data-search-event-id="${esc(r.event.id)}">
      <div class="search-result-copy"><strong>${esc(r.event.title)}</strong><span>${esc(r.stage.name)} · ${esc(r.event.contact)}</span></div>
      <svg class="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`).join('');

  const productsHtml=productRows.slice(0,20).map(r=>`
    <button class="search-result" data-search-product="${r.productIndex}">
      <div class="search-result-copy"><strong>${esc(r.product.name)}</strong><span>${esc(r.product.category)} · ${r.product.price} BYN / сутки</span></div>
      <svg class="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`).join('');

  const blocks=[];
  if(eventsHtml && globalSearchScope!=='rental')blocks.push(`<div class="search-section-label">Мероприятия · ${eventRows.length}</div>${eventsHtml}`);
  if(productsHtml && globalSearchScope!=='events')blocks.push(`<div class="search-section-label">Аренда · ${productRows.length}</div>${productsHtml}`);
  document.getElementById('globalSearchResults').innerHTML=blocks.join('')||`<div class="mini-note">Ничего не найдено</div>`;
}
