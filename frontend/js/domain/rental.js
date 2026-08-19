function normalizeProductName(value=''){
  return String(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,' ').trim();
}

rentalProducts.forEach((p,i)=>{
  if(!p.id)p.id='rental-'+String(i+1).padStart(3,'0');
});

function productIdForEstimateName(name=''){
  const needle=normalizeProductName(name);
  if(!needle)return '';
  const exact=rentalProducts.find(p=>normalizeProductName(p.name)===needle);
  if(exact)return exact.id;
  const loose=rentalProducts.find(p=>{
    const n=normalizeProductName(p.name);
    return n.includes(needle) || needle.includes(n);
  });
  return loose?.id||'';
}

function rentalDateKey(){
  return document.getElementById('rentalDate')?.value || dateKeyFromEventLabel(selectedEvent()?.date)||'';
}
function eventDateKey(event){
  return dateKeyFromEventLabel(event?.date);
}
function productAvailability(product,event=selectedEvent()){
  if(event){
    const range=bookingRangeForEvent(event);
    const av=maxReservableForEvent(product,event,range);
    return {dateKey:av.dateKey,busy:av.busy,free:av.max};
  }
  const dateKey=rentalDateKey();
  const busy=reservedQuantity(product.id,dateKey);
  return {dateKey,busy,free:Math.max(0,Number(product.total||0)-busy)};
}
function addRentalProductToSelectedEstimate(product,eventOverride=null){
  const event=eventOverride||selectedEvent();
  if(!event){notify('Сначала выберите мероприятие для сметы');return false;}
  const items=eventEstimate(event);
  const existing=items.find(x=>x.productId===product.id);
  const nextQty=(existing?Math.max(1,Number(existing.qty)||1):0)+1;
  const availability=maxReservableForEvent(product,event);
  if(nextQty>availability.max){
    notify(`Доступно только ${availability.max} шт. на ${formatShortDateKey(availability.dateKey)}`);
    return false;
  }
  if(existing){
    existing.qty=nextQty;
    if(!Number.isFinite(Number(existing.unitClient)))existing.unitClient=Number(product.price)||0;
    if(!Number.isFinite(Number(existing.unitCost)))existing.unitCost=Math.round((Number(product.price)||0)*.35*100)/100;
    syncEstimateItemTotals(existing);
  }else{
    items.push(normalizeEstimateItem({name:product.name,sub:product.category,qty:1,unitClient:product.price,unitCost:Math.round(product.price*.35*100)/100,clientVisible:true,productId:product.id}));
  }
  event.estimate=items.length>0;
  if(selectedEvent()?.id===event.id)estimate=items;
  persistCRM();
  renderRental();
  return true;
}
