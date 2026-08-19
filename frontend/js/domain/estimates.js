function syncEstimateItemTotals(item){
  const qty=Math.max(1,Math.round(Number(item.qty)||1));
  item.qty=qty;
  item.unitClient=Math.max(0,Number(item.unitClient)||0);
  item.unitCost=Math.max(0,Number(item.unitCost)||0);
  item.client=Math.round((item.unitClient*qty+Number.EPSILON)*100)/100;
  item.cost=Math.round((item.unitCost*qty+Number.EPSILON)*100)/100;
  return item;
}
function estimateItemClientTotal(item){
  return Math.max(0,Number(item?.client)||0);
}
function estimateItemCostTotal(item){
  return Math.max(0,Number(item?.cost)||0);
}
function normalizeEstimateItem(item){
  const x={...item};
  x.id=x.id||crmId('estimate');
  x.qty=Math.max(1,Math.round(Number(x.qty)||1));
  const legacyClient=Math.max(0,Number(x.client)||0);
  const legacyCost=Math.max(0,Number(x.cost)||0);
  x.unitClient=x.unitClient!==undefined?Math.max(0,Number(x.unitClient)||0):(legacyClient/x.qty);
  x.unitCost=x.unitCost!==undefined?Math.max(0,Number(x.unitCost)||0):(legacyCost/x.qty);
  x.clientVisible=x.clientVisible!==false;
  x.productId=x.productId||productIdForEstimateName(x.name);
  if(x.productId){
    const product=rentalProducts.find(p=>p.id===x.productId);
    x.productSnapshot=x.productSnapshot||{
      id:x.productId,
      name:product?.name||x.name||'',
      category:product?.category||x.sub||'',
      rentalPrice:Number(product?.price)||x.unitClient||0
    };
  }
  return syncEstimateItemTotals(x);
}

function eventEstimate(event){
  if(!event)return [];
  if(!Array.isArray(event.estimateItems))event.estimateItems=[];
  return event.estimateItems;
}

function eventEstimateClientTotal(event){
  return eventEstimate(event).reduce((sum,x)=>sum+estimateItemClientTotal(x),0);
}

function createEventEstimateItem(event,item){
  if(!event)return null;
  const normalized=normalizeEstimateItem(item);
  if(eventEstimate(event).some(existing=>existing.id===normalized.id))normalized.id=crmId('estimate');
  event.estimateItems.push(normalized);
  event.estimate=true;
  return normalized;
}
function updateEventEstimateItem(event,itemId,changes){
  const rows=eventEstimate(event);
  const index=rows.findIndex(item=>item.id===itemId);
  if(index<0)return null;
  const updated=normalizeEstimateItem({...rows[index],...changes,id:rows[index].id});
  rows[index]=updated;
  event.estimate=rows.length>0;
  return updated;
}
function deleteEventEstimateItem(event,itemId){
  const rows=eventEstimate(event);
  const index=rows.findIndex(item=>item.id===itemId);
  if(index<0)return null;
  const removed=rows.splice(index,1)[0]||null;
  event.estimate=rows.length>0;
  return removed;
}

function syncSelectedEstimate(){
  estimate=eventEstimate(selectedEvent());
  return estimate;
}
