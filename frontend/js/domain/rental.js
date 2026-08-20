function normalizeProductName(value=''){
  return String(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,' ').trim();
}

function normalizedRentalProduct(source,index=0){
  if(!source || typeof source!=='object')return null;
  const id=String(source.id||'').trim();
  const name=String(source.name||'').trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) || !name)return null;
  const price=Number(source.price);
  const total=Math.trunc(Number(source.total));
  if(!Number.isFinite(price) || price<0 || !Number.isFinite(total) || total<0)return null;
  return {
    id,
    externalCatalogId:String(source.externalCatalogId||''),
    name,
    category:String(source.category||'Без категории').trim()||'Без категории',
    price:Math.round(price*100)/100,
    total,
    busy:0,
    desc:String(source.desc||'').trim(),
    catalogPosition:Number.isInteger(Number(source.catalogPosition))?Number(source.catalogPosition):index
  };
}

function replaceRentalProducts(nextProducts,{allowEmpty=false}={}){
  if(!Array.isArray(nextProducts))return false;
  const normalized=nextProducts.map((product,index)=>normalizedRentalProduct(product,index)).filter(Boolean);
  if(normalized.length!==nextProducts.length)return false;
  if(!allowEmpty && normalized.length===0)return false;
  const ids=new Set(normalized.map(product=>product.id));
  if(ids.size!==normalized.length)return false;
  normalized.sort((a,b)=>a.catalogPosition-b.catalogPosition || a.name.localeCompare(b.name,'ru'));
  rentalProducts.splice(0,rentalProducts.length,...normalized);
  return true;
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
