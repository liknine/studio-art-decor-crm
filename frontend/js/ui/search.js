let globalSearchScope='all';

function renderGlobalSearch(query=''){
  const q=String(query).trim().toLowerCase();
  const eventRows=[];

  stages.forEach((stage,stageIndex)=>{
    stage.events.forEach((event,eventIndex)=>{
      const hay=[event.title,event.contact,event.place,stage.name,event.source].join(' ').toLowerCase();
      if(!q || hay.includes(q))eventRows.push({stage,event,stageIndex,eventIndex});
    });
  });

  const productRows=rentalProducts
    .map((product,productIndex)=>({product,productIndex}))
    .filter(({product})=>!q||[product.name,product.category,product.desc].join(' ').toLowerCase().includes(q));

  const eventsHtml=eventRows.slice(0,12).map(r=>`
    <button class="search-result" data-search-stage="${r.stageIndex}" data-search-event="${r.eventIndex}">
      <div class="search-result-copy"><strong>${esc(r.event.title)}</strong><span>${esc(r.stage.name)} · ${esc(r.event.contact)}</span></div>
      <svg class="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`).join('');

  const productsHtml=productRows.slice(0,8).map(r=>`
    <button class="search-result" data-search-product="${r.productIndex}">
      <div class="search-result-copy"><strong>${esc(r.product.name)}</strong><span>${esc(r.product.category)} · ${r.product.price} BYN / сутки</span></div>
      <svg class="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
    </button>`).join('');

  const blocks=[];
  if(eventsHtml && globalSearchScope!=='rental')blocks.push(`<div class="search-section-label">Мероприятия</div>${eventsHtml}`);
  if(productsHtml && globalSearchScope!=='events')blocks.push(`<div class="search-section-label">Аренда</div>${productsHtml}`);
  document.getElementById('globalSearchResults').innerHTML=blocks.join('')||`<div class="mini-note">Ничего не найдено</div>`;
}
